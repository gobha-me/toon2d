# lifelike-proto: lifelike AI art, animated three ways

**Credit:** Sample stills in `src/` — Generated with Grok Imagine (SpaceXAI) (CC0 1.0; see repo `PROVENANCE.md`).

Serve locally: `npm run serve` from this directory (or via the repo demo page). Cluster deploy examples are generic placeholders under `deploy/` — do not commit real hosts or credentials.


The scores and findings are in **REVIEW.md**, and the face lessons are in **LESSONS-face.md**.

The embeddable face is **`prototype/bust.js`**, with a demo at **`bust.html`**. It is the F2 bust (default `method: 2`, `turnMode: 0`; F1/F3/F4 selectable) on one canvas, controlled through an event API:
- `setExpression`;
- `say`, `yell`, `project`, `interject`, `quiet`;
- `hit(intensity)`, `hurting(level)`;
- `breath(intensity)`;
- `distract(level)`, `glance(side)`;
- `on(event, fn)`;
- `advance(n)`, `start`, `stop`, `destroy`.

## Layout

| Path | Contents |
|---|---|
| `src/` | The AI source art (fictional character). `rig_side.jpg` is the main body. `face_front.jpg` plus `face_eyes_closed.jpg` and `expr_sheet.jpg` are the faces. `walk_sheet2.jpg` is the walk frames. The failed attempts are kept on purpose: `fullbody_side.jpg` (3/4 view with a bag), `walk_sheet.jpg` (static legs) and `parts_sheet_attempt.jpg` (mannequin joints). |
| `tools/cut_body.py` | Removes the background, cuts the image into polygon parts and fills the areas the arm and hem hid (patch, row-fill and Telea heal). Also unmattes, removes the hand's backing and the floor shadow, then packs `body-atlas.webp` and `body-rig.json`. |
| `tools/prep_face.py` | Aligns every version to the neutral face (ORB + similarity RANSAC). The versions are: the 4 expressions, distressed, winded, 4 head turns, the yell and project mouths, and pain. It computes two-way DIS optical flow and writes three files:<br>• `face-e.webp`: a 4x4 atlas of the versions;<br>• `face-f.webp`: a 13x2 flow atlas at 128 px (RG = d*2+128; the B channel holds the mouth masks: row 0 is lips + opening, row 1 is the opening only);<br>• `face.json`. |
| `src/gen2/` | The second round of AI versions: head turns (rejected by the user and unused by default; the atlas still carries them), winded, distressed, yell, project and pain. Rejected tries are kept on purpose (`*_REJECTED`, `*hairdrift*`). |
| `tools/prep_walk.py` | Segments the 6 AI walk frames, keeps their size consistent using head height, sets a common baseline, and writes `walk-frames.webp/json`. |
| `prototype/` | WebGL, ES modules, flat files. `gl.js` is the batch renderer, `rig.js` has the bones, IK gait and approaches A/B/C, `face.js` is the face shader (F1/F2/F3/F4) plus `FaceSim` (expressions, takes, breathing, distraction, the speech layer, pain) and the gambit script. `bust.js` is the embeddable widget, and `main.js` handles the UI and the `window.lifelike` test API. |
| `scripts/` | `serve.mjs`, `dist.mjs` (flat 1 MiB ConfigMap check), `shots.mjs` (headless deterministic capture), `bustcheck.mjs` (widget smoke test), `livecheck.mjs` (headless check of the deployed pages), `gif_eyes.py` (eyes-only distracted GIF; `SETS=eyes`), `gif.py`, and `gif2.py` (the gambit GIFs). |
| `deploy/render.py` | Renders `deploy/lifelike.yaml`: ConfigMap with binaryData, Deployment, Service, Middlewares and Ingress. |

## Run

```
npm run lint                  # eslint flat config, 0 warnings
npm run serve                 # http://localhost:8080/
npm run prep                  # rebuild assets from src/ (.venv python)
node scripts/shots.mjs work/raw && .venv/bin/python scripts/gif.py work/raw shots
npm run dist && python3 deploy/render.py
```

To publish a static build, prefer GitHub Pages from the repo demo. If you adapt the example manifests under `deploy/`, replace placeholders (`demo`, `EXAMPLE_HOST`) and apply with your own kubectl context. Server-side apply is recommended for large ConfigMaps (client-side last-applied annotations are capped at 256 KB).

## How to do it (what worked)

1. **Generate rig-friendly art.** Use a strict profile, limbs separated, no props, flat background. The first 3/4 attempt with a bag was uncuttable.
2. **Cut parts with overlaps at the joints.** Paint in what each part hides. Plan for this, because AI art has no hidden layers.
3. **Body:** drive bones with IK on a moving floor so the feet stay planted.
   - Skinned meshes (B) give breathing and secondary motion.
   - Rigid parts (A) stay sharp.
4. **Face:**
   - Generate an expression set and an eyes-closed version from the same seed or reference, then align them to the neutral face.
   - Bake two-way optical flow and morph in a shader.
   - Mask the morph to the face, so hair and clothes that differ between versions don't swim.
   - Layer the procedural blink, eye movement, breathing and head sway on top.
