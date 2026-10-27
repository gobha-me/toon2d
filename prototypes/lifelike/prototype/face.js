// Lifelike face, "gambit" version: one AI portrait + 12 AI keys in one fragment shader.
//   face keys (masked to the face oval, separate upper/lower weights so they blend by region):
//     0 happy, 1 angry, 2 surprised, 3 sad, 4 distressed, 5 winded
//   head keys (whole head incl. hair): 6 turnL1, 7 turnL2, 8 turnR1, 9 turnR2
//   mouth keys (speech shapes, used only for geometry + teeth/tongue): 10 yell, 11 project
// Methods: F1 warp rig, F2 flow morph, F3 crossfade, F4 hybrid (default) = F2 for expression state +
// speech as a flow-driven mouth warp with a hard-switched teeth/tongue patch (no mouth crossfade).
// Head turns: 0 = eye look + parallax warp (no new art), 1 = one turned key per side, 2 = two per side.
import { program } from './gl.js';

const VS = `attribute vec2 aPos; varying vec2 vP;
void main() { vP = (aPos * 0.5 + 0.5) * vec2(512.0); vP.y = 512.0 - vP.y; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FS = `precision highp float;
varying vec2 vP;
uniform sampler2D uN, uC, uE, uF;
uniform float uWU[7], uWL[7], uWT[4];   // face keys 0-5 + pain (atlas 12) in slot 6
uniform float uSpeechKey, uLips, uHeadS, uTalk, uBlink, uTurnP, uBreath, uBreathAmp, uTilt, uHeadY, uDebug, uFlowScale;
uniform int uFix, uMethod;   // method: 1 = F1 warp rig, 2 = F2 flow morph, 3 = F3 crossfade, 4 = F4 hybrid
uniform int uFixDummy;          // 0 = v1 morph (sign bug), 1 = fixed two-way morph, 2 = fixed + short mouth dissolve
uniform vec2 uLook;
uniform vec4 uOpen;   // surprised key's mouth opening: centre xy, half-size zw (talk interior)
const vec2 EYE_L = vec2(212.5, 201.0), EYE_R = vec2(301.0, 201.0);
const vec2 MOUTH = vec2(258.0, 296.0), NOSE = vec2(257.0, 250.0);

float g(vec2 p, vec2 c, float r) { vec2 d = (p - c) / r; return exp(-dot(d, d)); }
float ell(vec2 p, vec2 c, vec2 r) { vec2 d = (p - c) / r; return 1.0 - smoothstep(0.75, 1.0, length(d)); }
vec3 N(vec2 p) { return texture2D(uN, clamp(p / 512.0, 0.0, 1.0)).rgb; }
vec3 C(vec2 p) { return texture2D(uC, clamp(p / 512.0, 0.0, 1.0)).rgb; }
// key atlas: 4 cols x 4 rows of 512 tiles
vec3 E(float i, vec2 p) {
  vec2 cell = vec2(mod(i, 4.0), floor(i / 4.0));
  return texture2D(uE, (clamp(p / 512.0, 0.001, 0.999) + cell) / vec2(4.0, 4.0)).rgb;
}
// flow atlas: 13 cols x 2 rows of 128 tiles; row 0 = N->E (N(p) ~ E(p+F)), row 1 = E->N (E(p) ~ N(p+B))
vec2 flowAt(float i, vec2 p, float row) {
  vec2 rg = texture2D(uF, (clamp(p / 512.0, 0.004, 0.996) + vec2(i, row)) / vec2(13.0, 2.0)).rg * 255.0;
  return (rg - 128.0) / uFlowScale;
}
vec2 F(float i, vec2 p) { return flowAt(i, p, 0.0); }
// mouth masks of key i in the key's own frame, flow blue channel: row 0 = opening + lips, row 1 = opening only
float mouthIn(float i, vec2 p, float row) { return texture2D(uF, (clamp(p / 512.0, 0.004, 0.996) + vec2(i, row)) / vec2(13.0, 2.0)).b; }
vec2 B(float i, vec2 p) { return flowAt(i, p, 1.0); }
// face-key slot -> atlas index (slot 6 = pain, stored after the head and mouth keys)
float kid(int i) { return i == 6 ? 12.0 : float(i); }
float eyeMask(vec2 p) { return max(ell(p, EYE_L, vec2(26.0, 13.0)), ell(p, EYE_R, vec2(26.0, 13.0))); }
float faceMask(vec2 p) { return ell(p, vec2(257.0, 262.0), vec2(112.0, 150.0)); }
float mouthMask(vec2 p) { return ell(p, MOUTH + vec2(0.0, 8.0), vec2(56.0, 40.0)); }

vec2 lookWarp(vec2 p) {
  vec2 off = uLook * vec2(9.5, 3.8);
  float m = eyeMask(p);
  float near = max(g(p, EYE_L + off, 13.0), g(p, EYE_R + off, 13.0));
  return p - off * m * (0.35 + 0.65 * near);
}

// F1-style jaw drop: everything below the upper lip moves down, fading out toward the chin edge
vec2 jawOffset(vec2 p, float jaw) {
  float below = smoothstep(292.0, 302.0, p.y) * faceMask(p) * (1.0 - smoothstep(330.0, 390.0, p.y) * 0.6);
  return vec2(0.0, jaw) * below * g(p, vec2(258.0, 330.0), 70.0);
}

