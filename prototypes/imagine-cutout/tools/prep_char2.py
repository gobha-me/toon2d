#!/usr/bin/env python3
"""Fit supplied Imagine cutouts to the frozen courier kit without model calls.

Deterministic polygon splits, affine fitting, compositing and source-interior material
joint completion. Run through heavy-run with two workers; requires Pillow,
NumPy and OpenCV. The source directory is read only.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw
from prep_parts import extend_joint_pixels

cv2.setNumThreads(2)
PROJECT = Path(__file__).resolve().parents[1]
SOURCE = "prototypes/imagine-cutout/tools/prep_char2.py"
BASE = "call1-base-best.jpg"
JACKET = "seg-be6a-teal-cropped-jacket.png"
SHORTS = "seg-be6a-black-shorts.png"
LEGGINGS = "seg-be6a-gray-leggings.png"
SCRIPTED = "SCRIPTED (flagged)"
LICENSE = "CC0 1.0"
CREDIT = "Generated with Grok Imagine (SpaceXAI); scripted derivation where stated"
RIGHTS = "Original fictional art only; no real-person likeness."
FALLBACK = ("The supplied Imagine base has no held prop and neither Segments "
            "run supplied a satchel. All three allowed calls were already used; "
            "this rigid satchel is a wholly scripted fallback.")


CAP_RADII = {
    "head": (8,24), "right_upper": (18,20), "left_arm": (18,20),
    "right_fore": (22,22), "left_fore": (22,22),
    "right_hand": (12,14), "left_hand": (12,14),
    "leg_left": (20,20), "leg_right": (20,20),
    "shin_left": (14,18), "shin_right": (14,18),
    "boot_left": (16,18), "boot_right": (16,18),
}
MATCHED_JOINTS = ("right_upper", "left_arm", "right_fore", "left_fore",
                  "right_hand", "left_hand", "boot_left", "boot_right")


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def provenance(path, date, *, source=SOURCE,
               tool="Python/Pillow/OpenCV scripted derivation from Grok Imagine (SpaceXAI)",
               description="Imagine courier cutout derivation", **metadata):
    """Also used for review captures; the date describes derivation only."""
    data = dict(tool=tool, model="no generative model used; source model not disclosed",
                date=date, date_source="scripted artifact creation time UTC", source=source,
                license=LICENSE, credit=CREDIT, rights=RIGHTS,
                description=description, output_sha256=digest(path))
    data.update(metadata)
    path.with_suffix(".gen.json").write_text(json.dumps(data, indent=2)+"\n")


def white_background(image):
    """Remove border-connected near-white; preserve enclosed eyes/shoe whites."""
    array = np.array(image.convert("RGBA"))
    rgb = array[:, :, :3].astype(np.int16)
    candidate = ((rgb.min(axis=2) >= 235) & (np.ptp(rgb, axis=2) <= 20)).astype(np.uint8)
    _, labels = cv2.connectedComponents(candidate, connectivity=8)
    border = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
    array[np.isin(labels, border[border != 0])] = 0
    return Image.fromarray(array)


def split(image, polygon):
    mask = Image.new("L", image.size)
    ImageDraw.Draw(mask).polygon([tuple(p) for p in polygon], fill=255)
    array = np.array(image)
    array[:, :, 3] = np.minimum(array[:, :, 3], np.array(mask))
    array[array[:, :, 3] == 0, :3] = 0
    return Image.fromarray(array)


def fit(image, start, end, target_start, target_end, width_scale, canvas):
    """Fit limb centreline and perpendicular independently, in premultiplied RGBA."""
    start, end, dest, finish = [np.array(p, np.float32) for p in (start,end,target_start,target_end)]
    axis, target_axis = end-start, finish-dest
    normal = np.array([-axis[1], axis[0]])/np.linalg.norm(axis)
    target_normal = np.array([-target_axis[1], target_axis[0]])/np.linalg.norm(target_axis)
    matrix = cv2.getAffineTransform(np.array([start,end,start+normal*100], np.float32),
                                   np.array([dest,finish,dest+target_normal*100*width_scale], np.float32))
    pixels = np.array(image).astype(np.float32)/255
    pixels[:, :, :3] *= pixels[:, :, 3:4]
    result = cv2.warpAffine(pixels, matrix, canvas, flags=cv2.INTER_CUBIC,
                           borderMode=cv2.BORDER_CONSTANT, borderValue=(0,0,0,0))
    result = np.clip(result, 0, 1)
    np.divide(result[:, :, :3], result[:, :, 3:4], out=result[:, :, :3], where=result[:, :, 3:4] > 0)
    return Image.fromarray(np.rint(np.clip(result,0,1)*255).astype(np.uint8)), matrix.tolist()


def prepare(project, audit_only=False):
    config = json.loads((project/"characters.yml").read_text())["characters"]["char2"]
    manifest_path = project / config["manifest"]
    manifest = json.loads(manifest_path.read_text())
    contract = json.loads((project / config["imagine_contract"]).read_text())
    destination, sources = project/"characters/char2", project/contract["source_directory"]
    for name, record in contract["sources"].items():
        if digest(sources/name) != record["sha256"]:
            raise ValueError(f"{name}: source hash differs from the frozen contract")
    report = dict(schema_version=2, manifest_sha256=digest(manifest_path),
                  source_kind="supplied Grok Imagine base and Segments; scripted fitting",
                  source_post_id=contract["calls"]["1"]["post_id"], generation_calls_used=3,
                  generation_calls_remaining=0, generation_requested=False, slots=[])
    for slot in manifest["slots"]:
        rule = contract["slots"][slot["slot"]]
        item = dict(slot=slot["slot"], part=slot["part"], bone=slot["bone"], pivot=slot["pivot"],
                    parent=slot["parent_bone"], overlap_px=slot["overlap_px"],
                    classification=rule["classification"], scripted_fallback=rule["classification"] == SCRIPTED,
                    imagine_sources=rule["required_sources"], method=rule["reason"])
        if item["scripted_fallback"]:
            item["fallback_reason"] = FALLBACK
        report["slots"].append(item)
        print(f"{slot['slot']}: {rule['classification']}")
    report["slot_tally"] = dict.fromkeys(contract["classifications"], 0)
    report["slot_tally"].update(Counter(s["classification"] for s in report["slots"]))
    (destination/"gap-report.json").write_text(json.dumps(report,indent=2)+"\n")
    if audit_only:
        return
    joints = {j["name"]:j for j in manifest["joints"]}
    slots = {s["part"]:s for s in manifest["slots"]}
    joint_slots = {s["bone"]:s for s in manifest["slots"] if s["overlap_px"]}
    size = tuple(manifest["source_canvas_px"])
    images = {name:Image.open(sources/name).convert("RGBA") for name in contract["sources"]}
    images[BASE] = white_background(images[BASE])
    textures = destination/"parts"
    textures.mkdir(exist_ok=True)
    date = datetime.now(timezone.utc).isoformat().replace("+00:00","Z")
    parts, ledger = [], {}

    def layer(name, polygon, start, end, target_start, target_end, width):
        image, matrix = fit(split(images[name],polygon),start,end,target_start,target_end,width,size)
        return image, dict(file=name, polygon=polygon, source_axis=[start,end],
                           target_axis=[target_start,target_end], width_scale=width,
                           affine_source_to_rig=matrix)

    def save(name, layers, bone, order, *, classification=None):
        slot = slots.get(name)
        classification = classification or contract["slots"][slot["slot"]]["classification"]
        scripted, pivot = classification == SCRIPTED, joints[bone]["pivot"]
        image, recipes = Image.new("RGBA",size), []
        for pixels, recipe in layers:
            image.alpha_composite(pixels)
            recipes.append(recipe)
        overlap = slot["overlap_px"] if slot else 0
        supports = []
        if overlap:
            supports.append((bone,pivot,CAP_RADII[name],overlap,"proximal"))
        for child in MATCHED_JOINTS:
            if joints[child]["parent"] == bone:
                child_slot = joint_slots[child]
                parent_radii = (16,16) if child in ("right_fore","left_fore") else CAP_RADII[child_slot["part"]]
                supports.append((child,joints[child]["pivot"],parent_radii,
                                 child_slot["overlap_px"],"distal seam support"))
        array = np.array(image)
        authored_source = array.copy()
        opaque = (authored_source[:,:,3] >= 250).astype(np.uint8)
        depth = cv2.distanceTransform(np.pad(opaque,1),cv2.DIST_L2,5)[1:-1,1:-1]
        core = depth >= 3
        yy,xx = np.ogrid[:size[1],:size[0]]
        backing_records = []
        for joint,anchor,radii,support_overlap,role in supports:
            x,y = anchor
            rx,ry = radii
            before = array[:,:,3] >= 128
            search_radius = max(rx,ry)+support_overlap+20
            nearby = core & ((xx-x)**2+(yy-y)**2 <= search_radius**2)
            candidates = nearby if nearby.any() else core
            selection = "authored opaque interior pixel closest to local median RGB"
            if joint in ("right_fore","left_fore"):
                # Both supplied sleeve images and the base retain real grey
                # cuff pixels above the elbow; keep underlap in that material.
                rgb = authored_source[:,:,:3].astype(np.int16)
                cuff = nearby & (yy < y) & (np.ptp(rgb,axis=2) < 40) & (rgb.mean(axis=2) < 180)
                if cuff.any():
                    candidates = cuff
                    selection = "local authored opaque cuff interior above elbow; median-nearest RGB"
            if not candidates.any():
                candidates = opaque > 0
            if not candidates.any():
                raise ValueError(f"{name}: no opaque source material for backing")
            colors = authored_source[:,:,:3][candidates].astype(np.float32)
            median = np.median(colors,axis=0)
            choice = int(np.square(colors-median).sum(axis=1).argmin())
            sy,sx = np.argwhere(candidates)[choice]
            color = authored_source[sy,sx,:3].copy()
            material = dict(rgb=color.tolist(),sample_rig_px=[int(sx),int(sy)],
                            selection=selection,
                            minimum_core_depth_px=3,search_radius_px=search_radius)
            if joint in MATCHED_JOINTS:
                # Complete the opaque local envelope beneath the source.
                # Pixel centres put both supports on the frozen bone pivot.
                support_mask = ((xx+.5-x)/(rx+support_overlap))**2+((yy+.5-y)/(ry+support_overlap))**2 <= 1
                alpha = array[:,:,3:4].astype(np.float32)/255
                composite = np.rint(array[:,:,:3].astype(np.float32)*alpha+color*(1-alpha)).astype(np.uint8)
                array[:,:,:3][support_mask] = composite[support_mask]
                array[:,:,3][support_mask] = 255
                rasterization = "opaque pixel-centred source-material underlay"
            else:
                cap = (((xx-x)/rx)**2+((yy-y)/ry)**2 <= 1) & (array[:,:,3] < 128)
                array[:,:,:3][cap] = color
                array[:,:,3][cap] = 255
                retained = array[:,:,3] > 0
                reach = max(rx,ry)+support_overlap+1
                array = extend_joint_pixels(array,support_overlap,[(x-reach,y-reach,x+reach,y+reach)])
                rounded = ((xx-x)/(rx+support_overlap))**2+((yy-y)/(ry+support_overlap))**2 <= 1
                array[:,:,3][~(retained | rounded)] = 0
                rasterization = "clipped source-edge dilation"
            new_backing = (array[:,:,3] >= 128) & ~before
            if joint not in MATCHED_JOINTS:
                array[:,:,:3][new_backing] = color
            backing_records.append(dict(joint=joint,role=role,pivot=anchor,source_part=name,
                rasterization=rasterization,
                cap_radii_px=list(radii),overlap_px=support_overlap,
                material=material,added_opaque_pixels=int(new_backing.sum())))
        image = Image.fromarray(array)
        added = sum(record["added_opaque_pixels"] for record in backing_records)
        primary = next((record for record in backing_records if record["role"] == "proximal"),None)
        material = primary["material"] if primary else None
        primary_radii = primary["cap_radii_px"] if primary else None
        bbox = image.getbbox()
        if bbox is None:
            raise ValueError(f"{name}: empty derived part")
        path = textures/(name+".png")
        image.crop(bbox).save(path)
        names = sorted({r["file"] for r in recipes if "file" in r})
        refs = [dict(file=n,sha256=contract["sources"][n]["sha256"]) for n in names]
        derivation = ("Wholly scripted satchel, flap, buckle and handle; no Imagine pixels." if scripted else
                      "Polygon split and affine fit of "+", ".join(names)+"; composited in listed order; "+
                      ("source-interior material joint supports "+", ".join(
                          record["joint"]+" "+record["role"]+" "+str(record["cap_radii_px"])+
                          "px with "+str(record["overlap_px"])+"px local dilation" for record in backing_records)+"."
                       if backing_records else "no joint dilation."))
        metadata = dict(tool_sha256=digest(Path(__file__)), manifest_sha256=digest(manifest_path),
                        classification=classification,scripted_fallback=scripted,
                        derived_from=derivation,imagine_sources=refs,operations=recipes,
                        joint_completion_added_pixels=added,backing_material=material,
                        joint_cap_radii_px=primary_radii,joint_backings=backing_records)
        if not scripted:
            metadata["source_post_url"] = contract["calls"]["1"]["post_url"]
        if scripted:
            metadata["fallback_reason"] = FALLBACK
        provenance(path,date,description="Derived fictional courier part: "+name,**metadata)
        part = dict(id=name,bone=bone,parent_bone=slot["part_parent_bone"] if slot else bone,
                    pivot=pivot,offset=[bbox[0]-pivot[0],bbox[1]-pivot[1]],bbox=list(bbox),
                    texture_hd=path.relative_to(project).as_posix(),z_order=order,joint_overlap_px=overlap,
                    rotation_limits_deg=joints[bone]["rotation_limits_deg"],source=SOURCE,
                    classification=classification,scripted_fallback=scripted,derived_from=derivation)
        if scripted:
            part["fallback_reason"] = FALLBACK
        parts.append(part)
        ledger[name] = dict(classification=classification,imagine_sources=refs,
                            output_sha256=digest(path),operations=recipes,joint_completion_added_pixels=added,
                            backing_material=material,joint_cap_radii_px=primary_radii,joint_backings=backing_records)

    torso = layer(BASE,[[625,218],[665,235],[741,235],[783,218],[813,275],
                        [795,465],[780,510],[625,510],[605,465],[593,275]],
                  [700,300],[700,500],[256,240],[256,412],.74)
    jacket = layer(JACKET,[[113,0],[304,0],[315,70],[302,170],[310,260],[100,260],[112,170],[100,70]],
                   [209,75],[209,240],[256,240],[256,371],.67)
    save("torso",[torso,jacket],"torso",8,classification="Segments-merged")
    hip = layer(SHORTS,[[0,0],[254,0],[254,135],[0,135]],[127,42],[127,140],[256,400],[256,459],.68)
    save("hip_backing",[hip],"hip",0,classification="Segments-split")
    head = layer(BASE,[[570,15],[825,15],[825,223],[734,229],[734,277],[676,277],[676,229],[570,223]],
                 [700,260],[700,60],[256,160],[256,60],.50)
    save("head",[head],"head",12)

    # Left hand is image-right. Leg labels retain the frozen image-side convention.
    for name,start,end,polygon in (
        ("right_upper",[112,70],[46,239],[[78,48],[127,66],[126,146],[102,205],[97,256],[56,280],[0,257],[21,205],[35,145],[54,96]]),
        ("left_arm",[302,70],[377,239],[[289,64],[337,48],[365,96],[385,145],[400,205],[418,257],[363,280],[322,256],[316,205],[290,146]]),
    ):
        bone = slots[name]["bone"]
        end_pivot = next(j["pivot"] for j in joints.values() if j["parent"] == bone)
        save(name,[layer(JACKET,polygon,start,end,joints[bone]["pivot"],end_pivot,.70)],bone,
             14 if name == "right_upper" else 9)
    for name,start,end,polygon in (
        ("right_fore",[520,482],[458,574],[[503,455],[546,481],[477,585],[435,569]]),
        ("left_fore",[884,482],[946,574],[[862,481],[905,455],[973,569],[931,585]]),
    ):
        bone = slots[name]["bone"]
        end_pivot = next(j["pivot"] for j in joints.values() if j["parent"] == bone)
        save(name,[layer(BASE,polygon,start,end,joints[bone]["pivot"],end_pivot,.78)],bone,
             14 if name == "right_fore" else 9)
    for name,start,end,polygon,glove,glove_axis in (
        ("right_hand",[451,585],[424,665],[[436,563],[479,581],[464,641],[448,679],[409,704],[389,696],[407,640]],
         "seg-be6a-black-fingerless-gloves-1.png",[[51,17],[26,79]]),
        ("left_hand",[953,585],[980,665],[[925,581],[968,563],[997,640],[1015,696],[995,704],[956,679],[940,641]],
         "seg-be6a-black-fingerless-gloves-2.png",[[27,17],[53,79]]),
    ):
        bone = slots[name]["bone"]
        x,y = joints[bone]["pivot"]
        target_end = [x+(-13 if name == "right_hand" else 13),y+39]
        pixels = layer(BASE,polygon,start,end,[x,y],target_end,.68)
        overlay = layer(glove,[[0,0],[79,0],[79,102],[0,102]],*glove_axis,[x,y+1],[target_end[0],y+27],.58)
        save(name,[pixels,overlay],bone,18 if name == "right_hand" else 10)

    for side,image_left in (("left",True),("right",False)):
        x = joints["leg_"+side]["pivot"][0]
        if image_left:
            axis = [[78,18],[64,175],[47,398]]
            half = [[0,0],[155,0],[155,417],[0,417]]
            shorts_half = [[0,0],[130,0],[130,246],[0,246]]
            shorts_start,shorts_end = [68,42],[65,220]
        else:
            axis = [[233,18],[249,175],[268,398]]
            half = [[155,0],[311,0],[311,417],[155,417]]
            shorts_half = [[124,0],[254,0],[254,246],[124,246]]
            shorts_start,shorts_end = [186,42],[190,220]
        upper_polygon = [[a,b] for a,b in half]
        upper_polygon[2][1] = upper_polygon[3][1] = 203
        legging = layer(LEGGINGS,upper_polygon,axis[0],axis[1],[x,420],[x,550],.60)
        shorts = layer(SHORTS,shorts_half,shorts_start,shorts_end,[x,420],[x,493],.60)
        save("leg_"+side,[legging,shorts],"leg_"+side,5)
        lower_polygon = [[a,b] for a,b in half]
        lower_polygon[0][1] = lower_polygon[1][1] = 148
        shin = layer(LEGGINGS,lower_polygon,axis[1],axis[2],[x,550],[x,680],.60)
        save("shin_"+side,[shin],"knee_"+side,5)
        if image_left:
            polygon,start,end = [[497,1127],[608,1127],[608,1344],[497,1344]],[569,1182],[550,1305]
        else:
            polygon,start,end = [[799,1127],[910,1127],[910,1344],[799,1344]],[836,1182],[856,1305]
        save("boot_"+side,[layer(BASE,polygon,start,end,[x,680],[x,732],.70)],"boot_"+side,6)

    satchel = Image.new("RGBA",size)
    draw = ImageDraw.Draw(satchel)
    x,y = joints["right_hand"]["pivot"]
    ox,oy = x-16,y-8
    draw.rounded_rectangle((ox,oy+25,ox+112,oy+112),radius=12,fill="#243447")
    draw.rounded_rectangle((ox+4,oy+29,ox+108,oy+108),radius=9,fill="#c58b45")
    draw.rounded_rectangle((ox+13,oy,ox+51,oy+40),radius=10,outline="#815435",width=7)
    draw.rounded_rectangle((ox+5,oy+29,ox+107,oy+65),radius=7,fill="#a96d38")
    draw.rectangle((ox+48,oy+53,ox+62,oy+75),fill="#edcd73")
    save("satchel",[(satchel,dict(operation="scripted rounded rectangles; texture grip (16,8)"))],"right_hand",16)
    data = dict(canvas=list(size),character="char2",rig_template=2,manifest=config["manifest"],
                bones=manifest["joints"],overlap_px=slots["head"]["overlap_px"],pixel_scale=1,
                parts=sorted(parts,key=lambda p:p["z_order"]))
    (project / config["subject"]).write_text(json.dumps(data,indent=2)+"\n")
    (destination/"derivation.json").write_text(json.dumps(dict(schema_version=1,tool=SOURCE,
        source_post_id=contract["calls"]["1"]["post_id"],manifest_sha256=digest(manifest_path),
        tool_sha256=digest(Path(__file__)),
        dependencies=dict(OpenCV=cv2.__version__,NumPy=np.__version__,Pillow=Image.__version__),
        source_sha256={n:r["sha256"] for n,r in contract["sources"].items()},parts=ledger),indent=2)+"\n")
    print(f"Prepared Imagine courier: {len(parts)} parts, {len(joints)} frozen joints")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project",type=Path,default=PROJECT)
    parser.add_argument("--audit-only",action="store_true")
    options = parser.parse_args()
    prepare(options.project,options.audit_only)
