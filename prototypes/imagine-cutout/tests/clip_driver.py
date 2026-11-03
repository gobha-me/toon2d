#!/usr/bin/env python3
"""Clip acceptance and launcher-owned planted trials on disposable subjects."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from zoneinfo import ZoneInfo

import numpy as np
from PIL import Image

PROTOTYPE = Path(__file__).resolve().parent.parent
REPO = PROTOTYPE.parent.parent
TEMP = Path(os.environ["TMPDIR"]).resolve()
RESULTS = PROTOTYPE / "tests" / "results" / "trenchcoat-clips"
CLIPS = {"idle": 48, "aim": 10, "fire": 6, "cooldown": 14}
SCENES = ("hd", "pixel")
PAIRS = {
    "idle-loop": ("idle", -1, "idle", 0),
    "idle-aim": ("idle", 0, "aim", 0),
    "aim-fire": ("aim", -1, "fire", 0),
    "fire-cooldown": ("fire", -1, "cooldown", 0),
    "cooldown-idle": ("cooldown", -1, "idle", 0),
}
MUTANTS = ("m1", "m2", "m3", "m3b", "m4", "m4b", "m4c", "m5")
ROT_EPS = .000001
POS_EPS = .001


class HarnessError(RuntimeError):
    pass


class HeavyRefusal(HarnessError):
    def __init__(self, rc: int):
        self.rc = rc
        super().__init__(f"heavy-run exit {rc}; stopped without wait or retry")


def public(text: str) -> str:
    for path, label in ((str(TEMP), "<TMPDIR>"), (str(REPO), "<REPO>"),
                        (sys.executable, "<PYTHON>")):
        text = text.replace(path, label)
    return "\n".join(line for line in text.splitlines()
                     if not line.startswith("heavy-run: holding slot")) + "\n"


def guard() -> None:
    now = datetime.now(ZoneInfo("America/New_York"))
    if now.hour < 3 or (now.hour == 23 and now.minute >= 55):
        raise HarnessError("quiet hours: no new work")
    for path in (REPO, TEMP):
        if shutil.disk_usage(path).free < 5 * 1024**3:
            raise HarnessError("under 5 GiB free")


def contract() -> tuple[dict, dict]:
    manifest = json.loads((PROTOTYPE / "body_parts.yml").read_text())
    subject = json.loads((PROTOTYPE / "parts.json").read_text())
    # Reuse the existing test-owned schema, never production code.
    from body_driver import read_manifest
    read_manifest(PROTOTYPE)
    names = [j["name"] for j in subject["bones"]]
    assert len(names) == len(set(names)), "duplicate JSON joints"
    assert set(names) == {j["name"] for j in manifest["joints"]}, "joint inventory mismatch"
    return manifest, subject


def labels(clip: str) -> list[str]:
    return [*(f"f{n:02d}" for n in range(CLIPS[clip])), "end"]


def key_plan(manifest: dict, subject: dict) -> list[str]:
    keys = []
    for scene in SCENES:
        keys.extend(f"CL1:{scene}:{clip}:{j['name']}"
                    for clip in CLIPS for j in manifest["joints"])
        keys.extend(f"CL2:{scene}:{clip}:{sample}:{j['name']}"
                    for clip in CLIPS for sample in labels(clip) for j in subject["bones"])
        for pair in PAIRS:
            keys.extend(f"CL3:{scene}:{pair}:{j['name']}" for j in manifest["joints"])
            keys.append(f"CL3:{scene}:{pair}:hip.position")
        keys.extend(f"CL4:{scene}:{name}" for name in ("hip_y_min", "hip_y_max", "hem_range"))
        keys.extend(f"CL5:{scene}:{name}" for name in ("departure", "settle"))
    assert len(keys) == len(set(keys))
    return keys


def verdict(passed: bool, measured, threshold: str) -> dict:
    return {"status": "PASS" if passed else "FAIL", "measured": measured, "threshold": threshold}


def error(why: str) -> dict:
    return {"status": "ERROR", "why": public(why).strip()}


def finite(value) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise HarnessError("non-finite observation")
    return number


def path_for(manifest: dict, name: str) -> str:
    joints = {j["name"]: j for j in manifest["joints"]}
    chain = []
    while name is not None:
        chain.append(name)
        name = joints[name]["parent"]
    return "Skeleton2D/" + "/".join(reversed(chain))


def sample(observed: dict, manifest: dict, scene: str, clip: str, index: int,
           bone: str, prop: str = "rotation"):
    data = observed[scene][clip]
    if "error" in data:
        raise HarnessError(data["error"])
    if abs(finite(data["length"]) - CLIPS[clip] / 24) > ROT_EPS:
        raise HarnessError("clip length differs from frozen timing")
    target = path_for(manifest, bone) + ":" + prop
    tracks = [t for t in data["tracks"] if t["path"] == target]
    if len(tracks) != 1 or not tracks[0]["enabled"] or tracks[0]["type"] != 0:
        raise HarnessError("missing, disabled, duplicate or non-value track " + target)
    samples = data["samples"]
    if len(samples) != CLIPS[clip] + 1:
        raise HarnessError("incomplete sample schedule")
    state = samples[index]
    if "error" in state:
        raise HarnessError(state["error"])
    expected_time = data["length"] if index == -1 or index == CLIPS[clip] else index / 24
    if abs(finite(state["time"]) - expected_time) > ROT_EPS:
        raise HarnessError("sample time differs from frozen schedule")
    if prop == "rotation":
        return finite(state["angles"][bone])
    vector = state["positions"][bone]
    if len(vector) != 2:
        raise HarnessError("invalid position vector")
    return [finite(v) for v in vector]


def numeric_verdicts(observed: dict, manifest: dict) -> dict:
    results = {}

    def check(key, evaluate):
        try:
            results[key] = evaluate()
        except Exception as exc:
            results[key] = error(str(exc))

    def angle(scene, clip, index, bone):
        return sample(observed, manifest, scene, clip, index, bone)

    def hip_range(scene):
        ys = [sample(observed, manifest, scene, "idle", i, "hip", "position")[1]
              for i in range(CLIPS["idle"] + 1)]
        return max(ys) - min(ys)

    for scene in SCENES:
        for clip in CLIPS:
            for joint in manifest["joints"]:
                def limits(scene=scene, clip=clip, joint=joint):
                    values = [angle(scene, clip, i, joint["name"])
                              for i in range(CLIPS[clip] + 1)]
                    low, high = map(math.radians, joint["rotation_limits_deg"])
                    return verdict(min(values) >= low - ROT_EPS and max(values) <= high + ROT_EPS,
                                   {"min_rad": min(values), "max_rad": max(values)},
                                   f"[{low}, {high}] rad inclusive; roundoff {ROT_EPS}")
                check(f"CL1:{scene}:{clip}:{joint['name']}", limits)
        for pair, (a, i, b, k) in PAIRS.items():
            for joint in manifest["joints"]:
                def chain(scene=scene, a=a, i=i, b=b, k=k, name=joint["name"]):
                    delta = abs(angle(scene, a, i, name) - angle(scene, b, k, name))
                    return verdict(delta <= ROT_EPS, delta, f"<= {ROT_EPS} rad")
                check(f"CL3:{scene}:{pair}:{joint['name']}", chain)
            def position(scene=scene, a=a, i=i, b=b, k=k):
                left = sample(observed, manifest, scene, a, i, "hip", "position")
                right = sample(observed, manifest, scene, b, k, "hip", "position")
                delta = math.dist(left, right)
                return verdict(delta <= POS_EPS, delta, f"<= {POS_EPS} native px")
            check(f"CL3:{scene}:{pair}:hip.position", position)
        for name, bound in (("hip_y_min", 1.), ("hip_y_max", 6. if scene == "hd" else 2.)):
            def bob(scene=scene, name=name, bound=bound):
                measured = hip_range(scene)
                passed = measured >= bound - POS_EPS if name == "hip_y_min" else measured <= bound + POS_EPS
                return verdict(passed, measured,
                               f"{'>=' if name == 'hip_y_min' else '<='} {bound} native px; roundoff {POS_EPS}")
            check(f"CL4:{scene}:{name}", bob)
        def hems(scene=scene):
            ranges = {}
            for bone in ("hem_left", "hem_right"):
                values = [angle(scene, "idle", i, bone) for i in range(CLIPS["idle"] + 1)]
                ranges[bone] = math.degrees(max(values) - min(values))
            return verdict(max(ranges.values()) >= 1., ranges, "either hem range >= 1.0 deg")
        check(f"CL4:{scene}:hem_range", hems)
        def departure(scene=scene):
            aim = angle(scene, "aim", -1, "right_fore")
            degrees = [math.degrees(abs(angle(scene, "fire", i, "right_fore") - aim))
                       for i in range(CLIPS["fire"] + 1)]
            early_peak = max(degrees[1:3])
            return verdict(early_peak >= 1. and early_peak >= max(degrees),
                           {"f01_deg": degrees[1], "f02_deg": degrees[2],
                            "sample_deviations_deg": degrees},
                           ">= 1.0 deg at f01 or f02; overall sampled peak reached by f02")
        check(f"CL5:{scene}:departure", departure)
        def settle(scene=scene):
            delta = math.degrees(abs(angle(scene, "fire", -1, "right_fore") -
                                     angle(scene, "aim", -1, "right_fore")))
            return verdict(delta <= .1, delta, "<= 0.1 deg inclusive at fire endpoint")
        check(f"CL5:{scene}:settle", settle)
    return results


def gap_verdicts(captures: Path, subject: dict) -> dict:
    atlases = json.loads((captures / "clip-atlases.json").read_text())
    expected = [(scene, clip, label) for scene in SCENES for clip in CLIPS for label in labels(clip)]
    assert [(a["scene"], a["clip"], a["sample"]) for a in atlases] == expected, "incomplete/reordered atlas schedule"
    results = {}
    for atlas in atlases:
        scene, clip, label = atlas["scene"], atlas["clip"], atlas["sample"]
        radius = 32 if scene == "hd" else 3
        size = radius * 2 + 8
        assert atlas["size"] == size and atlas["radius"] == radius, "native tile size changed"
        assert [j["joint"] for j in atlas["joints"]] == [j["name"] for j in subject["bones"]]
        pixels = np.asarray(Image.open(captures / atlas["filename"]).convert("RGBA"))
        assert pixels.shape == (3 * size, len(subject["bones"]) * size, 4), "atlas dimensions changed"
        yy, xx = np.ogrid[:size, :size]
        disk = (xx + .5 - size / 2)**2 + (yy + .5 - size / 2)**2 <= radius**2
        for column, (item, joint) in enumerate(zip(atlas["joints"], subject["bones"])):
            key = f"CL2:{scene}:{clip}:{label}:{joint['name']}"
            if "error" in item:
                results[key] = error(item["error"])
                continue
            assert item["root"] == (joint["parent"] is None), "incorrect root classification"
            x = column * size
            parent = pixels[:size, x:x+size]
            child = pixels[size:2*size, x:x+size]
            actual = pixels[2*size:, x:x+size]
            stencil = (parent[:, :, 3] >= 128) & (child[:, :, 3] >= 128) & disk
            magenta = np.all(np.abs(actual[:, :, :3].astype(np.int16) - [255, 0, 255]) <= 3, axis=2)
            count, area = int((stencil & magenta).sum()), int(stencil.sum())
            results[key] = verdict(count == 0 and (area > 0 or item["root"]),
                                   {"gap_pixels": count, "stencil_pixels": area},
                                   "0 background pixels; nonempty stencil except root")
    return results


def announce(result: dict) -> None:
    for key, item in result["keys"].items():
        status = item["status"]
        if status == "PASS":
            print(f"PASS {key}", flush=True)
        elif status == "FAIL":
            print(f"FAIL {key}: {json.dumps(item['measured'], sort_keys=True)} vs {item['threshold']}", flush=True)
        else:
            print(f"ERROR {key}: {item['why']}", flush=True)
    for scene in SCENES:
        for case in ("CL1", "CL2", "CL3", "CL4", "CL5"):
            selected = [v["status"] for k, v in result["keys"].items() if k.startswith(f"{case}:{scene}:")]
            status = "ERROR" if "ERROR" in selected else "RED" if "FAIL" in selected else "GREEN"
            print(f"SUMMARY {case}:{scene}: {status} "
                  f"({selected.count('PASS')} PASS, {selected.count('FAIL')} FAIL, {selected.count('ERROR')} ERROR)", flush=True)


def write_result(output: Path, keys: dict, **extra) -> dict:
    statuses = [item["status"] for item in keys.values()]
    result = {"timestamp_utc": datetime.now(timezone.utc).isoformat(),
              "rc": 2 if "ERROR" in statuses else 1 if "FAIL" in statuses else 0,
              "keys": keys, **extra}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n")
    return result


def clone(source: Path, destination: Path) -> None:
    guard()
    shutil.copytree(source, destination, ignore=shutil.ignore_patterns(
        "renders", ".godot", "results", "__pycache__", "mutants.log"))


def heavy(command: list[str], project: Path, log: Path) -> None:
    guard()
    executable = shutil.which("heavy-run")
    if executable is None:
        raise HarnessError("heavy-run missing")
    digest = hashlib.sha256(Path(executable).read_bytes()).hexdigest()
    start = datetime.now(timezone.utc).isoformat()
    # No detaching, parallel jobs, retries, or fallback outside heavy-run.
    process = subprocess.run([executable, *command], cwd=project,
                             env=dict(os.environ, HEAVY_WAIT="30"),
                             stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    end = datetime.now(timezone.utc).isoformat()
    with log.open("a") as stream:
        stream.write(public(f"# heavy-run: <HEAVY_RUN> sha256 {digest}\n"
                            f"COMMAND {command!r}\nSTART {start}\n{process.stdout}\n"
                            f"END {end}\nEXIT {process.returncode}\n"))
    if process.returncode in (75, 78):
        raise HeavyRefusal(process.returncode)
    if process.returncode != 0:
        raise HarnessError(f"Godot process exit {process.returncode}; see Godot log")
    if any(marker in process.stdout for marker in ("SCRIPT ERROR:", "Parse Error:", "ERROR:")):
        raise HarnessError("Godot reported an error; see Godot log")


def suite(source: Path, output: Path, *, announce_keys: bool = True) -> dict:
    manifest, subject = contract()
    plan = key_plan(manifest, subject)
    output.parent.mkdir(parents=True, exist_ok=True)
    work = Path(tempfile.mkdtemp(prefix="clips-", dir=TEMP))
    project, captures, log = work / "prototype", work / "captures", work / "godot.txt"
    keys = {key: error("observation did not complete") for key in plan}
    refusal = None
    try:
        clone(source, project)
        captures.mkdir()
        heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project),
               "--editor", "--import"], project, log)
        heavy(["godot", "--single-threaded-scene", "--headless", "--path", str(project),
               "--script", "res://tests/check_clips.gd", "--", "observe", str(captures)], project, log)
        observed = json.loads((captures / "clip-observed.json").read_text())
        keys.update(numeric_verdicts(observed, manifest))
        heavy(["xvfb-run", "-a", "godot", "--single-threaded-scene", "--path", str(project),
               "--audio-driver", "Dummy", "--script", "res://tests/check_clips.gd",
               "--", "render", str(captures)], project, log)
        keys.update(gap_verdicts(captures, subject))
        assert set(keys) == set(plan), "unexpected verdict key"
        shutil.copy2(captures / "clip-observed.json", output.with_suffix(".observed.json"))
        shutil.copy2(captures / "clip-atlases.json", output.with_suffix(".atlases.json"))
        # Keep every fresh native atlas for diagnosis, including empty stencils.
        images = output.parent / (output.stem + "-images")
        images.mkdir(exist_ok=True)
        for image in captures.glob("*.png"):
            shutil.copy2(image, images / image.name)
    except Exception as exc:
        if isinstance(exc, HeavyRefusal):
            refusal = exc.rc
        keys = {key: item if item["status"] != "ERROR" else error(str(exc)) for key, item in keys.items()}
        # A schedule/oracle exception after some observation is infrastructure,
        # even if every numeric check was already evaluated.
        if not any(item["status"] == "ERROR" for item in keys.values()):
            keys = {key: error(str(exc)) for key in plan}
    finally:
        if log.exists():
            shutil.copy2(log, output.with_suffix(".godot.txt"))
        dumps = [p for p in work.rglob("*") if p.is_file() and
                 (re.fullmatch(r"core(?:\.\d+)?", p.name) or p.suffix == ".core")]
        if dumps:
            keys = {key: error("core dump requires investigation") for key in plan}
        shutil.rmtree(work)
    result = write_result(output, {key: keys[key] for key in plan}, heavy_refusal=refusal,
                          manifest_sha256=hashlib.sha256((PROTOTYPE / "body_parts.yml").read_bytes()).hexdigest())
    if announce_keys:
        announce(result)
    return result


def edit_animation(scene: Path, clip: str, bone: str, prop: str, operation) -> None:
    text = scene.read_text()
    blocks = re.split(r"(?=^\[(?:sub_resource|node) )", text, flags=re.M)
    indices = [i for i, block in enumerate(blocks) if f'resource_name = "{clip}"\n' in block]
    assert len(indices) == 1, "cannot locate clip for plant"
    block = blocks[indices[0]]
    tracks = re.findall(r'tracks/(\d+)/path = NodePath\("([^"\n]+)"\)', block)
    tracks = [i for i, path in tracks if path.endswith("/" + bone + ":" + prop)]
    assert len(tracks) == 1, "cannot locate target track for plant"
    track = tracks[0]
    pattern = rf'(tracks/{track}/keys = \{{\n)(.*?)(\n\}})'
    matches = list(re.finditer(pattern, block, flags=re.S))
    assert len(matches) == 1, "cannot locate track keys"
    match = matches[0]
    content = match.group(2)
    times_match = re.search(r'"times": PackedFloat32Array\(([^)]*)\)', content)
    values_match = re.search(r'"values": \[(.*?)\]', content, flags=re.S)
    assert times_match and values_match
    times = [float(t) for t in times_match.group(1).split(",")]
    if prop == "rotation":
        values = [float(v) for v in values_match.group(1).split(",")]
    else:
        values = [[float(v) for v in xy.split(",")] for xy in
                  re.findall(r'Vector2\(([^)]*)\)', values_match.group(1))]
    assert len(values) == len(times), "key/value count mismatch"
    before = json.dumps(values)
    operation(times, values)
    assert json.dumps(values) != before, "plant was a no-op"
    if prop == "rotation":
        replacement = ", ".join(repr(v) for v in values)
    else:
        replacement = ", ".join(f"Vector2({v[0]!r}, {v[1]!r})" for v in values)
    content = content[:values_match.start(1)] + replacement + content[values_match.end(1):]
    blocks[indices[0]] = block[:match.start(2)] + content + block[match.end(2):]
    scene.write_text("".join(blocks))


def at_time(times: list[float], time_: float) -> int:
    indices = [i for i, t in enumerate(times) if abs(t - time_) <= ROT_EPS]
    assert len(indices) == 1, "plant time not unique"
    return indices[0]


def plant(project: Path, mutant: str, manifest: dict) -> dict:
    if mutant == "m2":
        # Exactly the established zero_overlap plant, HD texture and declaration
        # only. Importing this test helper does not run its suites or mutants.
        from body_driver import plant as body_plant
        return body_plant(project, "zero_overlap")
    joints = {j["name"]: j for j in manifest["joints"]}
    for scene in SCENES:
        path = project / "scenes" / f"{scene}.tscn"
        def change(times, values):
            if mutant == "m1":
                values[0] = math.radians(joints["hem_left"]["rotation_limits_deg"][1] + .5)
            elif mutant in ("m3", "m3b", "m5"):
                time_ = 2. if mutant == "m3" else 0. if mutant == "m3b" else .25
                index = at_time(times, time_)
                values[index] += math.radians(1.)
            elif mutant == "m4":
                first = list(values[at_time(times, 0.)])
                values[:] = [list(first) for _ in values]
            elif mutant == "m4b":
                values[at_time(times, .5)][1] -= 1.
            elif mutant == "m4c":
                values[:] = [0. for _ in values]
            else:
                raise HarnessError("unlisted mutant")
        clip = "fire" if mutant in ("m3b", "m5") else "idle"
        bone = {"m1": "hem_left", "m3": "torso", "m3b": "right_upper",
                "m4": "hip", "m4b": "hip", "m4c": "hem_left", "m5": "right_fore"}[mutant]
        prop = "position" if mutant in ("m4", "m4b") else "rotation"
        edit_animation(path, clip, bone, prop, change)
        if mutant == "m4c":
            edit_animation(path, "idle", "hem_right", "rotation", change)
    return {"files_changed": [f"scenes/{scene}.tscn" for scene in SCENES]}


def targets(mutant: str, keys: dict) -> list[str]:
    if mutant == "m2":
        return [key for key in keys if key.startswith("CL2:hd:") and key.endswith(":right_fore")]
    suffix = {
        "m1": ("CL1", "idle:hem_left"), "m3": ("CL3", "idle-loop:torso"),
        "m3b": ("CL3", "aim-fire:right_upper"), "m4": ("CL4", "hip_y_min"),
        "m4b": ("CL4", "hip_y_max"), "m4c": ("CL4", "hem_range"),
        "m5": ("CL5", "settle"),
    }[mutant]
    return [f"{suffix[0]}:{scene}:{suffix[1]}" for scene in SCENES]


def mutant_trials(output: Path) -> int:
    manifest, _ = contract()
    baseline = suite(PROTOTYPE, output.parent / "baseline.json")
    report = []
    if baseline["rc"] == 2:
        # An incomplete baseline cannot establish GREEN target preconditions.
        for name in MUTANTS:
            print(f"Running mutant {name}", flush=True)
            print(f"SKIP mutant {name}: baseline harness ERROR; no plant executed", flush=True)
            report.append({"mutant": name, "status": "SKIPPED", "reason": "baseline harness ERROR"})
        rc = baseline.get("heavy_refusal") or 2
        output.write_text(json.dumps({"rc": rc, "mutants": report}, indent=2) + "\n")
        return rc
    infrastructure = False
    refusal = None
    for name in MUTANTS:
        print(f"Running mutant {name}", flush=True)
        target = targets(name, baseline["keys"])
        green = {key for key in target if baseline["keys"][key]["status"] == "PASS"}
        if not green:
            print(f"SKIP mutant {name}: target keys RED at base {json.dumps(target)}", flush=True)
            report.append({"mutant": name, "status": "SKIPPED", "targets": target,
                           "reason": "target keys RED at base"})
            continue
        work = Path(tempfile.mkdtemp(prefix="clip-trial-", dir=TEMP))
        try:
            project = work / "prototype"
            clone(PROTOTYPE, project)
            planted = plant(project, name, manifest)
            if "skip" in planted:
                print(f"SKIP mutant {name}: {planted['skip']}", flush=True)
                report.append({"mutant": name, "status": "SKIPPED", **planted})
                continue
            trial = suite(project, output.parent / f"mutant-{name}.json")
            red_before = {key for key, item in baseline["keys"].items() if item["status"] == "FAIL"}
            red_after = {key for key, item in trial["keys"].items() if item["status"] == "FAIL"}
            new_red = sorted(key for key in red_after if baseline["keys"][key]["status"] == "PASS")
            new_green = sorted(key for key in red_before if trial["keys"][key]["status"] == "PASS")
            killed_keys = sorted(green & set(new_red))
            # Require each scene's exact target to change for two-scene plants.
            # m2 has an existential target by contract and affects HD only.
            killed = trial["rc"] != 2 and (bool(killed_keys) if name == "m2" else green == set(killed_keys))
            status = "KILLED" if killed else "SURVIVED"
            if trial["rc"] == 2:
                infrastructure = True
                print(f"SKIP mutant {name}: trial harness ERROR; never a kill", flush=True)
                status = "ERROR"
            elif killed:
                print(f"PASS mutant {name}: KILLED {json.dumps(killed_keys)}", flush=True)
            else:
                print(f"FAIL mutant {name}: SURVIVED", flush=True)
            print(f"DELTA mutant {name}: new RED {json.dumps(new_red)}; new GREEN {json.dumps(new_green)}", flush=True)
            report.append({"mutant": name, "status": status, "targets": target,
                           "green_targets": sorted(green), "killed_keys": killed_keys,
                           "new_red": new_red, "new_green": new_green, **planted})
            if trial.get("heavy_refusal") in (75, 78):
                # Refusals stop the invocation; the launcher owns any retry.
                refusal = trial["heavy_refusal"]
                break
        except Exception as exc:
            infrastructure = True
            print(f"SKIP mutant {name}: harness ERROR {public(str(exc)).strip()}", flush=True)
            report.append({"mutant": name, "status": "ERROR", "reason": public(str(exc)).strip()})
            break
        finally:
            shutil.rmtree(work)
    rc = refusal or (2 if infrastructure else 0 if len(report) == len(MUTANTS) and
                     all(r["status"] == "KILLED" for r in report) else 1)
    output.write_text(json.dumps({"rc": rc, "mutants": report}, indent=2) + "\n")
    return rc


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("clips", "clip-mutants"))
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    guard()
    RESULTS.mkdir(parents=True, exist_ok=True)
    output = args.output or RESULTS / ("clips.json" if args.mode == "clips" else "mutants.json")
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    if args.mode == "clip-mutants":
        return mutant_trials(output)
    result = suite(PROTOTYPE, output)
    return result.get("heavy_refusal") or result["rc"]


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        # Initialization errors also use only valid key forms, never a made-up
        # infrastructure key. If the contract itself is unreadable, use its
        # frozen test-owned inventory to emit the entire unevaluable schedule.
        from body_driver import JOINT_NAMES
        fallback = {"joints": [{"name": name} for name in JOINT_NAMES]}
        subject = {"bones": fallback["joints"]}
        result = {"keys": {key: error(str(exc)) for key in key_plan(fallback, subject)}}
        announce(result)
        raise SystemExit(2)
