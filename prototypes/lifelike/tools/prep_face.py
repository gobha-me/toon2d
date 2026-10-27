"""Gambit face prep: register every AI key onto the neutral portrait and bake two-way optical flow.
Outputs (prototype/):
  face-n.webp  neutral 512        face-c.webp  eyes-closed (registered)
  face-e.webp  key atlas, 4 cols x 3 rows of 512 tiles, order = KEYS
  face-f.webp  lossless flow atlas, KEYS cols x 2 rows of 128 tiles (row 0 = N->E, row 1 = E->N),
               R/G = dx/dy * FS + 128 in 512px units
  face.json    key list + layout
work/face2_*.jpg are alignment checks."""
import json
import numpy as np
import cv2

R, FT, FS = 512, 128, 2.0
N = cv2.resize(cv2.imread('src/face_front.jpg'), (R, R), interpolation=cv2.INTER_AREA)
C = cv2.resize(cv2.imread('src/face_eyes_closed.jpg'), (R, R), interpolation=cv2.INTER_AREA)
sheet = cv2.imread('src/expr_sheet.jpg')
quad = {n: sheet[y:y + 512, x:x + 512] for n, (y, x) in
        zip(['smile', 'angry', 'surprised', 'sad'], ((0, 0), (0, 512), (512, 0), (512, 512)))}


def load(p):
    return cv2.resize(cv2.imread(p), (R, R), interpolation=cv2.INTER_AREA)


# key name, source, kind (face = masked to face oval; head = whole head incl. hair)
KEYS = [
    ('smile', quad['smile'], 'face'),
    ('angry', quad['angry'], 'face'),
    ('surprised', quad['surprised'], 'face'),
    ('sad', quad['sad'], 'face'),
    ('distressed', load('src/gen2/distressed_t1.jpg'), 'face'),
    ('winded', load('src/gen2/winded_t1.jpg'), 'face'),
    ('turnL1', load('src/gen2/turnL5_t3.jpg'), 'head'),
    ('turnL2', load('src/gen2/turnL20_t1.jpg'), 'head'),
    ('turnR1', load('src/gen2/turnR20_t1.jpg'), 'head'),  # came out ~8 deg
    ('turnR2', load('src/gen2/turnR20_t4.jpg'), 'head'),
    ('yell', load('src/gen2/yell_angry_t1.jpg'), 'mouth'),
    ('project', load('src/gen2/yell_project_t1.jpg'), 'mouth'),
    ('pain', load('src/gen2/pain_t2.jpg'), 'face'),   # t1 rejected: painterly, not photographic
]


def interior(E):
    """mouth patch of a registered key: opening (teeth + tongue + dark) hull grown over the lips"""
    m = np.zeros((R, R), np.uint8)
    roi = E[268:360, 200:320]
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
    g = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    dark = g < 85
    teeth = (hsv[..., 1] < 70) & (hsv[..., 2] > 150)
    yy0, xx0 = np.mgrid[268:360, 200:320]
    near = ((xx0 - 258) / 40.0) ** 2 + ((yy0 - 308) / 34.0) ** 2 < 1
    k = ((dark | teeth) & near).astype(np.uint8)
    k = cv2.morphologyEx(k, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(k)
    keep = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 25]
    if not keep:
        return m, m
    pts = np.vstack([np.column_stack(np.nonzero(lab == i))[:, ::-1] for i in keep]) + [200, 268]
    hull = cv2.convexHull(pts.astype(np.int32))
    cv2.fillConvexPoly(m, hull, 255)
    # grow the opening to take in the lips (the F4 patch swaps lips + teeth + tongue together, so the
    # lips always frame their own opening), feathered a few px into the skin
    inner = cv2.erode(m, np.ones((7, 7), np.uint8))
    m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 21)))
    return cv2.GaussianBlur(m, (0, 0), 5), inner

orb = cv2.ORB_create(5000)
gN = cv2.cvtColor(N, cv2.COLOR_BGR2GRAY)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
low = np.zeros((R, R), np.uint8)
low[int(R * 0.64):] = 255
yy, xx = np.mgrid[0:R, 0:R].astype(np.float32)


