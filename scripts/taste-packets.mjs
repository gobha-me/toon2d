// Grader-side preparation only. This script is excluded from the portable author skill.
import { readFile, mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes, randomInt } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { decodePNG, encodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const text = value => typeof value === 'string' && value.trim().length > 0;

function normalizePNG(bytes) {
  if (!bytes.subarray(0, 8).equals(signature) || bytes.length < 45 ||
      bytes.toString('ascii', 12, 16) !== 'IHDR' || bytes.readUInt32BE(8) !== 13) {
    throw new Error('Expected an RGBA8 PNG contact sheet');
  }
  const w = bytes.readUInt32BE(16);
  const h = bytes.readUInt32BE(20);
  if (!w || !h || w * h > 4_000_000 || bytes[24] !== 8 || bytes[25] !== 6 ||
      bytes[26] !== 0 || bytes[27] !== 0 || bytes[28] !== 0) {
    throw new Error('PNG must be non-interlaced RGBA8 with at most four million pixels');
  }
  const compressed = [];
  let ended = false;
  for (let p = 33; p + 12 <= bytes.length;) {
    const size = bytes.readUInt32BE(p);
    if (p + size + 12 > bytes.length) throw new Error('Truncated PNG chunk');
    const type = bytes.toString('ascii', p + 4, p + 8);
    if (type === 'IHDR') throw new Error('Duplicate PNG header');
    if (type === 'IDAT') compressed.push(bytes.subarray(p + 8, p + 8 + size));
    if (type === 'IEND') { ended = size === 0; break; }
    if (!['IDAT', 'PLTE'].includes(type) && /^[A-Z]/.test(type)) throw new Error('Unsupported critical PNG chunk');
    p += size + 12;
  }
  if (!ended || !compressed.length) throw new Error('Incomplete PNG');
  // Bound inflation before using the shared codec, which assumes trusted rendered images.
  const expected = (w * 4 + 1) * h;
  const raw = inflateSync(Buffer.concat(compressed), { maxOutputLength: expected });
  if (raw.length !== expected) throw new Error('Incorrect PNG pixel length');
  for (let y = 0; y < h; y++) {
    if (raw[y * (w * 4 + 1)] > 4) throw new Error('Invalid PNG filter');
  }
  const image = decodePNG(bytes);
  return { bytes: encodePNG(w, h, image.data), pixels: w * h };
}

export async function preparePackets(manifest, sourceDirectory, outputDirectory) {
  if (manifest?.schema_version !== 1 || !Array.isArray(manifest.trials) ||
      !manifest.trials.length || manifest.trials.length > 100) {
    throw new Error('Expected schema_version 1 and between one and 100 trials');
  }
  const ids = new Set();
  const groups = new Map();
  const imageSplits = new Map();
  const prepared = [];
  let totalPixels = 0;
  for (const trial of manifest.trials) {
    if (!trial || !['id', 'group', 'candidate', 'reference'].every(field => text(trial[field])) ||
        !['calibration', 'held-out'].includes(trial.split)) throw new Error('Invalid trial fields');
    if (ids.has(trial.id)) throw new Error('Duplicate trial ID');
    ids.add(trial.id);
    if (groups.has(trial.group) && groups.get(trial.group) !== trial.split) {
      throw new Error('Related variants must remain in one split');
    }
    groups.set(trial.group, trial.split);
    const images = {};
    for (const role of ['candidate', 'reference']) {
      const path = resolve(sourceDirectory, trial[role]);
      if ((await stat(path)).size > 32_000_000) throw new Error('PNG file exceeds 32 MB');
      const source = await readFile(path);
      const image = normalizePNG(source);
      totalPixels += image.pixels;
      if (totalPixels > 16_000_000) throw new Error('Packet exceeds sixteen million total pixels');
      const normalizedHash = hash(image.bytes);
      if (imageSplits.has(normalizedHash) && imageSplits.get(normalizedHash) !== trial.split) {
        throw new Error('Identical pixels must remain in one split');
      }
      imageSplits.set(normalizedHash, trial.split);
      images[role] = { bytes: image.bytes, source_sha256: hash(source), packet_sha256: normalizedHash };
    }
    if (images.candidate.packet_sha256 === images.reference.packet_sha256) {
      throw new Error('Comparison sides have identical pixels');
    }
    prepared.push({ trial, images });
  }
  // Fisher-Yates and independent coin flips; no seed or order hints reach reviewers.
  for (let i = prepared.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [prepared[i], prepared[j]] = [prepared[j], prepared[i]];
  }
  const packet = { schema_version: 1, trials: [] };
  const key = { schema_version: 1, manifest_sha256: hash(JSON.stringify(manifest)), trials: [] };
  // Never overwrite a prior packet or its key, including when the output is a symlink.
  await mkdir(outputDirectory, { mode: 0o700 });
  try {
    const publicDirectory = join(outputDirectory, 'packet');
    await mkdir(publicDirectory);
    for (const { trial, images } of prepared) {
      const trial_id = randomBytes(16).toString('hex');
      const candidate_side = randomInt(2) ? 'left' : 'right';
      const row = { trial_id };
      const mapping = { trial_id, id: trial.id, group: trial.group, split: trial.split, candidate_side };
      for (const side of ['left', 'right']) {
        const role = candidate_side === side ? 'candidate' : 'reference';
        const { bytes, ...hashes } = images[role];
        row[side] = `${trial_id}-${side}.png`;
        mapping[role] = hashes;
        await writeFile(join(publicDirectory, row[side]), bytes, { flag: 'wx' });
      }
      packet.trials.push(row);
      key.trials.push(mapping);
    }
    await writeFile(join(outputDirectory, 'private-key.json'), JSON.stringify(key, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
    await writeFile(join(publicDirectory, 'trials.json'), JSON.stringify(packet, null, 2) + '\n', { flag: 'wx' });
  } catch (error) {
    await rm(outputDirectory, { recursive: true, force: true });
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node scripts/taste-packets.mjs manifest.json new-output-directory');
    const manifestPath = resolve(process.argv[2]);
    await preparePackets(JSON.parse(await readFile(manifestPath, 'utf8')), dirname(manifestPath), resolve(process.argv[3]));
    console.log('Prepared pixel packet and separate private key. Share only the packet directory.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
