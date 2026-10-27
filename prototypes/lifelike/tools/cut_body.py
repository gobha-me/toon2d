"""Cut the AI side-view (src/rig_side.jpg) into rig parts, fill what each cut hides,
pack an atlas. Outputs prototype/body-atlas.webp + prototype/body-rig.json and
work/cut_*.png debug views. All coordinates below are source pixels (720x1280)."""
import json
import numpy as np
import cv2
from PIL import Image, ImageDraw
from scipy import ndimage

SRC = 'src/rig_side.jpg'
S = 0.5  # atlas scale
rgb = np.array(Image.open(SRC).convert('RGB')).astype(np.float32)
H, W = rgb.shape[:2]


def fg_mask(a):
    bg = np.median(np.concatenate([a[:20].reshape(-1, 3), a[-20:].reshape(-1, 3), a[:, :20].reshape(-1, 3)]), 0)
    d = np.sqrt(((a - bg) ** 2).sum(-1))
    m = d > 16
    m = ndimage.binary_opening(m, iterations=2)
    lab, n = ndimage.label(m)
    sizes = ndimage.sum(m, lab, range(1, n + 1))
    m = lab == (1 + int(np.argmax(sizes)))
    m = ndimage.binary_fill_holes(m)
    soft = np.clip((d - 10) / 14, 0, 1) * ndimage.binary_dilation(m, iterations=2)
    return m, soft


FG, SOFT = fg_mask(rgb)


def poly(pts):
    im = Image.new('L', (W, H), 0)
    ImageDraw.Draw(im).polygon([tuple(p) for p in pts], fill=255)
    return np.array(im) > 0


def patch(img, hole, dx=0, dy=0):
    """copy a shifted block of the same image into the hole (keeps cloth texture)"""
    out = img.copy()
    ys, xs = np.nonzero(hole)
    sy = np.clip(ys + dy, 0, H - 1)
    sx = np.clip(xs + dx, 0, W - 1)
    out[ys, xs] = img[sy, sx]
    return out


def row_fill(img, hole, margin=4):
    """per row: copy the pixels just right of the hole into it (hole width + margin)"""
    out = img.copy()
    for y in np.nonzero(hole.any(1))[0]:
        xs = np.nonzero(hole[y])[0]
        L = xs.max() - xs.min() + margin
        out[y, xs] = img[y, np.clip(xs + L, 0, W - 1)]
    return out


def heal(img, hole, r=5):
    """cv2 Telea inpaint over a thin band on the hole border to hide the patch seam"""
    band = ndimage.binary_dilation(hole, iterations=2) & ~ndimage.binary_erosion(hole, iterations=2)
    u8 = np.clip(img, 0, 255).astype(np.uint8)
    return cv2.inpaint(u8, band.astype(np.uint8) * 255, r, cv2.INPAINT_TELEA).astype(np.float32)


P = {
    'torso': dict(pivot=(345, 640), poly=[(230, 213), (290, 213), (290, 193), (380, 193), (385, 222), (480, 222), (480, 600), (470, 632), (240, 632)]),
    'head': dict(pivot=(340, 212), poly=[(120, 0), (600, 0), (600, 240), (385, 240), (380, 193), (290, 193), (290, 213), (120, 213)]),
    'armU': dict(pivot=(292, 262), poly=[(240, 226), (330, 232), (344, 448), (248, 452)]),
    'armL': dict(pivot=(294, 440), poly=[(246, 424), (344, 420), (350, 520), (352, 596), (380, 606), (384, 660), (370, 698), (340, 702), (320, 684), (316, 614), (250, 614), (246, 520)]),
    'thighN': dict(pivot=(318, 645), poly=[(248, 600), (385, 600), (382, 880), (262, 892)]),
    'shinN': dict(pivot=(318, 880), poly=[(255, 860), (382, 860), (376, 1000), (380, 1135), (266, 1135), (262, 1000)]),
    'footN': dict(pivot=(322, 1140), poly=[(262, 1118), (380, 1118), (405, 1140), (452, 1166), (454, 1216), (262, 1216)]),
    'thighF': dict(pivot=(395, 645), poly=[(345, 600), (442, 600), (432, 880), (352, 880)]),
    'shinF': dict(pivot=(378, 880), poly=[(335, 860), (422, 860), (408, 1000), (408, 1110), (350, 1110), (340, 1000)]),
    'footF': dict(pivot=(380, 1118), poly=[(345, 1092), (410, 1092), (445, 1128), (488, 1150), (488, 1184), (345, 1184)]),
}
M = {k: poly(v['poly']) for k, v in P.items()}
M['head'] &= ~M['torso']
arm = M['armU'] | M['armL']

