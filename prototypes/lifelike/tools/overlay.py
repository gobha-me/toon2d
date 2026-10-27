import sys, importlib.util
from PIL import Image, ImageDraw
spec = importlib.util.spec_from_file_location('c', 'tools/cut_body.py')
src = open('tools/cut_body.py').read().split('M = {k')[0]
ns = {}
exec(src, ns)
P = ns['P']
im = Image.open('src/rig_side.jpg').convert('RGB')
d = ImageDraw.Draw(im)
cols = [(255,0,0),(0,255,0),(0,0,255),(255,255,0),(255,0,255),(0,255,255),(255,128,0),(128,0,255),(0,128,0),(255,255,255)]
for i,(k,v) in enumerate(P.items()):
    d.line(v['poly']+[v['poly'][0]], fill=cols[i%10], width=2)
    px,py=v['pivot']; d.ellipse([px-5,py-5,px+5,py+5], outline=cols[i%10], width=2); d.text((px+6,py-6),k,fill=cols[i%10])
for y in range(0,1280,50): d.text((2,y),str(y),fill=(0,0,0)); d.line([(0,y),(25,y)],fill=(0,0,0))
for x in range(0,720,50): d.text((x,2),str(x),fill=(0,0,0)); d.line([(x,0),(x,20)],fill=(0,0,0))
im.crop((150,0,560,1280)).save('work/overlay.jpg', quality=85)
