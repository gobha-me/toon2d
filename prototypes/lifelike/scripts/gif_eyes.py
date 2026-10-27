"""Eyes-only distracted GIF (F2, the default) from scripts/shots.mjs SETS=eyes.
Usage: .venv/bin/python scripts/gif_eyes.py work/eyes2 shots"""
import glob
import sys
from PIL import Image, ImageDraw

sys.argv = [sys.argv[0], sys.argv[1], sys.argv[2]]
from gif2 import gif  # noqa: E402

raw = sys.argv[1]
fr = []
for i, f in list(enumerate(sorted(glob.glob(f'{raw}/eyes-*.png'))))[::2]:
    im = Image.open(f).convert('RGB')
    head = im.crop((70, 100, 330, 400)).resize((182, 210), Image.LANCZOS)      # F2 panel, head and shoulders
    eyes = im.crop((115, 175, 295, 240)).resize((270, 98), Image.LANCZOS)      # eye band, 1.5x
    c = Image.new('RGB', (182 + 270 + 6, 210 + 18), (14, 15, 18))
    c.paste(head, (0, 0))
    c.paste(eyes, (188, 56))
    t = 'distracted, eyes only: wander' if i < 96 else 'glance(-1): eyes only'
    ImageDraw.Draw(c).text((6, 213), t + '  (F2, head = idle sway only)', fill=(230, 210, 140))
    fr.append(c)
gif('distracted-eyes-only', fr, 133, 64)
