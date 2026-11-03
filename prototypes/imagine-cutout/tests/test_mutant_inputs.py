"""Exercise mutant dispatch without rendering or requiring source artwork."""
import contextlib
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import driver


class MutantInputs(unittest.TestCase):
    def run_mutants(self, *, with_source=False, survives=False):
        with tempfile.TemporaryDirectory(dir=driver.TEMP) as scratch:
            root = Path(scratch)
            project = root / "prototype"
            results = project / "tests" / "results"
            results.mkdir(parents=True)
            (project / "tools").mkdir()
            (project / "tools" / "prep_parts.py").write_text("# packaged tool\n")
            for suffix in ("json", "godot.txt", "prep.txt"):
                (results / f"mutant-c.{suffix}").write_text("stale KILLED evidence\n")
            source = root / "exports"
            if with_source:
                source.mkdir()
                (source / "sentinel").write_text("source input")
            calls = []

            def suite(project, output, *, announce):
                name = output.stem
                calls.append(name)
                expected = {"mutant-a": "3", "mutant-b": "1",
                            "mutant-c": "5", "mutant-d": "2"}.get(name)
                report = {"tests": {str(n): {"passed": str(n) != expected or survives}
                                    for n in range(1, 6)}, "joints": []}
                output.write_text(json.dumps(report))
                output.with_suffix(".godot.txt").write_text("render mocked\n")
                return report

            def clone(original, destination):
                destination.mkdir()
                (destination / "parts.json").write_text('{"overlap_px": 12}')

            def prepare(command, cwd, log):
                self.assertEqual((cwd / "tools" / "prep_parts.py").read_text(),
                                 "# packaged tool\n")
                self.assertEqual((cwd / "src" / "sentinel").read_text(), "source input")
                (cwd / "prototypes" / "imagine-cutout" / "parts.json").write_text(
                    '{"overlap_px": 0}')
                log.write_text("prepared\n")

            with (patch.object(driver, "PROTOTYPE", project),
                  patch.object(driver, "REPO", root),
                  patch.object(driver, "TEMP", root),
                  patch.object(driver, "guard"), patch.object(driver, "phase"),
                  patch.object(driver, "clone", side_effect=clone),
                  patch.object(driver, "suite", side_effect=suite),
                  patch.object(driver, "animation_edit", return_value=["scene"]),
                  patch.object(driver, "heavy", side_effect=prepare),
                  contextlib.redirect_stdout(io.StringIO())):
                passed = driver.mutants(source if with_source else None)
            report = json.loads((results / "mutants.json").read_text())
            evidence = {suffix: (results / f"mutant-c.{suffix}").read_text()
                        for suffix in ("json", "godot.txt", "prep.txt")}
            return passed, calls, report, evidence

    def test_absent_source_skips_only_overlap_and_replaces_stale_evidence(self):
        passed, calls, report, evidence = self.run_mutants()
        self.assertTrue(passed)
        self.assertEqual(calls, ["baseline", "mutant-a", "mutant-b", "mutant-d"])
        self.assertEqual([item["status"] for item in report],
                         ["KILLED", "KILLED", "SKIPPED", "KILLED"])
        self.assertEqual(json.loads(evidence["json"])["status"], "SKIPPED")
        for suffix in ("godot.txt", "prep.txt"):
            self.assertTrue(evidence[suffix].startswith("SKIPPED:"))

    def test_explicit_source_uses_packaged_tools_and_runs_all_mutants(self):
        passed, calls, report, _ = self.run_mutants(with_source=True)
        self.assertTrue(passed)
        self.assertIn("mutant-c", calls)
        self.assertEqual([item["status"] for item in report], ["KILLED"] * 4)

    def test_skip_does_not_hide_a_surviving_mutant(self):
        passed, _, report, _ = self.run_mutants(survives=True)
        self.assertFalse(passed)
        self.assertEqual(report[-1]["status"], "SURVIVED")


if __name__ == "__main__":
    unittest.main()
