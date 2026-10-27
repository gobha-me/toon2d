import sys
from PIL import Image, ImageDraw
src, out, step = sys.argv[1], sys.argv[2], int(sys.argv[3])
box = tuple(map(int, sys.argv[4].split(','))) if len(sys.argv) > 4 else None
im = Image.open(src).convert('RGB')
if box: im = im.crop(box)
ox, oy = (box[0], box[1]) if box else (0, 0)
d = ImageDraw.Draw(im)
for x in range(0, im.width, step):
    d.line([(x, 0), (x, im.height)], fill=(255, 0, 255) if (x+ox) % (step*2) == 0 else (0, 160, 255), width=1)
    d.text((x + 2, 2), str(x + ox), fill=(255, 0, 0))
for y in range(0, im.height, step):
    d.line([(0, y), (im.width, y)], fill=(255, 0, 255) if (y+oy) % (step*2) == 0 else (0, 160, 255), width=1)
    d.text((2, y + 2), str(y + oy), fill=(255, 0, 0))
im.save(out)
