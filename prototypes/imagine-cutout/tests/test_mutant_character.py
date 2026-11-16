"""Character dispatch and isolated mutant inputs without rendering or artwork."""
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


CHARACTERS = {
    "trenchcoat": {"scene": "scenes/hd.tscn", "subject": "parts.json"},
    "char2": {"scene": "scenes/char2.tscn", "subject": "characters/char2/parts.json"},
}


class MutantCharacter(unittest.TestCase):
    @contextlib.contextmanager
    def checkout(self, character):
        """Keep both rigs usable so a fallback to the default is observable."""
        with tempfile.TemporaryDirectory(dir=driver.TEMP) as scratch:
            scratch = Path(scratch)
            root = scratch / "repository"
            prototype = root / "prototypes" / "imagine-cutout"
            results = prototype / "tests" / "results"
            results.mkdir(parents=True)

            def write_rigs(project):
                for name, config in CHARACTERS.items():
                    scene = project / config["scene"]
                    scene.parent.mkdir(parents=True, exist_ok=True)
                    scene.write_text(f"# mocked {name} scene\n")
                    subject = project / config["subject"]
                    subject.parent.mkdir(parents=True, exist_ok=True)
                    subject.write_text(json.dumps({"character": name, "overlap_px": 12}))

            write_rigs(prototype)
            tools = prototype / "tools"
            tools.mkdir()
            (tools / "prep_parts.py").write_text("# preparation is mocked\n")
            source = scratch / "segments exports"
            for directory, sentinel in ((source, "explicit"),
                                        (prototype / "src", "prototype"),
                                        (root / "src", "repository")):
                raw = directory / "parts" / "raw-hd"
                raw.mkdir(parents=True)
                # Opaque copy sentinels; these files are never decoded as images.
                (raw / "original.png").write_text(sentinel)

            historical = results / "mutants.json"
            historical.write_text("historical default evidence\n")
            suite_calls = []
            copied_sources = []

            def read_manifest(project, selected):
                self.assertEqual(project, prototype)
                self.assertEqual(selected, character)
                return {"_character": CHARACTERS[selected]}

            def clone(original, destination):
                self.assertEqual(original, prototype)
                write_rigs(destination)

            def suite(project, output, *, announce, character):
                self.assertEqual(character, expected_character)
                self.assertFalse(announce)
                config = CHARACTERS[character]
                self.assertEqual((project / config["scene"]).read_text(),
                                 f"# mocked {character} scene\n")
                self.assertEqual(json.loads((project / config["subject"]).read_text())["character"],
                                 character)
                suite_calls.append(output.stem)
                expected_red = {"mutant-a": "3", "mutant-b": "1",
                                "mutant-c": "5", "mutant-d": "2"}.get(output.stem)
                report = {"tests": {str(n): {"passed": str(n) != expected_red}
                                    for n in range(1, 6)}, "joints": []}
                output.write_text(json.dumps(report))
                output.with_suffix(".godot.txt").write_text("suite is mocked\n")
                return report

            def animation_edit(project, kind, selected):
                self.assertEqual(selected, character)
                self.assertIn(kind, ("flash", "bone", "timing"))
                scene = CHARACTERS[selected]["scene"]
                self.assertEqual((project / scene).read_text(), f"# mocked {selected} scene\n")
                return [scene]

            def prepare(command, cwd, log):
                self.assertEqual(command[1], str(cwd / "tools" / "prep_parts.py"))
                copied_sources.append((cwd / "src" / "parts" / "raw-hd" / "original.png").read_text())
                subject = cwd / "prototypes" / "imagine-cutout" / "parts.json"
                subject.write_text(json.dumps({"character": "trenchcoat", "overlap_px": 0}))
                log.write_text("preparation is mocked\n")

            expected_character = character
            body_mutants = Mock(return_value=True)
            stderr = io.StringIO()
            with (
                patch.object(driver, "PROTOTYPE", prototype),
                patch.object(driver, "REPO", root),
                patch.object(driver, "TEMP", scratch),
                patch.object(driver, "RERUN_COMMAND", None),
                patch.object(driver, "DEFERRED_EVIDENCE", None),
                patch.object(driver, "guard"),
                patch.object(driver, "mutation_guard") as mutation_guard,
                patch.object(driver, "phase") as phase,
                patch.object(driver, "clone", side_effect=clone) as clone_mock,
                patch.object(driver, "suite", side_effect=suite) as suite_mock,
                patch.object(driver, "animation_edit", side_effect=animation_edit) as edit,
                patch.object(driver, "heavy", side_effect=prepare) as heavy,
                patch.object(driver, "mutants", wraps=driver.mutants) as run_mutants,
                patch.object(driver, "overlap_inputs", wraps=driver.overlap_inputs) as inputs,
                patch.dict(sys.modules, {"body_driver": SimpleNamespace(
                    body_mutants=body_mutants,
                    character_index=Mock(return_value={"characters": CHARACTERS}),
                    read_manifest=Mock(side_effect=read_manifest),
                )}),
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(stderr),
            ):
                yield SimpleNamespace(
                    prototype=prototype, results=results, source=source, stderr=stderr,
                    run_mutants=run_mutants, inputs=inputs, body_mutants=body_mutants,
                    mutation_guard=mutation_guard, phase=phase, clone=clone_mock,
                    suite=suite_mock, suite_calls=suite_calls, edit=edit, heavy=heavy,
                    historical=historical, copied_sources=copied_sources,
                )

    def invoke_main(self, run, mode, character=None, *, explicit_source=False):
        argv = ["driver.py", mode]
        if character is not None:
            argv.extend(["--character", character])
        if explicit_source:
            argv.extend(["--src", str(run.source)])
        with patch.object(sys, "argv", argv):
            return driver.main()

    def assert_body_dispatch(self, run, mode, character):
        if mode == "all-mutants":
            run.body_mutants.assert_called_once_with(character=character)
        else:
            run.body_mutants.assert_not_called()

    def check_nondefault_character(self, mode, *, explicit_source=False):
        with self.checkout("char2") as run:
            self.assertEqual(self.invoke_main(run, mode, "char2", explicit_source=explicit_source),
                             0, run.stderr.getvalue())
            run.run_mutants.assert_called_once_with("char2", run.source if explicit_source else None)
            self.assert_body_dispatch(run, mode, "char2")
            self.assertEqual(run.suite_calls, ["baseline", "mutant-a", "mutant-b", "mutant-d"])
            self.assertEqual([entry.args[1:] for entry in run.edit.call_args_list],
                             [("flash", "char2"), ("bone", "char2"), ("timing", "char2")])
            report_dir = run.results / "char2"
            report = json.loads((report_dir / "legacy-mutants.json").read_text())
            self.assertEqual([item["mutant"] for item in report], ["a", "b", "d"])
            self.assertEqual([item["status"] for item in report], ["KILLED"] * 3)
            self.assertEqual([item["files_changed"] for item in report],
                             [[CHARACTERS["char2"]["scene"]]] * 3)
            for name in ("a", "b", "d"):
                self.assertTrue((report_dir / f"mutant-{name}.json").is_file())
            self.assertTrue((report_dir / "mutants.txt").is_file())
            self.assertFalse((report_dir / "mutant-c.json").exists())
            self.assertFalse((run.results / "trenchcoat").exists())
            self.assertEqual(run.historical.read_text(), "historical default evidence\n")
            self.assertFalse((run.prototype / "mutants.log").exists())
            # The current runner only prepares overlap inputs for trenchcoat.
            run.inputs.assert_not_called()
            run.heavy.assert_not_called()

    def test_mutants_selects_nondefault_character(self):
        self.check_nondefault_character("mutants")

    def test_all_mutants_selects_nondefault_character(self):
        self.check_nondefault_character("all-mutants")

    def test_mutants_selects_nondefault_character_with_explicit_source(self):
        self.check_nondefault_character("mutants", explicit_source=True)

    def test_all_mutants_selects_nondefault_character_with_explicit_source(self):
        self.check_nondefault_character("all-mutants", explicit_source=True)

    def test_nondefault_character_requires_its_own_rig_files(self):
        for mode in ("mutants", "all-mutants"):
            for key in ("scene", "subject"):
                with self.subTest(mode=mode, missing=key), self.checkout("char2") as run:
                    missing = CHARACTERS["char2"][key]
                    (run.prototype / missing).unlink()
                    self.assertEqual(self.invoke_main(run, mode, "char2", explicit_source=True), 1)
                    run.run_mutants.assert_called_once_with("char2", run.source)
                    report = json.loads((run.results / "char2" / "legacy-mutants.json").read_text())
                    self.assertEqual([item["mutant"] for item in report], ["a", "b", "d"])
                    self.assertEqual([item["status"] for item in report], ["CANNOT_PLANT"] * 3)
                    for item in report:
                        self.assertEqual(item["reason"], f"char2 rig/scene does not exist: {missing}")
                    self.assert_body_dispatch(run, mode, "char2")
                    for operation in (run.suite, run.clone, run.edit, run.inputs, run.heavy, run.phase):
                        operation.assert_not_called()
                    self.assertFalse((run.results / "trenchcoat").exists())
                    self.assertEqual(run.historical.read_text(), "historical default evidence\n")

    def test_invalid_character_is_rejected_before_work(self):
        for mode in ("mutants", "all-mutants"):
            with self.subTest(mode=mode), self.checkout("trenchcoat") as run:
                with self.assertRaises(SystemExit) as error:
                    self.invoke_main(run, mode, "unknown-character", explicit_source=True)
                self.assertEqual(error.exception.code, 2)
                self.assertEqual(run.stderr.getvalue().splitlines()[-1],
                                 "driver.py: error: unknown character: unknown-character")
                for operation in (run.run_mutants, run.body_mutants, run.mutation_guard,
                                  run.suite, run.clone, run.edit, run.inputs, run.heavy, run.phase):
                    operation.assert_not_called()
                self.assertEqual(list(run.results.iterdir()), [run.historical])
                self.assertEqual(run.historical.read_text(), "historical default evidence\n")

    def assert_default_character(self, run):
        self.assertEqual(run.suite_calls,
                         ["baseline", "mutant-a", "mutant-b", "mutant-c", "mutant-d"])
        run.inputs.assert_called_once_with(None)
        run.heavy.assert_called_once()
        work = run.heavy.call_args.args[1]
        self.assertEqual(run.copied_sources, ["prototype"])
        self.assertEqual(run.heavy.call_args.args[0][1], str(work / "tools" / "prep_parts.py"))
        report = json.loads((run.results / "trenchcoat" / "legacy-mutants.json").read_text())
        self.assertEqual([item["mutant"] for item in report], ["a", "b", "c", "d"])
        self.assertEqual([item["status"] for item in report], ["KILLED"] * 4)
        self.assertEqual(json.loads(run.historical.read_text()), report)
        self.assertFalse((run.results / "char2").exists())
        self.assertEqual([entry.args[1:] for entry in run.edit.call_args_list],
                         [("flash", "trenchcoat"), ("bone", "trenchcoat"), ("timing", "trenchcoat")])

    def test_omitted_character_uses_trenchcoat(self):
        for mode in ("mutants", "all-mutants"):
            with self.subTest(mode=mode), self.checkout("trenchcoat") as run:
                self.assertEqual(self.invoke_main(run, mode), 0, run.stderr.getvalue())
                run.run_mutants.assert_called_once_with("trenchcoat", None)
                self.assert_body_dispatch(run, mode, "trenchcoat")
                self.assert_default_character(run)

    def test_mutants_function_defaults_to_trenchcoat(self):
        with self.checkout("trenchcoat") as run:
            self.assertTrue(driver.mutants())
            run.run_mutants.assert_called_once_with()
            run.body_mutants.assert_not_called()
            self.assert_default_character(run)


if __name__ == "__main__":
    unittest.main()
