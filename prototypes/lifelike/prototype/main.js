import { Batch, createGL, loadImage, texture } from './gl.js';
import { GAITS, Rig, buildMeshes, drawCutout, drawFlipbook, drawMeshes, gaitSpeed } from './rig.js';
import { EXPRS, FaceRenderer, FaceSim, METHODS, TURN_MODES, VIEWS } from './face.js';

const DT = 1 / 60;
const q = new URLSearchParams(location.search);
const settings = { paused: false, debug: q.get('debug') === '1', gait: q.get('gait') || 'walk', blendC: q.get('blend') === '1', fix: Number(q.get('fix') ?? 2), view: VIEWS[q.get('view')] ? q.get('view') : 'f2' };

const bodyCanvas = document.getElementById('body');
const faceCanvas = document.getElementById('face');
const bgl = createGL(bodyCanvas);
const fgl = createGL(faceCanvas);

const [atlasImg, rigJson, walkImg, walkMeta, fN, fC, fE, fF, faceMeta] = await Promise.all([
  loadImage('body-atlas.webp'), fetch('body-rig.json').then((r) => r.json()),
  loadImage('walk-frames.webp'), fetch('walk-frames.json').then((r) => r.json()),
  loadImage('face-n.webp'), loadImage('face-c.webp'), loadImage('face-e.webp'), loadImage('face-f.webp'),
  fetch('face.json').then((r) => r.json()),
]);
const batch = new Batch(bgl);
const atlas = texture(bgl, atlasImg, { premultiply: true });
const walkTex = texture(bgl, walkImg, { premultiply: true });
const rig = new Rig(rigJson);
const meshes = buildMeshes(rig);
const face = new FaceRenderer(fgl, {
  uN: texture(fgl, fN), uC: texture(fgl, fC), uE: texture(fgl, fE), uF: texture(fgl, fF, { linear: true }),
}, faceMeta);
const faceSim = new FaceSim();
faceSim.eyesOnly = !VIEWS[settings.view].headTurn;

// --- simulation state (deterministic, stepped at 60 Hz)
const sim = { t: 0, ticks: 0, phase: 0, scroll: 0, gaitK: settings.gait === 'idle' ? 0 : 1, cur: settings.gait === 'idle' ? 'walk' : settings.gait, frameC: 0, scrollC: 0 };
const PANEL_W = 400, SCALE = 0.6, GROUND = rigJson.ground;
// C calibration: AI frame cell px -> model px (figure height match) and its own stride
const C_K = (GROUND - 22) / 367;
const C_CYCLE_PX = 240 * C_K; // 6 frames = two steps of ~120 cell px
const C_CYCLE_T = 1.0;

function step() {
  const target = settings.gait === 'idle' ? 0 : 1;
  sim.gaitK += Math.sign(target - sim.gaitK) * Math.min(Math.abs(target - sim.gaitK), DT / 0.35);
  if (settings.gait !== 'idle') sim.cur = settings.gait;
  const g = GAITS[sim.cur];
  sim.phase = (sim.phase + (DT / g.T) * (sim.gaitK > 0 ? 1 : 0)) % 1;
  sim.scroll += gaitSpeed(g) * DT * sim.gaitK;
  const cRate = settings.gait === 'run' ? 2 : 1;
  if (settings.gait !== 'idle') {
    sim.frameC = (sim.frameC + (DT / C_CYCLE_T) * walkMeta.n * cRate) % walkMeta.n;
    sim.scrollC += (C_CYCLE_PX / C_CYCLE_T) * cRate * DT;
  }
  faceSim.step(DT);
  sim.t += DT;
  sim.ticks++;
}

function ground(px, scroll, w) {
  const y = 36 + GROUND * SCALE;
  const pts = [px, y, px + w, y];
  const sp = 60;
  const off = (scroll * SCALE) % sp;
  for (let x = -off; x < w; x += sp) if (x >= 0) pts.push(px + x, y, px + x - 10, y + 12);
  batch.lines(pts, [0.55, 0.6, 0.68, 1]);
}

const TINTS = { near: [1, 1, 1, 1], far: [0.62, 0.62, 0.66, 1], farLeg: [0.8, 0.8, 0.82, 1] };

