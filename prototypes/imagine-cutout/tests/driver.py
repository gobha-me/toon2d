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
import shlex
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
RERUN_COMMAND: str | None = None
DEFERRED_EVIDENCE: Path | None = None


def record_deferred(reason: str, code: int = 75, log: Path | None = None) -> None:
    if RERUN_COMMAND is None:
        return
    path = REPO / ".codex-q" / "DEFERRED.md"
    path.parent.mkdir(exist_ok=True)
    with path.open("a") as stream:
        stream.write(f"\n- {datetime.now(ZoneInfo('UTC')).isoformat()} — DEFERRED; last exit {code}: {reason}\n"
                     f"  Rerun from repository root: `{RERUN_COMMAND}`\n")
    if DEFERRED_EVIDENCE is not None:
        DEFERRED_EVIDENCE.parent.mkdir(parents=True, exist_ok=True)
        with DEFERRED_EVIDENCE.open("a") as stream:
            stream.write(f"{datetime.now(ZoneInfo('UTC')).isoformat()} DEFERRED: {reason}; exit {code}\n")
            if log is not None and log.exists():
                stream.write(public_log(log.read_text()))


def mutation_guard() -> None:
    """Read-only gate before any mutation run; no process discovery for cleanup."""
    listing = subprocess.check_output(["ps", "-eo", "pid,pgid,sid,etime,args"], text=True)
    ancestors = {os.getpid()}
    cursor = os.getpid()
    while cursor > 1:
        # Parent IDs distinguish this invocation's wrappers from another run.
        stat = Path(f"/proc/{cursor}/stat").read_text().rsplit(")", 1)[1].split()
        cursor = int(stat[1])
        ancestors.add(cursor)
    for line in listing.splitlines()[1:]:
        fields = line.split(None, 4)
        if len(fields) != 5 or int(fields[0]) in ancestors:
            continue
        if re.search(r"(?:^|[ /])(?:run_mutants(?:\.sh)?|(?:runner\.sh|driver\.py)\s+(?:mutants|all-mutants|body-mutants))(?:\s|$)", fields[4]):
            record_deferred("another mutation run is live", 79)
            print("DEFERRED: another mutation run is live; re-check later", flush=True)
            raise SystemExit(79)


def guard() -> None:
    now = datetime.now(ZoneInfo("America/New_York"))
    if now.hour < 3 or (now.hour == 23 and now.minute >= 55):
        raise RuntimeError("quiet hours: no new work")
    for path in (REPO, TEMP):
        if shutil.disk_usage(path).free < 5 * 1024**3:
            raise RuntimeError(f"under 5 GiB free on {path}")


def phase(name: str, state: str) -> None:
    log = TEMP / "phases.txt"
    if log.exists():
        with log.open("a") as stream:
            stream.write(f"{datetime.now(ZoneInfo('UTC')).isoformat()} codexB {name} {state}\n")


def public_log(text: str) -> str:
    """Keep ephemeral paths and host identity out of public test evidence."""
    for path, label in ((str(TEMP), "<TMPDIR>"), (str(REPO), "<REPO>"),
                        (sys.executable, "<PYTHON>")):
        text = text.replace(path, label)
    return "\n".join(re.sub(r"^(slot[12] BUSY)\s+.*", r"\1 <other guarded job>", line)
                     for line in text.splitlines()
                     if not line.startswith("heavy-run: holding slot")) + "\n"


def overlap_inputs() -> tuple[Path, Path, list[str]]:
    """Resolve the packaged tool; source exports are optional, never invented."""
    tool = PROTOTYPE / "tools" / "prep_parts.py"
    candidates = (PROTOTYPE / "src", REPO / "src")
    source = next((p for p in candidates if (p / "parts" / "raw-hd").is_dir()), candidates[0])
    missing = []
    if not tool.is_file():
        missing.append("prototypes/imagine-cutout/tools/prep_parts.py")
    raw = source / "parts" / "raw-hd"
    # The preparer consumes all raw Segments images, including original.png.
    if not (raw / "original.png").is_file() or not any(raw.glob("*.png")):
        missing.append("src/parts/raw-hd Segments PNG inputs (including original.png; not committed)")
    return tool, source, missing


