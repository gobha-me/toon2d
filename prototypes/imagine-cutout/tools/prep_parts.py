#!/usr/bin/env python3
"""Deterministic cutout preparation. No learned models, drawing or AI calls.
Run from repository root with tools/run heavy-run .venv/bin/python tools/prep_parts.py.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import cv2
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src/parts/raw-hd"
DEST = ROOT / "prototypes/imagine-cutout"
OVERLAP_PX = 12  # HD source pixels; --overlap-px 0 is explicitly supported.
DEFRINGE_PX = 2  # HD source pixels; RGB-only, including opaque outline pixels.
PIXEL_EDGE_LIGHTNESS_DELTA = 32  # RGB luma steps above the interior reference.
POST = "https://grok.com/imagine/post/dc2b1c33-d3d0-4c3e-b927-c04cc4e91c38"
PIXEL_POST = "https://grok.com/imagine/post/e8878ac2-6b8a-4873-bae2-12b21910230e"
W, H = 1152, 1728
cv2.setNumThreads(2)


def sidecar(path: Path, derived: str, pixel_evidence=False, keep_extension=False):
    data = dict(source_post_url=PIXEL_POST if pixel_evidence else POST,
                tool="Grok Imagine", feature="Segments", model="not shown in UI",
                date="2026-10-30", derived_from=derived,
                rights="Original fictional art only; no real-person likeness.")
    target = path.with_name(path.name + ".sidecar.json") if keep_extension else path.with_suffix(".sidecar.json")
    target.write_text(json.dumps(data, indent=2) + "\n")


def save_image(im: Image.Image, path: Path, derived: str, pixel_evidence=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path)
    sidecar(path, derived, pixel_evidence)


def matte_background(image: Image.Image) -> tuple[Image.Image, dict]:
    """Matte before quantization. Also accepts a flat RGB/JPG image.

    Flood border-connected low-chroma pixels matching one/two dominant border
    greys. Two grey modes detect a baked light checkerboard; both squares enter
    the same flood, so a JPEG checkerboard is not treated as painted subject.
    Existing nonopaque RGBA is authoritative. Recolour soft alpha fringes from
    nearby opaque foreground to avoid white export halos.
    """
    arr = np.array(image.convert("RGBA"))
    rgb, alpha = arr[:, :, :3], arr[:, :, 3]
    report = {"input_mode": image.mode, "background": "existing-alpha"}
    if np.all(alpha == 255):
        border = np.concatenate((rgb[:6].reshape(-1, 3), rgb[-6:].reshape(-1, 3),
                                 rgb[:, :6].reshape(-1, 3), rgb[:, -6:].reshape(-1, 3)))
        grey = border[(np.ptp(border.astype(int), axis=1) < 20) & (border.min(axis=1) >= 140)]
        if len(grey):
            hist = np.bincount((grey.mean(axis=1) / 8).astype(int), minlength=32)
            modes = []
            for b in np.argsort(hist)[::-1]:
                value = int(b * 8 + 4)
                if hist[b] < max(8, len(grey) * .025): break
                if all(abs(value - m) >= 24 for m in modes): modes.append(value)
                if len(modes) == 2: break
            lum = rgb.mean(axis=2)
            candidate = (np.ptp(rgb.astype(int), axis=2) < 24)
            candidate &= np.min(np.stack([abs(lum-m) for m in modes]), axis=0) <= 22
            count, labels, stats, _ = cv2.connectedComponentsWithStats(candidate.astype(np.uint8), connectivity=8)
            touching = np.unique(np.concatenate((labels[0], labels[-1], labels[:, 0], labels[:, -1])))
            touching = touching[touching != 0]
            alpha[np.isin(labels, touching)] = 0
            # Enclosed background pockets (arm/coat, trigger opening) do not
            # reach the border. Also remove sufficiently large, locally flat
            # islands that match the detected background grey palette closely.
            # This remains a light-background heuristic, not semantic matting.
            nearest_mode = np.min(np.stack([abs(lum-m) for m in modes]), axis=0)
            local_range = cv2.dilate(lum.astype(np.float32),np.ones((3,3),np.uint8)) - cv2.erode(lum.astype(np.float32),np.ones((3,3),np.uint8))
            islands = 0
            touching_set = set(map(int,touching))
            for label in range(1,count):
                if label in touching_set or stats[label,cv2.CC_STAT_AREA] < 24: continue
                x,y,w,h,area = stats[label]
                region = labels[y:y+h,x:x+w] == label
                close = nearest_mode[y:y+h,x:x+w][region] <= 8
                flat = local_range[y:y+h,x:x+w][region] <= 10
                if close.mean() > .75 and flat.mean() > .5:
                    alpha[y:y+h,x:x+w][region] = 0
                    islands += 1
            report.update(background="baked-checkerboard" if len(modes) == 2 else "flat-grey",
                          border_grey_modes=modes, enclosed_background_islands=islands,
                          removed_pixels=int((alpha == 0).sum()))
        else:
            report["background"] = "unrecognized-opaque-background"
    arr[:, :, 3] = alpha
    # Nearest opaque RGB under anti-aliased alpha (matting, not a resample).
    opaque = (alpha > 220).astype(np.uint8)
    if opaque.any():
        _, nearest = cv2.distanceTransformWithLabels(1-opaque, cv2.DIST_L2, 5,
                                                   labelType=cv2.DIST_LABEL_PIXEL)
        colors = rgb[opaque.astype(bool)]
        fringe = (alpha > 0) & (alpha <= 220)
        arr[:, :, :3][fringe] = colors[np.maximum(nearest[fringe]-1, 0)]
    arr[alpha == 0, :3] = 0
    return Image.fromarray(arr), report


def decontaminate_edges(arr: np.ndarray, radius: int, pixel=False) -> np.ndarray:
    """Replace white-matted edge RGB with interior colour; never change alpha.

    The closest opaque pixel can itself be a white outline. Pull from a core
    deeper than the target strip instead. Thin hair/finger tips borrow from the
    nearest surviving core, retaining their silhouette. Bright outliers within
    a 3*radius band are also recoloured. Pixel mode uses a deeper reference before
    palette generation; alpha is unchanged in both modes.
    """
    if radius == 0: return arr.copy()
    bbox = Image.fromarray(arr).getbbox()
    if bbox is None: return arr.copy()
    x0,y0,x1,y1 = bbox
    patch = arr[y0:y1,x0:x1].copy()
    alpha = patch[:,:,3]
    opaque = np.pad((alpha >= 250).astype(np.uint8),1)
    depth = cv2.distanceTransform(opaque,cv2.DIST_L2,5)[1:-1,1:-1]
    pull_depth = 3*radius+1 if pixel else 2*radius
    core = depth > pull_depth
    if not core.any(): core = depth >= max(1,float(depth.max())*.75)
    if not core.any(): return arr.copy()
    _,labels = cv2.distanceTransformWithLabels((~core).astype(np.uint8),cv2.DIST_L2,5,
                                              labelType=cv2.DIST_LABEL_PIXEL)
    # A single nearest interior sample can still land on a white hair strand
    # or export rim. A local median keeps that isolated sample from propagating
    # outwards; only edge targets are changed, not interior texture detail.
    interior_rgb = cv2.medianBlur(patch[:,:,:3].copy(),2*radius+3)
    reference = interior_rgb[core][np.maximum(labels-1,0)]
    visible = alpha > 0
    luma = patch[:,:,:3].astype(np.float32).mean(axis=2)
    inner_luma = reference.astype(np.float32).mean(axis=2)
    outliers = visible & (depth <= 3*radius)
    outliers &= (luma-inner_luma > PIXEL_EDGE_LIGHTNESS_DELTA) & (luma > inner_luma*1.35)
    targets = outliers if pixel else outliers | (visible & ((depth <= radius) | (alpha < 255)))
    patch[:,:,:3][targets] = reference[targets]
    result = arr.copy()
    result[y0:y1,x0:x1] = patch
    return result


def locate(original: np.ndarray, image: np.ndarray, filename: str) -> tuple[int, int, float]:
    """Masked RGB template search, coarse then exact within a local window.

    Hair has a semantic top-of-figure search region: otherwise dark clothing
    creates a false minimum. Tiny decorative accents are matched but dropped.
    """
    xoff, yoff = 0, 0
    base = original[:, :, :3].astype(np.float32)
    if filename == "short-black-hair.png":
        base = base[:300, 400:740]; xoff = 400
    mask = (image[:, :, 3] > 240).astype(np.uint8) * 255
    size = (max(1, image.shape[1]//3), max(1, image.shape[0]//3))
    small = cv2.resize(image[:, :, :3], size, interpolation=cv2.INTER_AREA).astype(np.float32)
    m = cv2.resize(mask, size, interpolation=cv2.INTER_NEAREST)
    b = cv2.resize(base, (base.shape[1]//3, base.shape[0]//3), interpolation=cv2.INTER_AREA)
    result = cv2.matchTemplate(b, small, cv2.TM_SQDIFF_NORMED, mask=m)
    result[~np.isfinite(result)] = 10
    _, _, loc, _ = cv2.minMaxLoc(result)
    x, y = loc[0]*3, loc[1]*3
    x0, y0 = max(0, x-9), max(0, y-9)
    crop = base[y0:min(base.shape[0], y+image.shape[0]+9), x0:min(base.shape[1], x+image.shape[1]+9)]
    result = cv2.matchTemplate(crop, image[:, :, :3].astype(np.float32), cv2.TM_SQDIFF_NORMED, mask=mask)
    result[~np.isfinite(result)] = 10
    score, _, loc, _ = cv2.minMaxLoc(result)
    return xoff+x0+loc[0], yoff+y0+loc[1], float(score)


def extend_joint_pixels(arr: np.ndarray, overlap: int, gates: list[tuple[int,int,int,int]]) -> np.ndarray:
    """Dilate only internal joint seam gates; fill from nearest retained RGB.

    Retain silhouettes at face, fingers and gun. No overlap on gun, ever.
    """
    if overlap == 0 or not gates: return arr.copy()
    alpha = arr[:, :, 3]; inside = (alpha > 0).astype(np.uint8)
    dilation = cv2.dilate(inside, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2*overlap+1, 2*overlap+1)))
    gate = np.zeros_like(inside)
    for x0,y0,x1,y1 in gates: gate[max(0,y0):min(H,y1),max(0,x0):min(W,x1)] = 1
    add = (dilation > 0) & (inside == 0) & (gate > 0)
    _, labels = cv2.distanceTransformWithLabels(1-inside, cv2.DIST_L2, 5, labelType=cv2.DIST_LABEL_PIXEL)
    result = arr.copy(); colors = arr[:, :, :3][inside.astype(bool)]
    result[:, :, :3][add] = colors[labels[add]-1]; result[:, :, 3][add] = 255
    return result


def fill_attachment(arr: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Complete hidden garment attachment RGB from that garment's own pixels.

    Structural amodal completion is separate from OVERLAP_PX edge dilation.
    It connects an occluded back panel to its waist seam; it is not a new
    generated image or a hand-painted contour. Provenance records each use.
    """
    inside = arr[:,:,3] >= 128
    _,labels = cv2.distanceTransformWithLabels((~inside).astype(np.uint8),cv2.DIST_L2,5,
                                               labelType=cv2.DIST_LABEL_PIXEL)
    add = mask & ~inside
    result = arr.copy()
    result[:,:,:3][add] = arr[:,:,:3][inside][labels[add]-1]
    result[:,:,3][add] = 255
    return result


