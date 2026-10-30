#!/usr/bin/env python3
"""Independent scene observer and image oracle; temporary mutations only."""
from __future__ import annotations

import argparse
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from zoneinfo import ZoneInfo

import numpy as np
from PIL import Image

PROTOTYPE = Path(__file__).resolve().parent.parent
REPO = PROTOTYPE.parent.parent
TEMP = Path(os.environ["TMPDIR"]).resolve()
LABELS = {"1": "hierarchy", "2": "timing", "3": "flash", "4": "gun rigidity", "5": "joint gaps"}


def guard() -> None:
    now = datetime.now(ZoneInfo("America/New_York"))
    if now.hour < 3 or (now.hour == 23 and now.minute >= 55):
        raise RuntimeError("quiet hours: no new work")
    for path in (REPO, TEMP):
        if shutil.disk_usage(path).free < 5 * 1024**3:
            raise RuntimeError(f"under 5 GiB free on {path}")


def phase(name: str, state: str) -> None:
    log = REPO / "PHASE-LOG.txt"
    if log.exists():
        with log.open("a") as stream:
            stream.write(f"{datetime.now(ZoneInfo('UTC')).isoformat()} codexB {name} {state}\n")


def heavy(command: list[str], cwd: Path, log: Path) -> None:
    """One worker; exit 75 never falls through to an unguarded invocation."""
    while True:
        guard()
        env = dict(os.environ, HEAVY_WAIT="30")
        process = subprocess.Popen(["heavy-run", *command], cwd=cwd, env=env,
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   text=True, start_new_session=True)
        try:
            output, _ = process.communicate(timeout=600)
        except subprocess.TimeoutExpired:
            # Only the process group created and recorded immediately above.
            os.killpg(process.pid, signal.SIGTERM)
            try:
                output, _ = process.communicate(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                output, _ = process.communicate()
            log.write_text(output)
            raise RuntimeError(f"timed out process group {process.pid}; see {log.name}")
        with log.open("a") as stream:
            stream.write(f"COMMAND {command!r}\n{output}\nEXIT {process.returncode}\n")
        if process.returncode == 75:
            print("heavy-run deferred (75); retrying in 30 seconds", flush=True)
            time.sleep(30)
            continue
        if process.returncode != 0:
            raise RuntimeError(f"command failed ({process.returncode}): {command!r}\n{output[-6000:]}")
        if "SCRIPT ERROR:" in output or "Parse Error:" in output:
            raise RuntimeError(f"Godot script error:\n{output[-6000:]}")
        return


def clone(source: Path, destination: Path) -> None:
    guard()
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns(
        "renders", ".godot", "results", "__pycache__", "mutants.log"))


def image_oracle(capture_dir: Path) -> list[dict]:
    metadata = json.loads((capture_dir / "captures.json").read_text())
    joints = []
    for item in metadata["captures"]:
        if "error" in item:
            item.update(passed=False, gap_pixels=None, stencil_pixels=0)
            joints.append(item)
            continue
        prefix = capture_dir / item["prefix"]
        parent = np.asarray(Image.open(str(prefix) + "-parent.png").convert("RGBA"))
        child = np.asarray(Image.open(str(prefix) + "-child.png").convert("RGBA"))
        actual = np.asarray(Image.open(str(prefix) + "-actual.png").convert("RGB"))
        height, width = parent.shape[:2]
        yy, xx = np.ogrid[:height, :width]
        disk = ((xx + .5 - width / 2)**2 + (yy + .5 - height / 2)**2 <= item["radius"]**2)
        stencil = (parent[:, :, 3] >= 128) & (child[:, :, 3] >= 128) & disk
        key = np.all(np.abs(actual.astype(np.int16) - np.array([255, 0, 255])) <= 3, axis=2)
        gaps = stencil & key
        count, area = int(gaps.sum()), int(stencil.sum())
        item.update(gap_pixels=count, stencil_pixels=area,
                    passed=count == 0 and (area > 0 or item["root"]))
        if area == 0 and not item["root"]:
            item["error"] = "empty non-root stencil"
        marked = actual.copy()
        marked[gaps] = [0, 255, 0]
        Image.fromarray(marked).save(str(prefix) + "-marked.png")
        joints.append(item)
    return joints


