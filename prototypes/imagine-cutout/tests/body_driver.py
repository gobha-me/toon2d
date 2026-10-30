#!/usr/bin/env python3
"""Test-owned v2 contract; all scene observation occurs in disposable copies."""
from __future__ import annotations

import hashlib
import itertools
import json
from pathlib import Path
import random
import shutil
import tempfile

import numpy as np
from PIL import Image

import driver

# Frozen in the tests commit. Pairwise extremes are ADDITIONAL to these samples.
COMBINED_RANDOM_N = 200
COMBINED_SEED = 20261030
REQUIRED_SLOTS = (
    "head_face", "upper_arm_left", "lower_arm_left", "hand_left",
    "upper_arm_right", "lower_arm_right", "hand_right", "upper_leg_left",
    "lower_leg_left", "foot_left", "upper_leg_right", "lower_leg_right",
    "foot_right", "held_prop_gun",
)
JOINT_NAMES = (
    "hip", "torso", "head", "hair", "collar", "coat", "hem_left", "hem_center",
    "hem_right", "right_upper", "right_fore", "right_hand", "left_arm",
    "leg_left", "leg_right", "boot_left", "boot_right", "left_fore", "left_hand",
    "knee_left", "knee_right",
)
FROZEN_TOLERANCES = {
    "pivot_px": .001, "limit_deg": .000001, "radius_px": 32,
    "alpha_threshold": 128, "background_rgb": [255, 0, 255],
    "background_channel_tolerance": 3, "allowed_gap_pixels": 0,
}
TILE = 72  # Same 2*32+8 crop as the original HD joint test.


def evidence_text(value, level: int = 0) -> str:
    """One line per scalar record keeps exhaustive evidence reviewable."""
    pad = "  " * (level + 1)
    if isinstance(value, dict) and any(isinstance(v, (dict, list)) for v in value.values()):
        return "{\n" + ",\n".join(pad + json.dumps(k) + ": " + evidence_text(v, level + 1)
                                  for k, v in value.items()) + "\n" + "  " * level + "}"
    if isinstance(value, list) and any(isinstance(v, (dict, list)) for v in value):
        return "[\n" + ",\n".join(pad + evidence_text(v, level + 1) for v in value) + "\n" + "  " * level + "]"
    return json.dumps(value)


def read_manifest(source: Path) -> dict:
    # JSON is a YAML 1.2 subset; avoid introducing a parser dependency.
    manifest = json.loads((source / "body_parts.yml").read_text())
    slots = manifest["slots"]
    joints = manifest["joints"]
    assert len(slots) == len(REQUIRED_SLOTS)
    assert {s["slot"] for s in slots} == set(REQUIRED_SLOTS), "required slot inventory changed"
    assert tuple(j["name"] for j in joints) == JOINT_NAMES, "required joint inventory changed"
    by_name = {j["name"]: j for j in joints}
    for key, value in FROZEN_TOLERANCES.items():
        assert manifest["tolerances"][key] == value, f"frozen tolerance changed: {key}"
    for joint in joints:
        assert len(joint["pivot"]) == 2 and all(np.isfinite(joint["pivot"]))
        assert joint["rotation_limits_deg"][0] < joint["rotation_limits_deg"][1]
        assert len(joint["limit_reasons"]) == 2 and all(joint["limit_reasons"])
        assert joint["pivot_reason"] and joint["basis"]
        seen = {joint["name"]}
        parent = joint["parent"]
        while parent is not None:
            assert parent in by_name and parent not in seen, "invalid/cyclic joint parent"
            seen.add(parent)
            parent = by_name[parent]["parent"]
    for slot in slots:
        joint = by_name[slot["bone"]]
        assert slot["pivot"] == joint["pivot"]
        assert slot["parent_bone"] == joint["parent"]
        assert slot["part_parent_bone"] == slot["bone"]
        assert slot["joint_limits_deg"] == joint["rotation_limits_deg"]
        assert slot["overlap_px"] >= 0 and slot["overlap_reason"]
    return manifest