def heavy(command: list[str], cwd: Path, log: Path) -> None:
    """One worker; exit 75 never falls through to an unguarded invocation."""
    retry_seconds = float(os.environ.get("DRIVER_HEAVY_RETRY_SECONDS", "1800"))
    if retry_seconds < 0:
        raise ValueError("retry interval must be nonnegative")
    for attempt in range(1, 5):
        guard()
        now = datetime.now(ZoneInfo("America/New_York"))
        if now.hour == 23 and now.minute >= 40:
            record_deferred("23:40 ET attempt cutoff reached", 79)
            print("DEFERRED: 23:40 ET attempt cutoff reached (79)", flush=True)
            raise SystemExit(79)
        env = dict(os.environ, HEAVY_WAIT="30")
        heavy_program = shutil.which("heavy-run")
        if heavy_program is None:
            raise RuntimeError("heavy-run is required; refusing an unguarded command")
        process = subprocess.Popen([str(Path(heavy_program).resolve()), *command], cwd=cwd, env=env,
                                   stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                   text=True, start_new_session=True)
        def stop_child(signum, frame):
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait()
            raise SystemExit(128 + signum)
        previous = {sig: signal.signal(sig, stop_child) for sig in (signal.SIGINT, signal.SIGTERM)}
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
            log.write_text(public_log(output))
            raise RuntimeError(f"timed out process group {process.pid}; see {log.name}")
        finally:
            for sig, handler in previous.items():
                signal.signal(sig, handler)
        with log.open("a") as stream:
            stream.write(public_log(f"COMMAND {command!r}\n{output}\nEXIT {process.returncode}\n"))
        if process.returncode == 75:
            now = datetime.now(ZoneInfo("America/New_York"))
            stamp = now.astimezone(ZoneInfo("UTC")).isoformat()
            line = f"{stamp} DEFER heavy-run exit 75; attempt {attempt}/4"
            print(line, flush=True)
            with log.open("a") as stream:
                stream.write(line + "\n")
            cutoff = now.replace(hour=23, minute=40, second=0, microsecond=0)
            # Never sleep into the stop time or quiet hours.
            if attempt == 4 or now.hour < 3 or now.timestamp() + retry_seconds >= cutoff.timestamp():
                with log.open("a") as stream:
                    stream.write("DEFERRED exit 79\n")
                print("DEFERRED: heavy-run remains unavailable (79)", flush=True)
                record_deferred("heavy-run 75; attempt/time cap reached", log=log)
                raise SystemExit(79)
            time.sleep(retry_seconds)
            continue
        if process.returncode == 78:
            record_deferred("STOP: heavy-run configuration refusal", 78, log=log)
            print("STOP: heavy-run configuration refusal (78)", flush=True)
            raise SystemExit(78)
        if process.returncode != 0:
            raise RuntimeError(f"command failed ({process.returncode}): {command!r}\n{output[-6000:]}")
        if "SCRIPT ERROR:" in output or "Parse Error:" in output:
            raise RuntimeError(f"Godot script error:\n{output[-6000:]}")
        return


def clone(source: Path, destination: Path) -> None:
    guard()
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns(
        "renders", ".godot", "results", "__pycache__", "mutants.log"))
    # Imports/renders use one scene thread and at most two background workers.
    with (destination / "project.godot").open("a") as stream:
        stream.write("\n[threading]\nworker_pool/max_threads=2\n")


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


