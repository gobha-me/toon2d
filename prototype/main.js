// Game wiring: input -> physics -> state machine -> director -> face -> pose/IK
// -> secondary motion -> render. All the interesting math lives in the pure
// modules imported below; this file only connects them.
import { addPose } from './anim.js';
import { createDebugPanel } from './debug.js';
import {
  approachParams, composeFace, createBlink, lipFlap, lookAt, mixExpressions, neutralParams, stepBlink,
} from './face.js';
import { createLevel } from './level.js';
import { validateManifest } from './manifest.js';
import { clamp, damp, mulberry32 } from './mathx.js';
import { createBody, groundAngleAt, stepBody, surfaceBelow } from './physics.js';
import { createDirector, pinExpression, stepDirector, weightsOf } from './reactions.js';
import { drawBackground, drawBones, drawCharacter, drawLevel, drawParticles, drawSpeech } from './render.js';
import { animatedPose, applyLegIK, ikWeights } from './rig.js';
import { BONES, CLIPS, IK_MODE, LEGS, STATE_GRAPH } from './rigdata.js';
import { applyPoint, createSkeleton, solveFK } from './skeleton.js';
import { createChain, stepChain, stepSpring, translateChain } from './springs.js';
import { createStateMachine, stepStateMachine } from './statemachine.js';

const query = new URLSearchParams(location.search);
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const VIEW = { w: canvas.width, h: canvas.height };
const ZOOM = clamp(Number(query.get('zoom') || 2), 0.5, 4);
const WORLD_VIEW = { w: VIEW.w / ZOOM, h: VIEW.h / ZOOM };

const manifest = await fetch(new URL('./parts.json', import.meta.url)).then((r) => r.json());
const skel = createSkeleton(BONES);
const check = validateManifest(manifest, skel.bones.map((b) => b.name));
if (!check.ok) throw new Error(`parts.json invalid:\n${check.errors.join('\n')}`);
const images = new Map();
for (const part of manifest.parts) {
  if (!part.image) continue;
  const img = new Image();
  img.src = new URL(part.image, import.meta.url).href; // relative to this module: works under any sub-path
  images.set(part.name, img);
}

const level = createLevel();
const rng = mulberry32(Number(query.get('seed') || 7));

// chain anchor points in bone space
const CHAIN_DEFS = {
  ponytail: { bone: 'head', at: [-17, -27], count: 7, seg: 5.5, opts: { stiffness: 0.12, damping: 0.88, gravity: { x: 0, y: 900 } }, rest: [-0.35, 1] },
  scarf: { bone: 'neck', at: [-6, 1], count: 7, seg: 6, opts: { stiffness: 0.025, damping: 0.9, gravity: { x: 0, y: 700 } }, rest: [-0.6, 1] },
  ahoge: { bone: 'head', at: [4, -40], count: 3, seg: 5, opts: { stiffness: 0.55, damping: 0.8, gravity: { x: 0, y: 200 }, bend: 0.5 }, rest: [0.25, -1] },
};

const game = {
  time: 0,
  body: createBody(level.spawn.x, level.spawn.y),
  sm: createStateMachine(STATE_GRAPH),
  director: createDirector(),
  weights: { neutral: 1 },
  faceSmoothed: neutralParams(),
  face: neutralParams(),
  blink: createBlink(1.2),
  overrides: {},
  look: { pupilX: 0, pupilY: 0, headTurn: 0 },
  lookTarget: { x: 0, y: 0 },
  squash: { x: 0, v: 0 },
  groundedW: 1,
  speech: null,
  collected: new Set(),
  allCollectedAt: -1,
  particles: [],
  shake: 0,
  cam: { x: 0, y: 520 },
  mouse: { x: 0, y: 0, at: -99 },
  showBones: query.get('debug') === '1',
  world: null,
  ikTargets: [],
  chains: {},
};

// ---------------------------------------------------------------- input

const keys = new Set();
let jumpLatch = false;
const JUMP_KEYS = ['Space', 'KeyW', 'ArrowUp', 'KeyZ'];
window.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
  if (JUMP_KEYS.includes(e.code) && !keys.has(e.code)) jumpLatch = true;
  keys.add(e.code);
  if (e.code === 'KeyB') game.showBones = !game.showBones;
  if (e.code === 'KeyF') togglePanel();
  if (e.code === 'KeyR') respawn(false);
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointermove', (e) => {
  const r = canvas.getBoundingClientRect();
  game.mouse = {
    x: ((e.clientX - r.left) * WORLD_VIEW.w) / r.width + game.cam.x,
    y: ((e.clientY - r.top) * WORLD_VIEW.h) / r.height + game.cam.y,
    at: game.time,
  };
});