def pose_plan(manifest: dict) -> list[dict]:
    """42 single limits, 840 pair extremes, then exactly 200 random poses."""
    joints = manifest["joints"]
    rest = {j["name"]: 0 for j in joints}
    poses = []
    for joint in joints:
        for endpoint, angle in zip(("min", "max"), joint["rotation_limits_deg"]):
            poses.append({"id": f"single/{joint['name']}/{endpoint}", "kind": "single",
                          "angles": dict(rest, **{joint["name"]: angle})})
    for left, right in itertools.combinations(joints, 2):
        for a, b in itertools.product(range(2), repeat=2):
            poses.append({"id": f"pair/{left['name']}/{a}/{right['name']}/{b}", "kind": "pair",
                          "angles": dict(rest, **{left["name"]: left["rotation_limits_deg"][a],
                                                 right["name"]: right["rotation_limits_deg"][b]})})
    rng = random.Random(COMBINED_SEED)
    for index in range(COMBINED_RANDOM_N):
        poses.append({"id": f"random/{index:03}", "kind": "random",
                      "angles": {j["name"]: rng.uniform(*j["rotation_limits_deg"]) for j in joints}})
    assert len(poses) == 2 * len(joints) + 4 * len(joints) * (len(joints) - 1) // 2 + COMBINED_RANDOM_N
    return poses


def tile_oracle(parent: np.ndarray, child: np.ndarray, actual: np.ndarray, *, root: bool) -> dict:
    """Exactly the original HD stencil, applied to one native atlas tile."""
    yy, xx = np.ogrid[:TILE, :TILE]
    disk = (xx + .5 - TILE / 2)**2 + (yy + .5 - TILE / 2)**2 <= 32**2
    stencil = (parent[:, :, 3] >= 128) & (child[:, :, 3] >= 128) & disk
    key = np.all(np.abs(actual[:, :, :3].astype(np.int16) - [255, 0, 255]) <= 3, axis=2)
    count, area = int((stencil & key).sum()), int(stencil.sum())
    result = {"gap_pixels": count, "stencil_pixels": area,
              "passed": count == 0 and (area > 0 or root)}
    if not area and not root:
        result["error"] = "empty non-root stencil"
    return result


