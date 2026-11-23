# Local Python and rendering gates

From the repository root, use an existing Python with NumPy and Pillow:

```sh
python3 prototypes/imagine-cutout/tests/run_python_tests.py --temp-root "$CODEX_BURN_WORK/tmp"
```

Create the supplied temporary parent first. Omit `--temp-root` to use the
platform temporary directory. The command discovers every `test_*.py`, with
no exclusions, fails if no tests were discovered, and propagates test failures.
It supplies a private
`TMPDIR` before driver imports, private XDG directories, a two-worker cap and
no inherited `DISPLAY`; its scratch directory is removed on exit. It can be
called from any working directory using the script's absolute path.

The lifecycle controls start their own Xvfb server and require Bash, Xvfb and
at least 5 GiB free, under the existing 23:55–03:00 America/New_York quiet-hours
policy. Those controls remain subject to the separate hermetic-policy work in
PR #47. This runner neither replaces them nor hides a failure when a prerequisite
is missing. A display server supplied by the caller is unnecessary. The PNG
oracle controls create their own tiny captures; they require no Godot or artwork.

This is the test-side slice of issue #40. CI wiring belongs to the owner. The
ordinary Python controls are separate from live renderer acceptance and mutation
evidence. No result from one is evidence that another passed.

For the established rendered gates, set `TMPDIR` to an existing private scratch
parent and `TEST_PYTHON` to the same existing interpreter, then use the existing
wrappers from the repository root:

```sh
TMPDIR="$CODEX_BURN_WORK/tmp" TEST_PYTHON=python3 prototypes/imagine-cutout/tests/run_tests.sh
TMPDIR="$CODEX_BURN_WORK/tmp" TEST_PYTHON=python3 prototypes/imagine-cutout/tests/run_body_tests.sh --character char2
TMPDIR="$CODEX_BURN_WORK/tmp" TEST_PYTHON=python3 prototypes/imagine-cutout/tests/run_mutants.sh --character char2
```

These wrappers own an offscreen Xvfb display and disposable project copies;
each Godot import/render goes through the existing heavy-run guard, sequentially
with two workers. Godot's display-less mode alone cannot supply the framebuffer
readbacks required by these raster checks. Preserve every failure and refusal;
do not substitute cached images, relax tolerances or retry to obtain green.
Public trenchcoat mutation reports missing raw Segments exports as an explicit
skip for overlap mutant c; that skip is never a kill. See [the frozen rules](../TESTS.md).

The distinct provenance-only fixture mutants can be run without Godot or Xvfb:

```sh
TMPDIR="$CODEX_BURN_WORK/tmp" HEAVY_WAIT=1 agent-mutate python3 prototypes/imagine-cutout/tests/run_imagine_mutants.py --fixture --output "$CODEX_BURN_WORK/tmp/provenance-mutants.json"
```

That command requires a green baseline and twelve specific source/sidecar
rejections. Its fixture is explicitly **not rig acceptance** and does not replace
the four real rendered char2 body mutants. A busy heavy guard is a deferral,
not a passing run.

The new PNG-file controls also have a small, reproducible sensitivity check:

```sh
HEAVY_WAIT=1 agent-mutate python3 prototypes/imagine-cutout/tests/check_image_oracle_mutants.py --temp-root "$CODEX_BURN_WORK/tmp" --output "$CODEX_BURN_WORK/tmp/oracle-sensitivity.json"
```

It requires the eight controls to pass before making disposable copies of the
Python image oracle. Each copy changes one frozen rule: allow one gap, reject
alpha 128, narrow the colour tolerance from three to two, or allow an empty
non-root stencil. All four must produce assertion failures; import errors do
not count as kills. These four selected controls are not an exhaustive mutation
score, a configured percentage gate, or evidence about live Godot rendering.
