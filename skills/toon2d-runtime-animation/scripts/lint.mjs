#!/usr/bin/env node
// Static lint for a toon2d project. Zero deps (uses `node --check` for syntax).
//   node scripts/lint.mjs <projectDir>
// Rules (errors):
//   syntax        every .js/.mjs parses
//   no-bare-deps  imports are relative ('./x.js') or node: builtins: no npm packages, no CDN URLs
//   determinism   no Math.random / Date.now / performance.now in simulation modules (engine/ except files tagged // @dom)
//   pure-modules  engine/ files without a `// @dom` tag must not touch document/window/canvas APIs
//   contract      index.html, main.js (or a module script), rig.json, expressions.json exist; something defines window.__toon
//   validators    rig.json passes validate-rig --contract; expressions.json passes validate-expressions --min 3
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { validateRig } from './validate-rig.mjs';
import { validateExpressions } from './validate-expressions.mjs';

function walk(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n.startsWith('.') || n === 'shots' || n === 'dist') continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(m?js)$/.test(n)) out.push(p);
  }
  return out;
}

export function lint(projectDir) {
  const root = resolve(projectDir);
  const errors = [];
  const warnings = [];
  const files = walk(root);
  let contractFound = false;
  for (const f of files) {
    const rel = relative(root, f);
    const src = readFileSync(f, 'utf8');
    try {
      execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
    } catch (e) {
      errors.push(`syntax ${rel}: ${String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')}`);
    }
    for (const m of src.matchAll(/(?:import\s[^'"]*?from\s*|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g)) {
      const spec = m[1];
      if (!(spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:'))) errors.push(`no-bare-deps ${rel}: import '${spec}'`);
    }
    if (/window\.__toon\s*=/.test(src)) contractFound = true;
    const isDom = /\/\/\s*@dom\b/.test(src);
    if (rel.startsWith('engine/') && !isDom) {
      const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
      if (/Math\.random\s*\(/.test(code)) errors.push(`determinism ${rel}: Math.random (use a seeded rng)`);
      if (/\b(Date\.now|performance\.now)\s*\(/.test(code)) errors.push(`determinism ${rel}: wall clock in simulation (use the fixed tick dt)`);
      if (/\b(document|window|requestAnimationFrame|localStorage|HTMLCanvasElement|Image\s*\()\b/.test(code)) errors.push(`pure-modules ${rel}: DOM access in a logic module (tag it // @dom if it is a renderer)`);
    }
  }
  for (const n of ['index.html', 'rig.json', 'expressions.json']) if (!existsSync(join(root, n))) errors.push(`contract: missing ${n}`);
  if (!contractFound) errors.push('contract: nothing assigns window.__toon (see reference/harness-contract.md)');
  if (!existsSync(join(root, 'engine'))) warnings.push('no engine/ dir: purity and determinism rules were not applied to any file');
  if (existsSync(join(root, 'rig.json'))) {
    const r = validateRig(JSON.parse(readFileSync(join(root, 'rig.json'), 'utf8')), { baseDir: root, contract: true });
    errors.push(...r.errors.map((e) => `rig: ${e}`));
    warnings.push(...r.warnings.map((e) => `rig: ${e}`));
  }
  if (existsSync(join(root, 'expressions.json'))) {
    const r = validateExpressions(JSON.parse(readFileSync(join(root, 'expressions.json'), 'utf8')), { min: 3 });
    errors.push(...r.errors.map((e) => `expressions: ${e}`));
    warnings.push(...r.warnings.map((e) => `expressions: ${e}`));
  }
  return { errors, warnings, files: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] || '.';
  const r = lint(dir);
  for (const w of r.warnings) console.log(`warn  ${w}`);
  for (const e of r.errors) console.log(`ERROR ${e}`);
  console.log(r.errors.length ? `FAIL lint (${r.errors.length} errors, ${r.files} files)` : `OK lint (${r.files} files, ${r.warnings.length} warnings)`);
  process.exit(r.errors.length ? 1 : 0);
}
