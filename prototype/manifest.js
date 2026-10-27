// Parts manifest validation/normalisation. Pure.

export function validateManifest(manifest, boneNames) {
  const errors = [];
  if (!manifest || !Array.isArray(manifest.parts)) return { ok: false, errors: ['manifest.parts must be an array'] };
  const names = new Set();
  const bones = new Set(boneNames);
  for (const [i, p] of manifest.parts.entries()) {
    const where = `parts[${i}]${p && p.name ? ` (${p.name})` : ''}`;
    if (!p || typeof p.name !== 'string') errors.push(`${where}: missing name`);
    else if (names.has(p.name)) errors.push(`${where}: duplicate name`);
    else names.add(p.name);
    if (!p || !bones.has(p.bone)) errors.push(`${where}: unknown bone ${p && p.bone}`);
    if (!p || !Number.isFinite(p.z)) errors.push(`${where}: z must be a number`);
    if (p && !p.image && !p.shape) errors.push(`${where}: needs an image or a shape`);
    if (p && p.image && (!Array.isArray(p.pivot) || p.pivot.length !== 2)) errors.push(`${where}: image parts need pivot [x,y]`);
  }
  return { ok: errors.length === 0, errors };
}

/** Parts sorted by z (stable for equal z, by manifest order). */
export function drawOrder(manifest) {
  return manifest.parts
    .map((p, i) => ({ p, i }))
    .sort((a, b) => a.p.z - b.p.z || a.i - b.i)
    .map((e) => e.p);
}
