# Harness contract: `window.__toon`

`scripts/score.mjs` and `scripts/capture.mjs` open `<project>/index.html?harness=1[&your query]` in headless Chrome
(over the DevTools protocol; no Playwright needed), wait for `window.__toonReady` (or `__toon`), then drive the
simulation tick by tick. **Any engine port that implements this API can be scored and captured** (for Godot, export
to HTML5 and bridge with `JavaScriptBridge`, or write an equivalent harness in GDScript and adapt `scripts/lib/drive.mjs`).

Rules: `harness=1` means manual stepping (no rAF advance). Everything is deterministic for a given seed:
the same calls produce the same states and pixels (checked by `determinism`).

| Member | Returns / does |
|---|---|
| `version` | `1` |
| `dt` | fixed tick seconds (1/60) |
| `manual(v=true)` | stop/start the real-time loop |
| `reset({seed, flags, x})` | fresh character at `x` on the floor with given flags; resets input and events; returns `state()` |
| `setInput({left, right, jump})` | held buttons for the following ticks |
| `trigger(name)` | one-shot gameplay event next tick (`'hurt'`, ...) |
| `tick(n=1)` | advance n fixed ticks, then render once; returns tick count |
| `setFlags({...})` | e.g. `{ap:false}` (master anti-puppet), `{timing:'twos'}`, individual flags (see runtime-core.md) |
| `setExpression(name\|null)` | pin an expression preset (null = back to automatic director) |
| `expressions()` | preset names, must include `neutral` and ≥ 3 others |
| `lookAt(x, y)` / `lookAt(null)` | world-space gaze target |
| `view()` | `{mode:'pixel'\|'smooth', W, H, s, k, camX, camY, canvas:'#game'}`: buffer size, world→buffer scale s, integer upscale k, camera |
| `state()` | see below |
| `pixels(layer, rect?)` | `{w,h,x,y,data: base64 RGBA}` of `'buffer'` (low-res composite), `'character'` (character only, transparent bg, same size as buffer) or `'display'` (upscaled canvas). `rect` crops (big smooth buffers are slow to ship whole) |

`state()`:

```js
{ tick, state,               // 'idle'|'run'|'turn'|'jump'|'fall'|'land'|'hurt' (+ your own)
  facing,                    // +1 right, -1 left
  grounded,
  root: {x, y, vx, vy},      // world px (= buffer px in pixel mode); y down; root = ground point under the body
  feet: [{side:'F'|'B', x, y, planted, reach}],      // ankle world positions; planted = locked to the world
  joints: [{name, x, y, ex, ey}],                    // every bone start/end in world px (used for gap checks)
  face: {eyeOpenL, eyeOpenR, browL, mouthOpen, ...}, // current smoothed face params
  blink, pinned, flags, events }
```

Required bone names (for `validate-rig --contract` and score): `hip, spine, head, armUF, armLF, armUB, armLB,
legUF, legLF, legUB, legLB` (F = near/front, B = far/back). Add more bones freely (coat, tail, scarf...).

What the scripts feed it (STANDARD scenario in `scripts/lib/drive.mjs`): idle 360 ticks, run right 150, turn left 45,
stop 50, jump 75 (release at 22), run-jump 70, settle 40; then each expression pinned on a settled idle;
then repeats with `{ap:false}` for the toggle check.
