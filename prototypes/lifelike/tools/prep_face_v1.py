"""Register the AI face keyframes onto the neutral portrait and bake optical flow.
Outputs (prototype/): face-n.webp, face-c.webp (eyes closed), face-e.webp (2x2 atlas: smile, angry,
surprised, sad - registered into the neutral frame), face-f.png (4x2 flow atlas: row 0 = N->E, row 1 = E->N, 128px tiles,
R/G = dx/dy*4+128 in 512px units), face.json (landmarks). work/face_reg_*.jpg are checks."""
import json
import numpy as np
import cv2

R = 512
N = cv2.resize(cv2.imread('src/face_front.jpg'), (R, R), interpolation=cv2.INTER_AREA)
C = cv2.resize(cv2.imread('src/face_eyes_closed.jpg'), (R, R), interpolation=cv2.INTER_AREA)
sheet = cv2.imread('src/expr_sheet.jpg')
tiles = [sheet[y:y + 512, x:x + 512] for (y, x) in ((0, 0), (0, 512), (512, 0), (512, 512))]
NAMES = ['smile', 'angry', 'surprised', 'sad']

orb = cv2.ORB_create(4000)
gN = cv2.cvtColor(N, cv2.COLOR_BGR2GRAY)
kN, dN = orb.detectAndCompute(gN, None)
bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)


def register(img):
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    k, d = orb.detectAndCompute(g, None)
    m = sorted(bf.match(d, dN), key=lambda x: x.distance)[:600]
    src = np.float32([k[x.queryIdx].pt for x in m])
    dst = np.float32([kN[x.trainIdx].pt for x in m])
    A, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=3)
    warped = cv2.warpAffine(img, A, (R, R), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    valid = cv2.warpAffine(np.full(img.shape[:2], 255, np.uint8), A, (R, R)) > 128
    return warped, valid, A, int(inl.sum())


def bg_blend(img, valid):
    """outside the warped tile's footprint, show neutral (keeps frame edges clean)"""
    v = cv2.GaussianBlur(cv2.erode(valid.astype(np.float32), np.ones((9, 9))), (21, 21), 0)[..., None]
    return (img * v + N * (1 - v)).astype(np.uint8)


Cr, Cv, A, n = register(C)
print('closed', n, A.round(3).tolist())
Cr = bg_blend(Cr, Cv)
regs = []
for nm, t in zip(NAMES, tiles):
    w, v, A, n = register(t)
    s = np.sqrt(abs(np.linalg.det(A[:, :2])))
    print(nm, 'inliers', n, 'scale', round(s, 3), 'shift', A[:, 2].round(1).tolist())
    regs.append(bg_blend(w, v))

dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
dis.setFinestScale(1)
FT = 128
flows, backs = [], []
for nm, E in zip(NAMES, regs):
    gE = cv2.cvtColor(E, cv2.COLOR_BGR2GRAY)
    f = dis.calc(gN, gE, None)  # N(p) ~ E(p + f(p))
    f = cv2.GaussianBlur(f, (0, 0), 4)
    b = cv2.GaussianBlur(dis.calc(gE, gN, None), (0, 0), 4)  # E(p) ~ N(p + b(p))
    flows.append(f)
    backs.append(b)
    mag = np.linalg.norm(f, axis=2)
    print(nm, 'flow max', round(float(mag.max()), 1), 'p99', round(float(np.percentile(mag, 99)), 1))
    # check: backward-warp E by flow -> should look like N geometry with E colours
    yy, xx = np.mgrid[0:R, 0:R].astype(np.float32)
    back = cv2.remap(E, xx + f[..., 0], yy + f[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    cv2.imwrite(f'work/face_reg_{nm}.jpg', np.hstack([N, E, back, cv2.addWeighted(N, 0.5, E, 0.5, 0)]))

cv2.imwrite('prototype/face-n.webp', N, [cv2.IMWRITE_WEBP_QUALITY, 82])
cv2.imwrite('prototype/face-c.webp', Cr, [cv2.IMWRITE_WEBP_QUALITY, 82])
atlas = np.vstack([np.hstack(regs[:2]), np.hstack(regs[2:])])
cv2.imwrite('prototype/face-e.webp', atlas, [cv2.IMWRITE_WEBP_QUALITY, 80])
fl = np.zeros((FT * 2, FT * 4, 3), np.uint8)
for i, f in enumerate(flows + backs):
    s = cv2.resize(f, (FT, FT), interpolation=cv2.INTER_AREA)
    enc = np.clip(np.round(s * 4 + 128), 0, 255).astype(np.uint8)
    y, x = (i // 4) * FT, (i % 4) * FT
    fl[y:y + FT, x:x + FT, 2] = enc[..., 0]  # BGR order: R=dx
    fl[y:y + FT, x:x + FT, 1] = enc[..., 1]  # G=dy
cv2.imwrite('prototype/face-f.png', fl)
cv2.imwrite('work/face_closed_check.jpg', np.hstack([N, Cr, cv2.addWeighted(N, 0.5, Cr, 0.5, 0)]))
