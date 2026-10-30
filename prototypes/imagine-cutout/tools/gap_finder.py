#!/usr/bin/env python3
"""Audit a Segments export against the frozen HD kit; never generate artwork.

Supply the directory containing original.png and the Segments crops. Matching
coordinates come from the preparation ledger, not filesystem timestamps.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
from PIL import Image

from prep_parts import matte_background

PROJECT = Path(__file__).resolve().parents[1]
# Semantic names in this export; coordinates and articulation come from manifests.
SEGMENTS = {
    "right_upper": "cybernetic-arm.png", "right_fore": "cybernetic-arm.png",
    "right_hand": "cybernetic-arm.png", "leg_left": "black-combat-pants.png",
    "shin_left": "black-combat-pants.png", "leg_right": "black-combat-pants.png",
    "shin_right": "black-combat-pants.png",
    "boot_left": "black-combat-boots/black-combat-boots-2.png",
    "boot_right": "black-combat-boots/black-combat-boots-1.png",
}
CARRIERS = {"left_fore": "left_arm", "left_hand": "left_arm",
            "shin_left": "leg_left", "shin_right": "leg_right"}


def audit(source: Path, project: Path) -> dict:
    manifest_path = project / "body_parts.yml"
    manifest = json.loads(manifest_path.read_text())
    prepared = json.loads((project / "parts.json").read_text())
    matching = json.loads((project / "matching.json").read_text())
    by_part = {p["id"]: p for p in prepared["parts"]}
    joints = {j["name"]: j for j in manifest["joints"]}
    size = tuple(manifest["source_canvas_px"])
    original = None
    if (source / "original.png").is_file():
        original = np.array(matte_background(Image.open(source / "original.png"))[0])
        if original.shape[:2] != (size[1], size[0]):
            raise ValueError("original dimensions differ from manifest")
    known = np.zeros((size[1], size[0]), bool)
    aligned = {}
    hashes = {}
    for filename, placement in matching.items():
        path = source / filename
        if not path.is_file():
            continue
        hashes[filename] = hashlib.sha256(path.read_bytes()).hexdigest()
        image = matte_background(Image.open(path))[0]
        canvas = Image.new("RGBA", size)
        canvas.paste(image, tuple(placement["offset"]))
        alpha = np.array(canvas.getchannel("A")) > 127
        aligned[filename] = alpha
        if filename not in ("cyberpunk-woman.png", "illegible.png") and "orange-glowing" not in filename:
            known |= alpha
    residual = None if original is None else (original[:, :, 3] > 127) & ~known
    if original is not None:
        hashes["original.png"] = hashlib.sha256((source / "original.png").read_bytes()).hexdigest()
    yy, xx = np.ogrid[:size[1], :size[0]]
    slots = []
    for slot in manifest["slots"]:
        part = slot["part"]
        carrier = by_part.get(CARRIERS.get(part, part))
        roi = np.zeros_like(known)
        if carrier:
            x0, y0, x1, y1 = carrier["bbox"]
            roi[y0:y1, x0:x1] = True
            # When auditing an already split rig, a lower section has its own bbox.
            if part not in by_part:
                roi &= yy >= slot["pivot"][1]
            else:
                children = [j for j in manifest["joints"] if j["parent"] == slot["bone"]]
                distal = [j["pivot"][1] for j in children if j["pivot"][1] > slot["pivot"][1]]
                if distal and part != "gun":
                    roi &= yy < min(distal)
        filename = SEGMENTS.get(part)
        segment_pixels = int((aligned.get(filename, np.zeros_like(known)) & roi).sum())
        residual_pixels = int((residual & roi).sum()) if residual is not None else 0
        source_pixels = int(((original[:, :, 3] > 127) & roi).sum()) if original is not None else 0
        # Original residual seeds recover head, sleeve/hand and held prop. The
        # actual extractor keeps only source-alpha components within its ROI.
        available = segment_pixels > 0 if filename else residual_pixels > 0
        method = "Segments crop/split" if filename else "original residual-seeded cutout"
        slots.append(dict(slot=slot["slot"], part=part, bone=slot["bone"],
                          declared_in_input=part in by_part,
                          segments_slot_missing=filename is None,
                          action="scripted" if available else "generate",
                          method=method if available else "no recoverable source pixels; browser work required",
                          source=filename or "original.png", segment_pixels=segment_pixels,
                          residual_seed_pixels=residual_pixels, original_roi_pixels=source_pixels,
                          pivot=slot["pivot"], parent=joints[slot["bone"]]["parent"]))
    return dict(schema_version=1, manifest_sha256=hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
                source_sha256=hashes, known_alpha_pixels=int(known.sum()),
                residual_alpha_pixels=None if residual is None else int(residual.sum()), slots=slots,
                generation_requested=False)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--project", type=Path, default=PROJECT)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = audit(args.source, args.project)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    for slot in report["slots"]:
        print(f"{slot['slot']}: {slot['action']} ({slot['method']})")


if __name__ == "__main__":
    main()
