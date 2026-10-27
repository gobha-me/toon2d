// @dom
// Renderer (DOM/canvas). Pixel mode = draw into a 320x180 offscreen buffer, snap to the palette,
// add the hand-placed pixel face, then integer-upscale with nearest neighbour ONCE.
// Smooth mode = same world drawn at 3x into 960x540 with a vector face.
import { on } from './character.js';
import { drawPixelFace } from './face-pixel.js';
import { drawVectorFace } from './face-vector.js';

export const MODES = { pixel: { W: 320, H: 180, s: 1 }, smooth: { W: 960, H: 540, s: 3 } };

function hexRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function shade(hex, k) {
  const [r, g, b] = hexRgb(hex);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1)}`;
}

export function createRenderer(display, mode = 'pixel') {
  const m = MODES[mode] || MODES.pixel;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = m.W;
    c.height = m.H;
    return c;
  };
  const buf = mk();
  const chr = mk();
  const r = { mode, ...m, display, buf, chr, bctx: buf.getContext('2d', { willReadFrequently: true }), cctx: chr.getContext('2d', { willReadFrequently: true }), k: 1, cam: { x: 0, y: 0 }, palCache: new Map() };
  fitDisplay(r);
  return r;
}

/** Integer scale that fits the window. CSS size = device px / dpr so 1 buffer px = k device px exactly. */
export function fitDisplay(r, maxW = window.innerWidth - 16, maxH = window.innerHeight - 90) {
  const dpr = window.devicePixelRatio || 1;
  r.k = Math.max(1, Math.floor(Math.min((maxW * dpr) / r.W, (maxH * dpr) / r.H)));
  if (r.mode === 'pixel') r.k = Math.max(2, r.k);
  r.display.width = r.W * r.k;
  r.display.height = r.H * r.k;
  r.display.style.width = `${(r.W * r.k) / dpr}px`;
  r.display.style.height = `${(r.H * r.k) / dpr}px`;
}

function drawBackground(ctx, r, level, theme) {
  const s = r.s;
  ctx.fillStyle = theme.sky;
  ctx.fillRect(0, 0, r.W, r.H);
  ctx.fillStyle = theme.far;
  for (let i = -1; i < 12; i++) {
    const x = Math.round((i * 70 - r.cam.x * 0.4) % 840) * s;
    ctx.fillRect(x, (level.floorY - 60 - ((i * 37) % 30)) * s, 40 * s, 200 * s);
  }
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, (level.floorY - r.cam.y) * s, r.W, r.H);
  ctx.fillStyle = theme.groundHi;
  ctx.fillRect(0, (level.floorY - r.cam.y) * s, r.W, 2 * s);
  for (const p of level.platforms || []) {
    ctx.fillStyle = theme.ground;
    ctx.fillRect((p.x0 - r.cam.x) * s, (p.y - r.cam.y) * s, (p.x1 - p.x0) * s, 6 * s);
    ctx.fillStyle = theme.groundHi;
    ctx.fillRect((p.x0 - r.cam.x) * s, (p.y - r.cam.y) * s, (p.x1 - p.x0) * s, 2 * s);
  }
}

function limbPath(ctx, pts, caps) {
  if (caps) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  } else {
    // anti-puppet OFF: separate butt-capped segments -> visible hinges and see-through gaps at bends
    for (let i = 1; i < pts.length; i++) {
      ctx.beginPath();
      ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
      ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    }
  }
}

// Sprite parts: the part's pivot pixel goes on the joint and its pivot->tip direction is aligned to the
// bone angle j.a. Pass j.rot to set the on-screen rotation directly instead (0 = drawn exactly as in the
// sheet), e.g. feet that must stay flat on the ground while planted.
function drawSprite(ctx, sheet, partName, j) {
  const part = sheet.parts[partName];
  if (!part || !sheet.img) return false;
  const [rx, ry, rw, rh] = part.rect;
  const pa = Math.atan2(part.tip[1] - part.pivot[1], part.tip[0] - part.pivot[0]);
  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.rotate(j.rot ?? j.a - pa);
  ctx.drawImage(sheet.img, rx, ry, rw, rh, rx - part.pivot[0], ry - part.pivot[1], rw, rh);
  ctx.restore();
  return true;
}

/** Draw the character in root-local space (ctx already translated/scaled/mirrored). */
function drawBody(ctx, ch, pal, sheet, r) {
  const L = ch.local;
  const d = ch.rig.draw;
  const caps = on(ch.flags, 'caps');
  const narrow = 1 - 0.22 * ch.kick;
  const ol = r.mode === 'pixel' ? 2 : 1.1;
  const upper = (fn) => {
    ctx.save();
    ctx.translate(L.hip.x, 0);
    ctx.scale(narrow, 1);
    ctx.translate(-L.hip.x, 0);
    fn();
    ctx.restore();
  };
  ctx.lineCap = caps ? 'round' : 'butt';
  ctx.lineJoin = caps ? 'round' : 'miter';
  const limb = (key) => {
    const spec = d.limbs[key];
    const bones = spec.bones.map((b) => L[b]);
    const sprites = spec.bones.map((b) => ch.rig.byName[b].sprite);
    if (sheet && sprites.every(Boolean)) {
      ctx.save();
      if (spec.far) ctx.filter = 'brightness(0.72)';
      bones.forEach((j, i) => drawSprite(ctx, sheet, sprites[i], j));
      if (spec.endSprite) {
        const last = bones.at(-1);
        // feet: flat (as drawn) while grounded, toes follow the shin (pointed) in the air; hands follow the forearm
        const rot = spec.end === 'foot' ? (ch.body.grounded ? 0 : 0.6 * (last.a - Math.PI / 2)) : undefined;
        drawSprite(ctx, sheet, spec.endSprite, { x: last.ex, y: last.ey, a: last.a, rot });
      }
      ctx.restore();
      return;
    }
    const pts = [{ x: bones[0].x, y: bones[0].y }, ...bones.map((j) => ({ x: j.ex, y: j.ey }))];
    const col = spec.far ? shade(pal[spec.color], 0.72) : pal[spec.color];
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = spec.w[0] + ol;
    limbPath(ctx, pts, caps);
    ctx.strokeStyle = col;
    ctx.lineWidth = spec.w[0];
    limbPath(ctx, pts, caps);
    const end = pts.at(-1);
    const last = bones.at(-1);
    ctx.fillStyle = spec.end === 'foot' ? (spec.far ? shade(pal.shoe, 0.75) : pal.shoe) : spec.far ? pal.skinShade : pal.skin;
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = ol / 2;
    ctx.beginPath();
    if (spec.end === 'foot') {
      const flat = ch.hand === 'ball' ? null : ch.body.grounded;
      if (flat === null) ctx.ellipse(end.x + 0.5, end.y + 0.5, 2.2, 2.2, 0, 0, Math.PI * 2);
      else if (flat) ctx.roundRect(end.x - 1.5, end.y - 1, 5.5, 3, 1.2);
      else ctx.ellipse(end.x + Math.cos(last.a) * 1.5, end.y + Math.sin(last.a) * 1.5, 1.6, 3, last.a - Math.PI / 2 - 0.5, 0, Math.PI * 2);
    } else {
      const rr = ch.hand === 'open' ? [2.2, 1.4] : ch.hand === 'fist' ? [1.9, 1.9] : [1.6, 1.4];
      ctx.ellipse(end.x, end.y, rr[0], rr[1], last.a, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.stroke();
  };
  const torso = () => {
    const j = L[d.torso.bone];
    if (sheet && ch.rig.byName[d.torso.bone].sprite) return drawSprite(ctx, sheet, ch.rig.byName[d.torso.bone].sprite, j);
    const w = d.torso.w + 0.8 * ch.breath.chest * (on(ch.flags, 'breath') ? 1 : 0);
    const sq = ch.pose.squash ?? 0;
    const mid = { x: (j.x + j.ex) / 2 - Math.sin(ch.pose.angles.spine) * 2, y: (j.y + j.ey) / 2 };
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(j.x, j.y - 1);
      ctx.quadraticCurveTo(mid.x, mid.y, j.ex, j.ey + 1 + sq * 3);
      ctx.stroke();
    };
    ctx.lineCap = 'round';
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = w * (1 + sq * 0.3) + ol;
    path();
    ctx.strokeStyle = pal[d.torso.color];
    ctx.lineWidth = w * (1 + sq * 0.3);
    path();
    ctx.strokeStyle = pal.topShade;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(j.x - 3, j.y - 1);
    ctx.lineTo(j.ex - 3.2, j.ey + 3);
    ctx.stroke();
    ctx.lineCap = caps ? 'round' : 'butt';
  };
  const head = () => {
    const j = L[d.head.bone];
    const c = { x: j.x + Math.cos(j.a) * d.head.along, y: j.y + Math.sin(j.a) * d.head.along };
    if (sheet && ch.rig.byName[d.head.bone].sprite) {
      drawSprite(ctx, sheet, ch.rig.byName[d.head.bone].sprite, j);
    } else {
      const R = d.head.radius;
      ctx.lineWidth = ol / 2;
      ctx.strokeStyle = pal.line;
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.ellipse(c.x - 1.6, c.y - 0.8, R + 0.6, R + 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = pal.skin;
      ctx.beginPath();
      ctx.ellipse(c.x + 0.8, c.y + 0.8, R - 1, R - 1.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = pal.hair;
      ctx.beginPath();
      ctx.moveTo(c.x - R, c.y - 1);
      ctx.quadraticCurveTo(c.x - 1, c.y - R - 3, c.x + R + 0.5, c.y - 2.5);
      ctx.lineTo(c.x + 3, c.y - 3.5);
      ctx.lineTo(c.x + 1, c.y - 2);
      ctx.lineTo(c.x - 2, c.y - 3);
      ctx.closePath();
      ctx.fill();
    }
    if (r.mode !== 'pixel') {
      const a = j.a + Math.PI / 2;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(a);
      drawVectorFace(ctx, ch.face.params, pal, ch.yaw);
      ctx.restore();
    }
  };
  for (const part of d.order) {
    if (part === 'scarf') continue;
    if (part === 'legB' || part === 'legF') limb(part);
    else if (part === 'torso') upper(torso);
    else if (part === 'head') upper(head);
    else upper(() => limb(part));
  }
}

function drawScarf(ctx, ch, pal, r) {
  const s = r.s;
  const pts = ch.chain.pts.map((p) => ({ x: (p.x - r.cam.x) * s, y: (p.y - r.cam.y) * s }));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [col, w] of [[pal.line, 4.2], [pal.scarf, 2.8]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w * s;
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.stroke();
  }
}

/** Head-frame -> buffer px mapper used by the pixel face. */
export function faceMapper(ch, r) {
  const d = ch.rig.draw.face;
  const j = ch.local[d.bone];
  const narrow = 1 - 0.22 * ch.kick;
  const hip = ch.local.hip;
  const up = { x: Math.cos(j.a), y: Math.sin(j.a) };
  const fwd = { x: -up.y, y: up.x };
  const cx = j.x + up.x * d.along + fwd.x * (d.perp || 0);
  const cy = j.y + up.y * d.along + fwd.y * (d.perp || 0);
  return (fx, fy) => {
    const lx = cx + fwd.x * fx - up.x * fy;
    const ly = cy + fwd.y * fx - up.y * fy;
    const nx = hip.x + (lx - hip.x) * narrow;
    return { x: (ch.body.x + nx * ch.facing - r.cam.x) * r.s, y: (ch.body.y + ly - r.cam.y) * r.s };
  };
}

/** Snap every opaque pixel to the nearest palette colour and cut alpha: no AA blends, no mixed density. */
// extra = hex colours that must survive as-is (e.g. a sprite sheet's own palette from parts.json): without
// them, sprite colours get remapped to the nearest rig.palette entry and the art changes hue.
function quantize(ctx, r, pal, extra = []) {
  const img = ctx.getImageData(0, 0, r.W, r.H);
  const d = img.data;
  const cols = [...new Set([...Object.values(pal), ...extra])].flatMap((h) => [h, shade(h, 0.72), shade(h, 0.75)]).map(hexRgb);
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 110) {
      d[i + 3] = 0;
      continue;
    }
    const key = (d[i] << 16) | (d[i + 1] << 8) | d[i + 2];
    let best = r.palCache.get(key);
    if (!best) {
      let bd = Infinity;
      for (const c of cols) {
        const e = (c[0] - d[i]) ** 2 + (c[1] - d[i + 1]) ** 2 + (c[2] - d[i + 2]) ** 2;
        if (e < bd) {
          bd = e;
          best = c;
        }
      }
      r.palCache.set(key, best);
    }
    d[i] = best[0];
    d[i + 1] = best[1];
    d[i + 2] = best[2];
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** Render one frame. Returns nothing; read pixels via r.buf / r.chr / r.display. */
export function renderFrame(r, ch, level, opts = {}) {
  const pal = ch.rig.palette;
  const theme = opts.theme || { sky: '#2a2f4f', far: '#3a4170', ground: '#4b3d5e', groundHi: '#7a6a8e' };
  r.cam.x = Math.max(level.minX ?? 0, Math.min((level.maxX ?? 640) - r.W / r.s, ch.body.x - r.W / r.s / 2));
  r.cam.y = 0;
  const c = r.cctx;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, r.W, r.H);
  c.imageSmoothingEnabled = false;
  c.filter = 'none';
  drawScarf(c, ch, pal, r);
  c.save();
  c.translate((ch.body.x - r.cam.x) * r.s, (ch.body.y - r.cam.y) * r.s);
  c.scale(r.s * ch.facing, r.s);
  drawBody(c, ch, pal, opts.sheet, r);
  c.restore();
  if (r.mode === 'pixel') {
    quantize(c, r, pal, opts.sheet?.palette);
    drawPixelFace(c, faceMapper(ch, r), ch.face.params, pal, ch.yaw);
  }
  const b = r.bctx;
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.imageSmoothingEnabled = false;
  drawBackground(b, r, level, theme);
  b.drawImage(r.chr, 0, 0);
  const dc = r.display.getContext('2d');
  dc.imageSmoothingEnabled = false;
  dc.drawImage(r.buf, 0, 0, r.W * r.k, r.H * r.k);
}