def suite(source: Path, output: Path, *, announce: bool = True) -> dict:
    guard()
    work = Path(tempfile.mkdtemp(prefix="suite-", dir=TEMP))
    project = work / "prototype"
    captures = work / "captures"
    captures.mkdir()
    clone(source, project)
    log = work / "godot.txt"
    heavy(["godot", "--headless", "--path", str(project), "--editor", "--import"], project, log)
    heavy(["godot", "--headless", "--path", str(project), "--script", "res://tests/check_rig.gd",
           "--", "observe", str(captures)], project, log)
    observed = json.loads((captures / "observed.json").read_text())
    heavy(["xvfb-run", "-a", "godot", "--path", str(project), "--audio-driver", "Dummy",
           "--script", "res://tests/check_rig.gd", "--", "render", str(captures)], project, log)
    joints = image_oracle(captures)
    cases = {}
    for number in ("1", "2", "3", "4"):
        errors = [f"{mode}: {error}" for mode in ("hd", "pixel")
                  for error in observed["cases"][f"{mode}/{number}"]]
        cases[number] = {"name": LABELS[number], "passed": not errors, "errors": errors}
    errors = [f"{item['mode']}/{item['joint']}/{item['limit']}: "
              f"{item.get('error', str(item['gap_pixels']) + ' background pixels')}"
              for item in joints if not item["passed"]]
    cases["5"] = {"name": LABELS["5"], "passed": not errors, "errors": errors}
    result = {"timestamp_utc": datetime.now(ZoneInfo("UTC")).isoformat(),
              "tests": cases, "joints": joints, "samples": observed["samples"],
              "passed": all(case["passed"] for case in cases.values())}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n")
    output.with_suffix(".godot.txt").write_text(log.read_text())
    if output.stem == "real":
        # Keep native evidence for rejected limits; mutated copies are discarded.
        images = output.parent / "real-images"
        images.mkdir(exist_ok=True)
        for joint in joints:
            if not joint["passed"] and "prefix" in joint:
                for suffix in ("parent", "child", "actual", "marked"):
                    name = f"{joint['prefix']}-{suffix}.png"
                    shutil.copy2(captures / name, images / name)
    # Dumps are evidence of a failed run, never silently ignored or disabled.
    dumps = [p for p in work.rglob("*") if p.is_file() and
             (re.fullmatch(r"core(?:\.\d+)?", p.name) or p.suffix == ".core")]
    if dumps:
        raise RuntimeError(f"core dump requires investigation before acceptance: {dumps}")
    if announce:
        for number, case in cases.items():
            print(f"{'PASS' if case['passed'] else 'FAIL'} test {number}: {case['name']} "
                  f"({len(case['errors'])} failures)", flush=True)
        for item in joints:
            print(f"{'PASS' if item['passed'] else 'FAIL'} test 5 "
                  f"{item['mode']}/{item['joint']}/{item['limit']} "
                  f"angle={item['angle']} gaps={item['gap_pixels']} stencil={item['stencil_pixels']}"
                  f"{(' error=' + item['error']) if 'error' in item else ''}", flush=True)
    shutil.rmtree(work)
    return result


def animation_edit(project: Path, kind: str) -> list[str]:
    changed = []
    for mode in ("hd", "pixel"):
        path = project / "scenes" / f"{mode}.tscn"
        text = path.read_text()
        if kind == "bone":
            # Remove a leaf bone and its attached sprite; preserve the JSON oracle.
            blocks = re.split(r"(?=^\[node )", text, flags=re.M)
            kept = [block for block in blocks if not (
                re.match(r'\[node name="hair" type="Bone2D"', block) or
                re.match(r'\[node name="Part_hair" ', block))]
            assert len(kept) == len(blocks) - 2, "leaf bone mutation did not match"
            text = "".join(kept)
        else:
            clip = "fire" if kind == "flash" else "idle"
            blocks = re.split(r"(?=^\[(?:sub_resource|node) )", text, flags=re.M)
            indices = [i for i, block in enumerate(blocks)
                       if f'resource_name = "{clip}"\n' in block]
            assert len(indices) == 1, f"cannot locate {clip}"
            index = indices[0]
            block = blocks[index]
            if kind == "flash":
                match = re.search(r'tracks/(\d+)/path = NodePath\("[^"\n]*MuzzleFlash:visible"\)', block)
                assert match, "no flash visibility track"
                track = match.group(1)
                pattern = rf'(tracks/{track}/keys = \{{\n"times": PackedFloat32Array\()([^)]*)(\))'
                def set_flash(m: re.Match) -> str:
                    times = [float(t) for t in m.group(2).split(",")]
                    assert len(times) == 3 and abs(times[1] - 3 / 24) < 1e-6
                    times[1] = 5 / 24
                    return m.group(1) + ", ".join(map(str, times)) + m.group(3)
                block, count = re.subn(pattern, set_flash, block)
                assert count == 1
            else:
                block, count = re.subn(r'("times": PackedFloat32Array\()0(?=,)',
                                       r'\g<1>0.01', block, count=1)
                assert count == 1
            blocks[index] = block
            text = "".join(blocks)
        path.write_text(text)
        changed.append(str(path.relative_to(project)))
    return changed


