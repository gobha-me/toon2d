// Lifelike face: one fragment shader, three techniques on the same AI portrait.
//   mode 0 "warp rig": hand-placed displacement fields (brows, lids, mouth corners, jaw, iris)
//                       + eyes-closed keyframe for the blink lid sweep. No expression keyframes.
//   mode 1 "flow morph": AI expression keyframes registered to the neutral + baked optical flow;
//                       morph = warp neutral toward the key while dissolving into it. Region masks
//                       let eyes/brows and mouth come from different keys (talking).
//   mode 2 "crossfade":  plain dissolve between the same keyframes (the naive layer swap).
import { program } from './gl.js';

const VS = `attribute vec2 aPos; varying vec2 vP;
void main() { vP = (aPos * 0.5 + 0.5) * vec2(512.0); vP.y = 512.0 - vP.y; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `precision highp float;
varying vec2 vP;
uniform sampler2D uN, uC, uE, uF;
uniform int uMode;
uniform vec4 uW;          // smile, angry, surprised, sad
uniform float uTalk, uBlink, uTurn, uBreath, uTilt, uDebug;
uniform vec2 uLook;
const vec2 EYE_L = vec2(212.5, 201.0), EYE_R = vec2(301.0, 201.0);
const vec2 MOUTH = vec2(258.0, 296.0), CORNER_L = vec2(225.0, 297.0), CORNER_R = vec2(292.0, 296.0);
const vec2 NOSE = vec2(257.0, 250.0);

