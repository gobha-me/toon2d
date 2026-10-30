# V2 validation evidence

`v2-sourced/` is the **final full verification** of the silhouette-constrained
assembly, with read-only source exports copied into scratch so mutant c can
actually be planted. Its `oracle.txt`, `original.txt`, `body.txt`, `mutants.txt`
and copied JSON files are authoritative for the final result.

`v2/` retains the source-free development verification (mutant c explicitly
skipped), final preparation idempotence / unchanged-pixel hashes, the final
native HD review captures and the independent visual review. Source-free test
results there precede the final lining silhouette refinement; the final
source-backed full verification covers that refinement.

All tests are the committed test-lane code, copied unchanged into disposable
projects. Results were copied out; no test-lane file in this checkout was
modified. Godot imports and captures were guarded by `heavy-run`, sequential,
with at most two workers. No scratch project or raw source export is retained.
