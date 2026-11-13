#!/usr/bin/env python3
"""Retain char2 evidence without changing the committed acceptance tests.

Run body/rendered work through the required external heavy guard. Mutation modes
also require the external shared engine mutation lock. All commands run one at a
time; the test driver retains its own guard, retry policy and 600-second child
deadline. This wrapper adds no deadline overrides.

Oracle and harness controls read the checkout and write only to private scratch.
The oracle needs the real Git index to authenticate committed source inventory.
Body and mutation checks use a disposable prototype snapshot, and their default
tests/results outputs are copied only to validation/char2-imagine.
Legacy mode runs the unchanged char2 hierarchy, clip timing, flash, rigidity and
rendered gap checks in that snapshot. Full mode runs legacy after harness and
before body acceptance, followed by provenance and rendered body mutants.

Interrupted/error attempts retain sanitized transcripts, available reports and
private scratch for investigation. The core scan covers only dumps surviving in
this outer scratch directory. The immutable nested body harness can remove its
own scratch, including a dump, before this wrapper can inspect it; this wrapper
does not guarantee retention of those nested dumps.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[1]
REPO = PROJECT.parents[1]
DESTINATION = PROJECT / "validation/char2-imagine"
MODES = ("oracle", "harness", "legacy", "body", "provenance-mutants", "body-mutants")
IGNORED = {"validation", "results", "renders", ".godot", "__pycache__", ".git"}
CORE_SCAN_SCOPE = "Surviving outer scratch only; nested harness cleanup can remove its own dumps before this scan."


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def ignore(directory, names):
    return [name for name in names if name in IGNORED or name.endswith((".log", ".pyc"))]


def source_hashes(project: Path) -> dict[str, str]:
    hashes = {}
    for root, directories, files in os.walk(project):
        directories[:] = sorted(name for name in directories if name not in IGNORED)
        for name in sorted(files):
            if name.endswith((".log", ".pyc")):
                continue
            path = Path(root) / name
            hashes[path.relative_to(project).as_posix()] = hashlib.sha256(path.read_bytes()).hexdigest()
    # The oracle deliberately compares the historical trenchcoat pose values.
    historical = project / "tests/results/body-parts/red-first.poses.json"
    if historical.is_file():
        hashes[historical.relative_to(project).as_posix()] = hashlib.sha256(historical.read_bytes()).hexdigest()
    return hashes


def public_text(value: str, work: Path) -> str:
    replacements = ((str(PROJECT), "<PROJECT>"), (str(REPO), "<REPO>"),
                    (str(work), "<SCRATCH>"), (os.environ["TMPDIR"], "<TMPDIR>"),
                    (sys.executable, "<PYTHON>"))
    for path, label in sorted(replacements, key=lambda item: -len(item[0])):
        value = value.replace(path, label)
    hostname = os.environ.get("HOSTNAME")
    if hostname:
        value = value.replace(hostname, "<HOST>")
    return "\n".join(re.sub(r"^(slot[12] BUSY)\s+.*", r"\1 <other guarded job>", line)
                     for line in value.splitlines()
                     if not line.startswith("heavy-run: holding slot")) + "\n"


def copy_evidence(source: Path, destination: Path, work: Path) -> list[str]:
    inventory = []
    if not source.is_dir():
        return inventory
    for path in sorted(source.rglob("*")):
        if not path.is_file():
            continue
        relative = path.relative_to(source)
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if path.suffix in (".json", ".txt", ".log", ".tsv", ".md"):
            target.write_text(public_text(path.read_text(), work))
        else:
            shutil.copy2(path, target)
        inventory.append(relative.as_posix())
    return inventory


def core_dumps(work: Path) -> list[Path]:
    """Find surviving outer-scratch dumps; nested harness cleanup is unchanged."""
    return [path for path in work.rglob("*") if path.is_file() and
            (re.fullmatch(r"core(?:\.\d+)?", path.name) or path.suffix == ".core")]


def available_target(destination: Path, mode: str) -> Path:
    """Keep prior attempts intact, including deferred or failed evidence."""
    target = destination / mode
    number = 2
    while target.exists():
        target = destination / (mode + "-" + str(number))
        number += 1
    target.mkdir(parents=True)
    return target


def command_for(mode: str) -> list[str]:
    return {
        "oracle": ["bash", "tests/runner.sh", "oracle", "--character", "char2"],
        "harness": [sys.executable, "tests/test_harness_policy.py"],
        "legacy": ["bash", "tests/run_tests.sh", "--character", "char2",
                   "--output", "tests/results/char2/real.json"],
        "body": ["bash", "tests/run_body_tests.sh", "--character", "char2"],
        "provenance-mutants": [sys.executable, "tests/run_imagine_mutants.py",
                               "--output", "tests/results/char2/provenance-mutants.json"],
        "body-mutants": ["bash", "tests/runner.sh", "body-mutants", "--character", "char2"],
    }[mode]


def verdict(mode: str, results: Path) -> dict:
    """Summarize real reports, including the rendered mutants' green control."""
    if mode == "legacy":
        report = json.loads((results / "char2/real.json").read_text())
        tests = report["tests"]
        return {"baseline_passed": report["passed"],
                "tests": {number: case["passed"] for number, case in tests.items()},
                "test_names": {number: case["name"] for number, case in tests.items()},
                "passed": report["passed"] is True and set(tests) == {"1", "2", "3", "4", "5"} and
                          all(case["passed"] is True for case in tests.values())}
    if mode in ("body", "body-mutants"):
        baseline = json.loads((results / "char2/body.json").read_text())
        summary = {"baseline_passed": baseline["passed"],
                   "full_acceptance_run": baseline["full_acceptance_run"],
                   "pose_counts": baseline["pose_counts"],
                   "pose_sha256": baseline["pose_sha256"],
                   "manifest_sha256": baseline["manifest_sha256"],
                   "tests": {name: test["passed"] for name, test in baseline["tests"].items()}}
        if mode == "body-mutants":
            mutants = json.loads((results / "char2/mutants.json").read_text())
            summary["mutants"] = [{"mutant": item["mutant"], "status": item["status"]}
                                  for item in mutants]
            summary["passed"] = baseline["passed"] and len(mutants) == 4 and all(
                item["status"] == "KILLED" for item in mutants)
        else:
            summary["passed"] = baseline["passed"]
        return summary
    if mode == "provenance-mutants":
        report = json.loads((results / "char2/provenance-mutants.json").read_text())
        return {"baseline_passed": report["baseline"]["passed"], "passed": report["passed"],
                "mutants": [{"mutant": item["mutant"], "status": item["status"]}
                            for item in report["mutants"]]}
    return {}