float g(vec2 p, vec2 c, float r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
float ell(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return 1.0 - smoothstep(0.75, 1.0, length(d)); }
vec3 N(vec2 p) { return texture2D(uN, clamp(p / 512.0, 0.0, 1.0)).rgb; }
vec3 C(vec2 p) { return texture2D(uC, clamp(p / 512.0, 0.0, 1.0)).rgb; }
vec3 E(int i, vec2 p) {
  vec2 uv = clamp(p / 512.0, 0.001, 0.999) * 0.5;
  if (i == 1) uv.x += 0.5; else if (i == 2) uv.y += 0.5; else if (i == 3) uv += 0.5;
  return texture2D(uE, uv).rgb;
}
// flow atlas 4x2: row 0 = N->E (N(p) ~ E(p+F)), row 1 = E->N (E(p) ~ N(p+B))
vec2 flowAt(int i, vec2 p, float row) {
  vec2 uv = clamp(p / 512.0, 0.004, 0.996) * vec2(0.25, 0.5);
  uv.x += 0.25 * float(i);
  uv.y += 0.5 * row;
  vec2 rg = texture2D(uF, uv).rg * 255.0;
  return (rg - 128.0) / 4.0;
}
vec2 F(int i, vec2 p) { return flowAt(i, p, 0.0); }
vec2 B(int i, vec2 p) { return flowAt(i, p, 1.0); }
float eyeMask(vec2 p) { return max(ell(p, EYE_L, vec2(26.0, 13.0)), ell(p, EYE_R, vec2(26.0, 13.0))); }
float faceMask(vec2 p) { return ell(p, vec2(257.0, 262.0), vec2(112.0, 150.0)); }
float mouthMask(vec2 p) { return ell(p, MOUTH + vec2(0.0, 8.0), vec2(56.0, 40.0)); }

// iris look: pull pixels inside the eye opening toward the gaze direction
vec2 lookWarp(vec2 p) {
  vec2 off = uLook * vec2(7.0, 3.0);
  float m = eyeMask(p);
  float near = max(g(p, EYE_L + off, 13.0), g(p, EYE_R + off, 13.0));
  return p - off * m * (0.35 + 0.65 * near);
}

void main() {
  vec2 p = vP;
  // --- head motion shared by every mode (inverse mapping: where do we sample from?)
  float head = 1.0 - smoothstep(360.0, 430.0, p.y);
  vec2 piv = vec2(256.0, 430.0);
  float a = -uTilt * head;
  vec2 d = p - piv;
  p = piv + vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y);
  p.x -= uTurn * head * (3.0 + 9.0 * g(p, NOSE, 70.0) + 4.0 * g(p, NOSE, 25.0));
  p.y += uBreath * 3.0 * smoothstep(360.0, 470.0, p.y) + uBreath * 1.0 * head;

  vec3 col;
  float wsum = uW.x + uW.y + uW.z + uW.w;
  if (uMode == 0) {
    // analytic expression fields, all hand-tuned on landmarks found by eye
    vec2 o = vec2(0.0);
    float sm = uW.x, an = uW.y, su = uW.z, sa = uW.w;
    float jaw = su * 9.0 + uTalk * 7.0;
    o += sm * (vec2(-6.0, -9.0) * g(p, CORNER_L, 20.0) + vec2(6.0, -9.0) * g(p, CORNER_R, 20.0));
    o += sm * vec2(0.0, -4.0) * (g(p, vec2(210.0, 255.0), 30.0) + g(p, vec2(304.0, 255.0), 30.0));
    o += sm * vec2(0.0, -2.0) * (g(p, EYE_L + vec2(0.0, 9.0), 12.0) + g(p, EYE_R + vec2(0.0, 9.0), 12.0));
    o += an * (vec2(4.0, 7.0) * g(p, vec2(232.0, 182.0), 18.0) + vec2(-4.0, 7.0) * g(p, vec2(282.0, 182.0), 18.0));
    o += an * vec2(0.0, 2.0) * (g(p, EYE_L + vec2(0.0, -10.0), 10.0) + g(p, EYE_R + vec2(0.0, -10.0), 10.0));
    o += an * (vec2(0.0, 3.0) * (g(p, CORNER_L, 14.0) + g(p, CORNER_R, 14.0)));
    o += su * vec2(0.0, -9.0) * (g(p, vec2(210.0, 178.0), 32.0) + g(p, vec2(305.0, 178.0), 32.0));
    o += su * vec2(0.0, -3.0) * (g(p, EYE_L + vec2(0.0, -8.0), 12.0) + g(p, EYE_R + vec2(0.0, -8.0), 12.0));
    o += sa * (vec2(0.0, -6.0) * g(p, vec2(236.0, 178.0), 14.0) + vec2(0.0, -6.0) * g(p, vec2(278.0, 178.0), 14.0));
    o += sa * vec2(0.0, 3.0) * (g(p, vec2(192.0, 182.0), 14.0) + g(p, vec2(322.0, 182.0), 14.0));
    o += sa * vec2(0.0, 4.0) * (g(p, CORNER_L, 14.0) + g(p, CORNER_R, 14.0));
    // jaw drop: everything below the upper lip moves down, fading out at the chin edge
    float below = smoothstep(292.0, 302.0, p.y) * faceMask(p) * (1.0 - smoothstep(330.0, 390.0, p.y) * 0.6);
    o += vec2(0.0, jaw) * below * g(p, vec2(258.0, 330.0), 70.0);
    vec2 q = lookWarp(p - o);
    col = N(q);
    // mouth interior: a dark painted gap where the lips part (classic 2D-rig layer)
    float gap = jaw * 0.85;
    if (gap > 0.5) {
      float m = ell(p, MOUTH + vec2(0.0, gap * 0.55), vec2(20.0 + gap * 0.6, gap * 0.55));
      col = mix(col, vec3(0.22, 0.09, 0.09), m * 0.92);
      float teeth = ell(p, MOUTH + vec2(0.0, gap * 0.25), vec2(14.0 + gap * 0.4, gap * 0.22)) * step(0.5, gap / 8.0);
      col = mix(col, vec3(0.86, 0.82, 0.76), teeth * 0.5);
    }
    // blink: lid sweep using the eyes-closed key inside the eye mask
    float lid = EYE_L.y - 13.0 + 28.0 * uBlink;
    float cover = eyeMask(p) * smoothstep(lid + 2.0, lid - 2.0, p.y);
    cover = max(cover, eyeMask(p) * smoothstep(0.85, 1.0, uBlink));
    col = mix(col, C(p - o), cover);
  } else {
    vec4 w = uW;
    if (uMode == 1) {
      w *= faceMask(p);                        // keep hair and jacket off the morph (they differ per key)
      float talk = uTalk * mouthMask(p);       // mouth from the 'surprised' key only
      w.z = max(w.z, talk);
    } else {
      w.z = max(w.z, uTalk * 0.8);             // crossfade can only dissolve the whole frame
    }
    float s = w.x + w.y + w.z + w.w;
    if (s > 1.0) { w /= s; s = 1.0; }
    vec2 q = uMode == 1 ? lookWarp(p) : p;
    vec2 qn = q;
    if (uMode == 1) {
      // two-way flow morph: N pulled toward the blended key geometry, each key pulled back toward
      // the neutral by (1 - w); both ends are exact keyframes
      qn = q - (w.x * F(0, q) + w.y * F(1, q) + w.z * F(2, q) + w.w * F(3, q));
      col = (1.0 - s) * N(qn);
      col += w.x * E(0, q + (1.0 - w.x) * B(0, q));
      col += w.y * E(1, q + (1.0 - w.y) * B(1, q));
      col += w.z * E(2, q + (1.0 - w.z) * B(2, q));
      col += w.w * E(3, q + (1.0 - w.w) * B(3, q));
    } else {
      col = (1.0 - s) * N(q) + w.x * E(0, q) + w.y * E(1, q) + w.z * E(2, q) + w.w * E(3, q);
    }
    float b = smoothstep(0.15, 0.85, uBlink);
    col = mix(col, C(qn), b * (uMode == 1 ? eyeMask(p) : 1.0));
  }
  if (uDebug > 0.5) {
    float m = max(eyeMask(p), mouthMask(p) * 0.6);
    col = mix(col, vec3(0.2, 1.0, 0.8), 0.25 * m);
    col = mix(col, vec3(1.0, 0.3, 0.6), 0.25 * (faceMask(p) - smoothstep(0.0, 0.3, faceMask(p) - 0.1)));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class FaceRenderer {
  constructor(gl, tex) {
    this.gl = gl;
    this.tex = tex;
    this.prog = program(gl, VS, FS);
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  }
  draw(mode, s, rect, debug) {
    const gl = this.gl;
    const { p, u, a } = this.prog;
    gl.viewport(rect[0], rect[1], rect[2], rect[3]);
    gl.disable(gl.BLEND);
    gl.useProgram(p);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    const ap = a('aPos');
    gl.enableVertexAttribArray(ap);
    gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 8, 0);
    ['uN', 'uC', 'uE', 'uF'].forEach((name, i) => {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, this.tex[name].t);
      gl.uniform1i(u[name], i);
    });
    gl.uniform1i(u.uMode, mode);
    gl.uniform4f(u.uW, s.w[0], s.w[1], s.w[2], s.w[3]);
    gl.uniform1f(u.uTalk, s.talk);
    gl.uniform1f(u.uBlink, s.blink);
    gl.uniform1f(u.uTurn, s.turn);
    gl.uniform1f(u.uBreath, s.breath);
    gl.uniform1f(u.uTilt, s.tilt);
    gl.uniform1f(u.uDebug, debug ? 1 : 0);
    gl.uniform2f(u.uLook, s.look[0], s.look[1]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// --- expression timeline (deterministic from t) -----------------------------------------
export const EXPRS = ['neutral', 'smile', 'angry', 'surprised', 'sad'];
const SCRIPT = [
  ['neutral', 1.4], ['smile', 2.2], ['neutral', 1.0], ['angry', 2.2], ['surprised', 2.0, true], ['sad', 2.2], ['neutral', 1.2],
];
export const SCRIPT_LEN = SCRIPT.reduce((s, x) => s + x[1], 0);
const ease = (x) => x * x * (3 - 2 * x);

export function faceState(t, override) {
  const w = [0, 0, 0, 0];
  let talk = 0;
  if (override) {
    const i = EXPRS.indexOf(override.expr);
    if (i > 0) w[i - 1] = 1;
    talk = override.talk ? 0.5 + 0.5 * Math.sin(t * 17) * Math.sin(t * 5.3) : 0;
  } else {
    let tt = t % SCRIPT_LEN, i = 0;
    while (tt > SCRIPT[i][1]) {
      tt -= SCRIPT[i][1];
      i++;
    }
    const cur = SCRIPT[i], prev = SCRIPT[(i + SCRIPT.length - 1) % SCRIPT.length];
    const k = ease(Math.min(1, tt / 0.35));
    const ci = EXPRS.indexOf(cur[0]), pi = EXPRS.indexOf(prev[0]);
    if (pi > 0) w[pi - 1] += 1 - k;
    if (ci > 0) w[ci - 1] += k;
    if (cur[2]) talk = Math.max(0, Math.sin(tt * 14) * Math.sin(tt * 4.1 + 1)) * smoothIn(tt, cur[1]);
  }
  // blink every ~3.1 s (+ a double blink), 140 ms
  const bt = t % 3.1;
  const bl = (x) => (x >= 0 && x < 0.16 ? Math.sin((x / 0.16) * Math.PI) : 0);
  const blink = Math.max(bl(bt - 1.2), bl(bt - 1.45) * (Math.floor(t / 3.1) % 3 === 1 ? 1 : 0));
  // saccades: hold, then a fast 60 ms jump
  const LOOKS = [[0, 0], [0.9, 0.1], [0.2, -0.3], [-0.9, 0.15], [-0.3, 0.4], [0.5, 0]];
  const li = Math.floor(t / 1.3), lf = Math.min(1, (t - li * 1.3) / 0.06);
  const l0 = LOOKS[(li + LOOKS.length - 1) % LOOKS.length], l1 = LOOKS[li % LOOKS.length];
  const look = [l0[0] + (l1[0] - l0[0]) * lf, l0[1] + (l1[1] - l0[1]) * lf];
  return {
    w, talk, blink, look,
    turn: 0.5 * Math.sin(t * 0.45) + 0.2 * l1[0] * lf,
    tilt: 0.02 * Math.sin(t * 0.6 + 1),
    breath: 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 3.6),
  };
}
function smoothIn(tt, len) {
  return Math.min(1, tt / 0.3) * Math.min(1, (len - tt) / 0.3);
}
