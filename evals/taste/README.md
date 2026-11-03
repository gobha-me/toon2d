# Blind taste comparisons

Issue #5 requires a judge outside the author loop, seeing rendered pixels only,
with randomized presentation order. `scripts/taste-packets.mjs` prepares those
comparisons without calling a model or collecting invented human ratings. It
stays outside the portable skill package. Keep the actual grader prompt,
reference images, manifests and keys in the evaluator's separate environment.

Prepare a manifest with one candidate/reference comparison per trial:

```json
{
  "schema_version": 1,
  "trials": [
    {
      "id": "sheet-01-vs-reference",
      "group": "character-family-01",
      "split": "calibration",
      "candidate": "captures/candidate.png",
      "reference": "references/target.png"
    }
  ]
}
```

Input paths resolve relative to the manifest. Use native-scale contact sheets
with ordered motion frames, exported as non-interlaced RGBA8 PNG. Standardize
the layout, background and scale before preparing packets; the tool preserves
all visible pixels. It supports at most 100 trials, four million pixels per
image and sixteen million pixels total. Keep related variants in the same
preassigned split (`calibration` or `held-out`). Reused references must also stay
within a split: use disjoint reference sets for held-out comparisons.

```bash
node scripts/taste-packets.mjs manifest.json new-packet-directory
```

Only send `new-packet-directory/packet/` to the reviewer. It contains opaque
image filenames and `trials.json`, listing the presentation order and left/right
images. Trial order and candidate side are independently randomized using the
system cryptographic RNG. Images are decoded and re-encoded to remove PNG
metadata and trailing annotations. Source filenames, roles, split membership,
IDs, code, critiques and prior scores are absent from the packet manifest.

Keep `private-key.json` with the evaluator. It records the original IDs, groups,
splits, candidate sides and SHA-256 hashes of both source bytes and normalized
packet images. Its manifest hash covers `JSON.stringify` of the parsed manifest.
The output parent has mode 0700 and the key mode 0600. Existing output paths
are refused. Validate all inputs before any output is created; failed writes
remove the incomplete new output. Archive the exact packet and key used for a
review; regenerating a packet creates fresh IDs and presentation order.

For each opaque trial ID, collect left/right/tie preferences for each of the
eight rubric axes and observations grounded in specific frames. Ask reviewers
to inspect native scale and nearest-neighbour enlargement. Flag visible text
or labels before scoring and exclude contaminated sheets. Metadata removal
cannot detect or erase text drawn into pixels, nor establish that source art
is original. This manual screen is still mandatory. Authors must not receive
the key, hidden references or grader prompt.

The key lets the evaluator recover candidate preferences and audit the exact
images. Absolute 1–5 ratings collected for judge/human agreement remain a
separate measure; do not convert preferences into absolute scores. Independent
human ratings, judge calibration, a documented threshold and a fresh blind
baseline comparison are still required before #5 is complete. This preparation
tool neither grades art nor promotes the advisory take-off check in #13.

After all reviewers have returned their blind responses, the evaluator can
recover candidate preferences using `scripts/taste-preferences.mjs`. Collect
one response file with this shape (use the packet's actual opaque IDs):

```json
{
  "schema_version": 1,
  "reviewers": [
    {
      "reviewer_id": "owner-01",
      "kind": "owner",
      "trials": [
        {
          "trial_id": "opaque-id-from-trials-json",
          "visible_text": false,
          "preferences": ["left", "right", "tie", "left", "tie", "left", "right", "left"]
        }
      ]
    }
  ]
}
```

Each reviewer must screen and return every trial exactly once. The eight
preferences follow rubric order: proportions, silhouette, line weight,
palette, shading, on-model consistency, game scale, appeal. Values are `left`,
`right` or `tie`; `visible_text` is an explicit boolean from manual screening.
Any positive text flag excludes that sheet's trial for **all** reviewers.
Complete vectors are required even for excluded trials; those votes are
discarded. Collect responses independently before consulting the key. Reviewer
kinds are `owner`, `human` or `judge`; record the real evaluator identity and
collection method separately. The tool cannot establish reviewer independence
or verify who supplied a response.

```bash
node scripts/taste-preferences.mjs private-key.json responses.json new-report.json
```

The private report keeps every reviewer and split separate. For each axis it
counts candidate wins, reference wins and ties, reports `(wins + ties / 2) / N`
as `preference_score`, and reports `wins / (wins + losses)` as
`decisive_win_fraction`. Empty denominators yield `null`. No scores are pooled
across axes or reviewers, and no pass threshold or statistical significance
is inferred. Inspect owner and judge results separately for the fresh blind
comparison required by #5. The report includes excluded opaque IDs and SHA-256
hashes of the exact key and response bytes. Existing output paths are refused;
new reports have mode 0600 and stay with the private evaluator evidence.
These pairwise results remain separate from absolute judge/human agreement.