def body_suite(source: Path, output: Path, *, full: bool = True, announce: bool = True) -> dict:
    driver.guard()
    manifest = read_manifest(source)
    poses = pose_plan(manifest)
    if not full:
        # Mutant trials retain all per-joint extremes. The full baseline always
        # runs all combined poses; no partial trial can be an acceptance result.
        poses = [p for p in poses if p["kind"] == "single"]
    work = Path(tempfile.mkdtemp(prefix="body-suite-", dir=driver.TEMP))
    try:
        project, captures = work / "prototype", work / "captures"
        captures.mkdir()
        driver.clone(source, project)
        pose_text = json.dumps(poses, sort_keys=True, separators=(",", ":"))
        (captures / "poses.json").write_text(pose_text)
        log = work / "godot.txt"
        driver.heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project),
                      "--editor", "--import"], project, log)
        driver.heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project),
                      "--script", "res://tests/check_body_parts.gd", "--", "observe", str(captures)], project, log)
        observed = json.loads((captures / "body-observed.json").read_text())
        driver.heavy(["xvfb-run", "-a", "godot", "--single-threaded-scene", "--path", str(project),
                      "--audio-driver", "Dummy", "--script", "res://tests/check_body_parts.gd",
                      "--", "atlas", str(captures)], project, log)
        atlases = json.loads((captures / "body-atlases.json").read_text())
        assert len(atlases) == len(poses), "not all scheduled poses were captured"
        entries = []
        for atlas, pose in zip(atlases, poses):
            assert atlas["pose"] == pose["id"] and atlas["kind"] == pose["kind"]
            assert tuple(j["joint"] for j in atlas["joints"]) == JOINT_NAMES
            pixels = np.asarray(Image.open(captures / atlas["filename"]).convert("RGBA"))
            assert pixels.shape == (3 * TILE, len(JOINT_NAMES) * TILE, 4)
            for joint in atlas["joints"]:
                item = {"pose": atlas["pose"], "kind": atlas["kind"], "joint": joint["joint"]}
                if "error" in joint:
                    item.update(passed=False, error=joint["error"], gap_pixels=None, stencil_pixels=0)
                else:
                    x = joint["column"] * TILE
                    item.update(tile_oracle(pixels[:TILE, x:x+TILE], pixels[TILE:2*TILE, x:x+TILE],
                                            pixels[2*TILE:, x:x+TILE], root=joint["root"]))
                entries.append(item)
        tests = {
            "manifest": {"name": "manifest schema and frozen inventory", "passed": True, "errors": []},
            "completeness": {"name": "required slots, bones, parents, pivots, limits and overlap",
                             "passed": not observed["completeness"], "errors": observed["completeness"]},
        }
        for name, kind in (("per_joint", "single"), ("combined", "combined")):
            selected = [e for e in entries if (e["kind"] == "single") == (kind == "single")]
            errors = [dict(e, case_id=e["pose"] + "/" + e["joint"]) for e in selected if not e["passed"]]
            tests[name] = {"name": "per-joint limit gaps" if kind == "single" else "combined pose gaps",
                           "passed": bool(selected) and not errors, "errors": errors,
                           "checked_seams": len(selected), "gap_pixels": sum(e["gap_pixels"] or 0 for e in selected)}
        if not full:
            tests.pop("combined")
        tests["facing"] = {"name": "head/face and weapon arm direction", "passed": not observed["facing"],
                           "errors": observed["facing"], "samples": observed["facing_samples"]}
        result = {"timestamp_utc": driver.datetime.now(driver.ZoneInfo("UTC")).isoformat(),
                  "random_n": COMBINED_RANDOM_N, "seed": COMBINED_SEED, "full_acceptance_run": full,
                  "pose_counts": {kind: sum(p["kind"] == kind for p in poses) for kind in ("single", "pair", "random")},
                  "pose_sha256": hashlib.sha256(pose_text.encode()).hexdigest(),
                  "manifest_sha256": hashlib.sha256((source / "body_parts.yml").read_bytes()).hexdigest(),
                  "tests": tests, "joints": entries, "passed": all(t["passed"] for t in tests.values())}
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(evidence_text(result) + "\n")
        output.with_suffix(".godot.txt").write_text(log.read_text())
        if full:
            output.with_suffix(".poses.json").write_text(evidence_text(poses) + "\n")
            evidence = output.parent / (output.stem + "-images")
            evidence.mkdir(exist_ok=True)
            # Persist one representative single-limit atlas and one combined
            # atlas; counts for EVERY seam and pose are retained above.
            for kind in ("single", "pair", "random"):
                failures = {e["pose"] for e in entries if e["kind"] == kind and not e["passed"]}
                atlas = next((a for a in atlases if a["kind"] == kind and a["pose"] in failures), None)
                if atlas:
                    shutil.copy2(captures / atlas["filename"], evidence / f"{kind}.png")
        dumps = [p.name for p in work.rglob("*") if p.is_file() and
                 (driver.re.fullmatch(r"core(?:\.\d+)?", p.name) or p.suffix == ".core")]
        if dumps:
            raise RuntimeError(f"core dump requires investigation: {dumps}")
        if announce:
            print(f"BODY poses {result['pose_counts']}; random N={COMBINED_RANDOM_N} seed={COMBINED_SEED}", flush=True)
            for name, test in tests.items():
                print(f"{'PASS' if test['passed'] else 'FAIL'} body {name}: {len(test['errors'])} failures", flush=True)
        return result
    finally:
        shutil.rmtree(work)


def failure_ids(result: dict, test: str) -> set[str]:
    return {e["case_id"] for e in result["tests"][test]["errors"]}