def suite(source: Path, output: Path, *, announce: bool = True,
          character: str = "trenchcoat") -> dict:
    from body_driver import read_manifest
    manifest = read_manifest(source, character)
    config = manifest["_character"]
    guard()
    work = Path(tempfile.mkdtemp(prefix="suite-", dir=TEMP))
    project = work / "prototype"
    captures = work / "captures"
    captures.mkdir()
    clone(source, project)
    prop = manifest["facing"]["weapon_part"]
    prop_slot = next(s for s in manifest["slots"] if s["part"] == prop)
    (captures / "legacy-config.json").write_text(json.dumps({
        "subject": config["subject"], "scenes": config["legacy_scenes"],
        "prop_node": "Gun" if prop == "gun" else "Part_" + prop,
        "hand_bone": prop_slot["bone"],
    }))
    log = work / "godot.txt"
    heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project), "--editor", "--import"], project, log)
    heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project), "--script", "res://tests/check_rig.gd",
           "--", "observe", str(captures)], project, log)
    observed = json.loads((captures / "observed.json").read_text())
    heavy(["godot", "--single-threaded-scene", "--path", str(project), "--audio-driver", "Dummy",
           "--script", "res://tests/check_rig.gd", "--", "render", str(captures)], project, log)
    joints = image_oracle(captures)
    cases = {}
    for number in ("1", "2", "3", "4"):
        errors = [f"{mode}: {error}" for mode in config["legacy_scenes"]
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


def animation_edit(project: Path, kind: str, character: str = "trenchcoat") -> list[str]:
    from body_driver import read_manifest
    manifest = read_manifest(project, character)
    changed = []
    for mode, scene in manifest["_character"]["legacy_scenes"].items():
        path = project / scene
        text = path.read_text()
        if kind == "bone":
            bone_name = "hair" if character == "trenchcoat" else manifest["facing"]["head_part"]
            # Remove a leaf bone and its attached sprite; preserve the JSON oracle.
            blocks = re.split(r"(?=^\[node )", text, flags=re.M)
            kept = [block for block in blocks if not (
                block.startswith(f'[node name="{bone_name}" type="Bone2D"') or
                block.startswith(f'[node name="Part_{bone_name}" '))]
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


def mutants(character: str = "trenchcoat") -> bool:
    from body_driver import read_manifest
    config = read_manifest(PROTOTYPE, character)["_character"]
    result_dir = PROTOTYPE / "tests" / "results" / character
    result_dir.mkdir(parents=True, exist_ok=True)
    missing = [config[key] for key in ("scene", "subject") if not (PROTOTYPE / config[key]).is_file()]
    if missing:
        report = [{"mutant": name, "status": "CANNOT_PLANT",
                   "reason": f"{character} rig/scene does not exist: " + ", ".join(missing)}
                  for name in ("a", "b", "d")]
        (result_dir / "legacy-mutants.json").write_text(json.dumps(report, indent=2) + "\n")
        print(f"{character}: mutants a,b,d CANNOT_PLANT; missing rig/scene", flush=True)
        return False
    phase("mutants", "start")
    baseline = suite(PROTOTYPE, TEMP / "baseline.json", announce=False, character=character)
    baseline_joints = {(j["mode"], j["joint"], j["limit"]): j for j in baseline["joints"]}
    report = []
    trials = [("a", "flash", "3"), ("b", "bone", "1"), ("d", "timing", "2")]
    if character == "trenchcoat":
        trials.insert(2, ("c", "overlap", "5"))
    for name, kind, expected in trials:
        print(f"Running mutant {name}: {kind}", flush=True)
        work = Path(tempfile.mkdtemp(prefix=f"mutant-{name}-", dir=TEMP))
        project = work / "prototypes" / "imagine-cutout"
        project.parent.mkdir()
        clone(PROTOTYPE, project)
        if kind == "overlap":
            guard()
            before_hashes = asset_hashes(project)
            tool, source, missing = overlap_inputs()
            if missing:
                reason = "; ".join(missing)
                report.append({"mutant": name, "kind": kind, "status": "SKIPPED",
                               "reason": reason, "files_changed": [], "expected_test": expected,
                               "observed_red_tests": [], "new_red_tests": [], "worsened_joints": []})
                print(f"SKIP mutant {name}: missing {reason}", flush=True)
                # Replace historical success evidence too: a skipped trial must
                # never leave an old KILLED result under its current filename.
                (result_dir / f"mutant-{name}.json").write_text(json.dumps(report[-1], indent=2) + "\n")
                for suffix in ("godot.txt", "prep.txt"):
                    (result_dir / f"mutant-{name}.{suffix}").write_text(f"SKIPPED: missing {reason}\n")
                shutil.rmtree(work)
                continue
            shutil.copytree(tool.parent, work / "tools", ignore=shutil.ignore_patterns("__pycache__"))
            shutil.copytree(source, work / "src")
            prep_log = work / "prep.txt"
            heavy([sys.executable, str(work / "tools" / "prep_parts.py"), "--pixel", "120",
                   "--overlap-px", "0", "--defringe-px", "2"], work, prep_log)
            # Regenerated image resources are imported afresh by the suite.
            changed = [path for path, digest in asset_hashes(project).items()
                       if digest != before_hashes.get(path)]
            assert json.loads((project / "parts.json").read_text())["overlap_px"] == 0
        else:
            changed = animation_edit(project, kind, character)
        result = suite(project, TEMP / f"mutant-{name}.json", announce=False, character=character)
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
        shutil.copy2(TEMP / f"mutant-{name}.json", result_dir / f"mutant-{name}.json")
        shutil.copy2((TEMP / f"mutant-{name}.json").with_suffix(".godot.txt"),
                     result_dir / f"mutant-{name}.godot.txt")
        if kind == "overlap":
            shutil.copy2(prep_log, result_dir / "mutant-c.prep.txt")
        shutil.rmtree(work)
    lines = ["mutant | file changed | expected test | observed red tests | result",
             "--- | --- | --- | --- | ---"]
    for item in report:
        lines.append(f"{item['mutant']} ({item['kind']}) | {', '.join(item['files_changed'])} | "
                     f"{item['expected_test']} | {','.join(item['observed_red_tests'])} | {item['status']}")
    lines.extend(["", "Baseline red tests: " + ",".join(n for n, c in baseline["tests"].items() if not c["passed"]),
                  "KILLED requires a newly red expected test, or increased gap pixels for the already-red overlap test.",
                  "", json.dumps(report, indent=2)])
    (result_dir / "mutants.txt").write_text("\n".join(lines) + "\n")
    (result_dir / "legacy-mutants.json").write_text(json.dumps(report, indent=2) + "\n")
    phase("mutants", "end")
    return all(item["status"] in ("KILLED", "SKIPPED") for item in report)


def main() -> int:
    global RERUN_COMMAND, DEFERRED_EVIDENCE
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("suite", "mutants", "body", "body-mutants", "all-mutants", "oracle"))
    parser.add_argument("--character", default="trenchcoat")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    replay = []
    for arg in sys.argv[1:]:
        if arg.startswith(str(REPO) + os.sep):
            arg = str(Path(arg).relative_to(REPO))
        replay.append(arg)
    RERUN_COMMAND = 'TEST_PYTHON="${TEST_PYTHON:-python3}" heavy-run prototypes/imagine-cutout/tests/runner.sh ' + shlex.join(replay)  # TEST_PYTHON if set, else python3
    guard()
    from body_driver import character_index
    if args.character not in character_index(PROTOTYPE)["characters"]:
        parser.error("unknown character: " + args.character)
    DEFERRED_EVIDENCE = (args.output.with_suffix(".deferred.txt") if args.output else
                         PROTOTYPE / "tests" / "results" / args.character / (args.mode + "-deferred.txt"))
    if args.mode in ("mutants", "body-mutants", "all-mutants"):
        mutation_guard()
    if args.mode == "oracle":
        import unittest
        from test_body_oracle import GapOracleControls, PoseCoverageControls, CharacterManifestControls
        from test_imagine_provenance import ImagineProvenanceControls
        checks = unittest.TestSuite(unittest.defaultTestLoader.loadTestsFromTestCase(case)
                                    for case in (GapOracleControls, PoseCoverageControls, CharacterManifestControls,
                                                 ImagineProvenanceControls))
        return 0 if unittest.TextTestRunner(verbosity=2).run(checks).wasSuccessful() else 1
    if args.mode in ("mutants", "all-mutants"):
        legacy_passed = mutants(args.character)
        if args.mode == "mutants":
            return 0 if legacy_passed else 1
        from body_driver import body_mutants
        return 0 if body_mutants(character=args.character) and legacy_passed else 1
    if args.mode in ("body", "body-mutants"):
        from body_driver import body_suite, body_mutants
        if args.mode == "body-mutants":
            return 0 if body_mutants(character=args.character) else 1
        result = body_suite(PROTOTYPE, args.output or PROTOTYPE / "tests" / "results" / args.character / "body.json",
                            character=args.character)
        return 0 if result["passed"] else 1
    phase("real-suite", "start")
    output = args.output or PROTOTYPE / "tests" / "results" / args.character / "legacy.json"
    result = suite(PROTOTYPE, output.resolve(), character=args.character)
    phase("real-suite", "end")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL infrastructure: {exc}", file=sys.stderr, flush=True)
        raise SystemExit(2)
