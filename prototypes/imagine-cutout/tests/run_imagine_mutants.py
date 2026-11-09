#!/usr/bin/env python3
"""Plant source/trace regressions in copies; require every trial to be killed.

Run through the shared mutation lock and the externally supplied heavy guard.
--fixture proves provenance-validator sensitivity while no char2 rig exists;
it is never a substitute for the four rendered body mutants e/f/g/h.
"""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import tempfile

from body_driver import read_manifest
from driver import PROTOTYPE, guard
from imagine_fixture import make_fixture
from imagine_provenance import provenance_suite


def edit(path, change):
    data = json.loads(path.read_text())
    change(data)
    path.write_text(json.dumps(data, indent=2) + "\n")


# Each trial must introduce this specific failure, absent from the green control.
TRIALS = (
    ("i", "missing source image", "source/call1-base-best.jpg/image"),
    ("j", "missing source sidecar", "source/seg-be6a-red-hair.png/sidecar"),
    ("k", "changed source bytes", "source/call1-base-best.jpg/hash"),
    ("l", "approximate call presented as exact", "source/seg-be6a-red-hair.png/approximate"),
    ("m", "missing derived sidecar", "provenance/part/head/sidecar"),
    ("n", "lost Imagine trace", "provenance/part/head/required-sources"),
    ("o", "unflagged scripted satchel", "provenance/part/satchel/flag"),
    ("p", "Imagine head replaced with scripted fallback", "provenance/part/head/slot-class"),
    ("q", "missing head declaration", "provenance/slot/head_face"),
    ("r", "unclassified extra backing", "provenance/part/extra_backing/classification"),
    ("s", "changed runtime texture bytes", "provenance/part/head/metadata/output_sha256"),
    ("t", "invented recorded prompt", "source/call1-base-best.jpg/metadata/prompt"),
)


def plant(root, manifest, name):
    source = root / "characters/char2/imagine-source"
    subject = root / manifest["_character"]["subject"]
    parts = json.loads(subject.read_text())["parts"]
    head = next(part for part in parts if part["id"] == "head")
    head_texture = root / head["texture_hd"]
    head_sidecar = head_texture.with_suffix(".gen.json")
    if name == "i":
        (source / "call1-base-best.jpg").unlink()
    elif name == "j":
        (source / "seg-be6a-red-hair.gen.json").unlink()
    elif name == "k":
        with (source / "call1-base-best.jpg").open("ab") as stream:
            stream.write(b"planted-source-corruption")
    elif name == "l":
        edit(source / "seg-be6a-red-hair.gen.json", lambda d: d.pop("utc_time_is_approximate"))
    elif name == "m":
        head_sidecar.unlink()
    elif name == "n":
        edit(head_sidecar, lambda d: d.update(imagine_sources=[]))
    elif name == "o":
        edit(subject, lambda d: next(p for p in d["parts"] if p["id"] == "satchel").update(scripted_fallback=False))
    elif name == "p":
        edit(subject, lambda d: next(p for p in d["parts"] if p["id"] == "head").update(
            classification="SCRIPTED (flagged)", scripted_fallback=True))
    elif name == "q":
        edit(subject, lambda d: d.update(parts=[p for p in d["parts"] if p["id"] != "head"]))
    elif name == "r":
        edit(subject, lambda d: d["parts"].append({"id": "extra_backing"}))
    elif name == "s":
        with head_texture.open("ab") as stream:
            stream.write(b"planted-output-corruption")
    elif name == "t":
        edit(source / "call1-base-best.gen.json", lambda d: d.update(prompt="unrecorded replacement prompt"))
    else:
        raise ValueError("unknown planted mutant")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", action="store_true", help="use an explicitly labelled provenance-only control subject")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    guard()
    manifest = read_manifest(PROTOTYPE, "char2")
    with tempfile.TemporaryDirectory(prefix="imagine-mutants-", dir=os.environ["TMPDIR"]) as scratch:
        scratch = Path(scratch)
        baseline_root = scratch / "baseline"
        if args.fixture:
            manifest = make_fixture(PROTOTYPE, baseline_root, manifest)
        else:
            shutil.copytree(PROTOTYPE, baseline_root,
                            ignore=shutil.ignore_patterns(".godot", "results", "renders", "__pycache__"))
        baseline = provenance_suite(baseline_root, manifest)
        report = {"timestamp_utc": datetime.now(timezone.utc).isoformat(),
                  "scope": "provenance-only control fixture; NOT rig acceptance" if args.fixture else "actual char2 provenance",
                  "baseline": baseline, "mutants": []}
        before = {e["case_id"] for e in baseline["errors"]}
        for name, description, expected in TRIALS:
            guard()
            if not baseline["passed"]:
                item = {"mutant": name, "description": description, "status": "CANNOT_PLANT",
                        "reason": "provenance baseline is red; no existing error counts as a kill"}
            else:
                project = scratch / ("mutant-" + name)
                shutil.copytree(baseline_root, project)
                plant(project, manifest, name)
                observed = provenance_suite(project, manifest)
                new_errors = {e["case_id"] for e in observed["errors"]} - before
                killed = not observed["passed"] and expected in new_errors
                item = {"mutant": name, "description": description, "expected_failure": expected,
                        "status": "KILLED" if killed else "SURVIVED", "new_failure_cases": sorted(new_errors),
                        "observed": observed}
                shutil.rmtree(project)
            report["mutants"].append(item)
            print("{} {}: {}".format(name, description, item["status"]), flush=True)
        report["passed"] = (baseline["passed"] and len(report["mutants"]) == len(TRIALS) > 0 and
                            all(item["status"] == "KILLED" for item in report["mutants"]))
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, indent=2) + "\n")
        print("{}/{} KILLED; {}".format(sum(m["status"] == "KILLED" for m in report["mutants"]),
                                      len(TRIALS), report["scope"]), flush=True)
        return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
