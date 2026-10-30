#!/usr/bin/env python3
"""Split retained source cutouts into the manifest's HD elbow/wrist/knee kit.

The immutable input crops are retained so re-running preparation is idempotent.
No generation, paint, palette conversion or new pixel-art asset is involved.
"""
from __future__ import annotations

import argparse
import copy
import json
import math
from pathlib import Path

import numpy as np
import cv2
from PIL import Image

from prep_parts import extend_joint_pixels, fill_attachment, save_image

PROJECT = Path(__file__).resolve().parents[1]


def prepare(project: Path):
    manifest = json.loads((project / 'body_parts.yml').read_text())
    data = json.loads((project / 'parts.json').read_text())
    joints = {j['name']: j for j in manifest['joints']}
    slots = {s['part']: s for s in manifest['slots']}
    parts = {p['id']: p for p in data['parts']}
    inputs = project / 'parts/kit-inputs'
    ledger = json.loads((inputs / 'inputs.json').read_text())
    width, height = manifest['source_canvas_px']
    # The manifest need not be topologically sorted (boots precede knees).
    ordered = []
    pending = list(manifest['joints'])
    while pending:
        ready = [j for j in pending if j['parent'] is None or j['parent'] in {b['name'] for b in ordered}]
        if not ready:
            raise ValueError('cyclic or missing manifest parent')
        for joint in ready:
            ordered.append({k: joint[k] for k in ('name', 'parent', 'pivot', 'rotation_limits_deg')})
            pending.remove(joint)
    data['bones'] = ordered
    data['rig_template'] = 2
    data['manifest'] = 'body_parts.yml'
    data['pixel_backings'] = []
    # Keep the immutable pre-v2 crops as the preparation input, including their
    # reviewed source silhouettes and source-space origin, not reprocessed art.
    for carrier, sections in (
        ('left_arm', [('left_arm', 'left_arm'), ('left_fore', 'left_fore'), ('left_hand', 'left_hand')]),
        ('leg_left', [('leg_left', 'leg_left'), ('shin_left', 'knee_left')]),
        ('leg_right', [('leg_right', 'leg_right'), ('shin_right', 'knee_right')]),
    ):
        source_spec = ledger[carrier]
        image = Image.open(inputs / (carrier + '.png')).convert('RGBA')
        origin = source_spec['origin']
        canvas = Image.new('RGBA', (width, height))
        canvas.paste(image, origin)
        raw = np.array(canvas)
        yy = np.arange(height)[:, None]
        xx = np.arange(width)[None, :]
        # Round the internal cut ends using the actual garment cross-section.
        # This is structural backing, followed by exactly the manifest dilation.
        caps = []
        for _, child in sections[1:]:
            cx, cy = joints[child]['pivot']
            row = np.flatnonzero(raw[cy, :, 3] >= 128)
            if len(row) and row[0] <= cx <= row[-1]:
                radius = math.ceil((row[-1]-row[0]+1)/2)
                caps.append((cy, (xx-cx)**2 + (yy-cy)**2 <= radius**2))
                # The compatibility scene reuses its existing palette and
                # texture files. A runtime round cap supplies its hidden joint
                # backing without producing or reprocessing any pixel bitmap.
                palette_image = np.array(Image.open(project/source_spec['texture_pixel']).convert('RGBA'))
                px, py = round(cx*data['pixel_scale']), round(cy*data['pixel_scale'])
                sx, sy = source_spec['pixel_bbox'][:2]
                colors_y, colors_x = np.nonzero(palette_image[:, :, 3] >= 128)
                nearest = np.argmin((colors_x-(px-sx))**2 + (colors_y-(py-sy))**2)
                color = palette_image[colors_y[nearest], colors_x[nearest], :3].tolist()
                child_part = next(name for name, owner in sections if owner == child)
                data['pixel_backings'].append(dict(bone=child, radius=(radius+slots[child_part]['overlap_px'])*data['pixel_scale'],
                                                   color=color, z_order=parts[carrier]['z_order']-1))
        for index, (name, bone) in enumerate(sections):
            spec = joints[bone]
            slot = slots[name]
            overlap = slot['overlap_px']
            # Share only the prescribed overlap at a transverse split; joint
            # pivots and all parent links are read directly from the contract.
            low = 0 if index == 0 else spec['pivot'][1] - overlap
            high = height if index + 1 == len(sections) else joints[sections[index+1][1]]['pivot'][1] + overlap
            array = raw.copy()
            array[:, :, 3] = np.where((yy >= low) & (yy < high), array[:, :, 3], 0)
            for seam_y, cap in caps:
                if low <= seam_y <= high:
                    array = fill_attachment(array, cap)
            gates = []
            for y in (low + overlap, high - overlap):
                if 0 < y < height:
                    gates.append((0, y-overlap, width, y+overlap))
            array = extend_joint_pixels(array, overlap, gates)
            layer = Image.fromarray(array)
            bbox = layer.getbbox()
            if bbox is None:
                raise ValueError(f'{name}: empty source cut, requires generation')
            derived = source_spec['derived_from'] + '; manifest transverse split, source-colour round-cap backing and joint-gated dilation'
            save_image(layer.crop(bbox), project / 'parts/hd' / (name + '.png'), derived)
            part = copy.deepcopy(parts.get(name, parts[carrier]))
            pivot = spec['pivot']
            part.update(id=name, bone=bone, parent_bone=bone, pivot=pivot,
                        bbox=list(bbox), offset=[bbox[0]-pivot[0], bbox[1]-pivot[1]],
                        rotation_limits_deg=spec['rotation_limits_deg'], joint_overlap_px=overlap,
                        derived_from=derived, texture_hd='parts/hd/' + name + '.png',
                        amodal_attachment_completion=bool(caps))
            # Compatibility scene uses regions of the EXISTING pixel texture.
            # No pixel image is generated, quantized, recoloured or written.
            scale = data['pixel_scale']
            px0, py0, px1, py1 = source_spec['pixel_bbox']
            a = py0 if index == 0 else max(py0, round(low*scale))
            b = py1 if index+1 == len(sections) else min(py1, round(high*scale))
            pp = [round(v*scale) for v in pivot]
            part.update(texture_pixel=source_spec['texture_pixel'], pixel_pivot=pp,
                        pixel_offset=[px0-pp[0], a-pp[1]],
                        pixel_region=[0, a-py0, px1-px0, b-a], pixel_bbox=[px0,a,px1,b])
            parts[name] = part
    # Back exposed rotational attachments with the same material. Cap radii
    # come from each source cross-section; only the additional dilation margin
    # comes from the manifest. Keep backing attached to its actual parent bone.
    common_overlap = slots['head']['overlap_px']
    for backing, attached in (('coat_lining', ['hem_left', 'hem_center', 'hem_right']),
                              ('right_hand', ['right_hand'])):
        source_spec = ledger[backing]
        canvas = Image.new('RGBA', (width, height))
        canvas.paste(Image.open(inputs/(backing+'.png')).convert('RGBA'), source_spec['origin'])
        array = np.array(canvas)
        source_alpha = array[:, :, 3].copy()
        mask = np.zeros((height, width), bool)
        gates = []
        for name in attached:
            part = parts[name]
            cx, cy = joints[part['bone']]['pivot']
            section = Image.new('RGBA', (width, height))
            section.paste(Image.open(project/part['texture_hd']).convert('RGBA'), part['bbox'][:2])
            alpha = source_alpha if name == backing else np.array(section.getchannel('A'))
            row = np.flatnonzero(alpha[cy] >= 128)
            if not len(row):
                continue
            radius = math.ceil((row[-1]-row[0]+1)/2)
            mask |= (xx-cx)**2 + (yy-cy)**2 <= radius**2
            extent = radius+common_overlap
            gates.append((cx-extent, cy-extent, cx+extent+1, cy+extent+1))
        array = fill_attachment(array, mask)
        array = extend_joint_pixels(array, common_overlap, gates)
        if backing == 'coat_lining':
            # Hidden lining must follow the real garment silhouette. A full
            # circular cap may otherwise protrude through an open coat side.
            support = source_alpha > 0
            for garment in parts.values():
                if garment['id'] == backing or garment['bone'] not in ('coat', 'hem_left', 'hem_center', 'hem_right'):
                    continue
                layer = Image.new('RGBA', (width, height))
                layer.paste(Image.open(project/garment['texture_hd']).convert('RGBA'), garment['bbox'][:2])
                support |= np.array(layer.getchannel('A')) > 0
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*common_overlap+1, 2*common_overlap+1))
            allowed = cv2.dilate(support.astype(np.uint8), kernel) > 0
            array[:, :, 3][~allowed] = 0
        layer = Image.fromarray(array)
        bbox = layer.getbbox()
        part = parts[backing]
        part['bbox'] = list(bbox)
        part['offset'] = [bbox[i]-part['pivot'][i] for i in range(2)]
        part['derived_from'] = source_spec['derived_from'] + '; automatic source-colour circular attachment backing and manifest dilation'
        save_image(layer.crop(bbox), project/part['texture_hd'], part['derived_from'])
    for name, slot in slots.items():
        part = parts[name]
        joint = joints[slot['bone']]
        part.update(bone=slot['bone'], parent_bone=slot['part_parent_bone'], pivot=slot['pivot'],
                    rotation_limits_deg=joint['rotation_limits_deg'], joint_overlap_px=slot['overlap_px'])
    # Keep the reviewed face art looking toward the weapon throughout its
    # animation envelope. Rotate the complete hand/prop grip as a rigid unit;
    # no gun-targeting animation track, resampling or mirrored gun is required.
    chain = []
    bone = slots['gun']['bone']
    while bone is not None:
        chain.append(joints[bone])
        bone = joints[bone]['parent']
    low = sum(j['rotation_limits_deg'][0] for j in chain)
    high = sum(j['rotation_limits_deg'][1] for j in chain)
    direction = np.subtract(manifest['facing']['muzzle_texture_px'], manifest['facing']['grip_texture_px'])
    intrinsic = math.degrees(math.atan2(direction[1], direction[0]))
    angle = 180 - (low+high)/2 - intrinsic
    radians = math.radians(angle)
    rotation = np.array([[math.cos(radians), -math.sin(radians)],
                         [math.sin(radians), math.cos(radians)]])
    for name in ('right_hand', 'gun'):
        part = parts[name]
        offset = np.subtract(part['bbox'][:2], part['pivot'])
        part['offset'] = (rotation @ offset).tolist()
        part['pixel_offset'] = (rotation @ np.subtract(part['pixel_bbox'][:2], part['pixel_pivot'])).tolist()
        part['sprite_rotation_deg'] = angle
    for name in ('head', 'hair'):
        part = parts[name]
        part['sprite_scale'] = [-1, 1]
        part['offset'] = [part['pivot'][0]-part['bbox'][0], part['bbox'][1]-part['pivot'][1]]
        part['pixel_offset'] = [part['pixel_pivot'][0]-part['pixel_bbox'][0], part['pixel_bbox'][1]-part['pixel_pivot'][1]]
    data['facing_setup'] = dict(direction='left', grip_rotation_deg=angle,
                                note='Static hand and prop rotation; reflected head/hair sprites; manifest joints unchanged')
    data['parts'] = sorted(parts.values(), key=lambda p: p['z_order'])
    (project / 'parts.json').write_text(json.dumps(data, indent=2) + '\n')
    print(f'Prepared manifest v2: {len(ordered)} bones, {len(slots)} slots; retained pixel textures')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, default=PROJECT)
    prepare(parser.parse_args().project)
