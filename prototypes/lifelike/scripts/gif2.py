"""Gambit review GIFs from work/raw4 frames (scripts/shots.mjs SETS=gambit,distract,breath,blend,lips,gstill).
Usage: .venv/bin/python scripts/gif2.py work/raw4 shots"""
import glob
import os
import sys
from PIL import Image, ImageDraw

raw, out = sys.argv[1], sys.argv[2]
LIMIT = 1.5 * 1024 * 1024


def frames(prefix, box, scale, step=1, label=None):
    res = []
    for f in sorted(glob.glob(f'{raw}/{prefix}-*.png'))[::step]:
        im = Image.open(f).convert('RGB')
        h = im.height
        im = im.crop(box(im.width, h))
        res.append(im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS))
    return res


def gif(name, fr, ms, colors=96):
    sample = Image.new('RGB', (fr[0].width, fr[0].height * 6))
    for i, k in enumerate(range(0, len(fr), max(1, len(fr) // 6))):
        if i < 6:
            sample.paste(fr[k], (0, i * fr[0].height))
    pal = sample.quantize(colors=colors, method=Image.MEDIANCUT)
    q = [f.quantize(palette=pal, dither=Image.NONE) for f in fr]
    path = f'{out}/{name}.gif'
    q[0].save(path, save_all=True, append_images=q[1:], duration=ms, loop=0, optimize=True)
    size = os.path.getsize(path)
    print(f'{path}: {len(fr)} frames, {fr[0].width}x{fr[0].height}, {size / 1024:.0f} KB', 'OVER' if size > LIMIT else '')
    return size


def labelled(fr, texts):
    """caption strip under each frame"""
    res = []
    for im, t in zip(fr, texts):
        c = Image.new('RGB', (im.width, im.height + 18), (14, 15, 18))
        c.paste(im, (0, 0))
        ImageDraw.Draw(c).text((6, im.height + 3), t, fill=(230, 210, 140))
        res.append(c)
    return res


# panel geometry inside the 1200x450 stage screenshot: canvas is the bottom 400 px, panels 400 wide
def panel(i, x0=0, y0=0, x1=400, y1=400):
    return lambda w, h: (i * 400 + x0, h - 400 + y0, i * 400 + x1, h - 400 + y1)


PW, PH = 112, 142

if __name__ == '__main__':
    os.makedirs(out, exist_ok=True)
    # 1. gambit reel: panel Q (1 key per side), head and shoulders, 10 fps
    sys.path.insert(0, 'scripts')
    from reel_labels import labels
    # 5 fps + 36 colours keeps the 53 s reel under 1.5 MB; every state is still held >= 8 frames
    fr = frames('gambit', panel(1, 60, 20, 340, 360), 0.44, 2)
    gif('gambit-reel', labelled(fr, labels(len(fr), 0.2)), 200, 36)
    # 2. distracted: P / Q / R side by side, 20 fps
    fr = frames('distract', panel(0, 0, 0, 1200, 400), 0.42, 1)
    gif('distracted-test', fr, 50, 96)
    # 3. breathing ramp: panel Q incl. shoulders, 12 fps
    fr = frames('breath', panel(1, 20, 20, 380, 400), 0.56, 1)
    gif('breathing-ramp', fr, 83, 96)
    # 4. blends: panel Q, 12 fps
    names = ['distressed + winded'] * 36 + ['happy + distracted'] * 36 + ['sad + surprised'] * 28 + ['angry + winded'] * 28
    fr = frames('blend', panel(1, 40, 0, 360, 360), 0.56, 1)
    gif('blend-demo', labelled(fr, names), 83, 80)
    # 5. talking: F1 | F2 | F4 on happy, neutral, angry, 12 fps, head crop
    names = ['talking on happy'] * 36 + ['talking on neutral'] * 36 + ['talking on angry'] * 36
    tri = []
    for f in sorted(glob.glob(f'{raw}/talk-*.png')):
        im = Image.open(f).convert('RGB')
        h = im.height
        row = Image.new('RGB', (3 * PW, PH), (14, 15, 18))
        for i in range(3):
            c = im.crop((i * 400 + 90, h - 400 + 70, i * 400 + 310, h - 400 + 350)).resize((PW, PH), Image.LANCZOS)
            row.paste(c, (i * PW, 0))
        d = ImageDraw.Draw(row)
        for i, t in enumerate(['F1 warp', 'F2 morph', 'F4 hybrid']):
            d.text((i * PW + 4, 2), t, fill=(255, 255, 255))
        tri.append(row)
    gif('talking-compare', labelled(tri, names), 83, 64)
    # 6. speech intents side by side: talk | angry yell | projecting | interject (each from rest), 12 fps
    quad = []
    for k in range(48):
        row = Image.new('RGB', (4 * PW, PH), (14, 15, 18))
        d = ImageDraw.Draw(row)
        for i, (n, t) in enumerate([('talk', 'talking'), ('yell', 'angry yell'), ('project', 'projecting'), ('interject', 'interject')]):
            im = Image.open(f'{raw}/speech-{n}-{k:03d}.png').convert('RGB')
            h = im.height
            row.paste(im.crop((90, h - 400 + 70, 310, h - 400 + 350)).resize((PW, PH), Image.LANCZOS), (i * PW, 0))
            d.text((i * PW + 4, 2), t, fill=(255, 255, 255))
        quad.append(row)
    gif('speech-intents', quad, 83, 64)
    # 7. pain: light hit, heavy hit (30 fps), hurting + labored breath (15 fps), panel Q
    names = ['hit: light (0.35)'] * 30 + ['hit: heavy (1.0)'] * 40 + ['hurting 0.85 + breathing hard'] * 60
    fr = frames('pain', panel(1, 60, 20, 340, 360), 0.5, 1)
    durs = [33] * 70 + [66] * 60
    lab = labelled(fr, names)
    sample = lab[::20]
    pal = Image.new('RGB', (lab[0].width, lab[0].height * len(sample)))
    for i, im in enumerate(sample):
        pal.paste(im, (0, i * lab[0].height))
    pal = pal.quantize(colors=80, method=Image.MEDIANCUT)
    q = [im.quantize(palette=pal, dither=Image.NONE) for im in lab]
    path = f'{out}/pain-demo.gif'
    q[0].save(path, save_all=True, append_images=q[1:], duration=durs, loop=0, optimize=True)
    print(path, len(q), f'{os.path.getsize(path) / 1024:.0f} KB')
