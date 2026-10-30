#!/usr/bin/env python3
"""Run committed tests unmodified in scratch, retaining change-lane evidence.

Use through heavy-run. Every test/Godot subprocess is sequential. The nested
Godot guards used by the committed runner are preserved.
"""
import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

PROJECT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('original', 'body', 'mutants', 'oracle', 'quick', 'full'))
    parser.add_argument('--source', type=Path, help='optional read-only src tree for source-based mutant c')
    args = parser.parse_args()
    destination = PROJECT / ('validation/v2-sourced' if args.source else 'validation/v2')
    destination.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='verify-', dir=os.environ['TMPDIR']) as tmp:
        project = Path(tmp) / 'repo/prototypes/imagine-cutout'
        shutil.copytree(PROJECT, project, ignore=shutil.ignore_patterns(
            'validation', 'results', 'renders', '.godot', '__pycache__', '*.log'))
        if args.source:
            shutil.copytree(args.source, project/'src')
        env = dict(os.environ, TEST_PYTHON=sys.executable, PYTHONDONTWRITEBYTECODE='1',
                   OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2', LP_NUM_THREADS='2', MAKEFLAGS='-j2')
        modes = ('oracle', 'original', 'body', 'mutants') if args.mode == 'full' else (args.mode,)
        failures = []
        for mode in modes:
            # The committed mutant runner expects its evidence directory from
            # the checkout; our filtered scratch copies intentionally omit old
            # evidence, so recreate the empty directory before each command.
            (project/'tests/results').mkdir(parents=True, exist_ok=True)
            commands = {
                'original': ['bash', str(project/'tests/run_tests.sh')],
                'body': ['bash', str(project/'tests/run_body_tests.sh')],
                'mutants': ['bash', str(project/'tests/run_mutants.sh')],
                'oracle': ['bash', str(project/'tests/runner.sh'), 'oracle'],
                'quick': [sys.executable, '-c',
                          'import sys; from pathlib import Path; sys.path.insert(0,"tests"); import driver,body_driver; '
                          'r=body_driver.body_suite(Path("."), Path("tests/results/quick.json"),full=False); '
                          'sys.exit(0 if r["passed"] else 1)'],
            }
            if mode == 'quick':
                env.update(TMPDIR=tmp, XDG_DATA_HOME=tmp+'/xdg-data', XDG_CONFIG_HOME=tmp+'/xdg-config', XDG_CACHE_HOME=tmp+'/xdg-cache')
            command = commands[mode]
            start = datetime.now(timezone.utc).isoformat()
            log = destination / (mode+'.txt')
            # A file allows progress inspection while the long combined run works.
            with log.open('w') as stream:
                process = subprocess.Popen(command, cwd=project, env=env, stdout=stream, stderr=subprocess.STDOUT)
                rc = process.wait()
            text = log.read_text().replace(str(project), '<PROJECT>').replace(str(tmp), '<TMPDIR>').replace(sys.executable, '<PYTHON>')
            text = '\n'.join(line for line in text.splitlines() if not line.startswith('heavy-run: holding slot'))
            log.write_text(f'{start} {mode}\n{text}\nEXIT {rc}\n')
            results = project / 'tests/results'
            if results.exists():
                target = destination / mode
                if target.exists():
                    shutil.rmtree(target)
                shutil.copytree(results, target)
                shutil.rmtree(results)
            print(f'{mode}: exit {rc}', flush=True)
            if rc:
                failures.append(mode)
        return bool(failures)


if __name__ == '__main__':
    raise SystemExit(main())