def asset_hashes(project: Path) -> dict[str, str]:
    paths = [project / "parts.json", *sorted((project / "parts").rglob("*.png"))]
    return {str(path.relative_to(project)): hashlib.sha256(path.read_bytes()).hexdigest()
            for path in paths}


def mutants() -> bool:
    phase("mutants", "start")
    baseline = suite(PROTOTYPE, TEMP / "baseline.json", announce=False)
    baseline_joints = {(j["mode"], j["joint"], j["limit"]): j for j in baseline["joints"]}
    report = []
    for name, kind, expected in (("a", "flash", "3"), ("b", "bone", "1"),
                                 ("c", "overlap", "5"), ("d", "timing", "2")):
        print(f"Running mutant {name}: {kind}", flush=True)
        work = Path(tempfile.mkdtemp(prefix=f"mutant-{name}-", dir=TEMP))
        project = work / "prototypes" / "imagine-cutout"
        project.parent.mkdir()
        clone(PROTOTYPE, project)
        if kind == "overlap":
            guard()
            before_hashes = asset_hashes(project)
            shutil.copytree(REPO / "tools", work / "tools", ignore=shutil.ignore_patterns("__pycache__"))
            shutil.copytree(REPO / "src", work / "src")
            prep_log = work / "prep.txt"
            heavy([sys.executable, str(work / "tools" / "prep_parts.py"), "--pixel", "120",
                   "--overlap-px", "0", "--defringe-px", "2"], work, prep_log)
            # Regenerated image resources are imported afresh by the suite.
            changed = [path for path, digest in asset_hashes(project).items()
                       if digest != before_hashes.get(path)]
            assert json.loads((project / "parts.json").read_text())["overlap_px"] == 0
        else:
            changed = animation_edit(project, kind)
        result = suite(project, TEMP / f"mutant-{name}.json", announce=False)
        red = [number for number, case in result["tests"].items() if not case["passed"]]
        new_red = [number for number in red if baseline["tests"][number]["passed"]]
        worsened = []
        for joint in result["joints"]:
            key = (joint["mode"], joint["joint"], joint["limit"])
            before = baseline_joints[key]
            if joint["gap_pixels"] is not None and before["gap_pixels"] is not None and joint["gap_pixels"] > before["gap_pixels"]:
                worsened.append({"joint": "/".join(key), "before": before["gap_pixels"], "after": joint["gap_pixels"]})
        rejected = expected in red
        # A baseline-red check alone is insufficient evidence of a killed mutant.
        killed = rejected and (expected in new_red or (kind == "overlap" and bool(worsened)))
        report.append({"mutant": name, "kind": kind, "files_changed": changed, "expected_test": expected,
                       "observed_red_tests": red, "new_red_tests": new_red,
                       "worsened_joints": worsened, "status": "KILLED" if killed else "SURVIVED"})
        print(f"{'PASS' if killed else 'FAIL'} mutant {name}: expected {expected}; red {','.join(red)}; "
              f"{'KILLED' if killed else 'SURVIVED'}; increased-gap joints {len(worsened)}", flush=True)
        shutil.copy2(TEMP / f"mutant-{name}.json", PROTOTYPE / "tests" / "results" / f"mutant-{name}.json")
        shutil.copy2((TEMP / f"mutant-{name}.json").with_suffix(".godot.txt"),
                     PROTOTYPE / "tests" / "results" / f"mutant-{name}.godot.txt")
        if kind == "overlap":
            shutil.copy2(prep_log, PROTOTYPE / "tests" / "results" / "mutant-c.prep.txt")
        shutil.rmtree(work)
    lines = ["mutant | file changed | expected test | observed red tests | result",
             "--- | --- | --- | --- | ---"]
    for item in report:
        lines.append(f"{item['mutant']} ({item['kind']}) | {', '.join(item['files_changed'])} | "
                     f"{item['expected_test']} | {','.join(item['observed_red_tests'])} | {item['status']}")
    lines.extend(["", "Baseline red tests: " + ",".join(n for n, c in baseline["tests"].items() if not c["passed"]),
                  "KILLED requires a newly red expected test, or increased gap pixels for the already-red overlap test.",
                  "", json.dumps(report, indent=2)])
    (PROTOTYPE / "mutants.log").write_text("\n".join(lines) + "\n")
    (PROTOTYPE / "tests" / "results" / "mutants.json").write_text(json.dumps(report, indent=2) + "\n")
    phase("mutants", "end")
    return all(item["status"] == "KILLED" for item in report)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("suite", "mutants"))
    parser.add_argument("--output", type=Path, default=PROTOTYPE / "tests" / "results" / "real.json")
    args = parser.parse_args()
    guard()
    if args.mode == "mutants":
        return 0 if mutants() else 1
    phase("real-suite", "start")
    result = suite(PROTOTYPE, args.output.resolve())
    phase("real-suite", "end")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL infrastructure: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(2)
