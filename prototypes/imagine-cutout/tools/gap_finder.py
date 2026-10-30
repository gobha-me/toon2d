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


def audit_bounds(slot: dict, by_part: dict, joints: dict, inputs: Path, ledger: dict, prepared: dict):
    part = by_part.get(slot["part"])
    if part is not None:
        if "source_bbox" in part:
            return list(part["source_bbox"])
        translation = part.get("source_to_rig_translation")
        if translation is None and slot["part"] == "gun":
            # Older preparation ledgers record the transplant as source/rig
            # grip landmarks. Sprite-facing rotation never changes this bbox.
            translation = [prepared["gun_grip_rig"][i] - prepared["gun_grip_source"][i]
                           for i in range(2)]
        translation = translation or [0, 0]
        return [value - translation[i % 2] for i, value in enumerate(part["bbox"])]
    # Assembly replaces an upper carrier's bbox with its upper section. Only
    # the retained pre-split input can bound a missing lower section reliably.
    carrier = CARRIERS.get(slot["part"])
    spec = ledger.get(carrier)
    if spec is None:
        return None
    with Image.open(inputs / (carrier + ".png")) as image:
        width, height = image.size
    x0, y0 = spec["origin"]
    x1, y1 = x0 + width, y0 + height
    y0 = max(y0, slot["pivot"][1])
    distal = [j["pivot"][1] for j in joints.values()
              if j["parent"] == slot["bone"] and j["pivot"][1] > slot["pivot"][1]]
    if distal:
        y1 = min(y1, min(distal))
    return [x0, y0, x1, max(y0, y1)]


def audit(source: Path, project: Path) -> dict:
    manifest_path = project / "body_parts.yml"
    manifest = json.loads(manifest_path.read_text())
    prepared = json.loads((project / "parts.json").read_text())
    matching = json.loads((project / "matching.json").read_text())
    by_part = {p["id"]: p for p in prepared["parts"]}
    joints = {j["name"]: j for j in manifest["joints"]}
    inputs = project / "parts/kit-inputs"
    ledger_path = inputs / "inputs.json"
    ledger = json.loads(ledger_path.read_text()) if ledger_path.is_file() else {}
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
    slots = []
    for slot in manifest["slots"]:
        part = slot["part"]
        bounds = audit_bounds(slot, by_part, joints, inputs, ledger, prepared)
        roi = np.zeros_like(known)
        if bounds is not None:
            x0, y0, x1, y1 = bounds
            roi[max(0, y0):max(0, min(size[1], y1)), max(0, x0):max(0, min(size[0], x1))] = True
        filename = SEGMENTS.get(part)
        segment_pixels = int((aligned.get(filename, np.zeros_like(known)) & roi).sum())
        residual_pixels = int((residual & roi).sum()) if residual is not None else 0
        source_pixels = int(((original[:, :, 3] > 127) & roi).sum()) if original is not None else 0
        # Original residual seeds recover head, sleeve/hand and held prop. The
        # actual extractor keeps only source-alpha components within its ROI.
        available = segment_pixels > 0 if filename else residual_pixels > 0
        method = "Segments crop/split" if filename else "original residual-seeded cutout"
        slots.append(dict(slot=slot["slot"], part=part, bone=slot["bone"],
                          source_bbox=bounds,
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