tex = {}
alpha = {}
# torso: arm hides most of the jacket's back half -> copy the cloth just right of the arm,
# row by row; where that source is background (collar, hem) fall back to Telea inpaint
hole = arm & M['torso'] & (np.arange(H)[:, None] > 236) & (np.arange(H)[:, None] < 634)
t = row_fill(rgb, hole, margin=4)
srcok = row_fill(np.dstack([FG.astype(np.float32)] * 3), hole, margin=4)[..., 0] > 0.5
bad = hole & ~srcok
t = cv2.inpaint(np.clip(t, 0, 255).astype(np.uint8), bad.astype(np.uint8) * 255, 7, cv2.INPAINT_TELEA).astype(np.float32)
t = heal(t, hole)
tex['torso'] = t
alpha['torso'] = M['torso'] * SOFT
# head: neck extension under the collar -> copy neck skin downward
t = rgb.copy()
neck = poly([(318, 186), (362, 180), (366, 240), (318, 240)]) & (np.arange(H)[:, None] > 192)
neck &= np.roll(FG, 26, 0)
t = patch(t, neck, dy=-26)
t = heal(t, neck, 3)
tex['head'] = t
alpha['head'] = np.clip((M['head'] * SOFT) + neck, 0, 1)
for k in ('armU', 'armL'):
    tex[k] = rgb
    alpha[k] = M[k].astype(np.float32) * SOFT
# thighs: hand + jacket hem sit over the trousers -> fill hem rows from below, hand from the side
for k in ('thighN', 'thighF'):
    hem = M[k] & (np.arange(H)[:, None] < 636)
    h2 = M[k] & ndimage.binary_dilation(M['armL'] & (np.arange(H)[:, None] > 600), iterations=3)
    hh = hem | h2
    t = patch(rgb, hh, dy=112)
    t = heal(t, hh)
    sa = SOFT.copy()
    ys, xs = np.nonzero(hh)
    sa[ys, xs] = SOFT[np.clip(ys + 112, 0, H - 1), xs]
    tex[k] = t
    alpha[k] = M[k] * sa
for k in ('shinN', 'footN', 'shinF', 'footF'):
    tex[k] = rgb
    alpha[k] = M[k].astype(np.float32) * SOFT

# the hand sits over the trousers in the source: keep only skin below the cuff
R_, G_, B_ = rgb[..., 0], rgb[..., 1], rgb[..., 2]
skin = (R_ > G_ + 12) & (R_ > 85) & (R_ > B_ + 18)
skin = ndimage.binary_closing(ndimage.binary_opening(skin, iterations=1), iterations=2)
skin = ndimage.gaussian_filter(skin.astype(np.float32), 0.8)
below = np.arange(H)[:, None] > 606
alpha['armL'] = np.where(below, alpha['armL'] * np.clip(skin * 1.4, 0, 1), alpha['armL'])

# drop the baked floor shadow under the boots (light, desaturated pixels near the ground)
gray = rgb.mean(-1)
sat = rgb.max(-1) - rgb.min(-1)
shadow = (gray > 110) & (sat < 28) & (np.arange(H)[:, None] > 1160)
for k in ('footN', 'footF', 'shinN', 'shinF'):
    alpha[k] = alpha[k] * ~shadow

# whole-limb textures for the skinned-mesh approach (union, same fills)
union = {
    'legN': ['thighN', 'shinN', 'footN'],
    'legF': ['thighF', 'shinF', 'footF'],
    'arm': ['armU', 'armL'],
}
for name, ks in union.items():
    a = np.zeros((H, W), np.float32)
    t = rgb.copy()
    for k in ks:
        sel = alpha[k] > a
        t[sel] = tex[k][sel]
        a = np.maximum(a, alpha[k])
    tex[name], alpha[name] = t, a

