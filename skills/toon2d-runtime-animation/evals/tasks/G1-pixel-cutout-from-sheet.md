# Golden task G1: playable pixel character from a parts pose sheet

You are given a pixel-art **parts pose sheet** for a character called Vex (cyberpunk courier):
`fixture/sheet.png` with `fixture/sheet.json` (part rects). Each part has single marker pixels:
`#FF00FF` = pivot (joint to its parent), `#00FFFF` = tip (joint to its child), `#FFFF00` on the head = face anchor.
1 sheet pixel = 1 game pixel. The face area is blank skin: the face must be procedural.

Use the skill in `skill/` (start at `skill/SKILL.md`).

Produce, in `out/`, a playable web character (open `out/index.html` from a static server) with:
1. The sheet's parts on the skeleton (sprites, not the template's vector shapes), markers never visible.
2. States idle, run, jump (and fall/land) and turn, driven by keyboard (left/right/space) and by the harness.
3. Pixel mode by default (low-res buffer, integer upscale, no filter blur).
4. Automatic blink, look-at, and at least 3 non-neutral expressions that each read at game scale.
5. Anti-puppet layers on by default (toggleable).
6. The skill's harness contract (`window.__toon`) so the skill's scripts can score and capture it.
7. `out/NOTES.md`: what you did, the scores you measured, your own rubric scores with evidence, known issues.

Done = the skill's own lint, validators and score pass on `out/`, and you have looked at the captures.
Do not modify `fixture/` or `skill/`.
