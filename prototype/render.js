// Canvas renderer. Everything visual lives here; logic modules never draw.
import { drawOrder } from './manifest.js';
import { clamp, lerp } from './mathx.js';

const TAU = Math.PI * 2;

// ---------------------------------------------------------------- helpers

function capsule(ctx, w, len) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.lineTo(-r, len);
  ctx.arc(0, len, r, Math.PI, 0, true);
  ctx.lineTo(r, 0);
  ctx.arc(0, 0, r, 0, Math.PI, true);
  ctx.closePath();
}

/** Union outline trick: stroke every path thick, then fill every path. */
function outlinedUnion(ctx, paths, fill, line, width = 3.2) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = line;
  ctx.lineWidth = width;
  for (const p of paths) {
    p();
    ctx.stroke();
  }
  ctx.fillStyle = fill;
  for (const p of paths) {
    p();
    ctx.fill();
  }
}

function fillStroke(ctx, fill, line, width = 1.6) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = width;
  ctx.strokeStyle = line;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// ---------------------------------------------------------------- body shapes

function drawShape(ctx, part, pal, state) {
  const s = part.shape;
  const fill = pal[s.fill] || s.fill || '#f0f';
  switch (s.type) {
    case 'capsule':
      capsule(ctx, s.w, s.len);
      fillStroke(ctx, fill, pal.line, 1.5);
      break;
    case 'hand':
      ctx.beginPath();
      ctx.arc(0, 1, s.r, 0, TAU);
      fillStroke(ctx, fill, pal.line, 1.4);
      break;
    case 'shoe':
      ctx.beginPath();
      ctx.ellipse(3, -0.5, 7, 4.6, 0, 0, TAU);
      fillStroke(ctx, fill, pal.line, 1.5);
      ctx.beginPath();
      ctx.moveTo(-3.2, 2.6);
      ctx.lineTo(9.4, 2.6);
      ctx.strokeStyle = pal.sole;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(6, -2, 1.4, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
      break;
    case 'torso': {
      ctx.beginPath();
      ctx.moveTo(-9.5, 4);
      ctx.quadraticCurveTo(-10.5, -12, -8, -24);
      ctx.quadraticCurveTo(0, -28, 8, -24);
      ctx.quadraticCurveTo(10.5, -12, 9.5, 4);
      ctx.closePath();
      fillStroke(ctx, fill, pal.line, 1.6);
      // cel shadow on the back side
      ctx.save();
      ctx.clip();
      ctx.fillStyle = pal.jacketShade;
      ctx.fillRect(-12, -30, 6, 40);
      ctx.restore();
      // zipper + pocket
      ctx.strokeStyle = 'rgba(42,29,51,0.55)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(4.5, -22);
      ctx.lineTo(5.5, 3);
      ctx.stroke();
      ctx.fillStyle = '#ffd34d';
      ctx.fillRect(3.8, -19, 2, 3);
      break;
    }
    case 'hem':
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(10, -4);
      ctx.lineTo(12, 7);
      ctx.quadraticCurveTo(0, 9.5, -12, 7);
      ctx.closePath();
      fillStroke(ctx, fill, pal.line, 1.5);
      ctx.fillStyle = pal.jacketShade;
      ctx.fillRect(-9, 3.5, 20, 1.6);
      break;
    case 'neck':
      ctx.beginPath();
      ctx.rect(-3, -4, 6, 8);
      fillStroke(ctx, fill, pal.line, 1.2);
      break;
    case 'scarfWrap':
      ctx.beginPath();
      ctx.ellipse(1, 1, 8.5, 4.2, -0.1, 0, TAU);
      fillStroke(ctx, fill, pal.line, 1.6);
      ctx.beginPath();
      ctx.moveTo(-5, 0.5);
      ctx.quadraticCurveTo(1, 3.5, 7, 0);
      ctx.strokeStyle = pal.scarfShade;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      break;
    case 'hairBack':
      drawHairBack(ctx, pal, state);
      break;
    case 'head':
      drawHead(ctx, pal);
      break;
    case 'bangs':
      drawBangs(ctx, pal);
      break;
    case 'face':
      if (s.layer === 'lower') drawFaceLower(ctx, state.face, pal, state.time);
      else drawFaceUpper(ctx, state.face, pal, state.time);
      break;
    default:
      break;
  }
}

function drawHairBack(ctx, pal) {
  outlinedUnion(
    ctx,
    [
      () => {
        ctx.beginPath();
        ctx.ellipse(-1, -21, 20.5, 20, 0, 0, TAU);
      },
      () => {
        ctx.beginPath();
        ctx.moveTo(-20, -18);
        ctx.quadraticCurveTo(-23, -4, -17, 1);
        ctx.lineTo(-10, -3);
        ctx.lineTo(-6, 1);
        ctx.lineTo(-2, -8);
        ctx.lineTo(4, -20);
        ctx.closePath();
      },
    ],
    pal.hairShade,
    pal.line,
  );
}

function headPath(ctx) {
  ctx.beginPath();
  ctx.moveTo(-15, -12);
  ctx.bezierCurveTo(-20, -26, -12, -38, 1, -38);
  ctx.bezierCurveTo(14, -38, 21, -28, 19, -16);
  ctx.bezierCurveTo(18, -8, 13, -1, 6, 0);
  ctx.bezierCurveTo(0, 1, -6, -2, -9, -5);
  ctx.closePath();
}

function drawHead(ctx, pal) {
  headPath(ctx);
  fillStroke(ctx, pal.skin, pal.line, 1.8);
  // ear (back of head side)
  ctx.beginPath();
  ctx.ellipse(-14.5, -12, 3, 4, -0.2, 0, TAU);
  fillStroke(ctx, pal.skin, pal.line, 1.3);
  ctx.beginPath();
  ctx.arc(-14.5, -12, 1.4, -1, 1.6);
  ctx.strokeStyle = pal.skinShade;
  ctx.lineWidth = 1;
  ctx.stroke();
  // soft jaw shadow (cel)
  ctx.save();
  headPath(ctx);
  ctx.clip();
  ctx.fillStyle = 'rgba(246,160,140,0.25)';
  ctx.beginPath();
  ctx.ellipse(-14, -10, 8, 14, 0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function drawBangs(ctx, pal) {
  outlinedUnion(
    ctx,
    [
      () => {
        ctx.beginPath();
        ctx.moveTo(-20, -15);
        ctx.bezierCurveTo(-23, -34, -10, -42, 2, -41);
        ctx.bezierCurveTo(16, -41, 23, -30, 21, -16);
        // face-framing lock on the near side
        ctx.quadraticCurveTo(22, -8, 19.5, -3);
        ctx.quadraticCurveTo(17.5, -10, 16, -16);
        // forehead zig-zag fringe (front to back)
        ctx.lineTo(14.5, -20.5);
        ctx.lineTo(11, -27);
        ctx.lineTo(7.5, -21.5);
        ctx.lineTo(3.5, -28.5);
        ctx.lineTo(0, -21);
        ctx.lineTo(-3, -28);
        ctx.lineTo(-6.5, -21.5);
        ctx.lineTo(-10, -27);
        ctx.lineTo(-14, -18);
        ctx.closePath();
      },
    ],
    pal.hair,
    pal.line,
    3,
  );
  // angel-ring highlight
  ctx.beginPath();
  ctx.ellipse(1, -24, 16, 13, 0, -2.75, -1.05);
  ctx.strokeStyle = pal.hairHi;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(1, -24, 16, 13, 0, -0.85, -0.55);
  ctx.stroke();
}

// ---------------------------------------------------------------- face

const EYES = {
  L: { cx: -2.5, cy: -14.5, k: 0.8, outer: -1 },
  R: { cx: 10.5, cy: -14.5, k: 1, outer: 1 },
};

function drawEye(ctx, P, side, pal) {
  const e = EYES[side];
  const open = P[`eyeOpen${side}`];
  const smile = P[`eyeSmile${side}`];
  const w = 4.4 * e.k;
  const h = 5.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pal.line;
  if (P.eyeShut > 0.5) {
    // > <  squeezed shut; chevrons point toward the nose
    const dir = side === 'R' ? -1 : 1;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(e.cx - dir * w, e.cy - 4);
    ctx.lineTo(e.cx + dir * w * 0.8, e.cy);
    ctx.lineTo(e.cx - dir * w, e.cy + 4);
    ctx.stroke();
    return;
  }
  const eff = open * (1 - smile * 0.6);
  if (eff < 0.14) {
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    if (smile > 0.35) {
      ctx.moveTo(e.cx - w, e.cy + 1.5);
      ctx.quadraticCurveTo(e.cx, e.cy - 5, e.cx + w, e.cy + 1.5);
    } else {
      ctx.moveTo(e.cx - w, e.cy + 1);
      ctx.quadraticCurveTo(e.cx, e.cy + 3.5, e.cx + w, e.cy + 1);
    }
    ctx.stroke();
    return;
  }
  const bottom = e.cy + h - smile * h * 0.9;
  const top = bottom - 2 * h * Math.min(eff, 1.3);
  const midY = (top + bottom) / 2;
  const ry = (bottom - top) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(e.cx, midY, w, ry, 0, 0, TAU);
  ctx.fillStyle = '#fffaf7';
  ctx.fill();
  ctx.clip();
  // lid shadow
  ctx.fillStyle = 'rgba(120,100,170,0.25)';
  ctx.fillRect(e.cx - w, top, w * 2, 2.2);
  // iris + pupil
  const size = P.pupilSize;
  const ix = e.cx + P.pupilX * w * 0.5;
  const iy = e.cy + 0.6 + P.pupilY * h * 0.35;
  const irx = 3.4 * e.k * (0.72 + 0.28 * size);
  const iry = 4.8 * (0.72 + 0.28 * size);
  const g = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
  g.addColorStop(0, pal.irisDark);
  g.addColorStop(0.55, pal.iris);
  g.addColorStop(1, '#ffd27a');
  ctx.beginPath();
  ctx.ellipse(ix, iy, irx, iry, 0, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ix, iy - 0.4, 1.6 * e.k * size, 2.4 * size, 0, 0, TAU);
  ctx.fillStyle = '#2a1206';
  ctx.fill();
  // highlights (fixed light from upper-right reads as "alive")
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ix + 1.3 * e.k, iy - 2.2, 1.5, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ix - 1.2 * e.k, iy + 2.3, 0.75, 0, TAU);
  ctx.fill();
  if (P.sparkle > 0.05) {
    ctx.globalAlpha = P.sparkle;
    star(ctx, ix - 0.4, iy + 0.4, 3 * e.k, '#fff');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // upper lash line with a wing at the outer corner
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(e.cx, midY, w + 0.3, ry + 0.3, 0, Math.PI * 1.06, Math.PI * 1.94);
  ctx.stroke();
  ctx.beginPath();
  const ox = e.cx + e.outer * (w + 0.2);
  ctx.moveTo(ox - e.outer * 1.2, midY - ry * 0.55);
  ctx.lineTo(ox + e.outer * 2.2, midY - ry * 0.75 - 1);
  ctx.lineWidth = 1.8;
  ctx.stroke();
  // lower lash
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.ellipse(e.cx, midY, w * 0.9, ry, 0, Math.PI * 0.3, Math.PI * 0.7);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function star(ctx, x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.32;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawMouth(ctx, P, pal) {
  const mx = 6.5;
  const my = -5.2;
  const hw = 3.6 * P.mouthWidth;
  const curve = P.mouthCurve;
  const lY = my - curve * 1.8 + P.mouthSmirk * 0.6;
  const rY = my - curve * 1.8 - P.mouthSmirk * 2.2;
  const lx = mx - hw;
  const rx = mx + hw + P.mouthSmirk * 0.8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = pal.line;
  if (P.mouthOpen < 0.06) {
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, lY);
    ctx.quadraticCurveTo(mx, my + curve * 2.6, rx, rY);
    ctx.stroke();
    return;
  }
  const o = P.mouthOpen;
  const topY = my + curve * 1.2 - o * 0.8;
  const botY = my + curve * 2.4 + o * 8.5;
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(lx, lY);
    ctx.quadraticCurveTo(mx, topY, rx, rY);
    ctx.quadraticCurveTo(mx, botY, lx, lY);
    ctx.closePath();
  };
  path();
  ctx.fillStyle = pal.mouth;
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  ctx.beginPath();
  ctx.ellipse(mx + 0.5, botY - 0.5, hw * 0.7, Math.max(1.2, o * 3.2), 0, 0, TAU);
  ctx.fillStyle = pal.tongue;
  ctx.fill();
  if (curve > 0.4 && o > 0.25) {
    // upper teeth strip for big grins
    ctx.fillStyle = '#fff';
    ctx.fillRect(lx, topY - 2, hw * 2.2, 2.6 + o);
  }
  ctx.restore();
  path();
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

function drawFaceLower(ctx, P, pal) {
  // blush under everything else
  if (P.blush > 0.02) {
    for (const [x, y, s] of [[14, -7.5, 1], [-4.5, -7.5, 0.8]]) {
      ctx.globalAlpha = 0.5 * P.blush;
      ctx.beginPath();
      ctx.ellipse(x, y, 4.2 * s, 2.3, 0, 0, TAU);
      ctx.fillStyle = pal.blush;
      ctx.fill();
      if (P.blush > 0.3) {
        ctx.globalAlpha = Math.min(1, P.blush) * 0.8;
        ctx.strokeStyle = '#e8506f';
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * 2 * s - 0.8, y + 1.3);
          ctx.lineTo(x + i * 2 * s + 0.8, y - 1.3);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  drawEye(ctx, P, 'L', pal);
  drawEye(ctx, P, 'R', pal);
  // tiny nose
  ctx.beginPath();
  ctx.moveTo(16.5, -10.5);
  ctx.lineTo(17.4, -9.2);
  ctx.strokeStyle = pal.skinShade;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  drawMouth(ctx, P, pal);
  if (P.tears > 0.05) {
    ctx.globalAlpha = clamp(P.tears, 0, 1);
    ctx.strokeStyle = '#7cc8ff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (const x of [10.5, -2.5]) {
      ctx.beginPath();
      ctx.moveTo(x, -9.5);
      ctx.quadraticCurveTo(x + 1, -6, x + 0.5, -9.5 + 7 * P.tears);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

function drawFaceUpper(ctx, P, pal, time) {
  // brows drawn OVER the bangs (classic anime readability trick)
  for (const side of ['L', 'R']) {
    const e = EYES[side];
    const a = P[`browAngle${side}`];
    const by = e.cy - 9.5 - P.browHeight * 3.2;
    const inner = -e.outer;
    const half = 3.8 * e.k;
    const ix = e.cx + inner * half;
    const ox = e.cx - inner * half;
    const iy = by + a * 2.4;
    const oy = by - a * 1.2;
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.quadraticCurveTo(e.cx, by - 1.4, ox, oy);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d1636';
    ctx.lineWidth = 2.6;
    ctx.stroke();
  }
  if (P.sparkle > 0.4) {
    // "kira" glint next to the head
    const tw = 0.8 + Math.sin(time * 12) * 0.2;
    ctx.globalAlpha = (P.sparkle - 0.4) / 0.6;
    star(ctx, 25, -38, 5.5 * tw, '#ffd34d');
    star(ctx, 25, -38, 3 * tw, '#fff');
    ctx.globalAlpha = 1;
  }
  if (P.gloom > 0.05) {
    ctx.globalAlpha = 0.6 * P.gloom;
    ctx.strokeStyle = '#6a5acd';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const x = -1 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(x, -34);
      ctx.lineTo(x, -34 + 8 + (i % 2) * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (P.sweat > 0.05) {
    const s = P.sweat;
    const bob = Math.sin(time * 6) * 0.6;
    ctx.save();
    ctx.translate(22, -30 + bob + (1 - s) * 3);
    ctx.scale(0.8 + 0.3 * s, 0.8 + 0.3 * s);
    ctx.globalAlpha = Math.min(1, s * 1.3);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.quadraticCurveTo(4, 0, 0, 3.5);
    ctx.quadraticCurveTo(-4, 0, 0, -6);
    fillStroke(ctx, '#bfe6ff', '#3d7fc4', 1.2);
    ctx.beginPath();
    ctx.arc(-1, 0.5, 0.9, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.restore();
  }
  if (P.angerMark > 0.05) {
    const s = P.angerMark * (1 + Math.sin(time * 10) * 0.08);
    ctx.save();
    ctx.translate(15, -36);
    ctx.scale(s, s);
    ctx.strokeStyle = '#e8283a';
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.arc(3.2, 3.2, 2.6, Math.PI * 1.0, Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- chains

function drawChain(ctx, pts, s, pal) {
  if (pts.length < 2) return;
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[Math.min(i + 1, pts.length - 1)];
    const o = pts[Math.max(i - 1, 0)];
    let dx = q.x - o.x;
    let dy = q.y - o.y;
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const t = i / (pts.length - 1);
    const hw = lerp(s.width, s.tip, s.ribbon ? t * 0.4 : t * t) / 2;
    left.push({ x: p.x - dy * hw, y: p.y + dx * hw });
    right.push({ x: p.x + dy * hw, y: p.y - dx * hw });
  }
  const poly = [...left, ...right.reverse()];
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length - 1; i++) {
    const mx = (poly[i].x + poly[i + 1].x) / 2;
    const my = (poly[i].y + poly[i + 1].y) / 2;
    ctx.quadraticCurveTo(poly[i].x, poly[i].y, mx, my);
  }
  ctx.closePath();
  fillStroke(ctx, pal[s.fill] || s.fill, pal[s.stroke] || pal.line, 1.6);
  if (s.ribbon) {
    // stripe down the scarf
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = pal.scarfShade;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------- character

/**
 * ch = { x, y, facing, sx, sy, skel, world, face, chains:{name:{points}}, time, flash }
 * images: Map(partName -> HTMLImageElement) for parts with an image.
 */
export function drawCharacter(ctx, ch, manifest, images) {
  const pal = manifest.palette;
  const base = ctx.getTransform();
  const order = drawOrder(manifest);
  const state = { face: ch.face, time: ch.time };
  ctx.save();
  if (ch.flash) ctx.globalAlpha = 0.45;
  for (const part of order) {
    if (part.shape && part.shape.type === 'chain') {
      const chain = ch.chains[part.shape.chain];
      if (!chain) continue;
      ctx.save();
      ctx.setTransform(base);
      drawChain(ctx, chain.points, part.shape, pal);
      ctx.restore();
      continue;
    }
    const m = ch.world[ch.skel.index.get(part.bone)];
    if (!m) continue;
    ctx.save();
    ctx.setTransform(base);
    ctx.translate(ch.x, ch.y);
    ctx.scale(ch.facing * ch.sx, ch.sy);
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    const img = images && images.get(part.name);
    if (img && img.complete && img.naturalWidth > 0) {
      const sc = part.scale ?? 1;
      const [ox, oy] = part.offset || [0, 0];
      ctx.drawImage(img, ox - part.pivot[0] * sc, oy - part.pivot[1] * sc, img.naturalWidth * sc, img.naturalHeight * sc);
    } else if (part.shape) {
      drawShape(ctx, part, pal, state);
    }
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- world

export function drawBackground(ctx, cam, view, time) {
  const g = ctx.createLinearGradient(0, 0, 0, view.h);
  g.addColorStop(0, '#8fd3ff');
  g.addColorStop(0.6, '#d9f1ff');
  g.addColorStop(1, '#fff1df');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, view.w, view.h);
  // clouds
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 7; i++) {
    const x = ((i * 310 - cam.x * 0.15 + time * 8) % (view.w + 300) + view.w + 300) % (view.w + 300) - 150;
    const y = 60 + ((i * 97) % 140) - cam.y * 0.05;
    for (const [dx, dy, r] of [[0, 0, 26], [26, -10, 22], [50, 0, 24], [24, 8, 22]]) {
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, r, 0, TAU);
      ctx.fill();
    }
  }
  // parallax hills
  const layers = [
    { k: 0.3, y: 360, amp: 50, color: '#a7dcc2', step: 220 },
    { k: 0.5, y: 420, amp: 40, color: '#7fc9a5', step: 160 },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.color;
    ctx.beginPath();
    ctx.moveTo(0, view.h);
    const off = cam.x * L.k;
    for (let sx = -L.step; sx <= view.w + L.step; sx += 16) {
      const wx = sx + off;
      const y = L.y - cam.y * L.k * 0.4 + Math.sin(wx / L.step) * L.amp + Math.sin(wx / (L.step * 0.37)) * L.amp * 0.3;
      ctx.lineTo(sx, y);
    }
    ctx.lineTo(view.w, view.h);
    ctx.closePath();
    ctx.fill();
  }
}

export function drawLevel(ctx, level, time, collected) {
  const bottom = level.world.bottom + 400;
  // floor body
  ctx.beginPath();
  ctx.moveTo(level.floor[0][0], bottom);
  for (const [x, y] of level.floor) ctx.lineTo(x, y);
  ctx.lineTo(level.floor[level.floor.length - 1][0], bottom);
  ctx.closePath();
  ctx.fillStyle = '#c98f5a';
  ctx.fill();
  // dirt stripes
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,70,40,0.25)';
  ctx.lineWidth = 6;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    ctx.moveTo(level.floor[0][0], 740 + i * 34);
    ctx.lineTo(level.floor[level.floor.length - 1][0], 700 + i * 34);
    ctx.stroke();
  }
  ctx.restore();
  // grass lip
  ctx.beginPath();
  for (const [i, [x, y]] of level.floor.entries()) (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.strokeStyle = '#4fbf5f';
  ctx.lineWidth = 9;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.strokeStyle = '#2c3a2a';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  for (const p of level.platforms) {
    const w = p.x2 - p.x1;
    ctx.beginPath();
    ctx.roundRect(p.x1, p.y1, w, 16, 6);
    fillStroke(ctx, '#e8b375', '#5a3a22', 2);
    ctx.beginPath();
    ctx.roundRect(p.x1, p.y1 - 3, w, 7, 4);
    fillStroke(ctx, '#62c96f', '#2c3a2a', 1.5);
    ctx.fillStyle = 'rgba(90,58,34,0.35)';
    for (let x = p.x1 + 18; x < p.x2 - 8; x += 26) ctx.fillRect(x, p.y1 + 7, 8, 3);
  }

  for (const s of level.spikes) {
    const n = Math.floor(s.w / 14);
    for (let i = 0; i < n; i++) {
      const x = s.x + i * (s.w / n);
      ctx.beginPath();
      ctx.moveTo(x, s.y + s.h);
      ctx.lineTo(x + s.w / n / 2, s.y - 4);
      ctx.lineTo(x + s.w / n, s.y + s.h);
      ctx.closePath();
      fillStroke(ctx, '#d6dbe8', '#3a3f55', 1.6);
    }
  }

  for (const [i, gem] of level.gems.entries()) {
    if (collected.has(i)) continue;
    const bob = Math.sin(time * 3 + i) * 4;
    const sq = Math.abs(Math.cos(time * 2 + i));
    ctx.save();
    ctx.translate(gem.x, gem.y + bob);
    ctx.scale(0.35 + 0.65 * sq, 1);
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, -2);
    ctx.lineTo(0, 11);
    ctx.lineTo(-8, -2);
    ctx.closePath();
    fillStroke(ctx, '#ff6fb5', '#6b1f4a', 1.8);
    ctx.beginPath();
    ctx.moveTo(-3, -4);
    ctx.lineTo(0, -8);
    ctx.lineTo(2, -3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    ctx.restore();
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
    star(ctx, p.x, p.y, p.r, p.color);
  }
  ctx.globalAlpha = 1;
}

export function drawSpeech(ctx, x, y, text) {
  if (!text) return;
  ctx.font = 'bold 15px "Trebuchet MS", "Comic Sans MS", sans-serif';
  const w = Math.max(30, ctx.measureText(text).width + 18);
  const h = 26;
  const bx = x - w / 2;
  const by = y - h;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 12);
  ctx.moveTo(x - 6, by + h - 1);
  ctx.lineTo(x - 2, by + h + 9);
  ctx.lineTo(x + 6, by + h - 1);
  fillStroke(ctx, '#ffffff', '#2a1d33', 2);
  ctx.beginPath();
  ctx.roundRect(bx + 1.5, by + 1.5, w - 3, h - 3, 10);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.fillStyle = '#2a1d33';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, by + h / 2 + 1);
}

/** Debug: bones, joints, IK targets, chain points. Called in world space. */
export function drawBones(ctx, ch, targets) {
  ctx.save();
  ctx.translate(ch.x, ch.y);
  ctx.scale(ch.facing * ch.sx, ch.sy);
  for (const [i, b] of ch.skel.bones.entries()) {
    const m = ch.world[i];
    const ox = m[4];
    const oy = m[5];
    const tx = m[2] * b.length + m[4];
    const ty = m[3] * b.length + m[5];
    ctx.strokeStyle = b.name.endsWith('B') ? '#ff9a3c' : '#00e0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(b.length > 0 ? tx : ox + m[0] * 4, b.length > 0 ? ty : oy + m[1] * 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ox, oy, 2.2, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  for (const t of targets) {
    ctx.strokeStyle = t.reached ? '#3cff6b' : '#ff3c5a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(t.x - 4, t.y - 4);
    ctx.lineTo(t.x + 4, t.y + 4);
    ctx.moveTo(t.x + 4, t.y - 4);
    ctx.lineTo(t.x - 4, t.y + 4);
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#ff3cf0';
  for (const c of Object.values(ch.chains)) {
    for (const p of c.points) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.8, 0, TAU);
      ctx.fill();
    }
  }
}
