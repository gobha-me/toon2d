// @dom
// Vector face for smooth (non-pixel) modes. Same params, same layout as face-pixel.js.
// Draw inside the head frame: caller sets the transform so +x = facing, +y = down, units = world px.
import { clampToHead, clampedYaw, peakTurn } from './face-clamp.js';

export function drawVectorFace(ctx, P, pal, yaw = 0, lw = 0.45) {
  const y = clampedYaw(yaw);
  const shift = y * 1.0;
  const hideFar = peakTurn(y);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const e of [{ side: 'R', fx: 2.6 + shift, w: 1.2, near: true }, { side: 'L', fx: -2.2 + shift * 0.5, w: y > 0.35 ? 0.6 : 1, near: false }]) {
    if (hideFar && !e.near) continue;
    const cxy = clampToHead(e.fx, 0);
    const fx = cxy.fx;
    const open = P[`eyeOpen${e.side}`];
    const smile = P[`eyeSmile${e.side}`];
    const eff = open * (1 - smile * 0.6);
    ctx.strokeStyle = pal.eye;
    ctx.fillStyle = pal.eye;
    ctx.lineWidth = lw;
    if (P.eyeShut > 0.5) {
      ctx.beginPath();
      ctx.moveTo(fx + 0.8, -1);
      ctx.lineTo(fx - 0.6, 0);
      ctx.lineTo(fx + 0.8, 1);
      ctx.stroke();
    } else if (smile > 0.45 || eff < 0.2) {
      ctx.beginPath();
      if (smile > 0.45) {
        ctx.moveTo(fx - 1.1, 0.4);
        ctx.quadraticCurveTo(fx, -1.2, fx + 1.1, 0.4);
      } else {
        ctx.moveTo(fx - 1.1, 0.5);
        ctx.lineTo(fx + 1.1, 0.5);
      }
      ctx.stroke();
    } else {
      const h = Math.min(1.3, eff) * 1.6;
      ctx.beginPath();
      ctx.ellipse(fx, 0.6 - h / 2, e.w * (P.pupilSize < 0.7 ? 1.2 : 1), h, 0, 0, Math.PI * 2);
      ctx.fillStyle = P.pupilSize < 0.7 ? pal.white : pal.eye;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(fx + P.pupilX * 0.4, 0.6 - h / 2 + P.pupilY * 0.4, 0.5 * P.pupilSize * e.w, Math.max(0.3, h * 0.45 * P.pupilSize), 0, 0, Math.PI * 2);
      ctx.fillStyle = P.pupilSize < 0.7 ? pal.eye : pal.iris;
      ctx.fill();
      ctx.fillStyle = pal.white;
      ctx.fillRect(fx - 0.6, 0.2 - h, 0.5, 0.5);
    }
    const dirIn = e.side === 'R' ? -1 : 1;
    const by = -3 - P.browHeight * 1.2;
    const ang = P[`browAngle${e.side}`] * 1.4;
    ctx.strokeStyle = pal.hair;
    ctx.lineWidth = lw * 1.6;
    ctx.beginPath();
    ctx.moveTo(fx - dirIn * 1.2, by - ang * 0.3);
    ctx.lineTo(fx + dirIn * 1.2, by + ang);
    ctx.stroke();
    if (P.blush > 0.05) {
      ctx.globalAlpha = P.blush * 0.7;
      ctx.fillStyle = pal.blush;
      ctx.beginPath();
      ctx.ellipse(fx, 2.4, 1.2, 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (P.tears > 0.05) {
      ctx.globalAlpha = P.tears;
      ctx.fillStyle = pal.sweat;
      ctx.fillRect(fx - dirIn * 0.8, 1.2, 0.5, 1 + P.tears * 2);
      ctx.globalAlpha = 1;
    }
  }
  const mxy = clampToHead(1.6 + shift, 4);
  const mx = mxy.fx;
  const my = mxy.fy;
  ctx.strokeStyle = pal.mouth;
  ctx.fillStyle = pal.mouth;
  ctx.lineWidth = lw;
  if (hideFar) {
    ctx.beginPath();
    ctx.arc(mx, my, 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const hw = 0.8 * P.mouthWidth;
    const c = -P.mouthCurve * 0.9;
    ctx.beginPath();
    ctx.moveTo(mx - hw, my + c);
    ctx.quadraticCurveTo(mx, my - c * 0.4, mx + hw, my + c - P.mouthSmirk * 0.6);
    if (P.mouthOpen > 0.06) {
      ctx.quadraticCurveTo(mx, my + P.mouthOpen * 2.6 - c, mx - hw, my + c);
      ctx.fill();
    }
    ctx.stroke();
  }
  if (P.sweat > 0.05) {
    const s = clampToHead(-4.0, -2.5);
    ctx.globalAlpha = P.sweat;
    ctx.fillStyle = pal.sweat;
    ctx.beginPath();
    ctx.ellipse(s.fx, s.fy, 0.6, 1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (P.angerMark > 0.05) {
    const a = clampToHead(-3.0, -5.5);
    ctx.globalAlpha = P.angerMark;
    ctx.strokeStyle = pal.anger;
    ctx.lineWidth = lw * 1.4;
    ctx.beginPath();
    ctx.moveTo(a.fx - 0.6, a.fy);
    ctx.lineTo(a.fx + 0.8, a.fy);
    ctx.moveTo(a.fx + 0.1, a.fy - 0.7);
    ctx.lineTo(a.fx + 0.1, a.fy + 0.7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
