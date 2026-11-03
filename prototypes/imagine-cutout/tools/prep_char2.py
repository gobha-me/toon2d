#!/usr/bin/env python3
"""Author an original courier from layered shapes and the frozen rig manifest.

Run through heavy-run with an existing Python providing Pillow/NumPy/OpenCV.
All drawing uses the manifest canvas. Only saved textures are tightly cropped;
their source origins remain in parts.json. No external artwork or model is used.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from gap_finder import scripted_audit
from prep_parts import extend_joint_pixels, fill_attachment

PROJECT = Path(__file__).resolve().parents[1]
SOURCE = "prototypes/imagine-cutout/tools/prep_char2.py"
RECIPES = {
    "head": "profile face, nose, ear, hair and courier cap; rounded neck backing",
    "left_arm": "far teal sleeve capsule; proximal round backing and manifest dilation",
    "left_fore": "far teal forearm capsule and cuff; proximal backing and manifest dilation",
    "left_hand": "far mitten with thumb; proximal backing and manifest dilation",
    "right_upper": "near teal sleeve capsule; proximal round backing and manifest dilation",
    "right_fore": "near teal forearm capsule and cuff; proximal backing and manifest dilation",
    "right_hand": "near gripping mitten; proximal backing and manifest dilation",
    "leg_left": "navy trouser capsule; proximal backing and manifest dilation",
    "shin_left": "navy trouser calf capsule; proximal backing and manifest dilation",
    "boot_left": "right-pointing leather boot and sole; ankle backing and manifest dilation",
    "leg_right": "navy trouser capsule; proximal backing and manifest dilation",
    "shin_right": "navy trouser calf capsule; proximal backing and manifest dilation",
    "boot_right": "right-pointing leather boot and sole; ankle backing and manifest dilation",
    "satchel": "ochre satchel, flap, buckle and handle; rigid undilated prop",
}
INK = '#243447'
TEAL = '#338f92'
FAR_TEAL = '#286e79'
SKIN = '#eab185'
NAVY = '#334860'
LEATHER = '#815435'


def circle(draw, point, radius, fill):
    x, y = point
    draw.ellipse((x-radius, y-radius, x+radius, y+radius), fill=fill)


def capsule(draw, start, end, radius, fill):
    draw.line((tuple(start), tuple(end)), fill=fill, width=2*radius+1)
    circle(draw, start, radius, fill)
    circle(draw, end, radius, fill)


def provenance(path, date, *, source=SOURCE, tool="Python/Pillow/OpenCV procedural cutout authoring",
               description="Original fictional courier; scripted shapes only"):
    path.with_suffix('.gen.json').write_text(json.dumps(dict(
        tool=tool, model="none (scripted)", date=date, source=source,
        prompt="not applicable (scripted)",
        image_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        license="CC0-1.0", description=description), indent=2)+'\n')


def prepare(project, audit_only=False):
    config = json.loads((project/'characters.yml').read_text())['characters']['char2']
    manifest_path = project / config['manifest']
    manifest = json.loads(manifest_path.read_text())
    destination = project/'characters/char2'
    destination.mkdir(parents=True, exist_ok=True)
    report = scripted_audit(manifest_path, RECIPES, SOURCE)
    (destination/'gap-report.json').write_text(json.dumps(report, indent=2)+'\n')
    for slot in report['slots']:
        print(f"{slot['slot']}: {slot['action']} ({slot['method']})")
    if audit_only:
        return
    if report['generation_requested']:
        raise ValueError('unsupported slots require artwork; see gap report')
    joints = {j['name']: j for j in manifest['joints']}
    slots = {s['part']: s for s in manifest['slots']}
    size = tuple(manifest['source_canvas_px'])
    date = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    parts = []
    textures = destination/'parts'
    textures.mkdir(exist_ok=True)

    def save(name, image, bone, order, overlap=0, slot=None):
        pivot = joints[bone]['pivot']
        bbox = image.getbbox()
        if bbox is None:
            raise ValueError(f'{name}: empty procedural part')
        path = textures/(name+'.png')
        image.crop(bbox).save(path)
        provenance(path, date)
        parts.append(dict(id=name, bone=bone,
            parent_bone=slot['part_parent_bone'] if slot else bone,
            pivot=slot['pivot'] if slot else pivot,
            offset=[bbox[0]-pivot[0], bbox[1]-pivot[1]], bbox=list(bbox),
            source_bbox=list(bbox), source_to_rig_translation=[0, 0],
            texture_hd=path.relative_to(project).as_posix(), z_order=order,
            joint_overlap_px=overlap, rotation_limits_deg=joints[bone]['rotation_limits_deg'],
            source=SOURCE, classification='scripted original',
            derived_from=RECIPES.get(name, 'procedural torso and pelvis backing')))

    # These are actual clothing panels, with complete hidden silhouettes.
    for name, bone, half_width, top, bottom, color, order in (
        ('hip_backing', 'hip', 91, -15, 45, NAVY, 0),
        ('torso', 'torso', 92, 0, 160, TEAL, 8),
    ):
        image = Image.new('RGBA', size)
        draw = ImageDraw.Draw(image)
        x, y = joints[bone]['pivot']
        draw.rounded_rectangle((x-half_width, y+top-45, x+half_width, y+bottom+30),
                               radius=48, fill=INK)
        draw.rounded_rectangle((x-half_width+5, y+top-40, x+half_width-5, y+bottom+25),
                               radius=43, fill=color)
        if bone == 'torso':
            draw.polygon([(x-45,y-35),(x,y+5),(x+45,y-35),(x+30,y-48),(x-30,y-48)], fill='#e9c65e')
            draw.line((x,y+8,x,y+bottom+18), fill='#276d78', width=5)
            draw.rounded_rectangle((x+25,y+45,x+65,y+75), radius=6, fill='#e9c65e')
            draw.line((x-80,y+bottom,x+80,y+bottom), fill=LEATHER, width=18)
            draw.rectangle((x-8,y+bottom-9,x+8,y+bottom+9), fill='#e9c65e')
        save(name, image, bone, order)

    for name, slot in slots.items():
        bone = slot['bone']
        pivot = joints[bone]['pivot']
        x, y = pivot
        image = Image.new('RGBA', size)
        draw = ImageDraw.Draw(image)
        radius = 24
        order = 14
        if name == 'head':
            circle(draw, pivot, radius, SKIN)
            draw.rounded_rectangle((x-44,y-106,x+42,y+6), radius=37, fill=INK)
            draw.rounded_rectangle((x-39,y-101,x+38,y+1), radius=34, fill=SKIN)
            draw.polygon([(x+34,y-66),(x+57,y-46),(x+34,y-40)], fill=SKIN)
            draw.pieslice((x-42,y-105,x+40,y-25),180,350,fill='#473d3a')
            circle(draw,(x-26,y-44),12,'#d39370')
            draw.rounded_rectangle((x-49,y-111,x+37,y-81),radius=12,fill=TEAL)
            draw.rounded_rectangle((x-7,y-88,x+59,y-79),radius=4,fill=INK)
            draw.ellipse((x+21,y-65,x+28,y-57),fill=INK)
            draw.line((x+21,y-29,x+35,y-29),fill=INK,width=3)
            order = 12
        elif name == 'satchel':
            # Match the frozen grip (16,8) and endpoint (48,8) in the
            # cropped texture. The wrist sits at the grip; the bag hangs below.
            origin = (x-16, y-8)
            ox, oy = origin
            draw.rounded_rectangle((ox,oy+25,ox+112,oy+112),radius=12,fill=INK)
            draw.rounded_rectangle((ox+4,oy+29,ox+108,oy+108),radius=9,fill='#c58b45')
            draw.rounded_rectangle((ox+13,oy,ox+51,oy+40),radius=10,outline=LEATHER,width=7)
            draw.rounded_rectangle((ox+5,oy+29,ox+107,oy+65),radius=7,fill='#a96d38')
            draw.rectangle((ox+48,oy+53,ox+62,oy+75),fill='#edcd73')
            order = 16
        elif 'hand' in name:
            circle(draw,pivot,radius,SKIN)
            draw.rounded_rectangle((x-21,y-5,x+24,y+39),radius=15,fill=SKIN)
            circle(draw,(x+24,y+10),11,'#d39370')
            draw.line((x-12,y+22,x+14,y+22),fill='#bc7c5e',width=2)
            order = 18 if name == 'right_hand' else 4
        elif name.startswith('boot'):
            circle(draw,pivot,radius,LEATHER)
            draw.rounded_rectangle((x-26,y-8,x+52,y+44),radius=17,fill=INK)
            draw.rounded_rectangle((x-21,y-5,x+48,y+36),radius=14,fill=LEATHER)
            draw.line((x-19,y+35,x+47,y+35),fill='#c38d54',width=5)
            order = 6
        else:
            children = [j for j in joints.values() if j['parent'] == bone]
            if len(children) != 1:
                raise ValueError(f'{name}: expected one distal joint')
            end = children[0]['pivot']
            leg = name.startswith(('leg_', 'shin_'))
            radius = 28 if leg else 24
            color = NAVY if leg else (TEAL if name.startswith('right') else FAR_TEAL)
            capsule(draw,pivot,end,radius,INK)
            capsule(draw,pivot,end,radius-4,color)
            # Hidden proximal backing is cloth, rather than an enlarged ink
            # outline. The distal contour retains its thin authored edge.
            circle(draw,pivot,radius,color)
            draw.line((x-10,y+14,end[0]-10,end[1]-14),fill='#4e677b' if leg else '#55aaa5',width=4)
            order = 5 if leg else (14 if name.startswith('right') else 3)
        if slot['overlap_px']:
            # Reuse the v2 material completion and joint-gated dilation. The
            # round proximal backing is sized from this part's cross-section;
            # the extra margin is exactly the slot's manifest overlap.
            yy, xx = np.ogrid[:size[1], :size[0]]
            mask = (xx-x)**2+(yy-y)**2 <= radius**2
            array = fill_attachment(np.array(image), mask)
            authored = array[:, :, 3] > 0
            reach = radius+slot['overlap_px']+1
            array = extend_joint_pixels(array, slot['overlap_px'],
                                        [(x-reach,y-reach,x+reach,y+reach)])
            # A rectangular seam gate bounds the existing v2 dilation helper.
            # Clip only newly added backing to the rounded attachment, so its
            # gate boundary cannot leave square tabs on the outer silhouette.
            rounded = (xx-x)**2+(yy-y)**2 <= (radius+slot['overlap_px'])**2
            array[:, :, 3][~(authored | rounded)] = 0
            image = Image.fromarray(array)
        save(name,image,bone,order,slot['overlap_px'],slot)
    data = dict(canvas=list(size), character='char2', rig_template=2,
                manifest=config['manifest'], bones=manifest['joints'],
                overlap_px=slots['head']['overlap_px'], pixel_scale=1,
                parts=sorted(parts,key=lambda p:p['z_order']))
    (project / config['subject']).write_text(json.dumps(data,indent=2)+'\n')
    print(f'Prepared original courier: {len(parts)} parts, {len(joints)} manifest joints')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=PROJECT)
    parser.add_argument('--audit-only', action='store_true')
    options = parser.parse_args()
    prepare(options.project, options.audit_only)
