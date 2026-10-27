// Small RGBA image helpers shared by capture/score (pure).
export const fromB64 = (p) => ({ w: p.w, h: p.h, data: new Uint8Array(Buffer.from(p.data, 'base64')) });

export function crop(img, x0, y0, w, h) {
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sx = x + x0;
      const sy = y + y0;
      if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
      out.set(img.data.subarray((sy * img.w + sx) * 4, (sy * img.w + sx) * 4 + 4), (y * w + x) * 4);
    }
  }
  return { w, h, data: out };
}

export function scaleNearest(img, k) {
  const w = img.w * k;
  const h = img.h * k;
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = ((Math.floor(y / k) * img.w + Math.floor(x / k)) * 4);
      out.set(img.data.subarray(s, s + 4), (y * w + x) * 4);
    }
  }
  return { w, h, data: out };
}

/** Grid of equal-size images (contact sheet), cols per row, gap px of bg. */
export function sheet(imgs, cols, gap = 2, bg = [16, 16, 24, 255]) {
  const { w, h } = imgs[0];
  const rows = Math.ceil(imgs.length / cols);
  const W = cols * w + (cols + 1) * gap;
  const H = rows * h + (rows + 1) * gap;
  const out = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i++) out.set(bg, i * 4);
  imgs.forEach((im, i) => {
    const ox = gap + (i % cols) * (w + gap);
    const oy = gap + Math.floor(i / cols) * (h + gap);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (y * w + x) * 4;
        if (im.data[s + 3] < 128) continue;
        out.set(im.data.subarray(s, s + 4), ((oy + y) * W + ox + x) * 4);
      }
    }
  });
  return { w: W, h: H, data: out };
}

/** Bounding box of alpha >= 128 pixels, or null. */
export function alphaBox(img) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.data[(y * img.w + x) * 4 + 3] >= 128) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  return x1 < 0 ? null : { x0, y0, x1, y1 };
}

/** Fraction of pixels that differ (any channel > tol) between two same-size images, over a mask of either alpha. */
export function diffFraction(a, b, tol = 8) {
  let n = 0;
  let d = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const on = a.data[i + 3] >= 128 || b.data[i + 3] >= 128;
    if (!on) continue;
    n++;
    if (Math.abs(a.data[i] - b.data[i]) > tol || Math.abs(a.data[i + 1] - b.data[i + 1]) > tol || Math.abs(a.data[i + 2] - b.data[i + 2]) > tol || (a.data[i + 3] >= 128) !== (b.data[i + 3] >= 128)) d++;
  }
  return n ? d / n : 0;
}

/** Connected components (8-neighbour) of alpha >= 128. Returns sizes sorted descending. */
export function components(img) {
  const { w, h, data } = img;
  const seen = new Uint8Array(w * h);
  const sizes = [];
  const stack = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || data[i * 4 + 3] < 128) continue;
    let n = 0;
    stack.push(i);
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      n++;
      const x = p % w;
      const y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const q = ny * w + nx;
          if (!seen[q] && data[q * 4 + 3] >= 128) {
            seen[q] = 1;
            stack.push(q);
          }
        }
      }
    }
    sizes.push(n);
  }
  return sizes.sort((a, b) => b - a);
}

export function hash(img) {
  let h = 2166136261;
  for (const v of img.data) h = Math.imul(h ^ v, 16777619);
  return (h >>> 0).toString(16);
}
