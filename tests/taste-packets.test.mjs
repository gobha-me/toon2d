import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { preparePackets } from '../scripts/taste-packets.mjs';
import { encodePNG, decodePNG } from '../skills/toon2d-runtime-animation/scripts/lib/png.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'toon2d-packets-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const images = [];
  for (let i = 0; i < 4; i++) {
    const bytes = encodePNG(2, 1, Uint8Array.from([i * 40, 20, 30, 255, 90, 80, 70, 255]));
    const name = `private-source-${i}.png`;
    await writeFile(join(dir, name), bytes);
    images.push({ name, bytes });
  }
  const manifest = {
    schema_version: 1,
    trials: [
      { id: 'author-baseline', group: 'family-a', split: 'calibration', candidate: images[0].name, reference: images[1].name },
      { id: 'author-revision', group: 'family-b', split: 'held-out', candidate: images[2].name, reference: images[3].name },
    ],
  };
  return { dir, images, manifest, output: join(dir, 'output') };
}

test('packets expose only opaque IDs and pixels; the private key reconstructs both sides', async t => {
  const f = await fixture(t);
  await preparePackets(f.manifest, f.dir, f.output);
  const packet = JSON.parse(await readFile(join(f.output, 'packet', 'trials.json')));
  const key = JSON.parse(await readFile(join(f.output, 'private-key.json')));
  assert.equal(packet.trials.length, 2);
  assert.equal(key.trials.length, 2);
  assert.deepEqual(Object.keys(packet).sort(), ['schema_version', 'trials']);
  const publicText = JSON.stringify(packet);
  for (const secret of ['author', 'baseline', 'revision', 'family', 'calibration', 'held-out', 'candidate', 'reference', 'private-source']) {
    assert.ok(!publicText.includes(secret), secret);
  }
  for (const trial of packet.trials) {
    assert.deepEqual(Object.keys(trial).sort(), ['left', 'right', 'trial_id']);
    const mapping = key.trials.find(row => row.trial_id === trial.trial_id);
    const source = f.manifest.trials.find(row => row.id === mapping.id);
    assert.equal(mapping.split, source.split);
    assert.equal(mapping.group, source.group);
    assert.ok(['left', 'right'].includes(mapping.candidate_side));
    for (const side of ['left', 'right']) {
      const role = side === mapping.candidate_side ? 'candidate' : 'reference';
      const original = await readFile(join(f.dir, source[role]));
      const published = await readFile(join(f.output, 'packet', trial[side]));
      assert.deepEqual(decodePNG(published), decodePNG(original));
      assert.equal(mapping[role].source_sha256, digest(original));
      assert.equal(mapping[role].packet_sha256, digest(published));
      assert.match(trial[side], /^[a-f0-9]{32}-(left|right)\.png$/);
    }
  }
  assert.equal((await readdir(join(f.output, 'packet'))).length, 5);
  assert.equal((await stat(f.output)).mode & 0o777, 0o700);
  assert.equal((await stat(join(f.output, 'private-key.json'))).mode & 0o777, 0o600);
});

test('re-encoding strips trailing source annotations without changing the visible pixels', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, f.images[0].name), Buffer.concat([f.images[0].bytes, Buffer.from('author score: five') ]));
  await preparePackets(f.manifest, f.dir, f.output);
  const key = JSON.parse(await readFile(join(f.output, 'private-key.json')));
  const trial = key.trials.find(row => row.id === 'author-baseline');
  const bytes = await readFile(join(f.output, 'packet', `${trial.trial_id}-${trial.candidate_side}.png`));
  assert.deepEqual(bytes, f.images[0].bytes);
});

for (const [name, mutate] of [
  ['duplicate trial IDs', m => { m.trials[1].id = m.trials[0].id; }],
  ['related variants crossing splits', m => { m.trials[1].group = m.trials[0].group; }],
  ['identical pixels crossing splits', m => { m.trials[1].candidate = m.trials[0].candidate; }],
  ['identical comparison sides', m => { m.trials[0].reference = m.trials[0].candidate; }],
  ['unknown split', m => { m.trials[0].split = 'training'; }],
  ['empty trials', m => { m.trials = []; }],
  ['unsupported schema', m => { m.schema_version = 2; }],
  ['missing source', m => { m.trials[0].candidate = 'absent.png'; }],
]) {
  test(`reject ${name} before publishing`, async t => {
    const f = await fixture(t);
    mutate(f.manifest);
    await assert.rejects(preparePackets(f.manifest, f.dir, f.output));
    await assert.rejects(stat(f.output), { code: 'ENOENT' });
  });
}

test('reject invalid image data and preserve an existing destination', async t => {
  const f = await fixture(t);
  await writeFile(join(f.dir, f.images[0].name), 'not a PNG');
  await assert.rejects(preparePackets(f.manifest, f.dir, f.output), /PNG/);
  await writeFile(f.output, 'existing result');
  await assert.rejects(preparePackets(f.manifest, f.dir, f.output));
  assert.equal(await readFile(f.output, 'utf8'), 'existing result');
});
