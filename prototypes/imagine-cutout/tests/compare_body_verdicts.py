#!/usr/bin/env python3
"""Compare the fresh trenchcoat acceptance verdicts to the retained v2 run."""
import argparse
import json
from pathlib import Path


def main():
    prototype = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser()
    parser.add_argument('--actual', type=Path, default=prototype / 'tests/results/trenchcoat/body.json')
    parser.add_argument('--reference', type=Path,
                        default=prototype / 'validation/v2/body/body-parts/red-first.json')
    args = parser.parse_args()
    if not args.actual.is_file():
        print('DEFERRED: fresh trenchcoat body result has not been produced')
        return 79
    actual = json.loads(args.actual.read_text())
    reference = json.loads(args.reference.read_text())
    canonical = lambda value: json.dumps(value, sort_keys=True, separators=(',', ':')).encode()
    equal = canonical(actual['tests']) == canonical(reference['tests'])
    equal = equal and actual['pose_sha256'] == reference['pose_sha256']
    if equal and actual['passed'] and actual['full_acceptance_run']:
        print('PASS: full trenchcoat verdict bytes and pose hash match the retained v2 run')
        return 0
    print('FAIL: trenchcoat verdict bytes/pose hash differ, or acceptance is incomplete/red')
    return 1


if __name__ == '__main__':
    raise SystemExit(main())