// F4 talk jaw: like jawOffset but hinged exactly at the lip seam (y 293) so the lower lip moves whole
vec2 jawOffsetSeam(vec2 p, float jaw) {
  float below = smoothstep(291.0, 295.0, p.y) * faceMask(p) * (1.0 - smoothstep(330.0, 390.0, p.y) * 0.6);
  return vec2(0.0, jaw) * below * g(p, vec2(258.0, 325.0), 60.0);
}

// F1: hand-placed displacement fields on the neutral only (no expression keys)
vec3 f1(vec2 p) {
  float sm = uWU[0], an = uWU[1] + 0.8 * uWU[6], su = uWU[2], sa = uWU[3] + 0.6 * uWU[4] + 0.3 * uWU[6];
  su += 0.25 * uWU[4];
  vec2 o = vec2(0.0);
  float jaw = su * 9.0 + uTalk * 7.0 + uWL[5] * 5.0;
  vec2 CL = vec2(225.0, 297.0), CR = vec2(292.0, 296.0);
  o += sm * (vec2(-6.0, -9.0) * g(p, CL, 20.0) + vec2(6.0, -9.0) * g(p, CR, 20.0));
  o += sm * vec2(0.0, -4.0) * (g(p, vec2(210.0, 255.0), 30.0) + g(p, vec2(304.0, 255.0), 30.0));
  o += sm * vec2(0.0, -2.0) * (g(p, EYE_L + vec2(0.0, 9.0), 12.0) + g(p, EYE_R + vec2(0.0, 9.0), 12.0));
  o += an * (vec2(4.0, 7.0) * g(p, vec2(232.0, 182.0), 18.0) + vec2(-4.0, 7.0) * g(p, vec2(282.0, 182.0), 18.0));
  o += an * vec2(0.0, 2.0) * (g(p, EYE_L + vec2(0.0, -10.0), 10.0) + g(p, EYE_R + vec2(0.0, -10.0), 10.0));
  o += an * (vec2(0.0, 3.0) * (g(p, CL, 14.0) + g(p, CR, 14.0)));
  o += su * vec2(0.0, -9.0) * (g(p, vec2(210.0, 178.0), 32.0) + g(p, vec2(305.0, 178.0), 32.0));
  o += su * vec2(0.0, -3.0) * (g(p, EYE_L + vec2(0.0, -8.0), 12.0) + g(p, EYE_R + vec2(0.0, -8.0), 12.0));
  o += sa * (vec2(0.0, -6.0) * g(p, vec2(236.0, 178.0), 14.0) + vec2(0.0, -6.0) * g(p, vec2(278.0, 178.0), 14.0));
  o += sa * vec2(0.0, 3.0) * (g(p, vec2(192.0, 182.0), 14.0) + g(p, vec2(322.0, 182.0), 14.0));
  o += sa * vec2(0.0, 4.0) * (g(p, CL, 14.0) + g(p, CR, 14.0));
  o += jawOffset(p, jaw);
  vec2 q = lookWarp(p - o);
  vec3 col = N(q);
  float gap = jaw * 0.85;
  if (gap > 0.5) {
    float m = ell(p, MOUTH + vec2(0.0, gap * 0.55), vec2(20.0 + gap * 0.6, gap * 0.55));
    col = mix(col, vec3(0.22, 0.09, 0.09), m * 0.92);
    float teeth = ell(p, MOUTH + vec2(0.0, gap * 0.25), vec2(14.0 + gap * 0.4, gap * 0.22)) * step(0.5, gap / 8.0);
    col = mix(col, vec3(0.86, 0.82, 0.76), teeth * 0.5);
  }
  float lid = EYE_L.y - 13.0 + 28.0 * uBlink;
  float cover = eyeMask(p) * smoothstep(lid + 2.0, lid - 2.0, p.y);
  cover = max(cover, eyeMask(p) * smoothstep(0.85, 1.0, uBlink));
  return mix(col, C(p - o), cover);
}

