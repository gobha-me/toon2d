// Produce a FLAT dist/ folder suitable for `kubectl create configmap --from-file=dist/`
// (ConfigMaps don't keep subdirectories and cap total size at 1 MiB).
// Checks: flat relative references only, valid ConfigMap keys, size budget.
// Does not deploy anything.
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';

const SRC = 'prototype';
const OUT = 'dist';
const LIMIT = 1024 * 1024;
const BUDGET = 900 * 1024; // keep headroom under the hard limit
const RUNTIME = new Set(['.html', '.js', '.json', '.css', '.png', '.webp', '.svg']);
const KEY = /^[-._a-zA-Z0-9]+$/;

const errors = [];
const files = readdirSync(SRC).filter((f) => {
  const st = statSync(join(SRC, f));
  if (st.isDirectory()) {
    errors.push(`subdirectory ${f}/ would be dropped by a ConfigMap; keep runtime files flat`);
    return false;
  }
  return RUNTIME.has(extname(f));
});

for (const f of files) {
  if (!KEY.test(f)) errors.push(`${f}: not a valid ConfigMap key`);
  if (!['.js', '.html', '.css', '.json'].includes(extname(f))) continue;
  const text = readFileSync(join(SRC, f), 'utf8');
  const refs = [
    ...text.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/(?:src|href)=["']([^"']+)["']/g),
    ...text.matchAll(/new URL\(\s*['"]([^'"]+)['"]/g),
    ...text.matchAll(/"image"\s*:\s*"([^"]+)"/g),
  ].map((m) => m[1]);
  for (const r of refs) {
    if (/^(data:|https?:|#)/.test(r)) continue;
    if (r.startsWith('/')) errors.push(`${f}: absolute path "${r}" breaks sub-path hosting`);
    else if (r.replace(/^\.\//, '').includes('/')) errors.push(`${f}: nested path "${r}" breaks a flat ConfigMap`);
    else if (!files.includes(r.replace(/^\.\//, ''))) errors.push(`${f}: reference "${r}" not found in ${SRC}/`);
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
let total = 0;
for (const f of files) {
  copyFileSync(join(SRC, f), join(OUT, f));
  total += statSync(join(OUT, f)).size;
}
const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;
console.log(`${files.length} files -> ${OUT}/ (${kib(total)} of ${kib(LIMIT)} ConfigMap limit)`);
if (total > LIMIT) errors.push(`total ${kib(total)} exceeds the 1 MiB ConfigMap limit`);
else if (total > BUDGET) console.warn(`warning: ${kib(total)} is above the ${kib(BUDGET)} safety budget`);
if (errors.length) {
  console.error(`dist check FAILED:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log('dist check OK. To publish (not run by this script):');
console.log(`  kubectl create configmap NAMESPACE --from-file=${OUT}/ --dry-run=client -o yaml`);
