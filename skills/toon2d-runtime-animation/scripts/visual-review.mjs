#!/usr/bin/env node
// Deterministic, CPU-only advisory proxies; no model calls and no grader changes.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { open, record } from './lib/drive.mjs';
import { alphaBox, components, hash, scaleNearest, sheet } from './lib/img.mjs';
import { encodePNG } from './lib/png.mjs';
import { hipHeight, torsoPitch } from './takeoff.mjs';
import { jumpPoses } from './self-review.mjs';

// Fail-floor candidates only. Human calibration is still needed before gating art.
export const VISUAL_LIMITS = Object.freeze({
  mainComponent: 0.97, boxFill: 0.85, splitRows: 0.08,
  accelerationP95: 0.10, accelerationMax: 0.35, motionSpan: 0.02,
  crouchDepth: 0.15, crouchTicksMin: 3, crouchTicksMax: 18,
  overshootDegrees: 2, settleDegrees: 2,
  maxHoldTicks: 6, jitterFraction: 0.15, jitterStep: 0.015,
  partialAlphaFraction: 0.001,
});
const SEGMENTS = ['idle', 'run', 'stop', 'jump'];
const event = (s, name) => (s.events || []).some((e) => e === name || e?.type === name);
const mean = (a) => a.length ? a.reduce((a, b) => a + b, 0) / a.length : null;
const quantile = (a, q) => a.length ? [...a].sort((a, b) => a - b)[Math.floor((a.length - 1) * q)] : null;
const rounded = (v) => v === null ? null : +v.toFixed(5);
const cite = (segment, tick) => ({ segment, tick });
const signal = (id, pass, detail, metrics, evidence) => ({
  id, status: pass ? 'pass' : 'warn', detail, metrics, evidence,
});
const joint = (s, name) => (s.joints || []).find((j) => j.name === name);

function validate(rec, view) {
  if (!view || !['pixel', 'smooth'].includes(view.mode) || !Number.isFinite(view.s) || view.s <= 0) {
    throw new Error('view needs mode pixel/smooth and a finite positive scale');
  }
  let dimensions;
  for (const name of SEGMENTS) {
    const seg = rec[name];
    if (!seg || !Array.isArray(seg.states) || seg.states.length < 2 || !Array.isArray(seg.frames)) {
      throw new Error(`missing or incomplete segment: ${name}`);
    }
    if (seg.frames.length !== seg.states.length || seg.frames.some((f, i) => f.i !== i)) {
      throw new Error(`${name}: character captures must cover every tick in order`);
    }
    for (const s of seg.states) {
      if (![s.root?.x, s.root?.y].every(Number.isFinite) || !Array.isArray(s.joints) ||
          s.joints.some((j) => ![j.x, j.y, j.ex, j.ey].every(Number.isFinite))) {
        throw new Error(`${name}: roots and joint coordinates must be finite`);
      }
      const names = s.joints.map((j) => j.name);
      if (names.some((n) => typeof n !== 'string' || !n.trim()) || new Set(names).size !== names.length) {
        throw new Error(`${name}: joint names must be nonempty and unique in each snapshot`);
      }
    }
    for (const f of seg.frames) {
      const im = f.img;
      if (!im || !Number.isInteger(im.w) || !Number.isInteger(im.h) || im.w < 1 || im.h < 1 ||
          im.w * im.h > 1_000_000 || !(im.data instanceof Uint8Array) || im.data.length !== im.w * im.h * 4) {
        throw new Error(`${name}: invalid RGBA image`);
      }
      dimensions ??= { w: im.w, h: im.h };
      if (im.w !== dimensions.w || im.h !== dimensions.h) throw new Error(`${name}: inconsistent image dimensions`);
    }
  }
}

function silhouetteMetrics(img) {
  const box = alphaBox(img);
  if (!box) return { main: 0, fill: 0, split: 0, empty: true, clipped: false };
  const sizes = components(img);
  const area = sizes.reduce((a, b) => a + b, 0);
  const width = box.x1 - box.x0 + 1;
  const height = box.y1 - box.y0 + 1;
  let split = 0;
  const start = box.y0 + Math.floor(height / 2);
  for (let y = start; y <= box.y1; y++) {
    let runs = 0;
    let previous = false;
    for (let x = box.x0; x <= box.x1; x++) {
      const opaque = img.data[(y * img.w + x) * 4 + 3] >= 128;
      if (opaque && !previous) runs++;
      previous = opaque;
    }
    if (runs >= 2) split++;
  }
  return {
    main: sizes[0] / area, fill: area / (width * height), split: split / (box.y1 - start + 1), empty: false,
    clipped: box.x0 === 0 || box.y0 === 0 || box.x1 === img.w - 1 || box.y1 === img.h - 1,
  };
}

