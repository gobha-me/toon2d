"""Segment the 6 AI walk frames, normalise height and baseline, pack into a WebP strip."""
import json
import numpy as np
import cv2
from scipy import ndimage

im = cv2.imread('src/walk_sheet2.jpg')
H, W = im.shape[:2]
bg = np.median(np.concatenate([im[:8].reshape(-1, 3), im[-8:].reshape(-1, 3)]), axis=0)
d = np.linalg.norm(im.astype(np.float32) - bg, axis=2)
fg = d > 22
fg = ndimage.binary_opening(fg, iterations=1)
lab, n = ndimage.label(fg)
sizes = ndimage.sum(fg, lab, range(1, n + 1))
objs = ndimage.find_objects(lab)
cands = [(sizes[i], objs[i], i + 1) for i in range(n) if sizes[i] > 4000]
cands.sort(key=lambda c: c[1][1].start)
print('figures', len(cands), [(int(s), o[1].start, o[1].stop, o[0].start, o[0].stop) for s, o, _ in cands])
TH, FW = 380, 250  # output cell
cells, meta, heads = [], [], []
href = None
heights = [o[0].stop - o[0].start for _, o, _ in cands]
ref = float(np.median(heights))
areas = [c[0] for c in cands]
aref = float(np.median(areas))
for s, o, li in cands:
    m = ndimage.binary_fill_holes(lab == li)
    soft = np.clip((d - 14) / 16, 0, 1) * ndimage.binary_dilation(m, iterations=2)
    gray = im.mean(-1); sat = im.max(-1).astype(int) - im.min(-1)
    rows = np.arange(H)[:, None]
    soft = soft * ~((gray > 110) & (sat < 28) & (rows > o[0].stop - 0.07 * (o[0].stop - o[0].start)))
    ys, xs = o
    crop = im[ys, xs]
    sa = soft[ys, xs]
    aa = np.maximum(sa, 0.05)[..., None]
    crop = np.clip(np.where(sa[..., None] > 0.02, (crop.astype(np.float32) - (1 - aa) * bg) / aa, crop), 0, 255).astype(np.uint8)
    a = (np.clip((sa - 0.2) / 0.8, 0, 1) * 255).astype(np.uint8)
    h = ys.stop - ys.start
    mm = m[ys, xs]
    wid = mm.sum(1)
    top = int(h * 0.12); bot = int(h * 0.30)
    neck = top + int(np.argmin(wid[top:bot]))  # narrowest row under the hair = neck
    heads.append(neck)
    href = href or neck
    k = (TH - 12) / ref * (href / neck)  # normalise by head height (AI drifts scale between frames)
    rgba = np.dstack([crop, a])
    rgba = cv2.resize(rgba, None, fx=k, fy=k, interpolation=cv2.INTER_AREA)
    # anchor: bottom of figure on baseline, x by torso centroid of upper 40%
    up = rgba[: int(rgba.shape[0] * 0.4), :, 3] > 128
    cx = np.nonzero(up)[1].mean()
    cell = np.zeros((TH, FW, 4), np.uint8)
    ox = int(round(FW / 2 - cx)); oy = TH - 4 - rgba.shape[0]
    hh, ww = rgba.shape[:2]
    x0, x1 = max(0, ox), min(FW, ox + ww)
    y0 = max(0, oy)
    cell[y0:oy + hh, x0:x1] = rgba[y0 - oy:, x0 - ox:x1 - ox]
    cells.append(cell)
    meta.append({'srcH': int(h), 'neck': neck, 'scale': round(float(k), 3)})
strip = np.hstack(cells)
cv2.imwrite('prototype/walk-frames.webp', strip, [cv2.IMWRITE_WEBP_QUALITY, 80])
json.dump({'w': FW, 'h': TH, 'n': len(cells), 'frames': meta}, open('prototype/walk-frames.json', 'w'))
chk = strip.copy(); chk[..., :3] = (chk[..., :3] * (chk[..., 3:] / 255) + 255 * (1 - chk[..., 3:] / 255)).astype(np.uint8)
cv2.imwrite('work/walk_strip_v4.jpg', chk[..., :3])
print(meta)