def plant(project: Path, kind: str) -> dict:
    """Mutate scratch subjects only, leaving the test manifest frozen."""
    scene = project / "scenes" / "hd.tscn"
    text = scene.read_text()
    if kind in ("missing_slot", "flipped_facing"):
        blocks = driver.re.split(r"(?=^\[node )", text, flags=driver.re.M)
        indices = [i for i, b in enumerate(blocks) if b.startswith('[node name="Part_head" ')]
        assert len(indices) == 1, "cannot plant head slot/facing mutant"
        index = indices[0]
        if kind == "missing_slot":
            blocks.pop(index)
        else:
            assert "flip_h =" not in blocks[index]
            blocks[index] += "flip_h = true\n\n"
        scene.write_text("".join(blocks))
        return {"files_changed": ["scenes/hd.tscn"]}
    if kind == "removed_knee":
        blocks = driver.re.split(r"(?=^\[node )", text, flags=driver.re.M)
        removed = [b for b in blocks if b.startswith('[node name="knee_left" type="Bone2D" ')]
        if not removed:
            return {"skip": "knee_left Bone2D does not exist in the PoC; no removed-knee mutant can be planted"}
        # Retain descendants but reparent them to the thigh, preserving a loadable
        # scene and giving completeness an observable missing-knee regression.
        path = driver.re.search(r'parent="([^"]+)"', removed[0]).group(1) + "/knee_left"
        text = "".join(b for b in blocks if b not in removed)
        text = text.replace('parent="' + path, 'parent="' + path.rsplit("/", 1)[0])
        scene.write_text(text)
        return {"files_changed": ["scenes/hd.tscn"]}
    assert kind == "zero_overlap"
    data = json.loads((project / "parts.json").read_text())
    parts = {p["id"]: p for p in data["parts"]}
    upper, lower = parts["right_upper"], parts["right_fore"]
    canvas = tuple(data["canvas"])
    masks = []
    for part in (upper, lower):
        image = Image.open(project / part["texture_hd"]).convert("RGBA")
        alpha = Image.new("L", canvas)
        origin = tuple(part["pivot"][i] + part["offset"][i] for i in range(2))
        alpha.paste(image.getchannel("A"), origin)
        masks.append(np.array(alpha))
    shared = (masks[0] > 0) & (masks[1] > 0)
    image_path = project / lower["texture_hd"]
    image = np.array(Image.open(image_path).convert("RGBA"))
    x, y = (lower["pivot"][i] + lower["offset"][i] for i in range(2))
    cut = shared[y:y+image.shape[0], x:x+image.shape[1]]
    removed_pixels = int(cut.sum())
    if removed_pixels == 0:
        return {"skip": "right upper/lower arm textures share no source pixels; zero-overlap carve cannot be planted"}
    image[cut, 3] = 0
    Image.fromarray(image).save(image_path)
    lower["joint_overlap_px"] = 0
    (project / "parts.json").write_text(json.dumps(data, indent=2) + "\n")
    return {"files_changed": [lower["texture_hd"], "parts.json"], "removed_overlap_pixels": removed_pixels,
            "meaning": "zero shared rest alpha between right upper/lower arm; no source regeneration claimed"}


def body_mutants(baseline: dict | None = None) -> bool:
    results = driver.PROTOTYPE / "tests" / "results" / "body-parts"
    if baseline is None:
        baseline = body_suite(driver.PROTOTYPE, results / "red-first.json")
    report = []
    for name, kind, expected in (("e", "missing_slot", "completeness"),
                                 ("f", "flipped_facing", "facing"),
                                 ("g", "removed_knee", "completeness"),
                                 ("h", "zero_overlap", "per_joint")):
        driver.guard()
        work = Path(tempfile.mkdtemp(prefix=f"mutant-{name}-", dir=driver.TEMP))
        try:
            project = work / "prototype"
            driver.clone(driver.PROTOTYPE, project)
            planted = plant(project, kind)
            item = {"mutant": name, "kind": kind, "expected_test": expected, **planted}
            if "skip" in planted:
                item["status"] = "CANNOT_PLANT"
                print(f"SKIP mutant {name}: {planted['skip']}", flush=True)
            else:
                result = body_suite(project, results / f"mutant-{name}.json", full=False, announce=False)
                new_errors = sorted(failure_ids(result, expected) - failure_ids(baseline, expected))
                before = {(j["pose"], j["joint"]): j for j in baseline["joints"] if j["kind"] == "single"}
                worsened = [{"pose": j["pose"], "joint": j["joint"],
                             "before": before[j["pose"], j["joint"]]["gap_pixels"], "after": j["gap_pixels"]}
                            for j in result["joints"] if j["gap_pixels"] is not None and
                            before[j["pose"], j["joint"]]["gap_pixels"] is not None and
                            j["gap_pixels"] > before[j["pose"], j["joint"]]["gap_pixels"]]
                killed = bool(worsened) if kind == "zero_overlap" else bool(new_errors)
                item.update(status="KILLED" if killed else "SURVIVED", new_failure_cases=new_errors,
                            worsened_joints=worsened, observed_red_tests=[k for k, t in result["tests"].items() if not t["passed"]])
                print(f"{'PASS' if killed else 'FAIL'} mutant {name}: {item['status']}; "
                      f"new relevant failures {len(new_errors)}, increased-gap seams {len(worsened)}", flush=True)
            report.append(item)
        finally:
            shutil.rmtree(work)
    results.mkdir(parents=True, exist_ok=True)
    (results / "mutants.json").write_text(evidence_text(report) + "\n")
    return all(item["status"] in ("KILLED", "CANNOT_PLANT") for item in report)
