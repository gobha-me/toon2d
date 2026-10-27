#!/usr/bin/env node
// Objective grader for the golden tasks. Run by the EVALUATOR, not by the agent doing the task.
//   node evals/run-evals.mjs <G1|G2|G3> <projectDir> [--out DIR] [--skill DIR]
// Writes DIR/results.json + results.md (+ captures for G1/G2). Exit 0 = all required checks pass.
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const [task, projArg] = args;
if (!task || !projArg) {
  console.error('usage: node evals/run-evals.mjs <G1|G2|G3> <projectDir> [--out DIR] [--skill DIR]');
  process.exit(2);
}
const SKILL = resolve(opt('--skill', join(HERE, '..')));
const PROJ = resolve(projArg);
const OUT = resolve(opt('--out', join(PROJ, '_eval')));
mkdirSync(OUT, { recursive: true });

const { lint } = await import(join(SKILL, 'scripts/lint.mjs'));
const { validateRig } = await import(join(SKILL, 'scripts/validate-rig.mjs'));
const { validateExpressions } = await import(join(SKILL, 'scripts/validate-expressions.mjs'));
const { score } = await import(join(SKILL, 'scripts/score.mjs'));
const { captureAll } = await import(join(SKILL, 'scripts/capture.mjs'));
const { open } = await import(join(SKILL, 'scripts/lib/drive.mjs'));
const { fromB64 } = await import(join(SKILL, 'scripts/lib/img.mjs'));
const { decodePNG } = await import(join(SKILL, 'scripts/lib/png.mjs'));