function drawBody() {
  const W = bodyCanvas.width, H = bodyCanvas.height;
  bgl.clearColor(0.09, 0.1, 0.12, 1);
  bgl.clear(bgl.COLOR_BUFFER_BIT);
  batch.begin(W, H);
  const g = GAITS[sim.cur];
  const pose = Rig.blend(rig.idlePose(sim.t), rig.gaitPose(g, sim.phase, sim.t), sim.gaitK);
  const M = rig.matrices(pose);
  const cx = 175;
  for (let i = 0; i < 3; i++) {
    const view = { x: i * PANEL_W + PANEL_W / 2 - cx * SCALE, y: 36, s: SCALE };
    if (i === 0) drawCutout(batch, atlas, rig, M, view, TINTS, settings.debug);
    if (i === 1) drawMeshes(batch, atlas, rig, meshes, M, pose, view, TINTS, settings.debug);
    if (i === 2) {
      const idle = settings.gait === 'idle';
      drawFlipbook(batch, walkTex, walkMeta, idle ? 0 : sim.frameC, view, {
        k: C_K, cx: cx + 10, ground: GROUND + 4, blend: settings.blendC, debug: settings.debug,
        squash: idle ? 1 + 0.006 * Math.sin((sim.t * Math.PI * 2) / 3.6) : 1,
      });
    }
    ground(i * PANEL_W + 20, i === 2 ? sim.scrollC : sim.scroll, PANEL_W - 40);
    if (i) batch.lines([i * PANEL_W, 0, i * PANEL_W, H], [0.25, 0.27, 0.3, 1]);
  }
}

function drawFace() {
  const W = faceCanvas.width;
  fgl.clearColor(0.09, 0.1, 0.12, 1);
  fgl.clear(fgl.COLOR_BUFFER_BIT);
  faceSim.eyesOnly = !VIEWS[settings.view].headTurn;   // kept in sync every frame (reset() restores the default)
  const s = faceSim.state();
  const size = W / 3;
  VIEWS[settings.view].panels.forEach(([meth, tm], m) => face.draw(meth, tm, s, [m * size + 4, 4, size - 8, size - 8], settings.debug, settings.fix));
  document.getElementById('exprNow').textContent = describe(s);
}
function describe(s) {
  if (faceSim.script) return faceSim.label;
  const on = EXPRS.filter((e) => faceSim.cur[e] > 0.15).map((e) => `${e} ${faceSim.cur[e].toFixed(1)}`);
  if (faceSim.breathI > 0.05) on.push(`breath ${faceSim.breathI.toFixed(2)}`);
  if (faceSim.d.mode !== 'present') on.push(`glance ${faceSim.d.side < 0 ? 'left' : 'right'}`);
  if (s.pain > 0.05) on.push(`pain ${s.pain.toFixed(2)}`);
  if (faceSim.hurtC > 0.05) on.push(`hurting ${faceSim.hurtC.toFixed(2)}`);
  if (faceSim.speech !== 'off') on.push(`${faceSim.speech} (${s.talk.toFixed(2)})`);
  return on.join(' + ') || 'neutral';
}

function draw() {
  drawBody();
  drawFace();
}

let last = performance.now(), acc = 0;
function loop(now) {
  if (!settings.paused) {
    acc += Math.min(0.1, (now - last) / 1000);
    while (acc >= DT) {
      step();
      acc -= DT;
    }
    draw();
  }
  last = now;
  requestAnimationFrame(loop);
}
draw();
requestAnimationFrame(loop);

