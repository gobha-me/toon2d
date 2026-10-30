#!/usr/bin/env python3
"""Render-only smoke utility. No rig acceptance assertions.
All subprocesses are sequential and inherit the outer heavy-run slot.
"""
import argparse, json, os, shutil, subprocess, sys
from pathlib import Path
from PIL import Image,ImageDraw
from prep_parts import sidecar

ROOT=Path(__file__).resolve().parents[1]
PROJECT=ROOT
FPS=24

def run(command,log):
    print("Running:"," ".join(map(str,command)),flush=True)
    with log.open("w") as f:
        result=subprocess.run(list(map(str,command)),cwd=ROOT,stdout=f,stderr=subprocess.STDOUT)
    if result.returncode:
        print(log.read_text()[-8000:],file=sys.stderr)
        raise SystemExit(result.returncode)

def sheet(items,path,cols,cell=(240,308),pixel=False):
    rows=(len(items)+cols-1)//cols
    out=Image.new("RGB",(cols*cell[0],rows*cell[1]),"#18202b"); draw=ImageDraw.Draw(out)
    for i,(image,label) in enumerate(items):
        im=Image.open(image).convert("RGB")
        factor=min((cell[0]-8)/im.width,(cell[1]-26)/im.height)
        if pixel: factor=max(1,int(factor))
        im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.NEAREST if pixel else Image.Resampling.LANCZOS)
        x=(i%cols)*cell[0]; y=(i//cols)*cell[1]
        out.paste(im,(x+(cell[0]-im.width)//2,y+24))
        draw.text((x+6,y+6),label,fill="white")
    out.save(path)
    sidecar(path,"Godot render contact sheet: "+"; ".join(str(p.relative_to(PROJECT)) for p,_ in items))

def joint_closeups(records,renders,mode):
    """Display every native 1:1 joint crop on magenta, at exactly 2x or 8x."""
    factor=8 if mode=="pixel" else 2
    source_size=32 if mode=="pixel" else 200
    size=source_size*factor
    cell=(size+8,size+30); cols=4
    poses=records["joint_extremes"]
    output=Image.new("RGB",(cols*cell[0],((len(poses)+cols-1)//cols)*cell[1]),"#18202b")
    draw=ImageDraw.Draw(output)
    for i,pose in enumerate(poses):
        path=renders/pose["closeup_path"]
        native=Image.open(path).convert("RGBA")
        contrast=Image.new("RGBA",native.size,"#ff00ff")
        contrast.alpha_composite(native)
        native=contrast.convert("RGB")
        native.save(path)
        sidecar(path,f"Native Godot 1:1 {source_size}px joint crop centred at world pivot {pose['closeup_pivot_world']}; {pose['joint']} / {pose['side']} / {pose['degrees']} deg; magenta background, no gap retouching")
        x=(i%cols)*cell[0]; y=(i//cols)*cell[1]
        draw.text((x+4,y+6),f"{pose['joint']} / {pose['side']} / {pose['degrees']:+} deg",fill="white")
        output.paste(native.resize((size,size),Image.Resampling.NEAREST),(x+4,y+26))
    path=renders/mode/"joint-closeups-contact.png"
    output.save(path)
    sidecar(path,f"Every joint at both limits, native {source_size}x{source_size} Godot source pixels shown at {factor}x nearest; centred on actual pivot; flat magenta background exposes gaps; no acceptance assertions")

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skip-capture",action="store_true",help="Repackage existing captures only")
    args=parser.parse_args()
    renders=PROJECT/"renders"; logs=renders/"logs"; logs.mkdir(parents=True,exist_ok=True)
    # Generated PNGs are output artifacts, not editor texture imports.
    (renders/".gdignore").touch()
    (PROJECT/"provenance/.gdignore").touch()
    (PROJECT/"diagnostics/.gdignore").touch()
    (PROJECT/"comparisons/.gdignore").touch()
    if not args.skip_capture:
        # Editor import writes .uid/.import files beside discovered sources.
        # Never let it scan the independently owned test tree in this workspace.
        # Render a filtered temporary project and copy back only our outputs.
        capture_project=Path(os.environ["TMPDIR"])/"render-project"
        shutil.copytree(PROJECT,capture_project,ignore=shutil.ignore_patterns(
            "tests","TESTS.md","mutants.log","renders",".godot","__pycache__"))
        godot=["godot","--path",capture_project,"--audio-driver","Dummy","--single-threaded-scene"]
        run(godot+["--headless","--editor","--import","--quit"],logs/"import.txt")
        run(godot+["--headless","--script","scripts/build_rig.gd"],logs/"build.txt")
        for mode in ["hd","pixel"]:
            shutil.copy2(capture_project/"scenes"/(mode+".tscn"),PROJECT/"scenes"/(mode+".tscn"))
            for stub in (capture_project/"parts"/mode).glob("*.import"):
                shutil.copy2(stub,PROJECT/"parts"/mode/stub.name)
        # Preserve normal runtime loading without an editor scan of tests/.
        shutil.copytree(capture_project/".godot/imported",PROJECT/".godot/imported",dirs_exist_ok=True)
        shutil.copy2(capture_project/".godot/uid_cache.bin",PROJECT/".godot/uid_cache.bin")
        # Remove only this utility's capture outputs so a failed run cannot
        # silently reuse an earlier manifest or obsolete numbered frames.
        (renders/"manifest.json").unlink(missing_ok=True)
        for mode in ["hd","pixel"]:
            for folder in ["idle","aim","fire","cooldown","keyposes","joint_extremes","joint_closeups"]:
                target=renders/mode/folder
                if target.exists(): shutil.rmtree(target)
        run(["xvfb-run","-a",*godot,"--rendering-method","gl_compatibility","--script","scripts/render.gd"],logs/"capture.txt")
        shutil.copytree(capture_project/"renders",renders,dirs_exist_ok=True)
    manifest=json.loads((renders/"manifest.json").read_text())
    for mode,records in manifest["modes"].items():
        for clip in ["idle","aim","fire","cooldown"]:
            info=records["animations"][clip]
            for frame in info["frames"]:
                path=renders/frame["path"]
                sidecar(path,f"Godot {mode} / {clip} / frame {frame['frame']} at 24 fps; prepared Segments + scripted cutouts; see parts.json")
            endpoint=renders/mode/"keyposes"/(clip+"_end.png")
            sidecar(endpoint,f"Godot {mode} / {clip} / authored endpoint at {info['duration']} seconds")
            video=renders/mode/(clip+".mp4")
            # Pixel enlargement is an integer nearest-neighbour display scale.
            scale="scale=768:864:flags=neighbor" if mode=="pixel" else "null"
            run(["/usr/bin/ffmpeg","-y","-v","warning","-threads","2","-filter_threads","2","-framerate",str(FPS),
                 "-i",renders/mode/clip/"%03d.png","-frames:v",str(len(info["frames"])),"-vf",scale,
                 "-c:v","libx264","-threads","2","-crf","16","-pix_fmt","yuv420p",video],logs/(mode+"-"+clip+"-mp4.txt"))
            sidecar(video,f"Godot {mode} / {clip}; ffmpeg MP4 at 24 fps; lossy review copy; PNG frames are authoritative")
            gif=renders/mode/(clip+".gif")
            filters=f"[0:v]fps={FPS},{scale},split[frames][colours];[colours]palettegen=max_colors=256:reserve_transparent=0[palette];[frames][palette]paletteuse=dither=none[out]"
            run(["/usr/bin/ffmpeg","-y","-v","warning","-threads","2","-filter_complex_threads","2",
                 "-framerate",str(FPS),"-i",renders/mode/clip/"%03d.png","-filter_complex",filters,
                 "-map","[out]","-frames:v",str(len(info["frames"])),"-r",str(FPS),"-loop","0","-gifflags","0",gif],
                logs/(mode+"-"+clip+"-gif.txt"))
            # Keep the GIF extension so this sidecar cannot overwrite the
            # neighbouring MP4's existing <clip>.sidecar.json.
            sidecar(gif,f"Godot {mode} / {clip}; ffmpeg fps=24 + palettegen/paletteuse, no dithering, infinite GIF loop; nearest 6x for pixel; GIF delays rounded to centiseconds",keep_extension=True)
        items=[]
        for clip in ["idle","aim","fire","cooldown"]:
            info=records["animations"][clip]
            chosen={"idle":[0,12,36],"aim":[0,5,9],"fire":[0,2,3],"cooldown":[0,7,13]}[clip]
            for frame in chosen:
                items.append((renders/info["frames"][frame]["path"],f"{clip} / f{frame:02d}"))
            items.append((renders/mode/"keyposes"/(clip+"_end.png"),clip+" / endpoint"))
        cell=(272,330) if mode=="pixel" else (256,330)
        sheet(items,renders/mode/"key-pose-contact.png",4,cell,mode=="pixel")
        items=[]
        for pose in records["joint_extremes"]:
            path=renders/pose["path"]; sidecar(path,f"Godot {mode}: {pose['joint']} at {pose['degrees']} deg ({pose['side']}); remaining joints at rest")
            items.append((path,f"{pose['joint']} / {pose['degrees']:+} deg"))
        sheet(items,renders/mode/"joint-extremes-contact.png",6,cell,mode=="pixel")
        joint_closeups(records,renders,mode)
    print("Renders:",renders,flush=True)

if __name__=="__main__": main()
