#!/usr/bin/env node
// Author-side visual review only; the calibrated grader remains separate.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { open, record } from './lib/drive.mjs';
import { encodePNG } from './lib/png.mjs';
import { scaleNearest, sheet } from './lib/img.mjs';
import { hipHeight } from './takeoff.mjs';
import { parseArgs } from './capture.mjs';

export const AXES = Object.freeze([
  'proportions', 'silhouette', 'line_weight', 'palette',
  'shading', 'on_model', 'game_scale', 'appeal',
]);
const IMAGES = ['keyposes', 'keyposes-3x', 'motion'].map((stem) => `${stem}.png`);
const MAX_ROUNDS = 3;
const event = (state, name) => (state.events || []).some((e) => e === name || e?.type === name);
const readJSON = (path) => JSON.parse(readFileSync(path, 'utf8'));
const saveJSON = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/** Select observed events, rather than assuming a particular jump timing. */
export function jumpPoses(states) {
  const takeoff = states.findIndex((s) => event(s, 'jump'));
  const land = states.findIndex((s, i) => i > takeoff && event(s, 'land'));
  if (takeoff < 0 || land <= takeoff) throw new Error('capture needs a complete jump and landing');
  const crouches = states.slice(0, takeoff).map((s, i) => ({ height: hipHeight(s), i }))
    .filter(({ height, i }) => height !== null && states[i].grounded);
  if (!crouches.length) throw new Error('capture needs grounded crouch geometry');
  const crouch = crouches.reduce((a, b) => b.height < a.height ? b : a).i;
  let apex = takeoff;
  for (let i = takeoff; i < land; i++) {
    if (states[i].root.y < states[apex].root.y) apex = i;
  }
  return { crouch, takeoff, apex, land };
}

export async function captureReview(project, dir, { query = '' } = {}) {
  const session = await open(resolve(project), query);
  try {
    await session.page.eval('window.__toon.reset({ seed: 1 })');
    const rec = await record(session.page, [
      { name: 'idle', ticks: 90, input: {}, every: 15, layer: 'buffer' },
      { name: 'run', ticks: 60, input: { right: true }, every: 10, layer: 'buffer' },
      { name: 'stop', ticks: 45, input: {} },
      { name: 'jump', ticks: 90, input: { jump: true }, releaseJumpAt: 22, every: 1, layer: 'buffer' },
    ]);
    if (session.page.errors.length) throw new Error(session.page.errors.join('\n'));
    const poses = jumpPoses(rec.jump.states);
    const frames = [rec.idle.frames[0].img, rec.run.frames[3].img,
      ...Object.values(poses).map((i) => rec.jump.frames.find((f) => f.i === i).img)];
    const contact = sheet(frames, frames.length);
    const zoom = scaleNearest(contact, 3);
    const motion = sheet(rec.run.frames.map((f) => f.img), 6);
    for (const [name, img] of [['keyposes.png', contact], ['keyposes-3x.png', zoom], ['motion.png', motion]]) {
      writeFileSync(join(dir, name), encodePNG(img.w, img.h, img.data));
    }
    saveJSON(join(dir, 'frames.json'), {
      seed: 1, query, view: session.view,
      order: ['idle', 'run', ...Object.keys(poses)], jump_ticks: poses,
      motion_ticks: rec.run.frames.map((f) => f.i),
    });
  } finally {
    await session.close();
  }
}

function stateAt(out) {
  const path = join(out, 'state.json');
  return existsSync(path) ? readJSON(path) : { rounds: [], status: 'ready', max_rounds: MAX_ROUNDS };
}

export async function captureRound(project, out, { query = '', capture = captureReview } = {}) {
  out = resolve(out);
  const state = stateAt(out);
  if (state.status !== 'ready' || state.rounds.length >= MAX_ROUNDS) {
    throw new Error(`cannot capture: ${state.status}; assess the pending round or start a fresh review`);
  }
  mkdirSync(out, { recursive: true });
  const name = `round-${state.rounds.length + 1}`;
  const dir = join(out, name);
  mkdirSync(dir); // Never overwrite captures or their critique.
  const round = { directory: name, status: 'capture-failed' };
  state.rounds.push(round);
  state.status = 'capture-failed';
  saveJSON(join(out, 'state.json'), state);
  await capture(project, dir, { query });
  round.images = Object.fromEntries(IMAGES.map((name) => [name, digest(join(dir, name))]));
  round.status = state.status = 'awaiting-review';
  saveJSON(join(dir, 'review.json'), {
    reviewer: '', role: 'author', images_seen: [],
    axes: Object.fromEntries(AXES.map((axis) => [axis, { score: null, observation: '' }])),
  });
  saveJSON(join(out, 'state.json'), state);
  return { directory: dir, status: state.status };
}

/** Bind a pixel-based critique to this exact capture and enforce the round cap. */
export function assessRound(out) {
  out = resolve(out);
  const state = stateAt(out);
  if (state.status !== 'awaiting-review') throw new Error(`cannot assess: ${state.status}`);
  const round = state.rounds.at(-1);
  const dir = join(out, round.directory);
  const review = readJSON(join(dir, 'review.json'));
  if (typeof review.reviewer !== 'string' || !review.reviewer.trim() ||
      !['author', 'independent', 'human'].includes(review.role)) {
    throw new Error('name the reviewer and use role author, independent, or human');
  }
  if (!Array.isArray(review.images_seen) || IMAGES.some((name) => !review.images_seen.includes(name))) {
    throw new Error('look at all three images and record them in images_seen');
  }
  if (!review.axes || Object.keys(review.axes).sort().join() !== [...AXES].sort().join()) {
    throw new Error('review all eight rubric axes exactly once');
  }
  for (const axis of AXES) {
    const item = review.axes[axis];
    if (!Number.isInteger(item?.score) || item.score < 1 || item.score > 5 ||
        typeof item.observation !== 'string' || !item.observation.trim()) {
      throw new Error(`${axis}: provide an integer score 1-5 and a specific visual observation`);
    }
  }
  for (const name of IMAGES) {
    if (digest(join(dir, name)) !== round.images[name]) throw new Error(`capture changed: ${name}`);
  }
  const lowest = Math.min(...AXES.map((axis) => review.axes[axis].score));
  const fix = AXES.find((axis) => review.axes[axis].score === lowest);
  const status = lowest >= 3 ? 'author-pass' : state.rounds.length >= MAX_ROUNDS ? 'budget-exhausted' : 'ready';
  const critique = {
    ...review, lowest_score: lowest, fix_first: lowest < 3 ? fix : null,
    status, provisional: review.role === 'author', images: round.images,
  };
  writeFileSync(join(dir, 'critique.json'), `${JSON.stringify(critique, null, 2)}\n`, { flag: 'wx' });
  round.status = status;
  round.fix_first = critique.fix_first;
  state.status = status;
  saveJSON(join(out, 'state.json'), state);
  return critique;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const { pos, o } = parseArgs(process.argv.slice(2));
    if (!o.out || !['capture', 'assess'].includes(pos[0]) || (pos[0] === 'capture' && !pos[1])) {
      throw new Error('usage: self-review.mjs capture <project> --out <review-dir> [--query value] | assess --out <review-dir>');
    }
    const result = pos[0] === 'capture'
      ? await captureRound(pos[1], o.out, { query: o.query || '' }) : assessRound(o.out);
    console.log(JSON.stringify(result, null, 2));
    if (result.status === 'budget-exhausted') process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 2;
  }
}