def run_command(command: list[str], project: Path, env: dict, raw_log: Path) -> int:
    with raw_log.open("w") as stream:
        process = subprocess.Popen(command, cwd=project, env=env, stdout=stream,
                                   stderr=subprocess.STDOUT, start_new_session=True)
        previous = {}

        def stop_child():
            # This process group was created and recorded immediately above.
            try:
                os.killpg(process.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                process.wait()

        def interrupted(signum, frame):
            # Let the original wait unwind and release Popen's waitpid lock
            # before cleanup waits for the same child.
            raise SystemExit(128 + signum)

        try:
            previous = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGINT, signal.SIGTERM)}
            try:
                return process.wait()
            except BaseException:
                stop_child()
                raise
        finally:
            for sig, handler in previous.items():
                signal.signal(sig, handler)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("mode", choices=(*MODES, "full"))
    parser.add_argument("--output", type=Path, default=DESTINATION,
                        help="evidence directory under validation/char2-imagine")
    args = parser.parse_args()
    destination = args.output.resolve()
    if not destination.is_relative_to(DESTINATION.resolve()):
        parser.error("--output must stay under validation/char2-imagine")
    destination.mkdir(parents=True, exist_ok=True)
    modes = MODES if args.mode == "full" else (args.mode,)
    work = Path(tempfile.mkdtemp(prefix="char2-validation-", dir=os.environ["TMPDIR"]))
    records = []
    snapshot = work / "repo/prototypes/imagine-cutout"
    result = 0
    preserve = False
    head = None
    active = None
    target = raw_log = None
    results = snapshot / "tests/results"
    started = utc_now()

    def interrupted(signum, frame):
        raise SystemExit(128 + signum)

    # Keep interruption handling active during snapshotting and evidence writes
    # as well as the child wait. run_command restores these handlers on return.
    previous = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGINT, signal.SIGTERM)}
    try:
        if any(mode not in ("oracle", "harness") for mode in modes):
            shutil.copytree(PROJECT, snapshot, ignore=ignore)
        env = dict(os.environ, TMPDIR=str(work), TEST_PYTHON=sys.executable,
                   PYTHONDONTWRITEBYTECODE="1", MAKEFLAGS="-j2", OMP_NUM_THREADS="2",
                   OPENBLAS_NUM_THREADS="2", LP_NUM_THREADS="2",
                   XDG_DATA_HOME=str(work / "xdg-data"), XDG_CONFIG_HOME=str(work / "xdg-config"),
                   XDG_CACHE_HOME=str(work / "xdg-cache"))
        head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=PROJECT, text=True).strip()
        for mode in modes:
            target = available_target(destination, mode)
            project = PROJECT if mode in ("oracle", "harness") else snapshot
            # Separate result directories prevent evidence from a preceding mode
            # from masquerading as this mode's output. Only private copies move.
            if mode not in ("oracle", "harness"):
                results.mkdir(parents=True, exist_ok=True)
            command = command_for(mode)
            raw_log = work / (mode + ".txt")
            record = {"mode": mode, "started_utc": utc_now(), "head": head,
                      "cwd": "<PROJECT>", "command": shlex.join([
                          "<PYTHON>" if arg == sys.executable else arg for arg in command]),
                      "output": target.relative_to(PROJECT).as_posix(), "state": "running"}
            active = record
            record["inputs"] = source_hashes(project)
            print(mode + ": started " + record["started_utc"], flush=True)
            rc = run_command(command, project, env, raw_log)
            record.update(finished_utc=utc_now(), command_exit=rc, exit=rc)
            if rc < 0 or rc in (130, 143):
                preserve = True
                rc = 128 - rc if rc < 0 else rc
                record.update(exit=rc, state="interrupted", scratch_preserved=True)
            (target / "transcript.txt").write_text(public_text(raw_log.read_text(), work))
            if rc == 0 and mode not in ("oracle", "harness"):
                try:
                    record["verdict"] = verdict(mode, results)
                    if not record["verdict"]["passed"]:
                        rc = 1
                        record.update(exit=rc, error="report does not certify a green acceptance control and all required kills")
                except (OSError, ValueError, KeyError, TypeError) as exc:
                    rc = 1
                    record.update(exit=rc, error="missing or invalid real report: " + public_text(str(exc), work).strip())
            record["evidence"] = copy_evidence(results, target / "results", work)
            if results.exists():
                # Move our private result tree rather than deleting any checkout
                # evidence. The next mode starts with an empty results directory.
                results.rename(work / (mode + "-results"))
            dumps = core_dumps(work)
            record["core_dumps"] = [{"file": path.relative_to(work).as_posix(), "bytes": path.stat().st_size}
                                    for path in dumps]
            record["core_scan_scope"] = CORE_SCAN_SCOPE
            preserve = preserve or bool(dumps)
            if dumps:
                rc = rc or 2
                record["exit"] = rc
                record["core_investigation_required"] = True
            if record["state"] != "interrupted":
                record["state"] = "completed"
            (target / "verification.json").write_text(json.dumps(record, indent=2) + "\n")
            records.append(record)
            active = None
            raw_log = None
            print(mode + ": exit " + str(rc) + "; " + record["output"], flush=True)
            if rc:
                result = rc if rc in (75, 78, 79) or record["state"] == "interrupted" else 1
                # A refusal or a core dump must not fall through to another job.
                if rc in (75, 78, 79) or preserve:
                    break
        summary = {"created_utc": utc_now(), "head": head, "requested_mode": args.mode,
                   "passed": result == 0 and len(records) == len(modes), "exit": result,
                   "records": records}
        (destination / "verification.json").write_text(json.dumps(summary, indent=2) + "\n")
        return result
    except BaseException as exc:
        # Set this before any persistence work: even an error while copying a
        # partial report must leave the original private files recoverable.
        preserve = True
        status = (exc.code if isinstance(exc, SystemExit) and isinstance(exc.code, int) else
                  130 if isinstance(exc, KeyboardInterrupt) else 1)
        try:
            if active is None:
                target = available_target(destination, "initialization")
                active = {"mode": args.mode, "started_utc": started, "head": head,
                          "output": target.relative_to(PROJECT).as_posix()}
            active.setdefault("command_exit", None)
            active.update(finished_utc=utc_now(), exit=status, scratch_preserved=True,
                          state="interrupted" if isinstance(exc, (SystemExit, KeyboardInterrupt)) else "error",
                          error=public_text(type(exc).__name__ + ": " + str(exc), work).strip())
            transcript = raw_log.read_text(errors="replace") if raw_log is not None and raw_log.is_file() else "NOT STARTED\n"
            (target / "transcript.txt").write_text(public_text(transcript, work))
            try:
                active["evidence"] = copy_evidence(results, target / "results", work)
            except Exception as copy_error:
                active["evidence_copy_error"] = public_text(str(copy_error), work).strip()
                active["evidence"] = [path.relative_to(target / "results").as_posix()
                                      for path in sorted((target / "results").rglob("*")) if path.is_file()]
            active["core_dumps"] = [{"file": path.relative_to(work).as_posix(), "bytes": path.stat().st_size}
                                    for path in core_dumps(work)]
            active["core_scan_scope"] = CORE_SCAN_SCOPE
            (target / "verification.json").write_text(json.dumps(active, indent=2) + "\n")
            if not any(record is active for record in records):
                records.append(active)
            summary = {"created_utc": utc_now(), "head": head, "requested_mode": args.mode,
                       "passed": False, "exit": status, "records": records}
            (destination / "verification.json").write_text(json.dumps(summary, indent=2) + "\n")
        except Exception as persistence_error:
            # A full filesystem must not replace an interrupted command's status.
            print("Could not finish public evidence persistence; private scratch remains: " +
                  public_text(str(persistence_error), work).strip(), file=sys.stderr)
        # Preserve the existing signal exit status and unexpected-error behavior.
        raise
    finally:
        try:
            dumps = core_dumps(work)
        except OSError:
            dumps = []
            preserve = True
        if dumps:
            preserve = True
        if preserve:
            print("Private validation scratch retained for investigation: " + str(work), file=sys.stderr)
        else:
            shutil.rmtree(work)
        for sig, handler in previous.items():
            signal.signal(sig, handler)


if __name__ == "__main__":
    raise SystemExit(main())
