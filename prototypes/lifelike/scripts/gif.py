"""Assemble review GIFs + contact sheets from work/raw frames (scripts/shots.mjs).
Usage: .venv/bin/python scripts/gif.py work/raw shots"""
import glob
import os
import sys
from PIL import Image

raw, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)


def frames(prefix, box=None, scale=0.5, step=1):
    fs = sorted(glob.glob(f'{raw}/{prefix}-*.png'))[::step]
    res = []
    for f in fs:
        im = Image.open(f).convert('RGB')
        if box:
            im = im.crop(box(im))
        res.append(im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS))
    return res


def gif(name, fr, ms, colors=128):
    # one global palette built from a sample of frames keeps flicker and size down
    sample = Image.new('RGB', (fr[0].width, fr[0].height * 4))
    for i, k in enumerate(range(0, len(fr), max(1, len(fr) // 4))):
        if i < 4:
            sample.paste(fr[k], (0, i * fr[0].height))
    pal = sample.quantize(colors=colors, method=Image.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.NONE) for f in fr]
    path = f'{out}/{name}.gif'
    q[0].save(path, save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f'{path}: {len(fr)} frames, {fr[0].width}x{fr[0].height}, {kb:.0f} KB')
    return kb


def sheet(name, fr, cols):
    w, h = fr[0].size
    rows = (len(fr) + cols - 1) // cols
    s = Image.new('RGB', (w * cols, h * rows), (12, 12, 16))
    for i, f in enumerate(fr):
        s.paste(f, ((i % cols) * w, (i // cols) * h))
    s.save(f'{out}/{name}.jpg', quality=84)


body = lambda im: (0, 0, im.width, im.height)
gif('body-idle', frames('idle', body, 0.5), 66, 96)
gif('body-walk-compare', frames('walk', body, 0.5), 33, 112)
gif('body-run-compare', frames('run', body, 0.5), 33, 112)
sheet('body-walk-sheet', frames('walk', lambda im: (0, 62, im.width, im.height), 0.4, 6), 2)
# face: all three side by side (the comparison), and F2 alone bigger (the expression change)
face_all = frames('face', lambda im: (0, 0, im.width, int(62 + (im.height - 62) * 0.78)), 0.5, 2)
gif('face-compare', face_all, 133, 80)
f2 = lambda im: (im.width // 3, 62, 2 * im.width // 3, im.height)
gif('face-f2-expressions', frames('face', f2, 0.62, 2), 133, 128)
gif('face-f1-warp', frames('face', lambda im: (0, 62, im.width // 3, im.height), 0.62, 2), 133, 128)
for n in ['still-neutral', 'still-smile', 'still-angry', 'still-surprised', 'still-sad', 'still-mid-smile', 'debug-walk', 'debug-face']:
    Image.open(f'{raw}/{n}.png').convert('RGB').save(f'{out}/{n}.jpg', quality=86)
print('ok')
