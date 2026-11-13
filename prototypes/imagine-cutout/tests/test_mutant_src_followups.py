"""Regression coverage for explicit source selection and parse-time resolution."""
import contextlib
import io
import json
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

import driver


def invoke_main(mode, source):
    with patch.object(sys, "argv", ["driver.py", mode, "--src", str(source)]):
        return driver.main()


class MutantSourceDispatch(unittest.TestCase):
    def check_dispatch(self, mode):
        with tempfile.TemporaryDirectory(dir=driver.TEMP) as scratch:
            source = Path(scratch) / "segments exports"
            body_mutants = Mock(return_value=True)
            with (
                patch.object(driver, "guard"),
                patch.object(driver, "mutation_guard"),
                patch.object(driver, "mutants", return_value=True) as run_mutants,
                patch.dict(sys.modules, {"body_driver": SimpleNamespace(
                    body_mutants=body_mutants,
                    character_index=Mock(return_value={"characters": {"trenchcoat": {}}}),
                )}),
            ):
                self.assertEqual(invoke_main(mode, source), 0)
            run_mutants.assert_called_once_with("trenchcoat", source)
            self.assertEqual(body_mutants.call_count, int(mode == "all-mutants"))

    def test_mutants_dispatches_exact_explicit_source(self):
        self.check_dispatch("mutants")

    def test_all_mutants_dispatches_exact_explicit_source(self):
        self.check_dispatch("all-mutants")


