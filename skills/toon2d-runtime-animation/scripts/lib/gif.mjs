// Zero-dependency animated GIF encoder. frames: [{ w, h, data: RGBA }], all the same size.
// Uses the exact palette when the clip has <= 255 colours (pixel art), else a 6x7x6 uniform cube.
// Transparent pixels (alpha < 128) are drawn with `bg`.

function lzw(indices, minCode) {
  const out = [];
  let cur = 0;
  let bits = 0;
  let size = minCode + 1;
  const clear = 1 << minCode;
  const eoi = clear + 1;
  const emit = (code) => {
    cur |= code << bits;
    bits += size;
    while (bits >= 8) {
      out.push(cur & 255);
      cur >>>= 8;
      bits -= 8;
    }
  };
  let dict = new Map();
  let next = eoi + 1;
  emit(clear);
  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = prefix * 4096 + k;
    if (dict.has(key)) {
      prefix = dict.get(key);
      continue;
    }
    emit(prefix);
    if (next < 4096) {
      dict.set(key, next++);
      if (next > 1 << size && size < 12) size++;
    } else {
      emit(clear);
      dict = new Map();
      next = eoi + 1;
      size = minCode + 1;
    }
    prefix = k;
  }
  emit(prefix);
  emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

export function encodeGIF(frames, { delayMs = 50, bg = [24, 24, 32], loop = 0 } = {}) {
  const { w, h } = frames[0];
  const colors = new Map();
  let exact = true;
  for (const f of frames) {
    for (let i = 0; i < f.data.length && exact; i += 4) {
      const a = f.data[i + 3] >= 128;
      const key = a ? (f.data[i] << 16) | (f.data[i + 1] << 8) | f.data[i + 2] : (bg[0] << 16) | (bg[1] << 8) | bg[2];
      if (!colors.has(key)) {
        if (colors.size >= 256) exact = false;
        else colors.set(key, colors.size);
      }
    }
    if (!exact) break;
  }
  let pal;
  let index;
  if (exact) {
    pal = [...colors.keys()].map((k) => [(k >> 16) & 255, (k >> 8) & 255, k & 255]);
    index = (r, g, b) => colors.get((r << 16) | (g << 8) | b);
  } else {
    pal = [];
    for (let r = 0; r < 6; r++) for (let g = 0; g < 7; g++) for (let b = 0; b < 6; b++) pal.push([Math.round((r * 255) / 5), Math.round((g * 255) / 6), Math.round((b * 255) / 5)]);
    index = (r, g, b) => Math.round((r * 5) / 255) * 42 + Math.round((g * 6) / 255) * 6 + Math.round((b * 5) / 255);
  }
  while (pal.length < 256) pal.push([0, 0, 0]);
  const bytes = [];
  const u16 = (v) => bytes.push(v & 255, (v >> 8) & 255);
  bytes.push(...Buffer.from('GIF89a'));
  u16(w);
  u16(h);
  bytes.push(0xf7, 0, 0);
  for (const c of pal) bytes.push(...c);
  bytes.push(0x21, 0xff, 11, ...Buffer.from('NETSCAPE2.0'), 3, 1);
  u16(loop);
  bytes.push(0);
  const delay = Math.max(2, Math.round(delayMs / 10));
  for (const f of frames) {
    bytes.push(0x21, 0xf9, 4, 0x04);
    u16(delay);
    bytes.push(0, 0);
    bytes.push(0x2c);
    u16(0);
    u16(0);
    u16(w);
    u16(h);
    bytes.push(0);
    const idx = new Array(w * h);
    for (let i = 0, p = 0; i < f.data.length; i += 4, p++) {
      idx[p] = f.data[i + 3] >= 128 ? index(f.data[i], f.data[i + 1], f.data[i + 2]) : index(bg[0], bg[1], bg[2]);
    }
    bytes.push(8);
    const data = lzw(idx, 8);
    for (let i = 0; i < data.length; i += 255) {
      const block = data.slice(i, i + 255);
      bytes.push(block.length, ...block);
    }
    bytes.push(0);
  }
  bytes.push(0x3b);
  return Buffer.from(bytes);
}
