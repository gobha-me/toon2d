"""Four rule-sensitivity controls; run with agent-mutate, never as rig acceptance."""
import argparse
import ast
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

TESTS = Path(__file__).resolve().parent


class FrozenRuleMutant(ast.NodeTransformer):
    def __init__(self, name):
        self.name = name
        self.edits = 0

    def visit_FunctionDef(self, node):
        if node.name == 'image_oracle':
            node = self.generic_visit(node)
        return node

    def visit_Compare(self, node):
        node = self.generic_visit(node)
        if (self.name == 'allow-one-gap' and isinstance(node.left, ast.Name)
                and node.left.id == 'count' and len(node.ops) == 1
                and isinstance(node.ops[0], ast.Eq)
                and isinstance(node.comparators[0], ast.Constant)
                and node.comparators[0].value == 0):
            node.ops[0] = ast.LtE()
            node.comparators[0] = ast.Constant(value=1)
            self.edits += 1
        if (self.name == 'reject-colour-boundary-3' and len(node.ops) == 1
                and isinstance(node.ops[0], ast.LtE)
                and isinstance(node.comparators[0], ast.Constant)
                and type(node.comparators[0].value) is int
                and node.comparators[0].value == 3):
            node.comparators[0] = ast.Constant(value=2)
            self.edits += 1
        return node

    def visit_Constant(self, node):
        if self.name == 'reject-alpha-128' and type(node.value) is int and node.value == 128:
            self.edits += 1
            return ast.copy_location(ast.Constant(value=129), node)
        return node

    def visit_BoolOp(self, node):
        node = self.generic_visit(node)
        if (self.name == 'allow-empty-nonroot' and isinstance(node.op, ast.Or)
                and any(isinstance(child, ast.Name) and child.id == 'area'
                        for child in ast.walk(node))):
            self.edits += 1
            return ast.copy_location(ast.Constant(value=True), node)
        return node


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--temp-root', type=Path)
    parser.add_argument('--output', type=Path, help='optional JSON summary; detailed logs beside it')
    args = parser.parse_args()
    if args.output is not None:
        args.output.parent.mkdir(parents=True, exist_ok=True)
    results = []
    for name in ('baseline', 'allow-one-gap', 'reject-alpha-128',
                 'reject-colour-boundary-3', 'allow-empty-nonroot'):
        with tempfile.TemporaryDirectory(prefix='oracle-sensitivity-', dir=args.temp_root) as directory:
            target = Path(directory) / 'repository/prototypes/imagine-cutout/tests'
            target.mkdir(parents=True)
            tree = ast.parse((TESTS / 'driver.py').read_text())
            edits = 0
            if name != 'baseline':
                mutator = FrozenRuleMutant(name)
                tree = mutator.visit(tree)
                ast.fix_missing_locations(tree)
                edits = mutator.edits
                expected_edits = 2 if name == 'reject-alpha-128' else 1
                if edits != expected_edits:
                    raise RuntimeError(f'{name}: expected {expected_edits} edits, got {edits}')
            (target / 'driver.py').write_text(ast.unparse(tree) + '\n')
            shutil.copy2(TESTS / 'test_driver_image_oracle.py', target / 'test_driver_image_oracle.py')
            env = dict(os.environ, TMPDIR=directory, PYTHONDONTWRITEBYTECODE='1',
                       OPENBLAS_NUM_THREADS='2')
            result = subprocess.run([sys.executable, '-m', 'unittest', '-v',
                                     'test_driver_image_oracle'],
                                    cwd=target, env=env, text=True, capture_output=True)
            if args.output is not None:
                log = args.output.with_name(f'{args.output.stem}-{name}.log')
                log.write_text(result.stdout + result.stderr)
            if name == 'baseline':
                if result.returncode != 0:
                    raise RuntimeError(result.stdout + result.stderr)
                status = 'PASS'
            else:
                if not (result.returncode == 1 and 'FAIL:' in result.stderr
                        and 'ERROR:' not in result.stderr):
                    raise RuntimeError(f'{name}: mutant did not produce assertion failures\n'
                                       + result.stdout + result.stderr)
                status = 'KILLED'
            failures = [line for line in result.stderr.splitlines() if line.startswith('FAIL:')]
            results.append({'name': name, 'edits': edits, 'exit': result.returncode,
                            'status': status, 'failures': failures})
            print(json.dumps(results[-1]), flush=True)
    if args.output is not None:
        args.output.write_text(json.dumps({
            'scope': 'four hand-planted driver.image_oracle controls; not exhaustive mutation score',
            'results': results,
        }, indent=2) + '\n')


if __name__ == "__main__":
    main()