function readInput() {
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  const input = {
    x: (right ? 1 : 0) - (left ? 1 : 0),
    jumpHeld: JUMP_KEYS.some((k) => keys.has(k)),
    jumpPressed: jumpLatch,
  };
  jumpLatch = false;
  return input;
}

// ---------------------------------------------------------------- panel

const panelEl = document.getElementById('panel');
const panel = createDebugPanel(panelEl, {
  pin: (name) => {
    game.director = pinExpression(game.director, name);
  },
  say: (text) => say(text),
  override: (name, v) => {
    game.overrides = { ...game.overrides, [name]: v };
  },
  clearOverrides: () => {
    game.overrides = {};
  },
});
function togglePanel(force) {
  const show = force ?? panelEl.classList.contains('hidden');
  panelEl.classList.toggle('hidden', !show);
}
if (query.get('debug') === '1' || query.get('panel') === '1') togglePanel(true);
if (query.get('expr')) game.director = pinExpression(game.director, query.get('expr'));

// ---------------------------------------------------------------- helpers

function charToWorld(lx, ly) {
  const sy = 1 + game.squash.x;
  const sx = 1 / Math.sqrt(sy);
  return { x: game.body.x + game.body.facing * sx * lx, y: game.body.y + sy * ly };
}

function boneToWorld(name, x, y) {
  const p = applyPoint(game.world[skel.index.get(name)], x, y);
  return charToWorld(p.x, p.y);
}

function say(text) {
  if (text) game.speech = { text: String(text).slice(0, 60), t: 0 };
}

function burst(x, y, n, colors, speed = 120) {
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2;
    const s = speed * (0.4 + rng() * 0.8);
    const life = 0.4 + rng() * 0.4;
    game.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, life, max: life, r: 2.5 + rng() * 3, color: colors[i % colors.length] });
  }
}

function initChains() {
  for (const [name, d] of Object.entries(CHAIN_DEFS)) {
    const a = boneToWorld(d.bone, d.at[0], d.at[1]);
    game.chains[name] = createChain(d.count, d.seg, a.x, a.y, d.rest[0] * game.body.facing, d.rest[1]);
  }
}

function respawn(sad) {
  const dx = level.spawn.x - game.body.x;
  const dy = level.spawn.y - game.body.y;
  game.body = createBody(level.spawn.x, level.spawn.y);
  for (const k of Object.keys(game.chains)) game.chains[k] = translateChain(game.chains[k], dx, dy);
  return sad ? ['respawn'] : [];
}

// ---------------------------------------------------------------- update

const PHYS_STEP = 1 / 120;
const BIG_DROP = 170;