class MutantSourceFollowups(unittest.TestCase):
    @contextlib.contextmanager
    def checkout(self, *, source_state="valid", surviving_mutant=None,
                 source_name="segments exports"):
        """Run the real dispatcher and runner in a tiny, entirely mocked checkout."""
        with tempfile.TemporaryDirectory(dir=driver.TEMP) as scratch:
            scratch = Path(scratch)
            root = scratch / "repository"
            prototype = root / "prototypes" / "imagine-cutout"
            results = prototype / "tests" / "results"
            results.mkdir(parents=True)
            (prototype / "scene.tscn").write_text("# mocked character scene\n")
            (prototype / "parts.json").write_text('{"overlap_px": 12}\n')
            tools = prototype / "tools"
            tools.mkdir()
            (tools / "prep_parts.py").write_text("# packaged preparation stub\n")
            (results / "mutant-c.json").write_text('{"status": "KILLED", "stale": true}\n')
            for suffix in ("godot.txt", "prep.txt"):
                (results / f"mutant-c.{suffix}").write_text("stale overlap evidence\n")

            # Both defaults are usable, so ignoring an explicit source is observable.
            for default, sentinel in ((prototype / "src", "prototype default\n"),
                                      (root / "src", "repository default\n")):
                raw = default / "parts" / "raw-hd"
                raw.mkdir(parents=True)
                (raw / "original.png").write_text(sentinel)
            source = scratch / source_name
            if source_state != "missing":
                raw = source / "parts" / "raw-hd"
                raw.mkdir(parents=True)
                # Opaque copy sentinels; no image is decoded or preparation executed.
                name = "original.png" if source_state == "valid" else "other.png"
                (raw / name).write_text("explicit source sentinel\n")
            calls = []
            copied_sources = []

            def suite(project, output, *, announce, character):
                self.assertEqual(character, "trenchcoat")
                calls.append(output.stem)
                expected = {"mutant-a": "3", "mutant-b": "1",
                            "mutant-c": "5", "mutant-d": "2"}.get(output.stem)
                survives = output.stem == f"mutant-{surviving_mutant}"
                report = {"tests": {str(n): {"passed": str(n) != expected or survives}
                                    for n in range(1, 6)}, "joints": []}
                output.write_text(json.dumps(report))
                output.with_suffix(".godot.txt").write_text("render mocked\n")
                return report

            def clone(original, destination):
                self.assertEqual(original, prototype)
                destination.mkdir()
                (destination / "parts.json").write_text('{"overlap_px": 12}\n')

            def prepare(command, cwd, log):
                self.assertEqual(command[1], str(cwd / "tools" / "prep_parts.py"))
                self.assertEqual((cwd / "tools" / "prep_parts.py").read_text(),
                                 "# packaged preparation stub\n")
                copied = (cwd / "src" / "parts" / "raw-hd" / "original.png").read_text()
                copied_sources.append(copied)
                self.assertEqual(copied, "explicit source sentinel\n")
                (cwd / "prototypes" / "imagine-cutout" / "parts.json").write_text(
                    '{"overlap_px": 0}\n')
                log.write_text("preparation mocked\n")

            body_mutants = Mock(return_value=True)
            with (
                patch.object(driver, "PROTOTYPE", prototype),
                patch.object(driver, "REPO", root),
                patch.object(driver, "TEMP", scratch),
                patch.object(driver, "guard") as guard,
                patch.object(driver, "mutation_guard"),
                patch.object(driver, "phase"),
                patch.object(driver, "clone", side_effect=clone),
                patch.object(driver, "suite", side_effect=suite),
                patch.object(driver, "animation_edit", return_value=["scene.tscn"]),
                patch.object(driver, "heavy", side_effect=prepare) as preparer,
                patch.object(driver, "mutants", wraps=driver.mutants) as run_mutants,
                patch.object(driver, "overlap_inputs", wraps=driver.overlap_inputs) as inputs,
                patch.dict(sys.modules, {"body_driver": SimpleNamespace(
                    body_mutants=body_mutants,
                    character_index=Mock(return_value={"characters": {"trenchcoat": {}}}),
                    read_manifest=Mock(return_value={"_character": {
                        "scene": "scene.tscn", "subject": "parts.json",
                    }}),
                )}),
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(io.StringIO()),
            ):
                yield SimpleNamespace(
                    scratch=scratch, root=root, prototype=prototype, source=source,
                    results=results, calls=calls, copied_sources=copied_sources,
                    guard=guard, preparer=preparer, run_mutants=run_mutants,
                    inputs=inputs, body_mutants=body_mutants,
                )

    def assert_explicit_overlap_ran(self, run):
        run.run_mutants.assert_called_once_with("trenchcoat", run.source)
        run.inputs.assert_called_once_with(run.source)
        self.assertTrue(run.run_mutants.call_args.args[1].is_absolute())
        self.assertTrue(run.inputs.call_args.args[0].is_absolute())
        self.assertEqual(run.calls, ["baseline", "mutant-a", "mutant-b", "mutant-c", "mutant-d"])
        self.assertEqual(run.copied_sources, ["explicit source sentinel\n"])
        self.assertEqual(run.preparer.call_count, 1)
        report = json.loads((run.results / "mutants.json").read_text())
        self.assertEqual([item["mutant"] for item in report], ["a", "b", "c", "d"])
        self.assertEqual([item["status"] for item in report], ["KILLED"] * 4)

    def test_mutants_runs_overlap_from_explicit_source(self):
        with self.checkout() as run:
            self.assertEqual(invoke_main("mutants", run.source), 0)
            self.assert_explicit_overlap_ran(run)
            run.body_mutants.assert_not_called()

    def check_unavailable_source(self, source_state, mode, *, surviving_mutant=None):
        with self.checkout(source_state=source_state, surviving_mutant=surviving_mutant) as run:
            self.assertFalse((run.source / "parts" / "raw-hd" / "original.png").exists())
            self.assertEqual(run.source.exists(), source_state != "missing")
            for default in (run.prototype / "src", run.root / "src"):
                self.assertTrue((default / "parts" / "raw-hd" / "original.png").is_file())
            self.assertEqual(invoke_main(mode, run.source), int(surviving_mutant is not None))
            run.run_mutants.assert_called_once_with("trenchcoat", run.source)
            run.inputs.assert_called_once_with(run.source)
            self.assertEqual(run.calls, ["baseline", "mutant-a", "mutant-b", "mutant-d"])
            run.preparer.assert_not_called()
            self.assertEqual(run.copied_sources, [])
            report = json.loads((run.results / "mutants.json").read_text())
            self.assertEqual([item["mutant"] for item in report], ["a", "b", "c", "d"])
            self.assertEqual([item["status"] for item in report],
                             ["KILLED", "KILLED", "SKIPPED",
                              "SURVIVED" if surviving_mutant else "KILLED"])
            self.assertEqual(report[2]["files_changed"], [])
            self.assertIn("original.png", report[2]["reason"])
            self.assertEqual(json.loads((run.results / "mutant-c.json").read_text()), report[2])
            for suffix in ("json", "godot.txt", "prep.txt"):
                with self.subTest(suffix=suffix):
                    evidence = (run.results / f"mutant-c.{suffix}").read_text()
                    self.assertIn("SKIPPED", evidence)
                    self.assertNotIn("stale", evidence)
            self.assertIn("SKIPPED", (run.prototype / "mutants.log").read_text())
            self.assertEqual(run.body_mutants.call_count, int(mode == "all-mutants"))

    def test_mutants_missing_explicit_source_skips_without_fallback(self):
        self.check_unavailable_source("missing", "mutants")

    def test_all_mutants_missing_explicit_source_skips_without_fallback(self):
        self.check_unavailable_source("missing", "all-mutants")

    def test_mutants_incomplete_explicit_source_skips_without_fallback(self):
        self.check_unavailable_source("incomplete", "mutants")

    def test_all_mutants_incomplete_explicit_source_skips_without_fallback(self):
        self.check_unavailable_source("incomplete", "all-mutants")

    def test_explicit_source_skip_preserves_later_survivor_exit(self):
        self.check_unavailable_source("missing", "mutants", surviving_mutant="d")

    def test_relative_source_is_resolved_before_cwd_changes(self):
        for mode in ("mutants", "all-mutants"):
            with self.subTest(mode=mode), self.checkout() as run:
                other_cwd = run.scratch / "after parsing"
                other_cwd.mkdir()
                original_cwd = Path.cwd()
                try:
                    os.chdir(run.scratch)
                    run.guard.side_effect = lambda: os.chdir(other_cwd)
                    exit_code = invoke_main(mode, "segments exports")
                    self.assertEqual(Path.cwd(), other_cwd)
                finally:
                    os.chdir(original_cwd)
                self.assertEqual(exit_code, 0)
                self.assert_explicit_overlap_ran(run)

    def test_tilde_source_is_expanded_to_absolute_path_under_patched_home(self):
        for mode in ("mutants", "all-mutants"):
            with self.subTest(mode=mode), self.checkout(source_name=Path("home") / "x") as run:
                with patch.dict(os.environ, {"HOME": str(run.source.parent)}):
                    self.assertEqual(invoke_main(mode, "~/x"), 0)
                self.assert_explicit_overlap_ran(run)


if __name__ == "__main__":
    unittest.main()
