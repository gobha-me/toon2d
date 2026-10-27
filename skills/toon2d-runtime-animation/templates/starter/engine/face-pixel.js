// @dom
// Hand-placed pixel face for low-res buffers, driven by the same face params as the vector face.
// Lesson: a vector face downsampled to ~12 px turns to mush; draw deliberate 1-2 px clusters AFTER quantizing.
// at(fx, fy) maps face-frame offsets (fx toward facing, fy down) to buffer px. yaw -1 (camera) .. +1 (profile).
// Face-slide clamp: every feature is clamped to the head ellipse; peak turns drop the far eye.
import { clampToHead, clampedYaw, peakTurn } from './face-clamp.js';

export function drawPixelFace(ctx, at, P, pal, yaw = 0) {
  const px = (x, y, w = 1, h = 1, c = pal.eye) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  };
  const y = clampedYaw(yaw);
  const shift = y * 1.0;
  const hideFar = peakTurn(y);
  const eyes = [
    { side: 'R', fx: 2.6 + shift, w: 2, near: true },
    { side: 'L', fx: -2.2 + shift * 0.5, w: y > 0.35 ? 1 : 2, near: false },
  ];
  for (const e of eyes) {
    if (hideFar && !e.near) continue; // peak turn: near eye only
    const cxy = clampToHead(e.fx, 0);
    const c = at(cxy.fx, cxy.fy);
    const ex = Math.round(c.x);
    const ey = Math.round(c.y);
    const open = P[`eyeOpen${e.side}`];
    const smile = P[`eyeSmile${e.side}`];
    const eff = open * (1 - smile * 0.6);
    // Peak turn hides the far eye only (M4); near eye stays open so a silhouette still has a gaze.
    if (P.eyeShut > 0.5) {
      px(ex - 1, ey - 1);
      px(ex, ey);
      px(ex - 1, ey + 1);
    } else if (smile > 0.45) {
      px(ex - 1, ey);
      px(ex, ey - 1);
      px(ex + 1, ey);
    } else if (eff < 0.2) {
      px(ex - 1, ey, 3, 1);
    } else {
      const h = Math.max(2, Math.min(4, Math.round(eff * 3)));
      const top = ey + 2 - h;
      if (P.pupilSize < 0.7) {
        px(ex - 1, top, e.w + 1, h + 1, pal.white);
        px(ex, top + 1, 1, 1, pal.eye);
      } else {
        px(ex - 1 + (e.w === 1 ? 1 : 0), top, e.w, h, pal.eye);
        if (h >= 3) px(ex - 1 + (e.w === 1 ? 1 : 0), top + h - 1, e.w, 1, pal.iris);
        px(ex - 1 + (P.pupilX > 0.3 && e.w > 1 ? 1 : 0), top, 1, 1, pal.white);
      }
    }
    const by = ey - 3 - Math.round(P.browHeight * 1.2);
    const inner = Math.round(P[`browAngle${e.side}`] * 1.4);
    const dirIn = e.side === 'R' ? -1 : 1;
    px(ex + dirIn, by + inner, 1, 1, pal.hair);
    px(ex, by + Math.round(inner / 2), 1, 1, pal.hair);
    px(ex - dirIn, by, 1, 1, pal.hair);
    if (P.blush > 0.3) px(ex - 1, ey + 2, 2, 1, pal.blush);
    if (P.tears > 0.3) px(ex - dirIn, ey + 2, 1, 1 + Math.round(P.tears * 2), pal.sweat);
  }
  // mouth: clamped; at peak turn draw a 1 px mark only
  const mxy = clampToHead(1.6 + shift, 4);
  const m = at(mxy.fx, mxy.fy);
  const mx = Math.round(m.x);
  const my = Math.round(m.y);
  if (hideFar) {
    px(mx, my, 1, 1, pal.mouth);
  } else {
    const half = P.mouthWidth > 1.05 ? 2 : 1;
    if (P.mouthOpen > 0.3) {
      const h = P.mouthOpen > 0.7 ? 3 : 2;
      px(mx - half, my - 1, half * 2, h, pal.mouth);
      if (P.mouthCurve < -0.3) px(mx - half, my - 1, half * 2, 1, pal.eye);
    } else {
      const corner = P.mouthCurve > 0.3 ? -1 : P.mouthCurve < -0.3 ? 1 : 0;
      px(mx - half + 1, my, half * 2 - 1, 1, pal.mouth);
      px(mx - half, my + corner, 1, 1, pal.mouth);
      px(mx + half, my + corner + Math.round(P.mouthSmirk), 1, 1, pal.mouth);
    }
  }
  if (P.sweat > 0.4) {
    const s = clampToHead(-4.0, -3);
    px(at(s.fx, s.fy).x, at(s.fx, s.fy).y, 1, 2, pal.sweat);
  }
  if (P.angerMark > 0.4) {
    const a = clampToHead(-3, -5.5);
    const p = at(a.fx, a.fy);
    px(p.x, p.y, 2, 1, pal.anger);
    px(p.x, p.y + 1, 1, 1, pal.anger);
  }
}
