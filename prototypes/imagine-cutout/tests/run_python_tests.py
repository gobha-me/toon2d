#!/usr/bin/env python3
"""Run every Python control with private temporary/XDG state and no display.

This command runs unittest discovery only. It does not replace the separately
guarded rendered acceptance and planted-mutant gates documented in README.md.
"""
import argparse
import os
from pathlib import Path
import subprocess
import sys
import tempfile


DISCOVER = """
import sys
import unittest
suite = unittest.defaultTestLoader.discover(sys.argv[1], pattern="test_*.py")
if suite.countTestCases() == 0:
    print("No Python controls discovered", file=sys.stderr)
    raise SystemExit(2)
result = unittest.TextTestRunner(verbosity=2).run(suite)
raise SystemExit(0 if result.wasSuccessful() else 1)
"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--temp-root", type=Path,
                        help="existing parent for private scratch (default: platform temporary directory)")
    args = parser.parse_args()
    tests = Path(__file__).resolve().parent
    with tempfile.TemporaryDirectory(prefix="imagine-python-", dir=args.temp_root) as temporary:
        scratch = Path(temporary)
        env = dict(os.environ)
        env.pop("DISPLAY", None)
        env["TMPDIR"] = str(scratch)
        env["TMP"] = str(scratch)
        env["TEMP"] = str(scratch)
        for variable, dirname in (("XDG_DATA_HOME", "data"), ("XDG_CONFIG_HOME", "config"),
                                  ("XDG_CACHE_HOME", "cache")):
            directory = scratch / dirname
            directory.mkdir()
            env[variable] = str(directory)
        env.update(PYTHONDONTWRITEBYTECODE="1", OMP_NUM_THREADS="2",
                   OPENBLAS_NUM_THREADS="2", LP_NUM_THREADS="2", MAKEFLAGS="-j2")
        result = subprocess.run([sys.executable, "-c", DISCOVER, str(tests)],
                                cwd=tests.parents[2], env=env, check=False)
        return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