function analyzeSilhouette(rec) {
  const frames = SEGMENTS.flatMap((segment) => rec[segment].frames.map((f) => {
    const m = silhouetteMetrics(f.img);
    const faults = Number(m.main < VISUAL_LIMITS.mainComponent) + Number(m.fill > VISUAL_LIMITS.boxFill) +
      Number(m.split < VISUAL_LIMITS.splitRows) + Number(m.empty) + Number(m.clipped);
    return { ...m, faults, ...cite(segment, f.i) };
  }));
  const ranked = [...frames].sort((a, b) => b.faults - a.faults);
  const metrics = {
    min_component_share: rounded(Math.min(...frames.map((f) => f.main))),
    max_box_fill: rounded(Math.max(...frames.map((f) => f.fill))),
    min_split_rows: rounded(Math.min(...frames.map((f) => f.split))),
    empty_frames: frames.filter((f) => f.empty).length,
    clipped_frames: frames.filter((f) => f.clipped).length,
    flagged_frames: frames.filter((f) => f.faults).length, frames: frames.length,
  };
  return signal('silhouette', !metrics.flagged_frames,
    'Alpha-mask connectivity, box fill and separated lower-body spans; skirts and crossed limbs need visual review.',
    metrics, ranked.slice(0, 6).map(({ segment, tick }) => cite(segment, tick)));
}

function motion(rec, height) {
  const st = rec.run.states;
  // Skip the first 12 ticks of acceleration. Endpoints stay relative to the root.
  const names = [...new Set(st.flatMap((s) => s.joints.filter((j) => j.name !== 'hip').map((j) => j.name)))];
  const acceleration = [];
  const jitter = [];
  const spans = [];
  const perJoint = [];
  let complete = names.length > 0 && height > 0;
  for (const name of names) {
    if (!(height > 0)) continue;
    const points = st.map((s) => {
      const j = joint(s, name);
      return j ? { x: (j.ex - s.root.x) / height, y: (j.ey - s.root.y) / height } : null;
    });
    if (points.some((p) => !p)) { complete = false; continue; }
    const p = points.slice(12);
    if (p.length < 6) { complete = false; continue; }
    spans.push(Math.hypot(Math.max(...p.map((v) => v.x)) - Math.min(...p.map((v) => v.x)),
      Math.max(...p.map((v) => v.y)) - Math.min(...p.map((v) => v.y))));
    const boneAcceleration = [];
    const boneJitter = [];
    for (let i = 13; i < points.length - 1; i++) {
      const a = points[i - 1];
      const b = points[i];
      const c = points[i + 1];
      const u = { x: b.x - a.x, y: b.y - a.y };
      const v = { x: c.x - b.x, y: c.y - b.y };
      const sample = { value: Math.hypot(v.x - u.x, v.y - u.y), tick: i, joint: name };
      acceleration.push(sample);
      boneAcceleration.push(sample.value);
      const nu = Math.hypot(u.x, u.y);
      const nv = Math.hypot(v.x, v.y);
      const reversal = nu > VISUAL_LIMITS.jitterStep && nv > VISUAL_LIMITS.jitterStep &&
        (u.x * v.x + u.y * v.y) / (nu * nv) < -0.5;
      jitter.push({ reversal, tick: i, joint: name });
      boneJitter.push(Number(reversal));
    }
    perJoint.push({ name, p95: quantile(boneAcceleration, 0.95), jitter: mean(boneJitter) });
  }
  const worstSpacing = [...perJoint].sort((a, b) => b.p95 - a.p95)[0];
  const worstJitter = [...perJoint].sort((a, b) => b.jitter - a.jitter)[0];
  const p95 = worstSpacing?.p95 ?? null;
  const peak = [...acceleration].sort((a, b) => b.value - a.value)[0];
  const maximum = peak?.value ?? null;
  const span = spans.length ? Math.max(...spans) : null;
  const fraction = worstJitter?.jitter ?? null;
  const hasMotion = complete && span >= VISUAL_LIMITS.motionSpan;
  const spacingBone = maximum > VISUAL_LIMITS.accelerationMax ? peak?.joint : worstSpacing?.name;
  const spacingEvidence = acceleration.filter((a) => a.joint === spacingBone);
  const neighbors = (samples) => {
    // Two local triplets expose spacing and reversals instead of isolated stills.
    const selected = [];
    const seen = new Set();
    for (const sample of samples) {
      if (selected.length >= 6) break;
      const ticks = [sample.tick - 1, sample.tick, sample.tick + 1];
      if (ticks.some((tick) => seen.has(tick))) continue;
      for (const tick of ticks) {
        seen.add(tick);
        selected.push({ ...cite('run', tick), joint: sample.joint });
      }
    }
    return selected.length ? selected : [cite('run', 0)];
  };
  return [
    signal('spacing', hasMotion && p95 !== null && p95 <= VISUAL_LIMITS.accelerationP95 && maximum <= VISUAL_LIMITS.accelerationMax,
      'Worst-joint 95th-percentile and maximum endpoint acceleration in standing hip-heights/tick²; root-relative, run ticks 12 onward.',
      { acceleration_p95: rounded(p95), acceleration_max: rounded(maximum), worst_joint: worstSpacing?.name ?? null, max_joint: peak?.joint ?? null,
        max_motion_span: rounded(span), samples: acceleration.length, complete },
      neighbors(spacingEvidence.sort((a, b) => b.value - a.value))),
    signal('jitter', hasMotion && fraction !== null && fraction <= VISUAL_LIMITS.jitterFraction,
      hasMotion ? 'Worst-joint fraction of significant endpoint steps immediately reversing by more than 120°; deliberate impacts can warn.'
        : 'Insufficient moving geometry to assess jitter; inspect missing bones, standing height or a frozen run.',
      { reversal_fraction: rounded(fraction), worst_joint: worstJitter?.name ?? null, samples: jitter.length, complete, moving: hasMotion },
      neighbors(jitter.filter((j) => j.joint === worstJitter?.name)
        .sort((a, b) => Number(b.reversal) - Number(a.reversal)))),
  ];
}