function update(dt) {
  game.time += dt;
  const input = readInput();
  const physEvents = [];
  const n = Math.max(1, Math.ceil(dt / PHYS_STEP));
  for (let i = 0; i < n; i++) {
    const r = stepBody(game.body, { ...input, jumpPressed: i === 0 && input.jumpPressed }, dt / n, level);
    game.body = r.body;
    physEvents.push(...r.events);
  }
  const b = game.body;

  // gameplay events -> squash/particles + director reactions
  const reactions = [];
  for (const e of physEvents) {
    if (e.type === 'chargeFull') {
      reactions.push('chargeFull');
      burst(b.x, b.y - 4, 6, ['#ffd34d', '#fff'], 80);
    } else if (e.type === 'jump') {
      game.squash.v += 3.5 + 3 * e.power;
      if (e.power > 0.9) reactions.push('bigJump');
    } else if ((e.type === 'apex' || e.type === 'leftGround') && e.drop > BIG_DROP) {
      reactions.push('apexHigh');
    } else if (e.type === 'land') {
      game.squash.v -= clamp(e.impact / 900, 0.25, 1.3) * 7;
      if (e.impact > 900) reactions.push('landHard');
      if (e.impact > 500) burst(b.x, b.y, 6, ['#e8d3b5', '#fff'], 70);
    } else if (e.type === 'hurt') {
      reactions.push('hurt');
      game.shake = 0.25;
      burst(b.x, b.y - 30, 10, ['#ff5a6e', '#fff', '#ffd34d'], 160);
    } else if (e.type === 'fellOut') {
      reactions.push(...respawn(true));
    }
  }
  for (const [i, g] of level.gems.entries()) {
    if (!game.collected.has(i) && Math.hypot(g.x - b.x, g.y - (b.y - 30)) < 26) {
      game.collected.add(i);
      reactions.push('gem');
      burst(g.x, g.y, 12, ['#ff6fb5', '#ffd34d', '#fff', '#8fe3ff'], 140);
    }
  }
  if (game.collected.size === level.gems.length) {
    if (game.allCollectedAt < 0) game.allCollectedAt = game.time;
    else if (game.time - game.allCollectedAt > 3) {
      game.collected.clear();
      game.allCollectedAt = -1;
    }
  }

  const snap = { grounded: b.grounded, speed: Math.abs(b.vx), charging: b.charging, charge: b.charge, vy: b.vy, hurt: b.hurtTime > 0 };
  game.sm = stepStateMachine(STATE_GRAPH, game.sm, snap, dt);
  const dr = stepDirector(game.director, snap, reactions, dt);
  game.director = dr.director;
  game.weights = dr.weights;
  if (dr.lines.length) say(dr.lines[dr.lines.length - 1]);

  // ---- face
  game.faceSmoothed = approachParams(game.faceSmoothed, mixExpressions(game.weights), dt);
  const bl = stepBlink(game.blink, dt, rng, { suppress: clamp((game.weights.surprised ?? 0) + (game.weights.determined ?? 0) * 0.5, 0, 0.9) });
  game.blink = bl.state;
  const headPos = game.world ? boneToWorld('head', 5, -16) : { x: b.x, y: b.y - 60 };
  game.lookTarget = chooseLookTarget(headPos);
  const lk = lookAt(headPos.x, headPos.y, game.lookTarget.x, game.lookTarget.y, b.facing);
  game.look = {
    pupilX: damp(game.look.pupilX, lk.pupilX, 14, dt),
    pupilY: damp(game.look.pupilY, lk.pupilY, 14, dt),
    headTurn: damp(game.look.headTurn, lk.headTurn, 8, dt),
  };
  let viseme = null;
  if (game.speech) {
    game.speech.t += dt;
    const lf = lipFlap(game.speech.text, game.speech.t, 16);
    game.speech.shown = lf.shown;
    if (!lf.done) viseme = { mouthOpen: lf.mouthOpen, mouthWidth: lf.mouthWidth, weight: 1 };
    else if (game.speech.t > game.speech.text.length / 16 + 1.3) game.speech = null;
  }
  game.face = composeFace(game.faceSmoothed, {
    look: { ...game.look, weight: 1 },
    viseme,
    blink: bl.closed,
    overrides: game.overrides,
  });

  // ---- squash & stretch spring (volume preserving)
  const sqTarget = b.charging ? -0.16 * b.charge : 0;
  const s = stepSpring(game.squash.x, game.squash.v, sqTarget, 280, 13, dt);
  game.squash = { x: clamp(s.x, -0.38, 0.38), v: s.v };
  const sy = 1 + game.squash.x;
  const sx = 1 / Math.sqrt(sy);

  // ---- pose: clips + procedural layer + ground IK
  const slope = groundAngleAt(level.segments, b.x, b.y);
  const procedural = {
    head: { rot: game.look.headTurn + game.face.headTilt * 0.14 },
    spine: { rot: (b.grounded ? -slope * b.facing * 0.35 : 0) + clamp(b.vx * b.facing, -300, 300) * 0.0002 },
  };
  const pose = addPose(animatedPose(CLIPS, game.sm), procedural);
  game.groundedW = damp(game.groundedW, b.grounded ? 1 : 0, 30, dt);
  const iw = ikWeights(game.sm, IK_MODE);
  const groundAt = (lx) => {
    const wx = b.x + b.facing * lx * sx;
    const hit = surfaceBelow(level.segments, wx, b.y - 22);
    if (!hit) return 0;
    return clamp((hit.y - b.y) / sy, -16, 16);
  };
  const ik = applyLegIK(skel, pose, LEGS, groundAt, { plant: iw.plant * game.groundedW, adjust: iw.adjust * game.groundedW }, slope * b.facing);
  game.world = ik.world;
  game.ikTargets = ik.targets;

  // ---- secondary motion
  if (!game.chains.ponytail) initChains();
  for (const [name, d] of Object.entries(CHAIN_DEFS)) {
    const a = boneToWorld(d.bone, d.at[0], d.at[1]);
    const flutter = name === 'scarf' ? Math.sin(game.time * 9) * 120 : 0;
    game.chains[name] = stepChain(game.chains[name], a.x, a.y, dt, {
      ...d.opts,
      gravity: { x: d.opts.gravity.x - b.vx * 0.6 + flutter * (b.grounded ? 0.3 : 1), y: d.opts.gravity.y },
      restDir: { x: d.rest[0] * b.facing, y: d.rest[1] },
      bend: (d.opts.bend ?? 0) * b.facing,
    });
  }

  for (const p of game.particles) {
    p.life -= dt;
    p.vy += 400 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  game.shake = Math.max(0, game.shake - dt);

  // camera
  const tx = clamp(b.x - WORLD_VIEW.w / 2 + b.facing * 40, 0, level.world.width - WORLD_VIEW.w);
  const ty = clamp(b.y - WORLD_VIEW.h * 0.66, level.world.top, level.world.bottom - WORLD_VIEW.h);
  game.cam.x = damp(game.cam.x, tx, 6, dt);
  game.cam.y = damp(game.cam.y, ty, 5, dt);
  // hard bounds so fast jumps/falls never leave the frame
  game.cam.y = clamp(game.cam.y, b.y - WORLD_VIEW.h + 30, b.y - 95);
  game.cam.y = clamp(game.cam.y, level.world.top, level.world.bottom - WORLD_VIEW.h);
}

function chooseLookTarget(head) {
  const b = game.body;
  if (game.time - game.mouse.at < 3) return { x: game.mouse.x, y: game.mouse.y };
  let best = null;
  for (const [i, g] of level.gems.entries()) {
    if (game.collected.has(i)) continue;
    const d = Math.hypot(g.x - head.x, g.y - head.y);
    if (d < 280 && (!best || d < best.d)) best = { x: g.x, y: g.y, d };
  }
  if (best) return best;
  return { x: head.x + b.facing * 200, y: head.y + (b.grounded ? 10 : b.vy * 0.15) };
}

// ---------------------------------------------------------------- render

function render() {
  drawBackground(ctx, { x: game.cam.x * ZOOM, y: (game.cam.y - 450) * ZOOM * 0.5 }, VIEW, game.time);
  ctx.save();
  const shake = game.shake > 0 ? (rng() - 0.5) * 8 * (game.shake / 0.25) : 0;
  ctx.scale(ZOOM, ZOOM);
  ctx.translate(-game.cam.x + shake, -game.cam.y);
  drawLevel(ctx, level, game.time, game.collected);
  const b = game.body;
  const sy = 1 + game.squash.x;
  const ch = {
    x: b.x,
    y: b.y,
    facing: b.facing,
    sx: 1 / Math.sqrt(sy),
    sy,
    skel,
    world: game.world,
    face: game.face,
    chains: game.chains,
    time: game.time,
    flash: b.invuln > 0 && Math.floor(game.time * 18) % 2 === 0,
  };
  drawCharacter(ctx, ch, manifest, images);
  drawParticles(ctx, game.particles);
  if (game.speech) {
    const top = boneToWorld('head', 2, -46);
    drawSpeech(ctx, top.x + b.facing * 18, top.y - 6, game.speech.text.slice(0, game.speech.shown ?? 0));
  }
  if (game.showBones) {
    drawBones(ctx, ch, game.ikTargets);
    ctx.strokeStyle = '#ff3cf0';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    const h = boneToWorld('head', 5, -16);
    ctx.moveTo(h.x, h.y);
    ctx.lineTo(game.lookTarget.x, game.lookTarget.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
  drawHud();
}

function drawHud() {
  const entries = Object.entries(game.weights).filter(([, w]) => w > 0.02).sort((a, b) => b[1] - a[1]).slice(0, 4);
  ctx.save();
  ctx.fillStyle = 'rgba(27,21,48,0.7)';
  ctx.beginPath();
  ctx.roundRect(10, 10, 170, 22 + entries.length * 16 + (game.showBones ? 16 : 0), 8);
  ctx.fill();
  ctx.font = '12px ui-monospace, monospace';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd27a';
  ctx.fillText(game.director.pinned ? `face: pinned ${game.director.pinned}` : 'face: auto (gameplay)', 18, 22);
  entries.forEach(([name, w], i) => {
    const y = 38 + i * 16;
    ctx.fillStyle = '#3d3366';
    ctx.fillRect(90, y - 5, 80, 10);
    ctx.fillStyle = '#f08c2e';
    ctx.fillRect(90, y - 5, 80 * clamp(w, 0, 1), 10);
    ctx.fillStyle = '#fff';
    ctx.fillText(name, 18, y);
  });
  if (game.showBones) {
    ctx.fillStyle = '#8fe3ff';
    ctx.fillText(`anim: ${game.sm.state}${game.sm.prev ? ` <- ${game.sm.prev}` : ''}`, 18, 38 + entries.length * 16);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- loop

let last = performance.now();
let panelSync = 0;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  update(dt);
  render();
  panelSync -= dt;
  if (panelSync <= 0 && !panelEl.classList.contains('hidden')) {
    panelSync = 0.1;
    panel.sync(game.face, game.overrides, game.director.pinned);
  }
  requestAnimationFrame(frame);
}
game.world = solveFK(skel, {});
initChains();
requestAnimationFrame(frame);

// Small automation/debug hook (used by scripts/shots.mjs).
window.toon = {
  game,
  teleport(x, y) {
    const dx = x - game.body.x;
    const dy = y - game.body.y;
    game.body = { ...game.body, x, y, vx: 0, vy: 0, grounded: false };
    for (const k of Object.keys(game.chains)) game.chains[k] = translateChain(game.chains[k], dx, dy);
  },
  pin(name) {
    game.director = pinExpression(game.director, name);
  },
  say,
  weights: () => weightsOf(game.director),
};
