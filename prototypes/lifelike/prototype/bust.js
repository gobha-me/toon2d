// Embeddable bust widget: the F2 face (default; method 1/3/4 selectable) (expression morph + speech + pain + breath + distraction) on one canvas.
//
//   import { createBust } from './bust.js';
//   const bust = await createBust(document.querySelector('canvas'), { base: './' });
//   bust.setExpression('angry');            // or a blend: { distressed: 0.7, sad: 0.3 }; 'neutral' clears
//   bust.yell(0.9);                         // say / yell / project / interject (intensity 0..1), quiet()
//   bust.hit(0.4);                          // gameplay damage event: snap flinch, light 0.3 .. heavy 1
//   bust.hurting(0.6);                      // sustained pain level (wince, labored breath); 0 clears
//   bust.breath(0.8);                       // out-of-breath level 0..1
//   bust.distract(0.7);                     // eyes wander around the room; or bust.glance(-1) for one look left (eyes only)
//   bust.on('hit', (e) => ...);             // events: expression, speech, hit, hurting, breath, distract
//
// Assets (same folder as this file by default): face-n.webp, face-c.webp, face-e.webp, face-f.webp, face.json.
// Deterministic: the sim steps at a fixed 60 Hz; pass { autoplay: false } and call advance(n) to drive it.
import { createGL, loadImage, texture } from './gl.js';
import { EXPRS, FaceRenderer, FaceSim } from './face.js';

const DT = 1 / 60;
const clamp = (x) => Math.max(0, Math.min(1, Number(x)));

export class Bust {
  constructor(canvas, renderer, opts) {
    this.canvas = canvas;
    this.r = renderer;
    this.sim = new FaceSim();
    this.sim.script = false;
    this.sim.label = '';
    this.method = opts.method ?? 2;
    this.turnMode = opts.turnMode ?? 0;   // 0 = eyes-only distraction (head-turn keys 1/2 rejected)
    this.handlers = {};
    this.acc = 0;
    this.raf = 0;
    if (opts.autoplay !== false) this.start();
    else this.render();
  }
  on(evt, fn) {
    (this.handlers[evt] ||= new Set()).add(fn);
    return () => this.handlers[evt].delete(fn);
  }
  emit(evt, detail) {
    for (const fn of this.handlers[evt] || []) fn({ type: evt, t: this.sim.t, ...detail });
  }
  setExpression(e) {
    if (typeof e === 'string') {
      if (e !== 'neutral' && !EXPRS.includes(e)) throw new Error(`unknown expression ${e}; use neutral or ${EXPRS.join(', ')}`);
      this.sim.setExpr(e);
    } else this.sim.setBlend(e || {});
    this.emit('expression', { value: e });
    return this;
  }
  speak(intent, intensity = 0.8) {
    this.sim.volume = clamp(intensity);
    this.sim.setSpeech(intent);
    this.emit('speech', { intent, intensity: this.sim.volume });
    return this;
  }
  say(intensity) {
    return this.speak('talk', intensity);
  }
  yell(intensity) {
    return this.speak('yell', intensity);
  }
  project(intensity) {
    return this.speak('project', intensity);
  }
  interject(intensity) {
    return this.speak('interject', intensity);
  }
  quiet() {
    return this.speak('off', this.sim.volume);
  }
  hit(intensity = 0.7, side = 0) {
    this.sim.hit(clamp(intensity), side);
    this.emit('hit', { intensity: clamp(intensity) });
    return this;
  }
  hurting(level) {
    this.sim.setHurt(clamp(level));
    this.emit('hurting', { level: clamp(level) });
    return this;
  }
  breath(intensity, ramp = 0.8) {
    this.sim.setBreath(clamp(intensity), ramp);
    this.emit('breath', { intensity: clamp(intensity) });
    return this;
  }
  distract(level = 0.7) {
    this.sim.distract = clamp(level);
    this.emit('distract', { level: clamp(level) });
    return this;
  }
  glance(side = 1, hold = 1.3) {
    this.sim.glance(side < 0 ? -1 : 1, hold);
    return this;
  }
  get state() {
    return this.sim.state();
  }
  advance(n = 1) {
    for (let i = 0; i < n; i++) this.sim.step(DT);
    this.render();
  }
  render() {
    const c = this.canvas, gl = this.r.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.r.draw(this.method, this.turnMode, this.sim.state(), [0, 0, c.width, c.height], false, 2);
  }
  start() {
    let last = performance.now();
    const tick = (now) => {
      this.acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (this.acc >= DT) {
        this.sim.step(DT);
        this.acc -= DT;
      }
      this.render();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  stop() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }
  destroy() {
    this.stop();
    this.handlers = {};
    this.r.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

export async function createBust(canvas, opts = {}) {
  const base = opts.base ?? import.meta.url.replace(/[^/]*$/, '');
  const gl = createGL(canvas);
  const [n, c, e, f, meta] = await Promise.all([
    loadImage(`${base}face-n.webp`), loadImage(`${base}face-c.webp`), loadImage(`${base}face-e.webp`), loadImage(`${base}face-f.webp`),
    fetch(`${base}face.json`).then((r) => r.json()),
  ]);
  const r = new FaceRenderer(gl, { uN: texture(gl, n), uC: texture(gl, c), uE: texture(gl, e), uF: texture(gl, f, { linear: true }) }, meta);
  return new Bust(canvas, r, opts);
}