function anticipation(rec, height) {
  const states = rec.jump.states;
  const launch = states.findIndex((s) => event(s, 'jump'));
  const land = states.findIndex((s, i) => i > launch && event(s, 'land'));
  let crouch = -1;
  for (let i = launch - 1; i >= 0; i--) if (event(states[i], 'crouch')) { crouch = i; break; }
  const window = crouch >= 0 && launch > crouch ? states.slice(crouch, launch) : [];
  const heights = window.map(hipHeight);
  const deep = heights.length && heights.every((h) => Number.isFinite(h)) ? Math.min(...heights) : null;
  const depth = height > 0 && deep !== null ? (height - deep) / height : null;
  const ticks = window.length;
  const flight = launch >= 0 && land > launch ? states.slice(launch, land) : [];
  const airborne = flight.filter((s) => s.grounded === false).length;
  const completeFlight = airborne > 0 && airborne === flight.length && states[land]?.grounded === true;
  const pass = depth !== null && depth >= VISUAL_LIMITS.crouchDepth && ticks >= VISUAL_LIMITS.crouchTicksMin &&
    ticks <= VISUAL_LIMITS.crouchTicksMax && window.every((s) => s.grounded) && completeFlight;
  return signal('anticipation', pass, 'Grounded jump-squat depth and duration, followed by observed airborne flight and a grounded landing.',
    { depth_fraction: rounded(depth), crouch_ticks: ticks, launch_tick: launch, land_tick: land, airborne_ticks: airborne },
    [...new Set([Math.max(0, crouch - 1), crouch, deep === null ? -1 : crouch + heights.indexOf(deep), launch, land])]
      .filter((i) => i >= 0).map((i) => cite('jump', i)));
}

function overshoot(rec) {
  const pitches = rec.stop.states.map(torsoPitch);
  const valid = pitches.every((p) => p !== null && Number.isFinite(p));
  // Use the measured final pose as the target, not an assumed upright stance.
  const target = valid ? mean(pitches.slice(-5)) : null;
  const initial = valid ? pitches[0] - target : null;
  const direction = Math.sign(initial);
  const excursion = valid ? Math.max(0, ...pitches.map((p) => -(p - target) * direction)) : null;
  const tail = valid ? Math.max(...pitches.slice(-5).map((p) => Math.abs(p - target))) : null;
  const extreme = valid ? pitches.findIndex((p) => -(p - target) * direction === excursion) : 0;
  const pass = valid && Math.abs(initial) >= VISUAL_LIMITS.overshootDegrees && excursion >= VISUAL_LIMITS.overshootDegrees &&
    tail <= VISUAL_LIMITS.settleDegrees;
  return signal('overshoot', pass, 'Stop torso crosses its final pitch, then settles during the final five ticks; not required in every style.',
    { initial_offset_degrees: rounded(initial), excursion_degrees: rounded(excursion), tail_range_degrees: rounded(tail) },
    [0, Math.max(0, extreme), rec.stop.states.length - 5, rec.stop.states.length - 1].map((i) => cite('stop', i)));
}