order = ['torso', 'head', 'armU', 'armL', 'thighN', 'shinN', 'footN', 'thighF', 'shinF', 'footF', 'legN', 'legF', 'arm']
BG = np.median(np.concatenate([rgb[:20].reshape(-1, 3), rgb[:, :20].reshape(-1, 3)]), 0)


def unmatte(t, a):
    # remove the grey studio background from soft edges, then choke alpha a little (no halo on dark bg)
    aa = np.maximum(a, 0.35)[..., None]
    c = (t - (1 - aa) * BG) / aa
    return np.where(a[..., None] > 0.02, c, t), np.clip((a - 0.3) / 0.7, 0, 1)


crops = {}
for k in order:
    tex[k], alpha[k] = unmatte(tex[k], alpha[k])
    a = alpha[k]
    ys, xs = np.nonzero(a > 0.02)
    x0, y0, x1, y1 = xs.min() - 2, ys.min() - 2, xs.max() + 3, ys.max() + 3
    x0, y0 = max(x0, 0), max(y0, 0)
    im = np.dstack([np.clip(tex[k][y0:y1, x0:x1], 0, 255), a[y0:y1, x0:x1] * 255]).astype(np.uint8)
    pim = Image.fromarray(im, 'RGBA')
    pim = pim.resize((max(1, round(pim.width * S)), max(1, round(pim.height * S))), Image.LANCZOS)
    crops[k] = (pim, x0, y0)

# shelf pack
AW = 1024
x = y = rowh = 0
rects = {}
for k in sorted(order, key=lambda k: -crops[k][0].height):
    im = crops[k][0]
    if x + im.width + 2 > AW:
        x, y, rowh = 0, y + rowh + 2, 0
    rects[k] = (x, y, im.width, im.height)
    x += im.width + 2
    rowh = max(rowh, im.height)
AH = y + rowh
atlas = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
for k, (ax, ay, w, h) in rects.items():
    atlas.paste(crops[k][0], (ax, ay))
atlas.save('prototype/body-atlas.webp', quality=82, method=6)

rig = {'scale': S, 'ground': 1214 * S, 'parts': {}}
piv = {k: v['pivot'] for k, v in P.items()}
piv['legN'], piv['legF'], piv['arm'] = piv['thighN'], piv['thighF'], piv['armU']
for k in order:
    _, x0, y0 = crops[k]
    rig['parts'][k] = {
        'rect': rects[k],
        'origin': [x0 * S, y0 * S],  # top-left of the crop in model space
        'pivot': [piv[k][0] * S, piv[k][1] * S],
    }
rig['joints'] = {k: [v[0] * S, v[1] * S] for k, v in piv.items()}
json.dump(rig, open('prototype/body-rig.json', 'w'), indent=1)

# debug: exploded view + reassembly
dbg = Image.new('RGB', (W * 2, H), (200, 200, 200))
ex = Image.new('RGBA', (W, H), (0, 0, 0, 0))
off = {'head': (0, -40), 'armU': (-110, 0), 'armL': (-110, 20), 'thighN': (-40, 30), 'shinN': (-40, 60), 'footN': (-40, 90),
       'thighF': (90, 30), 'shinF': (90, 60), 'footF': (90, 90), 'torso': (0, 0)}
for k in ['thighF', 'shinF', 'footF', 'torso', 'head', 'thighN', 'shinN', 'footN', 'armU', 'armL']:
    a = alpha[k]
    im = Image.fromarray(np.dstack([np.clip(tex[k], 0, 255), a * 255]).astype(np.uint8), 'RGBA')
    ex.alpha_composite(im, off[k])
dbg.paste(Image.fromarray(rgb.astype(np.uint8)), (0, 0))
dbg.paste(ex, (W, 0), ex)
dbg.save('work/cut_exploded.jpg', quality=85)
print('atlas', AW, AH, {k: rects[k] for k in order})
