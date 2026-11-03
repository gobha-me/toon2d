"""Allowlisted lifecycle and real driver.heavy policy checks; no Godot needed."""
import json
import os
from pathlib import Path
import shutil
import signal
import subprocess
import sys
import tempfile
import time
import unittest

TESTS = Path(__file__).resolve().parent


class HarnessPolicy(unittest.TestCase):
    def lifecycle(self, terminate):
        with tempfile.TemporaryDirectory(dir=os.environ['TMPDIR']) as scratch:
            root = Path(scratch)
            tests = root / 'prototypes/imagine-cutout/tests'
            tests.mkdir(parents=True)
            subject = Path(os.environ.get('HARNESS_SUBJECT', TESTS))
            shutil.copy2(subject / 'runner.sh', tests / 'runner.sh')
            # A quick consumer of the runner's real X server, without a render.
            (tests / 'driver.py').write_text('''import json, os, pathlib, time
root = pathlib.Path(os.environ['TMPDIR'])
pidfile = root / 'xvfb.pid'
audit = {'pid': int(pidfile.read_text()) if pidfile.exists() else None,
         'display': os.environ.get('DISPLAY'), 'scratch': str(root)}
target = pathlib.Path(os.environ['LIFECYCLE_AUDIT'])
target.with_suffix('.pending').write_text(json.dumps(audit))
target.with_suffix('.pending').replace(target)
if os.environ['LIFECYCLE_TERM'] == '1':
    time.sleep(60)
else:
    while not pathlib.Path(os.environ['LIFECYCLE_RELEASE']).exists():
        time.sleep(.01)
''')
            audit = root / 'audit.json'
            env = dict(os.environ, TEST_PYTHON=sys.executable,
                       LIFECYCLE_AUDIT=str(audit), LIFECYCLE_TERM=str(int(terminate)),
                       LIFECYCLE_RELEASE=str(root / 'release'))
            process = subprocess.Popen(['bash', str(tests / 'runner.sh'), 'oracle'],
                                       env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                       text=True, start_new_session=True)
            recorded = None
            try:
                deadline = time.monotonic() + 10
                while not audit.exists() and time.monotonic() < deadline and process.poll() is None:
                    time.sleep(.02)
                self.assertTrue(audit.exists(), 'runner did not reach quick consumer')
                data = json.loads(audit.read_text())
                recorded = data['pid']
                self.assertIsNotNone(recorded, 'runner must record the Xvfb PID at spawn in xvfb.pid')
                display = data['display']
                self.assertTrue(display and display.startswith(':'))
                lock = Path('/tmp') / ('.X' + display[1:].split('.')[0] + '-lock')
                self.assertTrue(lock.exists(), 'real X server did not acquire its lock')
                os.kill(recorded, 0)
                if terminate:
                    process.send_signal(signal.SIGTERM)
                else:
                    (root / 'release').touch()
                output, _ = process.communicate(timeout=10)
                self.assertEqual(process.returncode, 143 if terminate else 0, output)
                with self.assertRaises(ProcessLookupError):
                    os.kill(recorded, 0)
                self.assertFalse(lock.exists(), 'recorded server lock survived runner exit')
                self.assertFalse(Path(data['scratch']).exists(), 'runner scratch survived exit')
                print(('TERM' if terminate else 'NORMAL') +
                      ': recorded PID gone; display lock gone; scratch removed', flush=True)
            finally:
                if process.poll() is None:
                    os.killpg(process.pid, signal.SIGTERM)
                    process.communicate(timeout=10)
                if recorded is not None:
                    try:
                        os.kill(recorded, signal.SIGTERM)
                    except ProcessLookupError:
                        pass

    def test_xvfb_no_orphan_normal_exit(self):
        self.lifecycle(False)

    def test_xvfb_no_orphan_on_term(self):
        self.lifecycle(True)

    def test_driver_heavy_defer_policy(self):
        for exits, expected, attempts in (([75, 0], 0, 2), ([75], 79, 4), ([78], 78, 1)):
            with self.subTest(exits=exits), tempfile.TemporaryDirectory(dir=os.environ['TMPDIR']) as scratch:
                root = Path(scratch)
                stub = root / 'heavy-run'
                stub.write_text('#!' + sys.executable + '''
import json, os, pathlib, sys
state = pathlib.Path(os.environ['STUB_STATE'])
n = int(state.read_text()) if state.exists() else 0
state.write_text(str(n + 1))
codes = json.loads(os.environ['STUB_EXITS'])
sys.exit(codes[min(n, len(codes)-1)])
''')
                stub.chmod(0o755)
                subject = Path(os.environ.get('HARNESS_SUBJECT', TESTS))
                env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'],
                           PYTHONPATH=str(subject), STUB_STATE=str(root / 'count'),
                           STUB_EXITS=json.dumps(exits), DRIVER_HEAVY_RETRY_SECONDS='0.01',
                           OMP_NUM_THREADS='2', OPENBLAS_NUM_THREADS='2', MAKEFLAGS='-j2')
                # Keep stub policy cases independent of the wall clock; only
                # datetime is injected, while driver.heavy itself remains real.
                code = '''import driver
from pathlib import Path
from datetime import datetime
class Daytime(datetime):
    @classmethod
    def now(cls, tz=None):
        return datetime(2026, 10, 30, 16, tzinfo=driver.ZoneInfo('UTC')).astimezone(tz)
driver.datetime = Daytime
driver.heavy(['true'], Path.cwd(), Path('heavy.txt'))
'''
                process = subprocess.Popen([sys.executable, '-c', code], cwd=root, env=env,
                                           stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                           text=True, start_new_session=True)
                try:
                    output, _ = process.communicate(timeout=3)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGTERM)
                    output, _ = process.communicate(timeout=3)
                    self.fail('driver ignored injected interval/cap: ' + output)
                self.assertEqual(process.returncode, expected, output)
                self.assertEqual(int((root / 'count').read_text()), attempts)
                log = (root / 'heavy.txt').read_text()
                if 75 in exits:
                    self.assertIn('DEFER', log)
                    self.assertRegex(log, r'\d{4}-\d\d-\d\dT')
                if expected == 79:
                    self.assertIn('DEFERRED', output)
                print(f'heavy stub {exits}: exit {expected}; attempts {attempts}', flush=True)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--baseline':
        revision = sys.argv.pop(2)
        sys.argv.pop(1)
        with tempfile.TemporaryDirectory(dir=os.environ['TMPDIR']) as scratch:
            subject = Path(scratch)
            for name in ('runner.sh', 'driver.py'):
                (subject / name).write_bytes(subprocess.check_output(
                    ['git', 'show', revision + ':prototypes/imagine-cutout/tests/' + name]))
            os.environ['HARNESS_SUBJECT'] = str(subject)
            unittest.main(verbosity=2)
    else:
        unittest.main(verbosity=2)