function holds(rec) {
  const frames = rec.run.frames;
  const runs = [];
  for (const f of frames) {
    const value = hash(f.img);
    const last = runs.at(-1);
    if (last?.hash === value) last.ticks++;
    else runs.push({ hash: value, start: f.i, ticks: 1 });
  }
  const max = Math.max(...runs.map((r) => r.ticks));
  return signal('holds', max <= VISUAL_LIMITS.maxHoldTicks && runs.length > 1,
    'Consecutive identical root-follow character rasters at 60 Hz; ones/twos/threes accepted, long run freezes flagged.',
    { max_hold_ticks: max, pose_runs: runs.length, frames: frames.length },
    runs.sort((a, b) => b.ticks - a.ticks).slice(0, 3).flatMap((r) => [cite('run', r.start), cite('run', r.start + r.ticks - 1)]));
}

function pixelGrid(rec, view) {
  const frames = SEGMENTS.flatMap((segment) => rec[segment].frames.map((f) => {
    let partial = 0;
    let visible = 0;
    for (let i = 3; i < f.img.data.length; i += 4) {
      const a = f.img.data[i];
      if (a > 0) visible++;
      if (a > 0 && a < 255) partial++;
    }
    return { ...cite(segment, f.i), fraction: visible ? partial / visible : 1 };
  }));
  frames.sort((a, b) => b.fraction - a.fraction);
  const integer = Number.isInteger(view.s) && view.s >= 1 && Number.isInteger(view.k) && view.k >= 1;
  return signal('pixel_grid', integer && frames[0].fraction <= VISUAL_LIMITS.partialAlphaFraction,
    'Integer buffer/display scales and binary character-edge alpha; does not establish screen filter quality or joint snapping.',
    { max_partial_alpha_fraction: rounded(frames[0].fraction), integer_scales: integer },
    frames.slice(0, 6).map(({ segment, tick }) => cite(segment, tick)));
}

/** Pure advisory analysis of dense 60 Hz character-layer captures and world-space states. */
export function analyzeVisualReview(rec, view) {
  validate(rec, view);
  const heights = rec.idle.states.map(hipHeight).filter((h) => Number.isFinite(h) && h > 0);
  const height = quantile(heights, 0.5);
  const [spacing, jitter] = motion(rec, height);
  const signals = [analyzeSilhouette(rec), spacing, anticipation(rec, height), overshoot(rec), holds(rec), jitter];
  if (view.mode === 'pixel') signals.push(pixelGrid(rec, view));
  return {
    schema_version: 1, advisory: true, seed: 1, tick_hz: 60,
    mode: view.mode, standing_hip_height: rounded(height), thresholds: VISUAL_LIMITS,
    signals, warning_count: signals.filter((s) => s.status === 'warn').length,
  };
}

export function visualMarkdown(report) {
  const lines = ['# Visual self-review (advisory)', '', `${report.warning_count} warnings. These measurable proxies do not establish artistic approval. Inspect the evidence against the eight-axis taste rubric.`, '',
    '[Key poses at game scale](keyposes.png) · [Nearest 3x](keyposes-3x.png) · [Black silhouettes](silhouettes.png) · [Run motion](motion.png)', '',
    '| Signal | Result | Measurements | Evidence |', '| --- | --- | --- | --- |'];
  for (const s of report.signals) {
    const values = JSON.stringify(s.metrics).replace(/\|/g, '\\|');
    lines.push(`| ${s.id} | ${s.status} | ${values} | [frames](${s.id}.png) |`);
  }
  lines.push('', 'Frame columns and zero-based segment ticks are listed in frames.json. Each evidence strip follows that listed order.', '',
    ...report.signals.map((s) => `- **${s.id}:** ${s.detail}`), '',
    'Warnings exit 0: fix the worst observed problem, then re-render into a new directory. Use self-review.mjs for the bounded human/author critique log.');
  return `${lines.join('\n')}\n`;
}

// Flatten with real alpha blending so thin, antialiased edges survive in the evidence.
function flatten(img, silhouette = false) {
  const data = new Uint8Array(img.data.length);
  for (let i = 0; i < data.length; i += 4) {
    const a = img.data[i + 3] / 255;
    for (let c = 0; c < 3; c++) data[i + c] = silhouette ? (a >= 0.5 ? 0 : 255) : Math.round(img.data[i + c] * a + 240 * (1 - a));
    data[i + 3] = 255;
  }
  return { w: img.w, h: img.h, data };
}

