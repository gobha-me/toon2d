# Golden task G2: smooth-mode character with a coat and a gameplay-driven expression

Use the skill in `skill/` (start at `skill/SKILL.md`). Build in `out/`, starting from the skill's starter.

Requirements:
1. Must work and pass the skill's score in smooth mode (`?mode=smooth`). Pixel mode may stay as it is.
2. Add a long coat tail hanging from the hip: at least 2 chained segments with spring/verlet secondary motion
   that lag on starts, stops, turns and landings and then settle. Expose the segments as bones whose names start
   with `coat` (so they appear in `window.__toon.state().joints`). Draw them behind the near leg.
3. Add a new expression preset `scheming` that moves eyes, brows and mouth, and a gameplay event `pickup`
   (`window.__toon.trigger('pickup')`) that makes the face play `scheming` as a reaction.
4. Keep everything else passing (feet, gaps, turn, idle, blink, expressions, anti-puppet toggle).
5. `out/GODOT.md`: how you would port this character to Godot 4 (nodes, IK, springs, physics tick, pixel/
   integer scaling, the face) in one page.
6. `out/NOTES.md`: what you did, measured scores, rubric self-scores with evidence, known issues.

Do not modify `skill/`.
