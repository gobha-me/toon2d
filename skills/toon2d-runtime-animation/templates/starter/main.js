// Entry point: loads data, runs a fixed 60 Hz simulation, renders, installs the eval harness.
// URL params: ?mode=pixel|smooth &ap=0|1 &timing=ones|twos|threes &seed=N &expr=happy &harness=1
// Guide aliases: ?style=pixel|toon|chibi|cel|ink, ?off=… (→ ap=0), ?twos=1|2|3, ?pxbuf=0 (→ smooth)
import { createCharacter, stepCharacter } from './engine/character.js';
import { createRenderer, fitDisplay, renderFrame } from './engine/render.js';
import { installHarness } from './engine/harness.js';

const q = new URLSearchParams(location.search);
// Guide aliases (M5): ?style=pixel|toon|…, ?off=…, ?twos=2|3, ?pxbuf=0 map onto mode/ap/timing.
function resolveQuery(q) {
  const style = (q.get('style') || '').toLowerCase();
  let mode = q.get('mode');
  if (!mode) {
    if (style === 'pixel') mode = 'pixel';
    else if (style) mode = 'smooth'; // toon/chibi/cel/ink → full-res smooth preview
    else mode = 'pixel';
  }
  if (q.get('pxbuf') === '0') mode = 'smooth';
  let ap = q.get('ap');
  if (ap == null && q.has('off')) ap = '0'; // any ?off=… means anti-puppet techniques off
  let timing = q.get('timing');
  if (!timing) {
    const twos = q.get('twos');
    if (twos === '1') timing = 'ones';
    else if (twos === '3') timing = 'threes';
    else if (twos === '2' || style === 'ink') timing = 'twos';
    else timing = mode === 'smooth' ? 'ones' : 'twos';
  }
  return { mode, ap: ap !== '0', timing };
}
const DT = 1 / 60;
const LEVEL = { floorY: 150, minX: 0, maxX: 640, platforms: [{ x0: 230, x1: 300, y: 104 }] };

async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function loadSheet(rig) {
  if (!rig.sheet) return null;
  const parts = await loadJSON(rig.sheet.parts);
  const img = new Image();
  img.src = rig.sheet.image;
  await img.decode();
  return { img, parts: parts.parts, palette: parts.palette || [] };
}

async function boot() {
  const rig = await loadJSON('rig.json');
  const expressions = await loadJSON('expressions.json');
  const sheet = await loadSheet(rig);
  const qq = resolveQuery(q);
  const flags = { ap: qq.ap, timing: qq.timing };
  // prime one tick so pose/FK/face exist before the first render
  const make = (seed, f = flags, x = 80) => stepCharacter(createCharacter(rig, expressions, { seed, flags: f, x, y: LEVEL.floorY }), {}, DT, LEVEL);
  const display = document.getElementById('game');
  const game = {
    dt: DT,
    level: LEVEL,
    r: createRenderer(display, qq.mode),
    opts: { sheet },
    input: { left: false, right: false, jump: false },
    pending: [],
    manual: q.get('harness') === '1',
    make,
  };
  game.ch = make(Number(q.get('seed') || 1));
  const api = installHarness(game);
  if (q.get('expr')) api.setExpression(q.get('expr'));

  const keys = new Set();
  const map = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'jump', KeyW: 'jump', ArrowUp: 'jump' };
  addEventListener('keydown', (e) => {
    if (map[e.code]) {
      keys.add(map[e.code]);
      e.preventDefault();
    }
    if (e.code === 'KeyP') game.ch.flags.ap = !game.ch.flags.ap;
    if (e.code === 'KeyT') game.ch.flags.timing = { ones: 'twos', twos: 'threes', threes: 'ones' }[game.ch.flags.timing];
    if (e.code === 'KeyH') game.pending.push('hurt');
    if (e.code.startsWith('Digit')) {
      const names = api.expressions();
      const i = Number(e.code.slice(5)) - 1;
      api.setExpression(i >= 0 && i < names.length ? names[i] : null);
    }
    hud();
  });
  addEventListener('keyup', (e) => map[e.code] && keys.delete(map[e.code]));
  addEventListener('resize', () => fitDisplay(game.r));

  const hudEl = document.getElementById('hud');
  function hud() {
    const f = game.ch.flags;
    hudEl.textContent = `mode ${game.r.mode} x${game.r.k} | anti-puppet ${f.ap ? 'ON' : 'off'} (P) | timing ${f.timing} (T) | expr ${game.ch.face.dir.pinned || 'auto'} (1-8, 0 = auto) | H hurt`;
  }
  hud();

  let acc = 0;
  let last = performance.now();
  function frame(now) {
    if (!game.manual) {
      acc = Math.min(acc + (now - last) / 1000, 0.25);
      game.input = { left: keys.has('left'), right: keys.has('right'), jump: keys.has('jump') };
      let n = 0;
      while (acc >= DT) {
        acc -= DT;
        n++;
      }
      if (n) api.tick(n);
    }
    last = now;
    requestAnimationFrame(frame);
  }
  renderFrame(game.r, game.ch, game.level, game.opts);
  requestAnimationFrame(frame);
  window.__toonReady = true;
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre class="err">${e.stack || e}</pre>`);
});