function selectedPoses(rec) {
  const base = [{ pose: 'idle', ...cite('idle', 0) }, { pose: 'run', ...cite('run', 30) }];
  try {
    const poses = jumpPoses(rec.jump.states);
    return [...base, ...Object.entries(poses).map(([pose, tick]) => ({ pose, ...cite('jump', tick) }))];
  } catch {
    // Incomplete animation should still yield reviewable evidence and warnings.
    return [...base, ...[0, 8, 28, 60].map((tick, i) => ({ pose: ['crouch', 'takeoff', 'apex', 'land'][i],
      ...cite('jump', Math.min(tick, rec.jump.states.length - 1)), fallback: true }))];
  }
}

/** Capture the existing runtime contract with GPU disabled by the shared CDP driver. */
export async function renderVisualReview(project, out, { query = '' } = {}) {
  out = resolve(out);
  if (existsSync(out)) throw new Error('output already exists; choose a fresh evidence directory');
  const session = await open(resolve(project), query);
  let rec;
  try {
    const dt = await session.page.eval('window.__toon.dt');
    if (!Number.isFinite(dt) || Math.abs(dt - 1 / 60) > 1e-9) throw new Error('visual review needs the 60 Hz runtime contract');
    await session.page.eval('window.__toon.reset({ seed: 1 })');
    rec = await record(session.page, [
      { name: 'idle', ticks: 90, input: {}, every: 1 },
      { name: 'run', ticks: 60, input: { right: true }, every: 1 },
      { name: 'stop', ticks: 45, input: {}, every: 1 },
      { name: 'jump', ticks: 90, input: { jump: true }, releaseJumpAt: 22, every: 1 },
    ]);
    if (session.page.errors.length) throw new Error(session.page.errors.join('\n'));
  } finally {
    await session.close();
  }
  const report = analyzeVisualReview(rec, session.view);
  const keyposes = selectedPoses(rec);
  const motion = [0, 10, 20, 30, 40, 50].map((tick) => cite('run', tick));
  const imageAt = ({ segment, tick }) => rec[segment].frames[tick].img;
  const contact = (frames, silhouette = false) => sheet(frames.map((f) => flatten(imageAt(f), silhouette)), frames.length);
  const native = contact(keyposes);
  const images = {
    'keyposes.png': native, 'keyposes-3x.png': scaleNearest(native, 3),
    'silhouettes.png': contact(keyposes, true), 'motion.png': contact(motion),
    ...Object.fromEntries(report.signals.map((s) => [`${s.id}.png`, contact(s.evidence, s.id === 'silhouette')])),
  };
  // Create only after rendering and validation; never overwrite earlier evidence.
  mkdirSync(dirname(out), { recursive: true });
  mkdirSync(out); // Atomic exclusive directory creation, including concurrent invocations.
  report.images = {};
  for (const [name, img] of Object.entries(images)) {
    const png = encodePNG(img.w, img.h, img.data);
    writeFileSync(join(out, name), png, { flag: 'wx' });
    report.images[name] = createHash('sha256').update(png).digest('hex');
  }
  const save = (name, value) => writeFileSync(join(out, name), `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  save('frames.json', { seed: 1, query, view: session.view, keyposes, motion,
    signals: Object.fromEntries(report.signals.map((s) => [s.id, s.evidence])) });
  save('report.json', report);
  writeFileSync(join(out, 'report.md'), visualMarkdown(report), { flag: 'wx' });
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const args = process.argv.slice(2);
    const project = args.shift();
    const options = {};
    while (args.length) {
      const key = args.shift();
      if (!['--out', '--query'].includes(key) || !args.length || args[0].startsWith('--') || key in options) {
        throw new Error('usage: visual-review.mjs <project> --out <new-dir> [--query mode=pixel|smooth]');
      }
      options[key] = args.shift();
    }
    if (!project || project.startsWith('--') || !options['--out']) {
      throw new Error('usage: visual-review.mjs <project> --out <new-dir> [--query mode=pixel|smooth]');
    }
    const report = await renderVisualReview(project, options['--out'], { query: options['--query'] || '' });
    for (const s of report.signals) console.log(`${s.status.toUpperCase()} ${s.id}: ${JSON.stringify(s.metrics)}`);
    console.log(`${report.warning_count} advisory warnings; inspect report.md and evidence images.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