def register(img, mask=None):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    k, d = orb.detectAndCompute(g, mask)
    kN, dN = orb.detectAndCompute(gN, mask)
    m = sorted(bf.match(d, dN), key=lambda x: x.distance)[:600]
    A, inl = cv2.estimateAffinePartial2D(np.float32([k[x.queryIdx].pt for x in m]),
                                         np.float32([kN[x.trainIdx].pt for x in m]),
                                         method=cv2.RANSAC, ransacReprojThreshold=3)
    w = cv2.warpAffine(img, A, (R, R), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    v = cv2.warpAffine(np.full(img.shape[:2], 255, np.uint8), A, (R, R)) > 128
    return w, v, A, int(inl.sum())


def bg_blend(img, valid):
    v = cv2.GaussianBlur(cv2.erode(valid.astype(np.float32), np.ones((9, 9))), (21, 21), 0)[..., None]
    return (img * v + N * (1 - v)).astype(np.uint8)


def body_err(w):
    return float(np.abs(w[int(R * .72):].astype(np.float32) - N[int(R * .72):]).mean())


Cr, Cv, _, _ = register(C)
Cr = bg_blend(Cr, Cv)
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
dis.setFinestScale(1)
regs, flows, backs, meta, masks = [], [], [], [], []
for name, img, kind in KEYS:
    cands = [register(img)] + ([register(img, low)] if kind == 'head' else [])
    w, v, A, n = min(cands, key=lambda c: body_err(c[0]))
    E = bg_blend(w, v)
    gE = cv2.cvtColor(E, cv2.COLOR_BGR2GRAY)
    sig = 5 if kind == 'head' else 4
    f = cv2.GaussianBlur(dis.calc(gN, gE, None), (0, 0), sig)   # N(p) ~ E(p + f)
    b = cv2.GaussianBlur(dis.calc(gE, gN, None), (0, 0), sig)   # E(p) ~ N(p + b)
    # turn estimate: mean dx of flow around the nose
    nose = f[235:265, 240:275, 0].mean()
    mag = np.linalg.norm(f, axis=2)
    info = dict(name=name, kind=kind, inliers=n, scale=round(float(np.sqrt(abs(np.linalg.det(A[:, :2])))), 3),
                body_err=round(body_err(w), 1), nose_dx=round(float(nose), 1),
                flow_p99=round(float(np.percentile(mag, 99)), 1), flow_max=round(float(mag.max()), 1))
    print(info)
    meta.append(info)
    regs.append(E)
    masks.append(interior(E) if kind == 'face' and name in ('surprised',) or kind == 'mouth' else (np.zeros((R, R), np.uint8),) * 2)
    flows.append(f)
    backs.append(b)
    chk = cv2.remap(E, xx + f[..., 0], yy + f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    cv2.imwrite(f'work/face2_{name}.jpg', cv2.resize(np.hstack([N, E, chk, cv2.addWeighted(N, .5, E, .5, 0)]),
                                                     None, fx=.5, fy=.5))

cv2.imwrite('prototype/face-n.webp', N, [cv2.IMWRITE_WEBP_QUALITY, 82])
cv2.imwrite('prototype/face-c.webp', Cr, [cv2.IMWRITE_WEBP_QUALITY, 82])
assert len(regs) <= 16
atlas = np.zeros((R * 4, R * 4, 3), np.uint8)
for i, E in enumerate(regs):
    atlas[(i // 4) * R:(i // 4 + 1) * R, (i % 4) * R:(i % 4 + 1) * R] = E
cv2.imwrite('prototype/face-e.webp', atlas, [cv2.IMWRITE_WEBP_QUALITY, 76])
K = len(KEYS)
fl = np.full((FT * 2, FT * K, 3), 128, np.uint8)
fl[..., 0] = 0
for row, fs in enumerate((flows, backs)):
    for i, f in enumerate(fs):
        s = cv2.resize(f, (FT, FT), interpolation=cv2.INTER_AREA)
        enc = np.clip(np.round(s * FS + 128), 0, 255).astype(np.uint8)
        fl[row * FT:(row + 1) * FT, i * FT:(i + 1) * FT, 2] = enc[..., 0]
        fl[row * FT:(row + 1) * FT, i * FT:(i + 1) * FT, 1] = enc[..., 1]
        # B channel: row 0 = mouth patch (opening + lips), row 1 = opening only, in the key's own frame
        fl[row * FT:(row + 1) * FT, i * FT:(i + 1) * FT, 0] = cv2.resize(masks[i][row], (FT, FT), interpolation=cv2.INTER_AREA)
for i, (mk, inner) in enumerate(masks):
    if mk.any():
        ys, xs = np.nonzero(mk > 128)
        meta[i]['mouth'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        ys, xs = np.nonzero(inner)
        meta[i]['opening'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
        ov = regs[i].copy()
        ov[mk > 0] = (ov[mk > 0] * 0.5 + np.array([0, 255, 0]) * 0.5).astype(np.uint8)
        cv2.imwrite(f'work/face2_mouth_{KEYS[i][0]}.jpg', np.hstack([regs[i][230:380, 170:350], ov[230:380, 170:350]]))
cv2.imwrite('prototype/face-f.webp', fl, [cv2.IMWRITE_WEBP_QUALITY, 101])
json.dump(dict(keys=meta, atlasCols=4, atlasRows=4, flowTile=FT, flowScale=FS), open('prototype/face.json', 'w'), indent=1)
grid = np.vstack([np.hstack([N] + regs[i:i + 3]) if i else np.hstack([N] + regs[:3]) for i in (0,)] )
rows = [np.hstack(([N] + regs + [N * 0] * 3)[j:j + 4]) for j in (0, 4, 8, 12)]
rows[-1] = np.hstack([rows[-1], np.zeros((R, R * (4 - rows[-1].shape[1] // R), 3), np.uint8)]) if rows[-1].shape[1] < R * 4 else rows[-1]
g = np.vstack(rows)
for y in (201, 250, 296):
    for r in range(4):
        cv2.line(g, (0, y + r * R), (R * 4, y + r * R), (0, 255, 255), 1)
for r in range(4):
    pass
for x in range(257, R * 4, R):
    cv2.line(g, (x, 0), (x, R * 4), (0, 255, 255), 1)
cv2.imwrite('work/face2_grid.jpg', cv2.resize(g, None, fx=.4, fy=.4))
