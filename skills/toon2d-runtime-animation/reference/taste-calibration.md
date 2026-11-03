# Paired taste ratings

Issue #5 needs a human-rated set and a judge/human agreement report before a
taste floor can become a required grader check. The report tool summarizes
ratings collected outside the author loop. It makes no model calls and assigns
no passing threshold.

Collect about 20 contact sheets covering clean and cluttered art, including
the baseline and the intended reference styles. Assign opaque sheet IDs and
calibration or held-out membership before collecting ratings. Keep related
variants in the same split. Shuffle presentation order and hide author names,
code, critiques and scores from each reviewer. Show the rendered pixels at
native and enlarged scales, with ordered motion frames. Use the eight axes in
[the taste rubric](taste-rubric.md). Keep the judge prompt and reference set in
the separate grader environment.

Record one human vector and one judge vector per sheet. If several people
rate a sheet, agree on a panel procedure before collecting data; preserve the
individual ratings separately and record the panel's final integer vector.
Do not count multiple ratings of the same sheet as independent sheets. Never
substitute an author's self-review for the human vector.

The input is JSON with `schema_version: 1` and a nonempty `pairs` array. Each
pair has `sheet_id`, `split` (`calibration` or `held-out`), `human`, and `judge`.
Both score objects must contain exactly these keys, with integer values 1–5:

```json
{
  "proportions": 3,
  "silhouette": 3,
  "line_weight": 3,
  "palette": 3,
  "shading": 3,
  "on_model": 3,
  "game_scale": 3,
  "appeal": 3
}
```

These values illustrate the format only. They are not calibration evidence.
Preserve the original sheets, their hashes, collection date, split assignment,
human panel procedure and judge version alongside the input in the evaluator's
records. Avoid publishing hidden grader material in the author skill.

From the skill directory, run:

```bash
node scripts/taste-agreement.mjs paired-ratings.json > agreement.json
```

The report includes a SHA-256 of the exact input bytes. Calibration and held-out
results are reported separately. Each axis reports exact agreement and
agreement within one point as fractions, mean absolute error in score points,
and Spearman rank correlation across sheets. `mean_score_spearman` correlates
each sheet's mean of the eight axes. Ties receive average ranks. Correlation
is `null` for fewer than two sheets or constant scores from either reviewer;
an empty split has zero sheets and `null` metrics. Counts always accompany
metrics so a small sample cannot be mistaken for a completed calibration set.

Exit 0 means a report was produced, including reports with low agreement or
missing held-out data. Invalid input exits 2 without a report. The tool rejects
duplicate sheet IDs even across splits, missing axes and out-of-range scores.
It cannot verify reviewer independence or detect different IDs for the same
artwork; audit those against the original sheets.

Use calibration results to choose a judge configuration and document its
proposed taste floor, then check the frozen configuration on the held-out
subset. Human approval of the threshold, actual reference images and the blind
baseline comparison remain required work in #5. This report does not promote
the advisory take-off check tracked in #13.