const checks = [];
const add = (id, pass, detail = '') => {
  checks.push({ id, pass: !!pass, detail: String(detail).slice(0, 600) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${id.padEnd(26)} ${String(detail).slice(0, 200)}`);
};
const readJSON = (p) => JSON.parse(readFileSync(p, 'utf8'));
const exists = (f) => existsSync(join(PROJ, f));
const text = (f) => (exists(f) ? readFileSync(join(PROJ, f), 'utf8') : '');

async function common(query, minExpr) {
  for (const f of ['index.html', 'rig.json', 'expressions.json', 'NOTES.md']) add(`files.${f}`, exists(f), exists(f) ? 'present' : 'missing');
  const l = lint(PROJ);
  add('lint', l.errors.length === 0, l.errors.slice(0, 6).join(' | ') || `${l.files} files clean`);
  if (exists('rig.json')) {
    const r = validateRig(readJSON(join(PROJ, 'rig.json')), { baseDir: PROJ, contract: true });
    add('validate.rig', r.errors.length === 0, r.errors.slice(0, 6).join(' | ') || `ok (${r.warnings.length} warnings)`);
  }
  if (exists('expressions.json')) {
    const r = validateExpressions(readJSON(join(PROJ, 'expressions.json')), { min: minExpr });
    add('validate.expressions', r.errors.length === 0, r.errors.slice(0, 6).join(' | ') || `${r.strong} strong expressions`);
  }
  const s = await score(PROJ, { query });
  writeFileSync(join(OUT, `score${query ? '-' + query.replace(/[^a-z0-9]+/gi, '_') : ''}.json`), JSON.stringify(s, null, 2));
  for (const c of s.checks) add(`score.${c.id}`, c.pass, c.detail);
  let cap = null;
  try {
    cap = await captureAll(PROJ, { out: OUT, query, label: 'capture' });
  } catch (e) {
    add('capture.runs', false, e.message);
  }
  const capDir = join(OUT, 'capture');
  const gifs = existsSync(capDir) ? readdirSync(capDir).filter((f) => f.endsWith('.gif') && statSync(join(capDir, f)).size > 2000) : [];
  add('capture.frames', gifs.length >= 5, `${gifs.length} non-trivial GIFs in ${capDir}`);
  return { s, cap, capDir };
}

async function withPage(query, fn) {
  const sess = await open(PROJ, query);
  try {
    return await fn(sess.page, sess.view);
  } finally {
    await sess.close();
  }
}

const countColour = (img, rgb, tol = 10) => {
  let n = 0;
  for (let i = 0; i < img.data.length; i += 4) {
    if (img.data[i + 3] > 200 && Math.abs(img.data[i] - rgb[0]) <= tol && Math.abs(img.data[i + 1] - rgb[1]) <= tol && Math.abs(img.data[i + 2] - rgb[2]) <= tol) n++;
  }
  return n;
};

async function G1() {
  await common('', 3);
  const rig = exists('rig.json') ? readJSON(join(PROJ, 'rig.json')) : {};
  const spriteBones = (rig.bones || []).filter((b) => b.sprite).length;
  add('sprites.declared', rig.sheet && spriteBones >= 8, `rig.sheet ${!!rig.sheet}, ${spriteBones} bones with sprites (min 8)`);
  if (rig.sheet?.image && exists(rig.sheet.image)) {
    const im = decodePNG(readFileSync(join(PROJ, rig.sheet.image)));
    const img = { w: im.w, h: im.h, data: im.data };
    const m = countColour(img, [255, 0, 255], 0) + countColour(img, [0, 255, 255], 0) + countColour(img, [255, 255, 0], 0);
    add('sprites.sheet_clean', m === 0, `${m} marker pixels left in ${rig.sheet.image} (quantizing would recolour them, not hide them)`);
  } else add('sprites.sheet_clean', false, 'rig.sheet.image missing');
  await withPage('', async (page, view) => {
    add('mode.pixel_default', view.mode === 'pixel' && view.W <= 480, `default view ${JSON.stringify(view)}`);
    const flags = await page.eval('window.__toon.state().flags');
    add('antipuppet.default_on', flags.ap !== false, `flags ${JSON.stringify(flags)}`);
    await page.eval('window.__toon.reset({seed: 3})');
    await page.eval('window.__toon.tick(30)');
    const img = fromB64(await page.eval('window.__toon.pixels("character")'));
    // fixture colours (evals/fixtures/make_vex_sheet.py): jacket teal, hair white, boot sole
    const teal = countColour(img, [30, 170, 160]);
    const hair = countColour(img, [230, 232, 240]);
    add('sprites.rendered', teal >= 25 && hair >= 10, `fixture jacket px ${teal} (min 25), hair px ${hair} (min 10)`);
    const ys = [];
    for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 0) ys.push(y);
    const h = ys.length ? Math.max(...ys) - Math.min(...ys) + 1 : 0;
    add('sprites.scale', h >= 34 && h <= 62, `character height ${h} buffer px (fixture parts imply ~40-52)`);
    // markers must never render: scan run + jump frames
    let markers = 0;
    await page.eval('window.__toon.setInput({right:true})');
    for (let i = 0; i < 12; i++) {
      await page.eval('window.__toon.tick(6)');
      if (i === 6) await page.eval('window.__toon.setInput({right:true, jump:true})');
      const f = fromB64(await page.eval('window.__toon.pixels("character")'));
      markers += countColour(f, [255, 0, 255], 4) + countColour(f, [0, 255, 255], 4) + countColour(f, [255, 255, 0], 4);
    }
    add('sprites.markers_hidden', markers === 0, `${markers} marker-coloured px across 12 run/jump frames`);
  });
}

async function G2() {
  await common('mode=smooth', 4);
  const ex = exists('expressions.json') ? readJSON(join(PROJ, 'expressions.json')) : {};
  const v = validateExpressions(ex, { min: 0 });
  const sch = ex.expressions?.scheming;
  add('expr.scheming', sch && !v.warnings.some((w) => w.startsWith('expression scheming:')), sch ? 'present, moves eyes+brows+mouth' : 'missing');
  add('expr.pickup_reaction', ex.reactions?.pickup?.expr === 'scheming', JSON.stringify(ex.reactions?.pickup || null));
  await withPage('mode=smooth', async (page) => {
    await page.eval('window.__toon.reset({seed: 5})');
    await page.eval('window.__toon.tick(90)');
    const s0 = await page.eval('window.__toon.state()');
    const coat = s0.joints.filter((j) => /^coat/i.test(j.name));
    add('coat.exposed', coat.length >= 2, `${coat.length} coat* joints in state().joints`);
    // pickup reaction moves the face toward the scheming preset
    const before = s0.face;
    await page.eval('window.__toon.trigger("pickup")');
    await page.eval('window.__toon.tick(14)');
    const after = (await page.eval('window.__toon.state()')).face;
    const keys = Object.keys(sch || {});
    const d = (a) => keys.reduce((t, k) => t + Math.abs((a[k] ?? 0) - sch[k]), 0);
    add('expr.pickup_drives_face', keys.length && d(after) < d(before) * 0.6, `L1 to scheming before ${d(before).toFixed(2)} after ${d(after).toFixed(2)}`);
    if (coat.length >= 2) {
      // secondary motion: run, stop; the coat tip keeps moving relative to the hip after the root stops
      await page.eval('window.__toon.reset({seed: 5})');
      await page.eval('window.__toon.setInput({right:true})');
      await page.eval('window.__toon.tick(90)');
      await page.eval('window.__toon.setInput({})');
      const rel = [];
      for (let i = 0; i < 40; i++) {
        await page.eval('window.__toon.tick(1)');
        const s = await page.eval('window.__toon.state()');
        const hip = s.joints.find((j) => j.name === 'hip');
        const tip = s.joints.filter((j) => /^coat/i.test(j.name)).at(-1);
        rel.push(tip.ex - hip.x);
      }
      const late = rel.slice(15);
      const range = Math.max(...late) - Math.min(...late);
      const swing = Math.max(...rel) - Math.min(...rel);
      add('coat.secondary_motion', swing >= 1.5, `coat tip x rel. hip: range ${swing.toFixed(2)} px over 40 ticks after stop (min 1.5); late range ${range.toFixed(2)}`);
      add('coat.settles', range < swing, `late range ${range.toFixed(2)} < total ${swing.toFixed(2)} (springs must damp)`);
    }
  });
  const g = text('GODOT.md');
  const kw = ['_physics_process', 'Skeleton2D|Bone2D', 'integer', 'nearest', 'IK'];
  const miss = kw.filter((k) => !new RegExp(k, 'i').test(g));
  add('godot.notes', g.length > 400 && miss.length === 0, g ? `missing: ${miss.join(', ') || 'none'}` : 'GODOT.md missing');
}

async function G3() {
  // G3 is a plan-text *lint* (keyword presence), not a cold motion/visual proof. Labelled as such in results.
  const p = text('PLAN.md');
  add('files.PLAN.md', p.length > 800, `${p.length} chars`);
  add('g3.kind', true, 'lint: keyword presence in PLAN.md (not a runtime/visual grade)');
  const must = {
    'bust.flow_morph': /optical[- ]flow|flow[- ]morph/i,
    'bust.face_mask': /mask/i,
    'bust.align_neutral': /align/i,
    'bust.procedural_layers': /blink/i,
    'gameplay.no_ai_flipbook': /(never|not|avoid|reject|don't|do not)[^.\n]{0,80}(AI[- ]generated|AI)[^.\n]{0,40}(frame|flipbook|walk)/i,
    'gameplay.alternative': /pre-?rendered 3D|3D render|stylis|styliz|frame-by-frame/i,
    'gameplay.lifelike_body_risk': /baked (light|shad)|rubber/i,
    'face.takes': /\btakes?\b|overshoot|anticipat/i,
    'verify.plan': /score\.mjs|capture\.mjs|rubric/i,
  };
  for (const [id, re] of Object.entries(must)) add(id, re.test(p), re.test(p) ? 'mentioned' : `not found: ${re}`);
}

const fn = { G1, G2, G3 }[task];
if (!fn) throw new Error(`unknown task ${task}`);
try {
  await fn();
} catch (e) {
  add('eval.exception', false, e.stack || e);
}
const pass = checks.every((c) => c.pass);
const res = { task, project: PROJ, pass, passed: checks.filter((c) => c.pass).length, total: checks.length, checks, at: new Date().toISOString() };
writeFileSync(join(OUT, 'results.json'), JSON.stringify(res, null, 2));
writeFileSync(join(OUT, 'results.md'), [`# ${task}: ${pass ? 'PASS' : 'FAIL'} ${res.passed}/${res.total}`, '', '| check | result | detail |', '|---|---|---|', ...checks.map((c) => `| ${c.id} | ${c.pass ? 'pass' : '**FAIL**'} | ${c.detail.replace(/\|/g, '/').replace(/\n/g, ' ')} |`), '', `Captures: ${join(OUT, 'capture')}`, 'Next: human/LLM review with evals/review.md'].join('\n'));
console.log(`\n${task} ${pass ? 'PASS' : 'FAIL'} ${res.passed}/${res.total} -> ${OUT}/results.md`);
process.exit(pass ? 0 : 1);
