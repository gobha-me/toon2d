"""Issue #16: dispatch mutants without rendering or requiring source artwork."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

import driver


class MutantSourceArgument(unittest.TestCase):
    def test_explicit_source_is_accepted_in_both_runner_modes(self):
        """Exercise argument parsing without creating files or invoking suites."""
        for mode in ("mutants", "all-mutants"):
            with self.subTest(mode=mode):
                stderr = io.StringIO()
                body_mutants = Mock(return_value=True)
                with (
                    patch.object(sys, "argv", ["driver.py", mode, "--src", "segments-exports"]),
                    patch.object(driver, "guard"),
                    patch.object(driver, "mutants", return_value=True) as run_mutants,
                    patch.dict(sys.modules, {"body_driver": SimpleNamespace(body_mutants=body_mutants)}),
                    contextlib.redirect_stderr(stderr),
                ):
                    try:
                        exit_code = driver.main()
                    except SystemExit as exc:
                        exit_code = exc.code
                self.assertEqual(exit_code, 0, stderr.getvalue())
                run_mutants.assert_called_once()
                self.assertEqual(body_mutants.call_count, int(mode == "all-mutants"))


class MutantRunnerInputs(unittest.TestCase):
    def run_runner(self, *, with_source=False, surviving_mutant=None, mode="mutants"):
        """Use a tiny checkout layout; preparation and every render are mocked."""
        with tempfile.TemporaryDirectory(dir=driver.TEMP) as scratch:
            root = Path(scratch) / "repository"
            prototype = root / "prototypes" / "imagine-cutout"
            results = prototype / "tests" / "results"
            results.mkdir(parents=True)
            (prototype / "tools").mkdir()
            (prototype / "tools" / "prep_parts.py").write_text("# packaged preparation stub\n")
            (results / "mutant-c.json").write_text('{"status": "KILLED", "stale": true}\n')
            for suffix in ("godot.txt", "prep.txt"):
                (results / f"mutant-c.{suffix}").write_text("stale overlap evidence\n")
            source = Path(scratch) / "segments-exports"
            if with_source:
                (source / "parts" / "raw-hd").mkdir(parents=True)
                # This is an opaque copy sentinel, never decoded as an image.
                (source / "parts" / "raw-hd" / "original.png").write_text("source sentinel\n")
            self.assertFalse((root / "tools").exists())
            self.assertFalse((root / "src").exists())
            calls = []

            def suite(project, output, *, announce):
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
                self.assertEqual((cwd / "src" / "parts" / "raw-hd" / "original.png").read_text(),
                                 "source sentinel\n")
                (cwd / "prototypes" / "imagine-cutout" / "parts.json").write_text(
                    '{"overlap_px": 0}\n')
                log.write_text("preparation mocked\n")

            argv = ["driver.py", mode]
            if with_source:
                argv.extend(["--src", str(source)])
            stderr = io.StringIO()
            with (
                patch.object(sys, "argv", argv),
                patch.object(driver, "PROTOTYPE", prototype),
                patch.object(driver, "REPO", root),
                patch.object(driver, "TEMP", Path(scratch)),
                patch.object(driver, "guard"),
                patch.object(driver, "phase"),
                patch.object(driver, "clone", side_effect=clone),
                patch.object(driver, "suite", side_effect=suite),
                patch.object(driver, "animation_edit", return_value=["scene.tscn"]),
                patch.object(driver, "heavy", side_effect=prepare) as preparer,
                patch.dict(sys.modules, {"body_driver": SimpleNamespace(body_mutants=Mock(return_value=True))}),
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(stderr),
            ):
                try:
                    exit_code = driver.main()
                except SystemExit as exc:
                    exit_code = exc.code
            self.assertEqual(exit_code, int(surviving_mutant is not None), stderr.getvalue())
            return SimpleNamespace(
                exit_code=exit_code,
                calls=calls,
                report=json.loads((results / "mutants.json").read_text()),
                evidence={suffix: (results / f"mutant-c.{suffix}").read_text()
                          for suffix in ("json", "godot.txt", "prep.txt")},
                log=(prototype / "mutants.log").read_text(),
                preparation_count=preparer.call_count,
            )

    def test_absent_source_skips_only_overlap_and_replaces_stale_evidence(self):
        run = self.run_runner()
        self.assertEqual(run.exit_code, 0)
        self.assertEqual(run.calls, ["baseline", "mutant-a", "mutant-b", "mutant-d"])
        self.assertEqual([item["mutant"] for item in run.report], ["a", "b", "c", "d"])
        self.assertEqual([item["status"] for item in run.report],
                         ["KILLED", "KILLED", "SKIPPED", "KILLED"])
        self.assertEqual(json.loads(run.evidence["json"]), run.report[2])
        self.assertEqual(run.report[2]["files_changed"], [])
        for suffix, evidence in run.evidence.items():
            with self.subTest(suffix=suffix):
                self.assertNotIn("stale", evidence)
                self.assertIn("SKIPPED", evidence)
        self.assertIn("SKIPPED", run.log)
        self.assertEqual(run.preparation_count, 0)

    def test_explicit_source_uses_packaged_tools_and_runs_all_mutants(self):
        run = self.run_runner(with_source=True, mode="all-mutants")
        self.assertEqual(run.exit_code, 0)
        self.assertEqual(run.calls, ["baseline", "mutant-a", "mutant-b", "mutant-c", "mutant-d"])
        self.assertEqual([item["mutant"] for item in run.report], ["a", "b", "c", "d"])
        self.assertEqual([item["status"] for item in run.report], ["KILLED"] * 4)
        self.assertEqual(run.preparation_count, 1)
        self.assertFalse(json.loads(run.evidence["json"])["tests"]["5"]["passed"])
        self.assertEqual(run.evidence["godot.txt"], "render mocked\n")
        self.assertEqual(run.evidence["prep.txt"], "preparation mocked\n")

    def test_skip_does_not_hide_a_later_surviving_mutant(self):
        run = self.run_runner(surviving_mutant="d", mode="all-mutants")
        self.assertEqual(run.exit_code, 1)
        self.assertEqual(run.calls, ["baseline", "mutant-a", "mutant-b", "mutant-d"])
        self.assertEqual([item["status"] for item in run.report],
                         ["KILLED", "KILLED", "SKIPPED", "SURVIVED"])
        self.assertEqual(run.report[-1]["mutant"], "d")
        self.assertEqual(run.preparation_count, 0)


if __name__ == "__main__":
    unittest.main()
