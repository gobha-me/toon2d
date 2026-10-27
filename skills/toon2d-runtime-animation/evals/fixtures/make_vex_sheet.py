# Generates the eval fixture: a pixel-art PARTS pose sheet for "Vex" (cyberpunk courier), 1 px = 1 game px.
# Markers: #FF00FF = pivot (joint to parent), #00FFFF = tip (joint to child), #FFFF00 = face anchor (head only).
# Re-run: python3 make_vex_sheet.py  (needs Pillow). Output: vex/sheet.png, vex/sheet.json, vex/preview.png
from PIL import Image, ImageDraw
import json

OUT = 'vex'
LINE = (24, 18, 40, 255)
C = {
    'skin': (236, 190, 160, 255), 'skin2': (205, 150, 128, 255),
    'hair': (230, 232, 240, 255), 'hair2': (170, 176, 200, 255),
    'jacket': (30, 170, 160, 255), 'jacket2': (18, 112, 112, 255), 'trim': (255, 210, 60, 255),
    'pants': (52, 48, 80, 255), 'pants2': (36, 32, 58, 255),
    'boot': (70, 40, 50, 255), 'boot2': (40, 24, 32, 255), 'sole': (210, 210, 220, 255),
    'glove': (60, 60, 80, 255),
}

def outline(im):
    w, h = im.size
    px = im.load()
    src = im.copy().load()
    for y in range(h):
        for x in range(w):
            if src[x, y][3] == 0:
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and src[nx, ny][3] > 0 and src[nx, ny] != LINE:
                        px[x, y] = LINE
                        break
    return im

def part(w, h, draw_fn):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    draw_fn(d, w, h)
    return outline(im)

def limb(col, col2, w, h, taper=0):
    def f(d, W, H):
        d.rounded_rectangle([1, 1, W - 2, H - 2], radius=(W - 2) // 2, fill=C[col])
        d.line([W - 3, 3, W - 3 - taper, H - 4], fill=C[col2])
    return part(w, h, f)

parts = {}
def torso(d, W, H):
    d.rounded_rectangle([1, 1, W - 2, H - 2], radius=3, fill=C['jacket'])
    d.rectangle([1, H - 5, W - 2, H - 3], fill=C['pants'])
    d.line([2, 2, 2, H - 6], fill=C['jacket2'])
    d.line([W // 2 + 1, 2, W // 2 + 1, H - 6], fill=C['trim'])
    d.rectangle([3, 1, W - 4, 2], fill=C['trim'])
parts['torso'] = (part(12, 17, torso), (6, 14), (6, 2))           # pivot = hip, tip = neck

def head(d, W, H):
    d.ellipse([2, 3, W - 2, H - 2], fill=C['skin'])
    d.pieslice([1, 1, W - 1, 12], 170, 360, fill=C['hair'])
    d.polygon([(1, 8), (4, 4), (5, 11), (2, 13)], fill=C['hair'])      # back hair (left = back when facing right)
    d.polygon([(8, 4), (W - 3, 5), (W - 4, 7), (11, 6), (9, 7)], fill=C['hair2'])  # bangs
    d.rectangle([6, H - 2, 9, H - 1], fill=C['skin2'])                  # neck
parts['head'] = (part(17, 18, head), (8, 16), (8, 3))
parts['head_face'] = (10, 11)                                            # face anchor = CENTRE of eyes+mouth box, >=4 px inside the head's front edge

parts['upper_arm'] = (limb('jacket', 'jacket2', 6, 11), (3, 2), (3, 8))
parts['fore_arm'] = (limb('jacket', 'jacket2', 5, 10), (2, 2), (2, 7))
def hand(d, W, H):
    d.ellipse([1, 1, W - 2, H - 2], fill=C['glove'])
parts['hand'] = (part(6, 6, hand), (3, 2), (3, 4))
parts['thigh'] = (limb('pants', 'pants2', 7, 13), (3, 2), (3, 10))
parts['shin'] = (limb('pants', 'pants2', 6, 13), (3, 2), (3, 10))
def boot(d, W, H):
    d.rounded_rectangle([1, 1, W - 2, H - 3], radius=2, fill=C['boot'])
    d.rectangle([1, H - 3, W - 2, H - 2], fill=C['sole'])
    d.line([2, 2, 3, 2], fill=C['boot2'])
parts['foot'] = (part(10, 7, boot), (3, 2), (8, 4))                      # pivot = ankle, tip = toe
def tail(d, W, H):
    d.polygon([(2, 1), (W - 2, 1), (W - 3, H - 2), (1, H - 3)], fill=C['jacket2'])
    d.line([2, 1, W - 2, 1], fill=C['trim'])
parts['coat_tail'] = (part(8, 11, tail), (4, 2), (3, 9))

# layout: one row, 3 px gutters
order = ['head', 'torso', 'upper_arm', 'fore_arm', 'hand', 'thigh', 'shin', 'foot', 'coat_tail']
x = 2
W = sum(parts[n][0].size[0] for n in order) + 3 * len(order) + 2
H = max(parts[n][0].size[1] for n in order) + 4
sheet = Image.new('RGBA', (W, H), (0, 0, 0, 0))
meta = {'image': 'sheet.png', 'units': '1 px = 1 game px (pixel mode, 320x180 buffer)', 'markers': {'pivot': '#FF00FF', 'tip': '#00FFFF', 'face': '#FFFF00'}, 'parts': {}}
for n in order:
    im, pv, tp = parts[n]
    im = im.copy()
    im.putpixel(pv, (255, 0, 255, 255))
    im.putpixel(tp, (0, 255, 255, 255))
    if n == 'head':
        im.putpixel(parts['head_face'], (255, 255, 0, 255))
    sheet.alpha_composite(im, (x, 2))
    meta['parts'][n] = {'rect': [x, 2, im.size[0], im.size[1]]}
    x += im.size[0] + 3
sheet.save(f'{OUT}/sheet.png')
json.dump(meta, open(f'{OUT}/sheet.json', 'w'), indent=1)
sheet.resize((W * 8, H * 8), Image.NEAREST).save(f'{OUT}/preview.png')
print('ok', W, H)