// --- UI
for (const b of document.querySelectorAll('[data-gait]')) {
  b.addEventListener('click', () => {
    settings.gait = b.dataset.gait;
    syncUI();
  });
}
const $ = (id) => document.getElementById(id);
const PRESETS = {
  'distressed+winded': () => { faceSim.setBlend({ distressed: 1 }); faceSim.setBreath(1, 1.5); },
  'happy+distracted': () => { faceSim.setBlend({ happy: 1 }); faceSim.distract = 0.8; },
  'sad+surprised': () => faceSim.setBlend({ sad: 0.6, surprised: 0.5 }),
  'angry+winded': () => { faceSim.setBlend({ angry: 0.8 }); faceSim.setBreath(0.8, 1.5); },
};
function manual() {
  faceSim.script = false;
  faceSim.label = '';
}
for (const b of document.querySelectorAll('[data-expr]')) {
  b.addEventListener('click', () => {
    if (b.dataset.expr === 'auto') {
      faceSim.reset();
      faceSim.takes = $('takes').checked;
    } else {
      manual();
      faceSim.setExpr(b.dataset.expr);
    }
    syncUI();
  });
}
for (const b of document.querySelectorAll('[data-preset]')) {
  b.addEventListener('click', () => {
    manual();
    faceSim.distract = 0;
    faceSim.setBreath(0, 1.5);
    PRESETS[b.dataset.preset]();
    syncUI();
  });
}
for (const r of document.querySelectorAll('[data-w]')) {
  r.addEventListener('input', () => {
    manual();
    faceSim.target[r.dataset.w] = Number(r.value);
    syncUI();
  });
}
$('breath').addEventListener('input', (e) => {
  manual();
  faceSim.setBreath(Number(e.target.value), 0.8);
  syncUI();
});
$('distract').addEventListener('input', (e) => {
  manual();
  faceSim.distract = Number(e.target.value);
  syncUI();
});
for (const b of document.querySelectorAll('[data-glance]')) {
  b.addEventListener('click', () => {
    manual();
    faceSim.glance(Number(b.dataset.glance), 1.4);
  });
}
$('talk').addEventListener('change', (e) => {
  faceSim.talk = e.target.checked;
});
for (const b of document.querySelectorAll('[data-speech]')) {
  b.addEventListener('click', () => {
    manual();
    faceSim.setSpeech(b.dataset.speech);
    syncUI();
  });
}
for (const b of document.querySelectorAll('[data-hit]')) {
  b.addEventListener('click', () => {
    manual();
    faceSim.hit(Number(b.dataset.hit));
  });
}
$('hurt').addEventListener('input', (e) => {
  manual();
  faceSim.setHurt(Number(e.target.value));
});
$('volume').addEventListener('input', (e) => {
  faceSim.volume = Number(e.target.value);
});
$('view').innerHTML = Object.entries(VIEWS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('');
$('view').addEventListener('change', (e) => {
  settings.view = e.target.value;
  faceSim.eyesOnly = !VIEWS[settings.view].headTurn;
  labels();
});
function labels() {
  const ps = VIEWS[settings.view].panels;
  for (const [i, el] of document.querySelectorAll('#faceStage .labels > div').entries()) {
    const [meth, tm] = ps[i];
    el.querySelector('b').textContent = `${'PQR'[i]}. ${METHODS[meth]}`;
    el.querySelector('span').textContent = meth === 1 ? 'hand-built warp rig, no turned art' : TURN_MODES[tm];
  }
}
$('takes').addEventListener('change', (e) => {
  faceSim.takes = e.target.checked;
});
$('fix').addEventListener('change', (e) => {
  settings.fix = Number(e.target.value);
});
$('debug').addEventListener('change', (e) => {
  settings.debug = e.target.checked;
});
$('blendC').addEventListener('change', (e) => {
  settings.blendC = e.target.checked;
});
function syncUI() {
  for (const b of document.querySelectorAll('[data-gait]')) b.classList.toggle('on', b.dataset.gait === settings.gait);
  const tg = faceSim.target, top = EXPRS.find((e) => tg[e] === 1 && EXPRS.every((x) => x === e || !tg[x]));
  const neutral = EXPRS.every((e) => !tg[e]);
  for (const b of document.querySelectorAll('[data-expr]')) {
    const ex = b.dataset.expr;
    b.classList.toggle('on', ex === 'auto' ? faceSim.script : !faceSim.script && (ex === 'neutral' ? neutral : ex === top));
  }
  for (const r of document.querySelectorAll('[data-w]')) r.value = tg[r.dataset.w];
  $('breath').value = faceSim.breathT;
  $('distract').value = faceSim.distract;
  $('talk').checked = faceSim.talk;
  $('volume').value = faceSim.volume;
  $('hurt').value = faceSim.hurt;
  $('view').value = settings.view;
  for (const b of document.querySelectorAll('[data-speech]')) b.classList.toggle('on', faceSim.speech === b.dataset.speech);
  $('takes').checked = faceSim.takes;
  $('fix').value = String(settings.fix);
  $('debug').checked = settings.debug;
  $('blendC').checked = settings.blendC;
}
syncUI();
labels();

// --- deterministic test API (used by scripts/shots.mjs)
window.lifelike = {
  settings, sim,
  advance(n = 1) {
    for (let i = 0; i < n; i++) step();
    draw();
  },
  reset(gait = 'walk') {
    Object.assign(sim, { t: 0, ticks: 0, phase: 0, scroll: 0, frameC: 0, scrollC: 0, gaitK: gait === 'idle' ? 0 : 1, cur: gait === 'idle' ? 'walk' : gait });
    settings.gait = gait;
    faceSim.reset();
    syncUI();
    draw();
  },
  face: faceSim,
  // expr: null = gambit script; a name = that expression; an object = a blend of targets
  setFace(expr, opts = {}) {
    if (expr === null) {
      faceSim.reset();
    } else {
      manual();
      if (typeof expr === 'string') faceSim.setExpr(expr);
      else faceSim.setBlend(expr);
    }
    if (opts.breath !== undefined) faceSim.setBreath(opts.breath, opts.ramp ?? 0.8);
    if (opts.distract !== undefined) faceSim.distract = opts.distract;
    if (opts.talk !== undefined) faceSim.talk = opts.talk;
    if (opts.speech !== undefined) faceSim.setSpeech(opts.speech);
    if (opts.hit !== undefined) faceSim.hit(opts.hit, opts.side ?? 1);
    if (opts.hurt !== undefined) faceSim.setHurt(opts.hurt);
    if (opts.volume !== undefined) faceSim.volume = opts.volume;
    if (opts.view !== undefined) {
      settings.view = opts.view;
      faceSim.eyesOnly = !VIEWS[settings.view].headTurn;
      labels();
    }
    if (opts.glance) faceSim.glance(opts.glance[0], opts.glance[1]);
    if (opts.fix !== undefined) settings.fix = opts.fix;
    syncUI();
    draw();
  },
  draw,
};