void main() {
  vec2 p = vP;
  // --- procedural head + body motion (inverse mapping)
  float head = 1.0 - smoothstep(360.0, 430.0, p.y);
  vec2 piv = vec2(256.0, 430.0);
  float a = -uTilt * head;
  vec2 d = p - piv;
  p = piv + vec2(cos(a) * d.x - sin(a) * d.y, sin(a) * d.x + cos(a) * d.y);
  p = piv + (p - piv) * mix(1.0, 1.0 / uHeadS, head);
  p.x -= uTurnP * head * (3.0 + 9.0 * g(p, NOSE, 70.0) + 4.0 * g(p, NOSE, 25.0));
  float body = smoothstep(360.0, 470.0, p.y);
  float sh = body * (0.55 + 0.45 * smoothstep(60.0, 170.0, abs(p.x - 256.0)));   // shoulders rise more than the sternum
  float br = uBreath * uBreathAmp;
  p.y += br * (3.0 * sh + 1.1 * head) + uHeadY * head;
  p.x = 256.0 + (p.x - 256.0) * (1.0 - 0.010 * br * body);                       // chest widens on the inhale
  vec2 q = p;
  if (uMethod == 1) {
    gl_FragColor = vec4(f1(q), 1.0);
    return;
  }
  bool flow = uMethod != 3;

  // --- stage 1: head turn keys (whole head and hair, not the jacket)
  float hm = 1.0 - smoothstep(415.0, 470.0, q.y);
  vec2 Dt = vec2(0.0), Bt = vec2(0.0);
  float st = 0.0;
  for (int j = 0; j < 4; j++) {
    float w = uWT[j] * hm;
    Dt += w * F(6.0 + float(j), q);
    Bt += w * B(6.0 + float(j), q);
    st += w;
  }
  vec2 qt = flow ? q - Dt : q;                          // frontal (neutral-frame) coordinates
  // F4 speech, layered on whatever expression is showing (its pixels move, nothing is crossfaded):
  //  talk (uLips 0): the F1 jaw drop - the lower lip and jaw slide down, the expression keeps its own mouth
  //    width and corners; the opening is filled with the surprised key's real teeth/tongue, remapped
  //    onto the gap (hard edge, never see-through)
  //  yell / project (uLips 1): the key's whole mouth shape - the lower face is warped by k x its flow
  float k = uMethod == 4 ? uTalk : 0.0;
  float lm = ell(qt, vec2(258.0, 318.0), vec2(78.0, 74.0)) * smoothstep(245.0, 275.0, qt.y);
  float jaw = k * 26.0 * (1.0 - uLips);
  // where the active expression has put the lip line (a neutral point p shows at p + F in key i)
  vec2 dM = vec2(0.0);
  for (int i = 0; i < 7; i++) dM += uWL[i] * F(kid(i), MOUTH);
  vec2 qj = qt - jawOffsetSeam(qt - dM, jaw) - k * uLips * lm * F(uSpeechKey, qt);

  // --- stage 2: expression keys in the frontal frame, upper/lower region weights
  float fm = faceMask(qj), lo = smoothstep(238.0, 272.0, qj.y), mm = mouthMask(qj);
  float w[7];
  float s = 0.0;
  for (int i = 0; i < 7; i++) {
    w[i] = mix(uWU[i], uWL[i], lo) * (flow ? fm : 1.0);
    if (i == 2 && uMethod != 4) w[i] = max(w[i], uTalk * (flow ? mm : 0.8));   // F2/F3 talk = surprised mouth
    s += w[i];
  }
  if (s > 1.0) { for (int i = 0; i < 7; i++) w[i] /= s; s = 1.0; }
  vec2 qe = lookWarp(qj);
  vec2 De = vec2(0.0), Be = vec2(0.0);
  for (int i = 0; i < 7; i++) { De += w[i] * F(kid(i), qe); Be += w[i] * B(kid(i), qe); }
  vec3 col;
  if (!flow) {
    // F3: plain dissolve of whole frames
    col = (1.0 - s) * N(qe);
    for (int i = 0; i < 7; i++) col += w[i] * E(kid(i), qe);
    if (st > 0.001) {
      vec3 ct = vec3(0.0);
      for (int j = 0; j < 4; j++) ct += uWT[j] * E(6.0 + float(j), q);
      col = mix(col, ct / st, st);
    }
  } else {
    // colour weights: fix 2 shortens the dissolve inside the mouth (geometry still flows linearly)
    float c[7];
    float cs = 0.0;
    for (int i = 0; i < 7; i++) {
      c[i] = uFix == 2 ? mix(w[i], smoothstep(0.3, 0.7, w[i]), mm) : w[i];
      cs += c[i];
    }
    if (cs > 1.0) { for (int i = 0; i < 7; i++) c[i] /= cs; cs = 1.0; }
    col = (1.0 - cs) * N(qe - De);
    for (int i = 0; i < 7; i++) {
      vec2 x = uFix == 0 ? qe + (1.0 - w[i]) * B(kid(i), qe)    // v1: wrong sign, key drifts the wrong way mid-change
                         : qe + Be - B(kid(i), qe);             // key i pulled to the shared blended geometry
      col += c[i] * E(kid(i), x);
    }
    // --- turned keys: their own pixels (real 3/4 shading, hair), displaced by the expression geometry
    if (st > 0.001) {
      vec3 ct = vec3(0.0);
      vec2 dj = De + (qt - qj);
      for (int j = 0; j < 4; j++) {
        float wj = uWT[j] * hm;
        float fj = 6.0 + float(j);
        vec2 x = uFix == 0 ? q + (1.0 - wj) * B(fj, q) : q + Bt - B(fj, q);
        ct += wj * E(fj, x - dj);
      }
      ct /= st;
      // inside the feature area an active expression keeps its own (turn-warped) pixels so eyes and
      // mouth stay self-consistent; jaw, cheek edge, ears and hair come from the turned key
      float feat = 1.0 - smoothstep(0.4, 1.05, length((qt - vec2(257.0, 248.0)) / vec2(82.0, 96.0)));
      col = mix(col, ct, st * (1.0 - smoothstep(0.0, 0.6, s) * feat));
    }
  }
  if (uLips > 0.5 && k > 0.02) {
    // the key's own lips + teeth + tongue, sampled with the same flow alignment (E(p - (1-k)B)) so the
    // patch opens with the warp; a hard-ish switch, never a see-through mix
    vec2 xk = qt - (1.0 - k) * B(uSpeechKey, qt);
    col = mix(col, E(uSpeechKey, xk), smoothstep(0.25, 0.75, mouthIn(uSpeechKey, xk, 0.0)) * lm * smoothstep(0.03, 0.12, k));
  }
  if (uLips < 0.5 && jaw > 1.0) {
    vec2 gc = vec2(258.0, 293.0) + dM + vec2(0.0, jaw * 0.5), gr = vec2(17.0 + jaw * 0.9, jaw * 0.62);   // 293 = lip seam
    float m = ell(qt, gc, gr);
    vec2 src = uOpen.xy + (qt - gc) / gr * uOpen.zw;
    vec3 inside = E(2.0, src) * mix(0.45, 1.0, smoothstep(3.0, 12.0, jaw));
    col = mix(col, inside, smoothstep(0.35, 0.6, m));
  }
  // blink: closed-eye key inside the eye mask, sampled through the expression geometry so the lids sit
  // where this expression's eyes are (F3 used to dissolve the whole frame to the neutral here)
  float b = smoothstep(0.15, 0.85, uBlink);
  col = mix(col, C(qe - De), b * eyeMask(qj - De));
  if (uDebug > 0.5) {
    col = mix(col, vec3(0.2, 1.0, 0.8), 0.25 * max(eyeMask(qt), mm * 0.6));
    col = mix(col, vec3(1.0, 0.3, 0.6), 0.25 * (fm - smoothstep(0.0, 0.3, fm - 0.1)));
    col = mix(col, vec3(1.0, 0.85, 0.2), 0.18 * lo * fm * (1.0 - mm));
  }
  gl_FragColor = vec4(col, 1.0);
}`;

// Turn mode 0 is the default (eyes-only distraction; idle sway only). 1/2 = head-turn keys, rejected by the user, kept for comparison.
export const TURN_MODES = ['eyes only (no head turn)', 'rejected: 1 turned key per side', 'rejected: 2 turned keys per side'];
export const METHODS = { 1: 'F1 warp rig', 2: 'F2 flow morph', 3: 'F3 crossfade', 4: 'F4 hybrid' };
export const VIEWS = {
  f2: { name: 'F2 (default) | F1 | F4', panels: [[2, 0], [1, 0], [4, 0]] },
  orig: { name: 'F1 | F2 | F3 (original three)', panels: [[1, 0], [2, 0], [3, 0]] },
  talk: { name: 'F1 | F2 | F4 (talking compare)', panels: [[1, 0], [2, 0], [4, 0]] },
  f4: { name: 'F4 hybrid x3', panels: [[4, 0], [4, 0], [4, 0]] },
  turn: { name: 'rejected: F2 head turn: eyes only | 1 key | 2 keys', panels: [[2, 0], [2, 1], [2, 2]], headTurn: true },
};
const SPEECH_KEY = { talk: 2, yell: 10, project: 11 };

export class FaceRenderer {
  constructor(gl, tex, meta) {
    this.gl = gl;
    this.tex = tex;
    this.meta = meta;
    this.prog = program(gl, VS, FS);
    this.buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    // where on |turn| the first key of a 2-per-side chain sits (its share of the full nose shift),
    // floored so a gaze-only first key still gets some of the range
    const dx = Object.fromEntries(meta.keys.map((k) => [k.name, Math.abs(k.nose_dx)]));
    this.open = meta.keys.find((k) => k.name === 'surprised').opening;
    this.brk = { L: Math.max(0.35, dx.turnL1 / dx.turnL2), R: Math.max(0.35, dx.turnR1 / dx.turnR2) };
  }
  turnWeights(mode, turn) {
    const wt = [0, 0, 0, 0];
    const t = Math.min(1, Math.abs(turn)), base = turn < 0 ? 0 : 2;
    if (mode === 1) wt[base + 1] = t;
    if (mode === 2) {
      const b = turn < 0 ? this.brk.L : this.brk.R;
      if (t < b) wt[base] = t / b;
      else {
        wt[base] = (1 - t) / (1 - b);
        wt[base + 1] = (t - b) / (1 - b);
      }
    }
    return wt;
  }
  // method 1..4, turnMode 0..2
  draw(method, turnMode, s, rect, debug, fix) {
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
    const tm = method === 1 ? 0 : turnMode;
    gl.uniform1fv(u.uWU, s.wu);
    gl.uniform1fv(u.uWL, s.wl);
    gl.uniform1fv(u.uWT, this.turnWeights(tm, s.turn));
    gl.uniform1i(u.uFix, fix);
    gl.uniform1i(u.uMethod, method);
    gl.uniform1f(u.uFlowScale, this.meta.flowScale);
    gl.uniform1f(u.uTalk, s.talk);
    gl.uniform1f(u.uSpeechKey, method === 4 ? SPEECH_KEY[s.speechShape] : 2);
    const o = this.open;
    gl.uniform4f(u.uOpen, (o[0] + o[2]) / 2, (o[1] + o[3]) / 2, (o[2] - o[0]) / 2, (o[3] - o[1]) / 2);
    gl.uniform1f(u.uLips, s.speechShape === 'talk' ? 0 : 1);
    gl.uniform1f(u.uHeadS, s.headS);
    gl.uniform1f(u.uBlink, s.blink);
    gl.uniform1f(u.uTurnP, tm === 0 ? s.turn * 2.0 : 0);
    gl.uniform1f(u.uBreath, s.breath);
    gl.uniform1f(u.uBreathAmp, s.breathAmp);
    gl.uniform1f(u.uTilt, s.tilt);
    gl.uniform1f(u.uHeadY, s.headY);
    gl.uniform1f(u.uDebug, debug ? 1 : 0);
    // with turned keys the eyes already look away; procedural look only adds the idle saccades
    const lx = tm === 0 ? s.look[0] + s.gaze : s.look[0] + s.gaze * 0.25;
    const ly = s.look[1] + (s.gazeY || 0);
    gl.uniform2f(u.uLook, Math.max(-1.25, Math.min(1.25, lx)), Math.max(-1, Math.min(1, ly)));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}

// --- behaviour: deterministic, stepped at a fixed dt -------------------------------------------
export const EXPRS = ['happy', 'angry', 'sad', 'surprised', 'distressed'];
export const SPEECH = ['off', 'talk', 'yell', 'project', 'interject'];
const SLOT = { happy: 0, angry: 1, surprised: 2, sad: 3, distressed: 4, winded: 5, pain: 6 };
const LID_FOLLOW = 0.3;
const LOOKS = [[0, 0], [0.9, 0.1], [0.2, -0.3], [-0.9, 0.15], [-0.3, 0.4], [0.5, 0]];
// speech intents: syllables/s, phrase on/off seconds, open range, vowel hold (lower = flatter tops)
const VOICE = {
  talk: { rate: 4.6, on: 1.7, off: 0.45, lo: 0.2, hi: 0.62, hold: 1.4 },
  yell: { rate: 5.6, on: 1.25, off: 0.4, lo: 0.55, hi: 1.0, hold: 0.9 },
  project: { rate: 3.0, on: 1.9, off: 0.75, lo: 0.5, hi: 0.95, hold: 0.45 },
};
const hash = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// the gambit reel: [seconds, label, actions]
export const SCRIPT = [
  [1.6, 'neutral', { expr: 'neutral' }],
  [2.0, 'happy', { expr: 'happy' }],
  [2.0, 'angry', { expr: 'angry' }],
  [2.0, 'sad', { expr: 'sad' }],
  [2.2, 'surprised (squint take first)', { expr: 'surprised' }],
  [2.2, 'distressed', { expr: 'distressed' }],
  [2.8, 'distracted: glance left', { expr: 'neutral', glance: [-1, 1.3] }],
  [2.8, 'distracted: glance right', { glance: [1, 1.3] }],
  [5.0, 'breathing harder -> winded', { breath: [1, 4.0] }],
  [3.0, 'distressed + winded', { expr: 'distressed' }],
  [3.4, 'happy + distracted', { expr: 'happy', breath: [0, 1.5], glance: [1, 1.6] }],
  [3.0, 'talking (happy)', { speech: 'talk' }],
  [3.0, 'angry yelling', { expr: 'angry', speech: 'yell' }],
  [3.2, 'projecting over noise', { expr: 'neutral', speech: 'project' }],
  [3.2, 'interjecting', { speech: 'interject' }],
  [1.6, 'pain: light hit', { expr: 'neutral', speech: 'off', hit: 0.35 }],
  [1.8, 'pain: heavy hit', { hit: 1 }],
  [4.0, 'hurting + breathing hard', { hurt: 0.85, breath: [0.6, 1.5] }],
  [2.0, 'recovering', { hurt: 0, breath: [0, 2] }],
  [1.8, 'neutral', { expr: 'neutral', speech: 'off' }],
];
export const SCRIPT_LEN = SCRIPT.reduce((a, x) => a + x[0], 0);

export class FaceSim {
  constructor() {
    this.reset();
  }
  reset() {
    this.t = 0;
    this.target = { happy: 0, angry: 0, surprised: 0, sad: 0, distressed: 0 };
    this.cur = { ...this.target };
    this.breathT = 0;
    this.breathI = 0;
    this.breathRamp = 0.8;
    this.phase = 0;
    this.distract = 0;
    this.speech = 'off';
    this.volume = 0.8;
    this.sp = { t0: 0, open: 0, env: 0, gap: 0, mix: 0 };
    this.takes = true;
    this.hits = [];      // active pain hits {t0, I, side}
    this.hurt = 0;       // sustained hurting level (target) and its eased value
    this.hurtC = 0;
    this.winceAt = 2;
    this.turn = 0;
    this.gaze = 0;
    this.gazeY = 0;
    this.eyesOnly = true;   // distraction moves only the eyes; false = legacy head-turn behaviour
    this.d = { mode: 'present', until: 2.5, side: 1, mag: 1, hold: 1, t0: 0 };
    this.seed = 7;
    this.take = null;
    this.pop = 0;
    this.script = true;
    this.scriptI = -1;
    this.label = 'neutral';
  }
  get talk() {
    return this.speech !== 'off';
  }
  set talk(v) {
    this.setSpeech(v ? 'talk' : 'off');
  }
  rnd() {
    this.seed = (this.seed * 16807) % 2147483647;
    return this.seed / 2147483647;
  }
  setExpr(name) {
    const was = this.target.surprised;
    for (const k of Object.keys(this.target)) this.target[k] = k === name ? 1 : 0;
    if (name === 'surprised' && was < 0.5 && this.takes) this.take = { t0: this.t, dur: 0.2 };
  }
  setBlend(w) {
    for (const k of Object.keys(this.target)) this.target[k] = w[k] ?? 0;
  }
  setBreath(i, ramp = 0.8) {
    this.breathT = i;
    this.breathRamp = ramp;
  }
  setSpeech(intent) {
    if (intent === this.speech) return;
    this.speech = intent;
    this.sp.t0 = this.t;
  }
  // a damage event: snap flinch (2-4 frames at 30 fps), hold, recover; light 0.3 .. heavy 1
  hit(intensity = 0.7, side = 0) {
    const I = Math.max(0, Math.min(1, intensity));
    this.hits.push({ t0: this.t, I, side: side || (this.rnd() < 0.5 ? -1 : 1) });
    if (this.hits.length > 4) this.hits.shift();
    this.breathI = Math.min(1, this.breathI + 0.25 * I);   // gasp: breathing jumps, then eases back
  }
  setHurt(level) {
    this.hurt = Math.max(0, Math.min(1, level));
  }
  // pain envelope of one hit: attack 0.04-0.09 s, hold, then exponential recovery
  hitEnv(h) {
    const e = this.t - h.t0, att = 0.09 - 0.05 * h.I, hold = 0.1 + 0.2 * h.I, rec = 0.3 + 0.5 * h.I;
    if (e < 0) return 0;
    if (e < att) return Math.sin((e / att) * Math.PI * 0.5);
    if (e < att + hold) return 1;
    return Math.exp(-(e - att - hold) / rec);
  }
  glance(side, hold = 1.3) {
    // eyes only: one look off to the side (a second, nearby fixation half the time), then back
    const fx = [{ x: side * (0.95 + 0.2 * this.rnd()), y: -0.15 + 0.4 * this.rnd(), dur: hold * 0.6 }];
    fx.push({ x: fx[0].x - side * 0.25 * this.rnd(), y: fx[0].y + 0.3 * (this.rnd() - 0.5), dur: hold * 0.4 });
    Object.assign(this.d, { mode: 'away', side, mag: 1, hold, t0: this.t, fx, fi: 0, ft: this.t });
  }
  // eyes-only wander: 1-3 fixations around the room, each held, mostly to one side, sometimes across
  wander() {
    const side = this.rnd() < 0.5 ? -1 : 1, n = 1 + Math.floor(this.rnd() * 3), fx = [];
    let x = side * (0.7 + 0.45 * this.rnd()), y = -0.4 + 0.75 * this.rnd();
    for (let i = 0; i < n; i++) {
      fx.push({ x, y, dur: 0.35 + 0.85 * this.rnd() });
      if (this.rnd() < 0.25) x = -Math.sign(x) * (0.6 + 0.4 * this.rnd());
      else x = Math.sign(x) * Math.min(1.2, Math.max(0.45, Math.abs(x) + 0.5 * (this.rnd() - 0.5)));
      y = Math.max(-0.5, Math.min(0.6, y + 0.5 * (this.rnd() - 0.5)));
    }
    const hold = fx.reduce((a, f) => a + f.dur, 0);
    Object.assign(this.d, { mode: 'away', side, mag: 1, hold, t0: this.t, fx, fi: 0, ft: this.t });
  }
  // current voice: interject = 0.35 s take, then projects, then settles into talking
  voice() {
    const e = this.t - this.sp.t0;
    if (this.speech === 'interject') {
      if (e < 0.35) return { shape: 'project', take: e / 0.35, e };
      if (e < 2.4) return { shape: 'project', v: VOICE.project, e: e - 0.35, loud: 1 };
      return { shape: 'talk', v: VOICE.talk, e: e - 2.4 };
    }
    if (this.speech === 'off') return { shape: 'talk', e };
    return { shape: this.speech, v: VOICE[this.speech], e };
  }
  step(dt) {
    const t = (this.t += dt);
    if (this.script) this.runScript();
    const k = 1 - Math.exp(-dt / 0.085);
    for (const n of Object.keys(this.cur)) {
      const tg = n === 'surprised' && this.take ? 0 : this.target[n];
      this.cur[n] += (tg - this.cur[n]) * k;
    }
    if (this.take && t - this.take.t0 > this.take.dur) {
      this.take = null;
      this.pop = 1;
    }
    this.pop *= Math.exp(-dt / 0.12);
    // hurting: eases in slowly, eases out slower; occasional winces; labored breathing
    this.hurtC += (this.hurt - this.hurtC) * (1 - Math.exp(-dt / (this.hurt > this.hurtC ? 0.4 : 1.2)));
    if (this.hurtC > 0.15 && t > this.winceAt) {
      this.hit(0.25 + 0.25 * this.hurtC, 0);
      this.winceAt = t + 1.6 + 2.4 * this.rnd() * (1.2 - this.hurtC);
    }
    this.hits = this.hits.filter((h) => t - h.t0 < 4);
    const bT = Math.max(this.breathT, 0.55 * this.hurtC);
    const rate = (bT > this.breathI ? 1 : 0.5) / Math.max(0.05, this.breathRamp);
    this.breathI += Math.sign(bT - this.breathI) * Math.min(Math.abs(bT - this.breathI), rate * dt);
    this.phase = (this.phase + dt * (0.28 + 0.67 * this.breathI)) % 1;
    // speech layer: syllable oscillator inside phrases, louder intents open wider
    const vo = this.voice(), sp = this.sp;
    let open = 0, env = 0, gap = 0;
    if (vo.take !== undefined) {
      open = 0.22 * Math.sin(Math.min(1, vo.take * 1.4) * Math.PI * 0.5);
    } else if (vo.v) {
      const v = vo.v, per = v.on + v.off, ph = vo.e % per, n = Math.floor(vo.e * v.rate);
      env = ph < v.on ? Math.min(1, ph / 0.08, (v.on - ph) / 0.1) : 0;
      gap = ph >= v.on ? Math.sin(((ph - v.on) / v.off) * Math.PI) : 0;
      const syl = Math.pow(Math.max(0, Math.sin((vo.e * v.rate % 1) * Math.PI)), v.hold);
      const amp = v.lo + (v.hi - v.lo) * hash(n + (vo.shape === 'yell' ? 50 : 0));
      const vol = vo.loud ? 1 : this.volume;
      open = env * syl * amp * (0.55 + 0.45 * vol);
    }
    sp.open += (open - sp.open) * (1 - Math.exp(-dt / 0.025));
    sp.env += (env - sp.env) * (1 - Math.exp(-dt / 0.08));
    sp.gap = gap;
    sp.shape = vo.shape;
    sp.take = vo.take;
    const want = this.speech === 'off' ? 0 : 1;
    sp.mix += (want - sp.mix) * (1 - Math.exp(-dt / 0.12));
    // distracted: glance away (eyes lead), linger, snap back
    const D = this.d;
    let turnT = 0.07 * Math.sin(t * 0.45), tau = 0.5, gazeT = 0, gazeYT = 0;
    if (D.mode === 'present' && this.distract > 0 && t > D.until) {
      if (this.eyesOnly) this.wander();
      else Object.assign(D, { mode: 'away', side: this.rnd() < 0.5 ? -1 : 1, mag: 0.6 + 0.4 * this.rnd(), hold: 0.8 + 1.4 * this.rnd(), t0: t, fx: null });
    }
    if (D.mode === 'away' && this.eyesOnly && D.fx) {
      // saccade between held fixations; the head keeps only its idle sway
      while (D.fi < D.fx.length - 1 && t - D.ft > D.fx[D.fi].dur) {
        D.ft += D.fx[D.fi].dur;
        D.fi++;
      }
      gazeT = D.fx[D.fi].x;
      gazeYT = D.fx[D.fi].y;
      if (t - D.t0 > D.hold) Object.assign(D, { mode: 'snap', t0: t, blinkBack: this.rnd() < 0.45 });
    } else if (D.mode === 'away') {
      const e = t - D.t0;
      gazeT = D.side;
      if (e > 0.07) {
        turnT = D.side * D.mag;
        tau = 0.13;
      }
      if (e > D.hold) Object.assign(D, { mode: 'snap', t0: t });
    } else if (D.mode === 'snap') {
      tau = 0.055;
      if (t - D.t0 > 0.3) {
        const g = 4.5 - 3.2 * this.distract;
        Object.assign(D, { mode: 'present', until: t + g * (0.7 + 0.6 * this.rnd()) });
      }
    }
    this.turn += (turnT - this.turn) * (1 - Math.exp(-dt / tau));
    this.gaze += (gazeT - this.gaze) * (1 - Math.exp(-dt / 0.03));
    this.gazeY += (gazeYT - this.gazeY) * (1 - Math.exp(-dt / 0.03));
  }
  runScript() {
    let tt = this.t % SCRIPT_LEN, i = 0;
    while (tt > SCRIPT[i][0]) {
      tt -= SCRIPT[i][0];
      i++;
    }
    if (i === this.scriptI) return;
    this.scriptI = i;
    const [, label, act] = SCRIPT[i];
    this.label = label;
    if (i === 0) {
      this.breathT = 0;
      this.breathI = 0;
      this.setSpeech('off');
      this.setHurt(0);
      this.hurtC = 0;
    }
    if (act.expr) this.setExpr(act.expr);
    if (act.breath) this.setBreath(act.breath[0], act.breath[1]);
    if (act.glance) this.glance(act.glance[0], act.glance[1]);
    if (act.speech) this.setSpeech(act.speech);
    if (act.hit) this.hit(act.hit, 0);
    if (act.hurt !== undefined) this.setHurt(act.hurt);
  }
  state() {
    const t = this.t, c = this.cur, sp = this.sp;
    const wu = [0, 0, 0, 0, 0, 0, 0], wl = [0, 0, 0, 0, 0, 0, 0];
    for (const n of Object.keys(c)) {
      wu[SLOT[n]] = c[n];
      wl[SLOT[n]] = c[n];
    }
    const ph = this.phase, I = this.breathI;
    let inh = 0.5 - 0.5 * Math.cos(2 * Math.PI * Math.pow(ph, 1 + 0.6 * I));
    wl[5] = I * (0.5 + 0.5 * inh);
    wu[5] = I * 0.65;
    let headY = 0, headS = 1, tilt = 0.02 * Math.sin(t * 0.6 + 1) - 0.012 * I * inh, turnX = 0;
    if (this.take) {
      const x = Math.min(1, (t - this.take.t0) / this.take.dur);
      const a = Math.sin(Math.min(1, x * 1.3) * Math.PI * 0.5);
      wu[1] += 0.75 * a;
      headY = -2.5 * a;
    }
    headY += 4 * this.pop;
    // pain: hits (snap flinch) on top of the sustained hurting level (wince + distressed brows)
    let pain = 0, jerkS = 0, jerkX = 0, jerkT = 0;
    for (const h of this.hits) {
      const e = this.hitEnv(h);
      pain = Math.max(pain, e * (0.45 + 0.55 * h.I));
      // head snaps back (smaller), up and to one side, with a little overshoot on the way back
      const ov = Math.sin(Math.min(1, (t - h.t0) / 0.6) * Math.PI) * 0.25;
      jerkS -= 0.035 * h.I * (e - ov);
      jerkX += h.side * 0.22 * h.I * e;
      jerkT += h.side * 0.05 * h.I * e;
      headY -= 3.5 * h.I * e;
    }
    const H = this.hurtC;
    wu[6] = Math.min(1, Math.max(pain, 0.3 * H));
    wl[6] = Math.min(1, Math.max(pain, 0.22 * H));
    wu[4] = Math.max(wu[4], 0.45 * H * (1 - pain));
    const paint = pain;
    // speech intent on top of the expression (upper face), head and breath
    const m = sp.mix, vol = this.volume;
    // a wide-open speech shape owns the mouth: the expression's lower face eases back as it opens
    if (sp.shape !== 'talk') for (let i = 0; i < 5; i++) wl[i] *= 1 - 0.6 * Math.min(1, sp.open * 1.3) * m;
    if (sp.take !== undefined) {
      // interject take: sharp inhale, lean in, brows up, mouth opens a little
      const a = Math.sin(Math.min(1, sp.take * 1.4) * Math.PI * 0.5);
      inh = Math.max(inh, a);
      headS += 0.03 * a;
      wu[2] += 0.45 * a;
    } else if (this.speech !== 'off') {
      const shape = sp.shape;
      if (shape === 'yell') {
        // knitted brows / narrowed eyes from the angry key, jaw forward (lean), tension shake
        wu[1] = Math.max(wu[1], 0.75 * m * (0.6 + 0.4 * vol));
        headS += 0.022 * sp.env * vol;
        headY -= 1.2 * sp.env;
        tilt += 0.006 * vol * sp.env * Math.sin(t * 47) + 0.004 * Math.sin(t * 29);
        turnX = 0.025 * vol * sp.env * Math.sin(t * 31);
      } else if (shape === 'project') {
        // brows up, eyes open (surprised upper), head forward and tipped up, big breaths in the gaps
        wu[2] = Math.max(wu[2], 0.35 * m * (0.6 + 0.4 * vol));
        headS += 0.018 * sp.env;
        headY += 2.2 * sp.env;
      }
      if (shape !== 'talk' && sp.gap > 0) inh = Math.max(inh, sp.gap);
    }
    const bt = t % 3.1;
    const bl = (x) => (x >= 0 && x < 0.16 ? Math.sin((x / 0.16) * Math.PI) : 0);
    // no blink while the pain key's eyes are squeezed shut
    let blink = Math.max(bl(bt - 1.2), bl(bt - 1.45) * (Math.floor(t / 3.1) % 3 === 1 ? 1 : 0)) * (1 - Math.min(1, paint * 1.5));
    // the upper lid follows the eyes down a little; a blink often rides on a big saccade back
    blink = Math.max(blink, LID_FOLLOW * Math.max(0, this.gazeY));
    if (this.d.mode === 'snap') blink = Math.max(blink, bl((t - this.d.t0) * 1.3) * (this.d.blinkBack ? 1 : 0));
    const li = Math.floor(t / 1.3), lf = Math.min(1, (t - li * 1.3) / 0.06);
    const l0 = LOOKS[(li + LOOKS.length - 1) % LOOKS.length], l1 = LOOKS[li % LOOKS.length];
    const away = this.d.mode !== 'present' ? 0.25 : 1;
    const speaking = this.speech !== 'off' ? 0.5 : 1;   // speakers hold eye contact more
    const look = [(l0[0] + (l1[0] - l0[0]) * lf) * away * 0.8 * speaking, (l0[1] + (l1[1] - l0[1]) * lf) * away * speaking];
    const loud = sp.shape === 'yell' || sp.shape === 'project' ? 1.6 : 1;
    return {
      wu, wl, talk: sp.open * (1 - paint), speechShape: sp.shape || 'talk', blink, look, gaze: this.gaze, gazeY: this.gazeY, turn: this.turn + turnX + jerkX, headY, headS: headS + jerkS, tilt: tilt + jerkT, pain: paint,
      breath: inh, breathAmp: (1 + 2.2 * I) * (this.speech !== 'off' ? loud : 1),
    };
  }
}