# Canonical source-space rest pivots and conservative diagnostic rotation limits.
BONES = [
 ("hip",None,(580,680),(-3,3)), ("torso","hip",(560,390),(-4,4)),
 ("head","torso",(562,251),(-8,8)), ("hair","head",(565,112),(-5,5)),
 ("collar","torso",(560,290),(-4,4)), ("coat","torso",(560,410),(-3,3)),
 ("hem_left","coat",(418,700),(-8,8)), ("hem_center","coat",(563,700),(-6,6)),
 ("hem_right","coat",(724,700),(-8,8)),
 ("right_upper","torso",(383,488),(-12,85)),
 ("right_fore","right_upper",(350,587),(-18,20)),
 ("right_hand","right_fore",(330,790),(-12,12)),
 ("left_arm","torso",(704,365),(-8,8)),
 ("leg_left","hip",(535,708),(-7,7)), ("leg_right","hip",(640,708),(-7,7)),
 ("boot_left","leg_left",(424,1360),(-6,6)), ("boot_right","leg_right",(672,1340),(-6,6)),
]


def prepare(args):
    dest = args.output; dest.mkdir(parents=True, exist_ok=True)
    original_im, matte_report = matte_background(Image.open(SRC/"original.png"))
    original = np.array(original_im)
    matched, match_report = {}, {}
    for p in sorted(SRC.rglob("*.png")):
        if p.name == "original.png": continue
        im,_ = matte_background(Image.open(p)); a=np.array(im)
        x,y,score=locate(original,a,p.name)
        full=np.zeros_like(original); full[y:y+a.shape[0],x:x+a.shape[1]]=a
        key=str(p.relative_to(SRC)); matched[key]=full
        match_report[key]=dict(offset=[x,y],masked_rgb_sqdiff=round(score,6))
    (dest/"matching.json").write_text(json.dumps(match_report,indent=2)+"\n")
    yy,xx=np.mgrid[:H,:W]
    def region(a, mask):
        b=a.copy(); b[:,:,3][~mask]=0; return b
    coat=matched["long-brown-trench-coat.png"]
    pants=matched["black-combat-pants.png"]
    mech=matched["cybernetic-arm.png"]
    body=matched["black-tactical-bodysuit.png"]
    # Residual from original minus known segment alphas seeds missing objects.
    known=np.zeros((H,W),bool)
    for k,a in matched.items():
        if k not in ("cyberpunk-woman.png","illegible.png") and "orange-glowing" not in k:
            known |= a[:,:,3]>127
    residual=(original[:,:,3]>0)&~known
    save_image(Image.fromarray(region(original,residual)),dest/"diagnostics/residual.png",
               "original.png minus aligned known Segments alpha union; seed evidence, not a rig part")
    # Bbox + colour heuristics; no hand-painted paths or new pixels.
    skin=(original[:,:,0].astype(float)>original[:,:,1]*1.04)&(original[:,:,1]>48)
    head_roi=(xx>=478)&(xx<648)&(yy>=96)&(yy<275)
    head_mask=head_roi & ((yy>=192)|residual|skin)
    # Recover dark eye/ear details by closing the skin/residual union within the bbox.
    head_mask=cv2.morphologyEx(head_mask.astype(np.uint8),cv2.MORPH_CLOSE,np.ones((7,7),np.uint8))>0
    head_mask &= head_roi
    # Sleeve is deliberately recovered too: the coat export merged it into coat.
    left_roi=(xx>=700)&(xx<856)&(yy>=351)&(yy<902)
    # Right border follows the sleeve/hand, stopping before the gun.
    left_edge=np.interp(yy,[350,500,650,780,820,900],[722,749,790,830,825,815])
    left_mask=left_roi & (xx<=left_edge)
    def seeded_original_components(roi):
        # Residual alpha identifies genuinely missing regions. Restore their
        # original connected pixels inside the constrained ROI, including the
        # sleeve/occluded boundaries that known amodal exports also covered.
        candidate=(original[:,:,3]>0)&roi
        _,labels=cv2.connectedComponents(candidate.astype(np.uint8),connectivity=8)
        seeds=np.unique(labels[residual&candidate]); seeds=seeds[seeds!=0]
        return np.isin(labels,seeds)&candidate
    left_mask=seeded_original_components(left_mask)
    # Gun: source alpha gives the outer edge. A row-dependent grip exclusion
    # separates black glove from black gun, which colour alone cannot separate.
    grip_edge=np.interp(yy,[818,843,877,902,935,955],[831,824,819,815,821,839])
    gun_roi=(yy>=818)&(yy<1118)&(xx>=grip_edge)&(xx<930)
    gun_mask=seeded_original_components(gun_roi)
    count, labels, stats, _=cv2.connectedComponentsWithStats(gun_mask.astype(np.uint8),connectivity=8)
    if count>1: gun_mask=labels==(1+np.argmax(stats[1:,cv2.CC_STAT_AREA]))
    # Fill enclosed alpha holes (including the source trigger opening). Extend
    # nearest gun RGB only there; never dilate the external gun silhouette.
    flood=gun_mask.astype(np.uint8)*255
    cv2.floodFill(flood,None,(0,0),255)
    holes=(flood==0)&~gun_mask
    gun=region(original,gun_mask)
    if holes.any():
        _, labels=cv2.distanceTransformWithLabels((~gun_mask).astype(np.uint8),cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
        gun[:,:,:3][holes]=original[:,:,:3][gun_mask][labels[holes]-1]
        gun[:,:,3][holes]=255
    # Remove the sleeve, retaining the inner right-front coat panel. The old
    # x>=700 cut also removed the panel's waist attachment down to y=800.
    coat_export = coat.copy()
    sleeve_inner = np.interp(yy,[351,500,650,780,800],[704,716,742,770,785])
    coat=region(coat,~((xx>=sleeve_inner)&(yy>=351)&(yy<800)))
    # The open-front export has no painted back under the torso. Complete a
    # concealed lining within the coat hull, connected to its existing side
    # panels. It sits behind the body, not over the visible shirt/pants.
    coat_hull = np.zeros((H,W),np.uint8)
    cv2.fillConvexPoly(coat_hull,cv2.convexHull(cv2.findNonZero((coat_export[:,:,3]>=128).astype(np.uint8))),1)
    lining_mask = (coat_hull>0)&(xx>=450)&(xx<770)&(yy>=500)&(yy<700)
    lining = region(fill_attachment(coat_export,lining_mask),lining_mask)
    center_attachment = (xx>=518)&(xx<618)&(yy>=700)&(yy<900)
    center_seed = region(coat,(yy>=700)&(xx>=520)&(xx<620))
    center_hem = fill_attachment(center_seed,center_attachment)
    # A genuine upper-left-thigh pivot lies in the garment at x=535. The old
    # x=488 position was outside both pants and bodysuit (under the outer coat).
    # Share real bodysuit pelvis pixels between the fixed hip and moving thigh.
    pelvis = region(body,(yy>=630)&(yy<780))
    left_thigh_back = region(body,(xx<574)&(yy>=650)&(yy<780))
    left_leg = np.array(Image.alpha_composite(Image.fromarray(left_thigh_back),
                                             Image.fromarray(region(pants,xx<574))))
    collars=np.array(Image.alpha_composite(Image.fromarray(matched["high-collar/high-collar-1.png"]),
                                           Image.fromarray(matched["high-collar/high-collar-2.png"])))
    pieces=[]
    def add(name,bone,a,z,category,derived,gates=(),source="segments",shift=(0,0)):
        pieces.append(dict(id=name,bone=bone,array=a,z_order=z,classification=category,
                           derived_from=derived,gates=list(gates),source=source,shift=shift))
    add("torso","torso",region(body,yy<750),0,"Segments-split","black-tactical-bodysuit.png: torso plus under-belt hip backing",[(470,738,704,764)])
    add("hip_backing","hip",pelvis,-3,"Segments-split","black-tactical-bodysuit.png: fixed pelvis backing behind both thigh seams",[(490,660,720,760)])
    add("belt","hip",matched["black-belt.png"],18,"Segments-usable","black-belt.png")
    add("head","head",region(original,head_mask),12,"SCRIPTED CUTOUT","original.png: residual alpha + face bbox/skin heuristic",[(490,245,630,287)],"scripted-cutout")
    add("hair","hair",matched["short-black-hair.png"],23,"Segments-usable","short-black-hair.png",[(490,130,650,180)])
    add("collar","collar",collars,24,"Segments-merged","high-collar-1.png + high-collar-2.png",[(500,310,645,344)])
    add("coat_yoke","coat",region(coat,yy<700),8,"Segments-split","long-brown-trench-coat.png: upper coat minus human sleeve",[(700,351,739,410)])
    add("coat_lining","coat",lining,-2,"Segments-split","long-brown-trench-coat.png: hidden back lining within coat hull; amodal nearest-coat-colour completion under torso, connected to waist seam",[(450,680,770,724)])
    for name,mask,pivot in [("left",xx<520,418),("center",(xx>=520)&(xx<620),563),("right",xx>=620,724)]:
        part = center_hem if name == "center" else region(coat,(yy>=700)&mask)
        note = "; hidden upper back panel completed to actual waist seam at y=700 with nearest original back-tail colour" if name == "center" else ""
        add("hem_"+name,"hem_"+name,part,-1 if name == "center" else 6,"Segments-split","long-brown-trench-coat.png: lower "+name+note,
            [(265,680,842,724),(508,700,532,1350),(608,700,632,1350)])
    for name,mask,gates in [
      ("right_upper",yy<587,[(290,477,428,506),(290,575,415,613)]),
      ("right_fore",(yy>=587)&(yy<790),[(285,778,395,816)]),
      ("right_hand",yy>=790,[])]:
        add(name,name,region(mech,mask),26,"Segments-split","cybernetic-arm.png: "+name,gates)
    add("left_arm","left_arm",region(original,left_mask),22,"SCRIPTED CUTOUT","original.png: residual hand + bbox-bounded sleeve, gun excluded",[(690,345,743,410)],"scripted-cutout")
    for name,mask in [("left",xx<574),("right",xx>=574)]:
        gates=[(410,660,715,728),(562,680,586,920)]
        if name == "left": gates.append((375,1328,480,1404))
        add("leg_"+name,"leg_"+name,left_leg if name=="left" else region(pants,mask),1,
            "Segments-merged" if name=="left" else "Segments-split",
            "black-combat-pants.png: "+name+("; black-tactical-bodysuit.png upper-thigh underlap; cuff backing extended behind boot by OVERLAP_PX" if name=="left" else ""),gates)
    add("boot_left","boot_left",matched["black-combat-boots/black-combat-boots-2.png"],4,"Segments-usable","black-combat-boots-2.png",[(370,1338,474,1382)])
    add("boot_right","boot_right",matched["black-combat-boots/black-combat-boots-1.png"],4,"Segments-usable","black-combat-boots-1.png",[(620,1312,724,1366)])
    # Transplant source gun (human hand) to mech hand. Translation only in prep.
    add("gun","right_hand",gun,25,"SCRIPTED CUTOUT","original.png: gun alpha + row/grip bbox heuristic; trigger hole nearest-colour filled; rigid transplant to mech hand",(),"scripted-cutout",(-492,-17))
    scale=args.pixel/1617
    grid_size=(round(W*scale),round(H*scale))
    # Palette is computed AFTER matting, from all retained opaque source colours.
    samples=[]
    for p in pieces:
        p["raw_array"] = p["array"]
        p["array"] = decontaminate_edges(p["array"],args.defringe_px)
        a=decontaminate_edges(p["array"],args.defringe_px,pixel=True)
        samples.append(a[:,:,:3][a[:,:,3]>127][::16])
    # Reserve three colours for the capture background and procedural flash:
    # animated pixel frames can stay within 32 colours too (29 + 3).
    sample=np.concatenate(samples); palette_image=Image.fromarray(sample.reshape(1,-1,3)).quantize(colors=29,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    palette=Image.new("P",(1,1)); palette.putpalette(palette_image.getpalette()[:29*3] + [24,32,43,255,199,94,255,241,187])
    metadata=dict(godot_version="4.7.2.stable.official.ed1daf0bf",overlap_px=args.overlap_px,
                  defringe_px=args.defringe_px,pixel_edge_lightness_delta=PIXEL_EDGE_LIGHTNESS_DELTA,
                  pixel_height=args.pixel,pixel_scale=scale,pixel_canvas=list(grid_size),fps=24,
                  flash_frames=3,canvas=[W,H],matting=matte_report,
                  gun_grip_source=[822,859],gun_muzzle_source=[900,1102],
                  gun_grip_rig=[330,842],gun_muzzle_rig=[408,1085],
                  bones=[dict(name=n,parent=par,pivot=list(piv),rotation_limits_deg=list(lim)) for n,par,piv,lim in BONES],parts=[])
    composite=Image.new("RGBA",(W,H)); raw_composite=Image.new("RGBA",(W,H))
    pixel_composite=Image.new("RGBA",grid_size)
    for p in sorted(pieces,key=lambda p:p["z_order"]):
        a=extend_joint_pixels(p["array"],args.overlap_px,p["gates"])
        # Internal split seams may extend into their sibling, not beyond the
        # original source silhouette. This prevents square coat-edge tabs.
        support = None
        if p["id"] == "torso": support = body
        elif p["id"].startswith("hem_") or p["id"] == "coat_yoke": support = coat
        elif p["id"].startswith("right_"): support = mech
        elif p["id"].startswith("leg_"): support = pants
        if support is not None:
            allowed = support[:,:,3] > 0
            if p["id"] == "hem_center":
                # Retain the structural back-panel completion and its upper
                # overlap; clipping it to the old export recreates the float.
                allowed |= (xx>=518-args.overlap_px)&(xx<618+args.overlap_px)&(yy>=700-args.overlap_px)&(yy<900)
            if p["id"] == "leg_left":
                allowed |= left_thigh_back[:,:,3]>0
                # Permit the bounded 12px cuff underpaint beyond the old pants
                # outline; otherwise the source-support clip deletes it again.
                allowed |= (xx>=375)&(xx<480)&(yy>=1328)&(yy<1404)
            a[:,:,3][~allowed] = 0
        sx,sy=p["shift"]
        layer=Image.new("RGBA",(W,H)); layer.paste(Image.fromarray(a),(sx,sy)); a=np.array(layer)
        raw=Image.new("RGBA",(W,H)); raw.paste(Image.fromarray(p["raw_array"]),(sx,sy))
        bbox=layer.getbbox(); crop=layer.crop(bbox)
        save_image(crop,dest/"parts/hd"/(p["id"]+".png"),p["derived_from"]+f"; RGB-only defringe {args.defringe_px}px; joint overlap {0 if p['id']=='gun' else args.overlap_px}px")
        # Quantize before snap. Alpha stays separate and becomes binary on grid.
        pixel_rgb=decontaminate_edges(a,args.defringe_px,pixel=True)[:,:,:3]
        q=Image.fromarray(pixel_rgb).quantize(palette=palette,dither=Image.Dither.NONE).convert("RGBA")
        q.putalpha(Image.fromarray((a[:,:,3]>=128).astype(np.uint8)*255))
        small=q.resize(grid_size,Image.Resampling.NEAREST)
        pb=small.getbbox()
        if pb is None: pb=(0,0,1,1)
        save_image(small.crop(pb),dest/"parts/pixel"/(p["id"]+".png"),p["derived_from"]+f"; matte, RGB-only defringe {args.defringe_px}px and bright-edge correction, shared 32-colour palette, nearest integer grid and 1-bit alpha")
        pivot=next(b[2] for b in BONES if b[0]==p["bone"])
        pp=[round(v*scale) for v in pivot]
        entry={k:p[k] for k in ("id","bone","z_order","classification","source","derived_from")}
        entry.update(parent_bone=p["bone"],pivot=list(pivot),offset=[bbox[0]-pivot[0],bbox[1]-pivot[1]],
                     bbox=list(bbox),pixel_pivot=pp,pixel_bbox=list(pb),pixel_offset=[pb[0]-pp[0],pb[1]-pp[1]],
                     rotation_limits_deg=list(next(b[3] for b in BONES if b[0]==p["bone"])),
                     joint_overlap_px=0 if p["id"]=="gun" else args.overlap_px,
                     defringe_px=args.defringe_px,
                     attachment_note=p["derived_from"],
                     amodal_attachment_completion=p["id"] in ("coat_lining","hem_center"),
                     texture_hd="parts/hd/"+p["id"]+".png",texture_pixel="parts/pixel/"+p["id"]+".png")
        metadata["parts"].append(entry)
        composite=Image.alpha_composite(composite,layer); raw_composite=Image.alpha_composite(raw_composite,raw)
        pixel_composite=Image.alpha_composite(pixel_composite,small)
        # Per-part comparison: raw Segments or clearly marked scripted source vs snapped.
        sheet=Image.new("RGB",(640,410),"#414854"); draw=ImageDraw.Draw(sheet)
        for col,im,label in [(0,raw.crop(raw.getbbox()),"RAW "+p["classification"]),(1,small.crop(pb),"GRID / 32 COLOURS")]:
            factor=min(300/im.width,350/im.height)
            if col == 1: factor=max(1,int(factor))
            size=(max(1,round(im.width*factor)),max(1,round(im.height*factor)))
            im=im.resize(size,Image.Resampling.NEAREST); sheet.paste(im,(col*320+(320-im.width)//2,36),im)
            draw.text((col*320+8,10),label,fill="white")
        save_image(sheet,dest/"comparisons"/(p["id"]+".png"),p["derived_from"]+"; raw vs snapped comparison")
    (dest/"parts.json").write_text(json.dumps(metadata,indent=2)+"\n")
    save_image(composite,dest/"diagnostics/assembled-hd.png","All prepared HD parts in rest pose; gun moved to mech hand")
    save_image(pixel_composite,dest/"diagnostics/assembled-pixel.png","Prepared HD parts, matte then shared palette then integer-grid sampling")
    whole=Image.new("RGB",(1000,750),"#414854"); d=ImageDraw.Draw(whole)
    for x,im,label in [(0,raw_composite,"RAW SEGMENTS + SCRIPTED CUTOUTS"),(500,pixel_composite,"GRID / 120px FIGURE / <=32 COLOURS")]:
        factor=min(460/im.width,690/im.height)
        if x: factor=max(1,int(factor))
        im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST)
        whole.paste(im,(x+20+(460-im.width)//2,40),im); d.text((x+10,10),label,fill="white")
    save_image(whole,dest/"comparisons/whole-figure.png","Raw assembled Segments plus explicitly labelled scripted cutouts vs grid-snapped figure")
    # Source provenance mirrors: src is strictly read-only, so sidecars live here.
    for source in sorted((ROOT/"src").rglob("*")):
        if source.suffix.lower() not in (".png",".jpg",".webp"): continue
        target=dest/"provenance"/source.relative_to(ROOT/"src")
        target.parent.mkdir(parents=True,exist_ok=True)
        sidecar(target,"Read-only supplied source: src/"+str(source.relative_to(ROOT/"src")),"raw-pixel" in str(source))
    # Demonstrate that the same matting function accepts supplied flat JPG.
    jpg=ROOT/"src/parts/raw-pixel/grok-image-e8878ac2-6b8a-4873-bae2-12b21910230e.jpg"
    m,report=matte_background(Image.open(jpg))
    save_image(m,dest/"diagnostics/matted-flat-jpg.png","Supplied flat JPG; same matte_background function before any quantization",True)
    (dest/"diagnostics/matting.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(dict(parts=len(pieces),overlap_px=args.overlap_px,defringe_px=args.defringe_px,pixel_canvas=grid_size,output=str(dest))))


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--overlap-px",type=int,default=OVERLAP_PX)
    parser.add_argument("--defringe-px",type=int,default=DEFRINGE_PX)
    parser.add_argument("--pixel",type=int,default=120,metavar="HEIGHT")
    parser.add_argument("--output",type=Path,default=DEST)
    opts=parser.parse_args()
    if opts.overlap_px<0: parser.error("--overlap-px must be nonnegative")
    if opts.defringe_px<0: parser.error("--defringe-px must be nonnegative")
    if not 96<=opts.pixel<=128: parser.error("--pixel must be between 96 and 128")
    prepare(opts)
