"""Exercise the local discovery command as a real child process."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class PythonRunnerControls(unittest.TestCase):
    def setUp(self):
        self.scratch = tempfile.TemporaryDirectory(dir=os.environ["TMPDIR"])
        self.addCleanup(self.scratch.cleanup)
        self.root = Path(self.scratch.name)
        self.tests = self.root / "repository/prototypes/imagine-cutout/tests"
        self.tests.mkdir(parents=True)
        self.runner = self.tests / "run_python_tests.py"
        shutil.copy2(Path(__file__).with_name("run_python_tests.py"), self.runner)

    def invoke(self):
        env = dict(os.environ)
        env.update(DISPLAY=":unused-parent-display", TMPDIR=str(self.root / "missing-parent-temp"))
        return subprocess.run([sys.executable, str(self.runner), "--temp-root", str(self.root)],
                              cwd=self.root, env=env, text=True, capture_output=True, check=False)

    def test_discovers_all_controls_without_inheriting_display_or_temp_state(self):
        audit = self.root / "audit.json"
        (self.tests / "test_environment.py").write_text(
            "import json, os, pathlib, unittest\n"
            "class EnvironmentControl(unittest.TestCase):\n"
            "    def test_environment(self):\n"
            "        values = {name: os.environ.get(name) for name in "
            "['DISPLAY', 'TMPDIR', 'XDG_DATA_HOME', 'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', "
            "'OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'LP_NUM_THREADS', 'MAKEFLAGS']}\n"
            "        values['cwd'] = str(pathlib.Path.cwd())\n"
            f"        pathlib.Path({str(audit)!r}).write_text(json.dumps(values))\n")
        (self.tests / "test_second.py").write_text(
            "import unittest\nclass SecondControl(unittest.TestCase):\n"
            "    def test_discovered(self):\n        self.assertTrue(True)\n")
        result = self.invoke()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("Ran 2 tests", result.stderr)
        data = json.loads(audit.read_text())
        self.assertIsNone(data["DISPLAY"])
        private = Path(data["TMPDIR"])
        self.assertEqual(private.parent, self.root)
        self.assertFalse(private.exists(), "private scratch must be cleaned after success")
        for name in ("XDG_DATA_HOME", "XDG_CONFIG_HOME", "XDG_CACHE_HOME"):
            self.assertTrue(Path(data[name]).is_relative_to(private))
        for name in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "LP_NUM_THREADS"):
            self.assertEqual(data[name], "2")
        self.assertEqual(data["MAKEFLAGS"], "-j2")
        self.assertEqual(Path(data["cwd"]), self.root / "repository")
        self.assertFalse(list(self.root.glob("imagine-python-*")))

    def test_failing_control_propagates_nonzero_exit_and_cleans_scratch(self):
        (self.tests / "test_red.py").write_text(
            "import unittest\nclass RedControl(unittest.TestCase):\n"
            "    def test_failure(self):\n"
            "        self.assertEqual(1, 2, 'intentional runner red control')\n")
        result = self.invoke()
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertIn("intentional runner red control", result.stderr)
        self.assertIn("FAILED (failures=1)", result.stderr)
        self.assertFalse(list(self.root.glob("imagine-python-*")))


if __name__ == "__main__":
    unittest.main(verbosity=2)
