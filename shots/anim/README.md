# Animated field guide clips

Made by `node scripts/animcap.mjs <jobs>` (deterministic fake-clock capture, `bubbles=0`) and
`python3 scripts/animgif.py` (job list: `scripts/animjobs.py`). `scripts/animweb.sh` converts them to
`docs/media/*.mp4` for the static guide (`docs/guide.html`). Build helpers live under `scripts/` when present; this candidate ships the already-captured MP4s.

- `style-<style>-<run|jumpland|idle|expr|turn>.gif`: each style in motion
- `tech-<technique>-<scenario>.gif`: the same inputs with the technique OFF (left) and ON (right)
  - mesh (zoom 3), ease (`off=ease,overlap`), twos (1s/2s/3s), smear (half speed), springs,
    turn (60 fps capture, half speed), idle, pixel (`pxbuf=0` = same rig at full res), all (vs `renderer=legacy`)
