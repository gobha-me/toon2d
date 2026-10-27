#!/usr/bin/env node
// Objective runtime checks + score for any build implementing window.__toon (reference/harness-contract.md).
//   node scripts/score.mjs <projectDir> [--query "mode=pixel"] [--require pixel] [--out report-dir] [--json]
// Exit 0 when every REQUIRED check passes. Writes <out>/score.json and score.md when --out is given.
// Thresholds live in THRESH below and are documented in reference/review-rubric.md. Do not loosen them to pass.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { STANDARD, open, record } from './lib/drive.mjs';
import { components, crop, diffFraction, fromB64, hash } from './lib/img.mjs';
import { decodePNG } from './lib/png.mjs';
import { parseArgs } from './capture.mjs';

export const THRESH = {
  slipMean: 0.35, // world px per tick, planted feet
  slipP95: 1.0,
  slipMax: 3.0,
  plantedMin: 120, // planted foot-ticks observed (stops "never plant" cheating)
  plantedAboveGround: 4,
  mainComponent: 0.97, // largest connected blob / all character pixels (see-through gaps, floating parts)
  jointCover: 0.95, // fraction of joint samples that land on opaque character pixels
  idleDiffMean: 0.01, // mean fraction of character pixels changing between idle samples 50 ms apart
  idleDistinct: 0.3, // distinct idle frames / samples
  blinkClosed: 0.25,
  exprMin: 3,
  exprL1: 1.0,
  exprGroups: 3, // eyes, brows, mouth (+ marks)
  exprPixels: 0.04, // head-region pixel change vs neutral
  turnTicksMin: 4,
  turnTicksMax: 30,
  apDiff: 0.04, // anti-puppet on vs off must visibly differ in the run
  upscaleMatch: 0.98, // screenshot pixels equal to nearest-neighbour upscale of the buffer
};

const pct = (a, p) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
};
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const groupOf = (k) => (k.startsWith('eye') || k.startsWith('pupil') ? 'eyes' : k.startsWith('brow') ? 'brows' : k.startsWith('mouth') ? 'mouth' : 'marks');

export async function score(projectDir, { query = '', require = [] } = {}) {
  const checks = [];
  const metrics = {};
  const add = (id, pass, detail, required = true) => checks.push({ id, pass: !!pass, required, detail });
  let sess;
  try {
    sess = await open(resolve(projectDir), query);
  } catch (e) {
    add('contract.boot', false, String(e.message).slice(0, 600));
    return { checks, metrics, pass: false };
  }
  const { page } = sess;
  try {
    const api = await page.eval(`(() => { const T = window.__toon; return ['reset','setInput','tick','state','pixels','view','setExpression','expressions','setFlags','manual'].filter((k) => typeof T[k] !== 'function'); })()`);
    add('contract.api', api.length === 0, api.length ? `missing: ${api.join(', ')}` : 'all methods present');
    const view = await page.eval('window.__toon.view()');
    metrics.view = view;

    // ---------- determinism: same seed + same input => identical pixels
    const runOnce = async () => {
      await page.eval('window.__toon.reset({ seed: 7 })');
      await record(page, [{ name: 'a', ticks: 90, input: { right: true } }, { name: 'b', ticks: 60, input: { jump: true }, releaseJumpAt: 10 }]);
      return hash(fromB64(await page.eval('window.__toon.pixels("buffer")')));
    };
    const h1 = await runOnce();
    const h2 = await runOnce();
    add('determinism', h1 === h2, `frame hash ${h1} vs ${h2}`);

    // ---------- the standard scenario
    await page.eval('window.__toon.reset({ seed: 1 })');
    const rec = await record(page, STANDARD);
    const all = STANDARD.flatMap((s) => rec[s.name].states);
    const visited = new Set(all.map((s) => s.state));
    metrics.states = [...visited];
    const need = ['idle', 'run', 'turn', 'land'];
    const air = visited.has('jump') || visited.has('fall');
    add('states.visited', need.every((n) => visited.has(n)) && air, `visited: ${[...visited].join(', ')} (need idle, run, turn, jump|fall, land)`);

    // turn: duration and a real facing flip
    let turnRun = 0;
    const turnRuns = [];
    let flips = 0;
    for (let i = 0; i < all.length; i++) {
      if (all[i].state === 'turn') turnRun++;
      else if (turnRun) {
        turnRuns.push(turnRun);
        turnRun = 0;
      }
      if (i && all[i].facing !== all[i - 1].facing) flips++;
    }
    if (turnRun) turnRuns.push(turnRun);
    metrics.turnTicks = turnRuns;
    add('turn.not_instant', turnRuns.length > 0 && turnRuns.every((n) => n >= THRESH.turnTicksMin && n <= THRESH.turnTicksMax) && flips > 0,
      `turn runs (ticks): ${turnRuns.join(', ') || 'none'}, facing flips: ${flips}`);

    // foot slip: planted on consecutive ticks => world displacement
    const slips = [];
    let planted = 0;
    let floating = 0;
    for (const seg of STANDARD) {
      const st = rec[seg.name].states;
      for (let i = 1; i < st.length; i++) {
        for (const f of st[i].feet || []) {
          const prev = (st[i - 1].feet || []).find((g) => g.side === f.side);
          if (!f.planted) continue;
          planted++;
          if (st[i].root.y - f.y > THRESH.plantedAboveGround + 3) floating++;
          if (prev && prev.planted) slips.push(Math.hypot(f.x - prev.x, f.y - prev.y));
        }
      }
    }
    metrics.footSlip = { mean: +mean(slips).toFixed(3), p95: +pct(slips, 0.95).toFixed(3), max: +Math.max(0, ...slips).toFixed(3), plantedTicks: planted, floating };
    add('feet.slip', slips.length > 0 && metrics.footSlip.mean <= THRESH.slipMean && metrics.footSlip.p95 <= THRESH.slipP95 && metrics.footSlip.max <= THRESH.slipMax,
      `mean ${metrics.footSlip.mean} p95 ${metrics.footSlip.p95} max ${metrics.footSlip.max} px/tick (limits ${THRESH.slipMean}/${THRESH.slipP95}/${THRESH.slipMax})`);
    add('feet.planted', planted >= THRESH.plantedMin && floating === 0, `${planted} planted foot-ticks, ${floating} planted while floating`);

    // gaps: connected components + joints over opaque pixels
    let worstMain = 1;
    let worstAt = '';
    let cover = 0;
    let coverN = 0;
    const misses = {};
    for (const seg of ['run', 'turn', 'jump', 'runjump', 'stop']) {
      for (const f of rec[seg].frames) {
        const c = f.img;
        const comp = components(c);
        const tot = comp.reduce((x, y) => x + y, 0);
        const main = tot ? comp[0] / tot : 0;
        if (main < worstMain) {
          worstMain = main;
          worstAt = `${seg}#${f.i} (${comp.slice(0, 4).join('/')})`;
        }
        for (const j of f.joints) {
          if (j.name === 'hip') continue;
          const pts = [[j.x, j.y]];
          if (/^leg[LU]?L|^armL|Lower|lower/.test(j.name) || j.name.startsWith('legL')) pts.push([j.ex, j.ey]);
          for (const [wx, wy] of pts) {
            const px = Math.round((wx - f.view.camX) * f.view.s) - f.box.x;
            const py = Math.round((wy - f.view.camY) * f.view.s) - f.box.y;
            let opaque = 0;
            for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const x = px + dx;
              const y = py + dy;
              if (x >= 0 && y >= 0 && x < f.img.w && y < f.img.h && f.img.data[(y * f.img.w + x) * 4 + 3] >= 128) opaque++;
            }
            coverN++;
            if (opaque >= 3) cover++;
            else misses[j.name] = (misses[j.name] || 0) + 1;
          }
        }
      }
    }
    metrics.gaps = { worstMainComponent: +worstMain.toFixed(3), worstAt, jointCover: +(cover / Math.max(1, coverN)).toFixed(3), misses };
    add('gaps.connected', worstMain >= THRESH.mainComponent, `worst largest-blob share ${worstMain.toFixed(3)} at ${worstAt} (min ${THRESH.mainComponent})`);
    add('gaps.joints_covered', coverN > 0 && cover / coverN >= THRESH.jointCover, `joint samples on opaque pixels ${(cover / Math.max(1, coverN)).toFixed(3)} (min ${THRESH.jointCover}); misses ${JSON.stringify(misses)}`);

    // idle liveliness (character layer, 50 ms apart)
    const idle = rec.idle.frames.map((f) => f.img);
    const diffs = idle.slice(1).map((im, i) => diffFraction(idle[i], im));
    const distinct = new Set(idle.map(hash)).size / Math.max(1, idle.length);
    metrics.idle = { diffMean: +mean(diffs).toFixed(4), distinct: +distinct.toFixed(3) };
    add('idle.alive', mean(diffs) >= THRESH.idleDiffMean && distinct >= THRESH.idleDistinct, `mean diff ${mean(diffs).toFixed(4)} (min ${THRESH.idleDiffMean}), distinct ${distinct.toFixed(2)} (min ${THRESH.idleDistinct})`);

    // blink happens and reopens during idle
    const opens = rec.idle.states.map((s) => Math.min(s.face.eyeOpenL ?? 1, s.face.eyeOpenR ?? 1));
    const minOpen = Math.min(...opens);
    const reopened = opens.slice(opens.indexOf(minOpen)).some((v) => v > 0.8);
    add('face.blink', minOpen <= THRESH.blinkClosed && reopened, `min eye open in 6 s idle: ${minOpen.toFixed(2)}`);

    // expressions: params AND pixels change, from a pinned neutral baseline
    const names = (await page.eval('window.__toon.expressions()')).filter((n) => n !== 'neutral');
    await page.eval('window.__toon.reset({ seed: 3 })');
    const grabHead = async () => {
      const st = await page.eval('window.__toon.state()');
      const v = await page.eval('window.__toon.view()');
      const head = st.joints.find((j) => j.name === 'head') || st.joints[0];
      const hx = Math.round((head.x - v.camX) * v.s);
      const hy = Math.round((head.y - v.camY) * v.s);
      const box = { x: hx - 12 * v.s, y: hy - 20 * v.s, w: 24 * v.s, h: 24 * v.s };
      let img = fromB64(await page.eval(`window.__toon.pixels("character", ${JSON.stringify(box)})`));
      if (img.w !== box.w) img = crop(img, box.x, box.y, box.w, box.h);
      return { face: st.face, img };
    };
    // blink is suppressed for the comparison by sampling right after settling and re-sampling if eyes are mid-blink
    const settle = async (name) => {
      await page.eval(`window.__toon.setExpression(${JSON.stringify(name)}), window.__toon.tick(45)`);
      let g = await grabHead();
      for (let k = 0; k < 6 && (await page.eval('window.__toon.state().blink')) > 0.05; k++) {
        await page.eval('window.__toon.tick(6)');
        g = await grabHead();
      }
      return g;
    };
    const neutral = await settle('neutral');
    const exprRes = [];
    for (const n of names) {
      const g = await settle(n);
      let l1 = 0;
      const groups = new Set();
      for (const [k, v] of Object.entries(g.face)) {
        const d = Math.abs(v - (neutral.face[k] ?? v));
        l1 += d;
        if (d > 0.15) groups.add(groupOf(k));
      }
      exprRes.push({ name: n, l1: +l1.toFixed(2), groups: [...groups], pixels: +diffFraction(neutral.img, g.img).toFixed(3), hash: hash(g.img) });
    }
    await page.eval('window.__toon.setExpression(null)');
    const good = exprRes.filter((e) => e.l1 >= THRESH.exprL1 && e.groups.filter((x) => x !== 'marks').length >= 3 && e.pixels >= THRESH.exprPixels);
    const distinctFaces = new Set(good.map((e) => e.hash)).size;
    metrics.expressions = exprRes;
    add('face.expressions', good.length >= THRESH.exprMin && distinctFaces >= THRESH.exprMin,
      `${good.length} expressions change eyes+brows+mouth params and >= ${THRESH.exprPixels * 100}% head pixels (${distinctFaces} distinct); ${exprRes.map((e) => `${e.name}:${e.l1}/${e.pixels}`).join(' ')}`);

    // anti-puppet toggle makes a visible difference in the run
    const runFrames = async (ap) => {
      await page.eval(`window.__toon.reset({ seed: 1, flags: { ap: ${ap} } })`);
      const r = await record(page, [{ name: 'r', ticks: 90, input: { right: true }, every: 6 }]);
      return r.r.frames.map((f) => f.img);
    };
    const onF = await runFrames(true);
    const offF = await runFrames(false);
    const apd = mean(onF.map((im, i) => diffFraction(im, offF[i])));
    await page.eval('window.__toon.reset({ seed: 1, flags: { ap: true } })');
    metrics.antiPuppetDiff = +apd.toFixed(3);
    add('antipuppet.toggle', apd >= THRESH.apDiff, `on vs off run diff ${apd.toFixed(3)} (min ${THRESH.apDiff})`);

    // pixel mode: integer nearest upscale actually reaches the screen (no filter blur)
    const pixelReq = require.includes('pixel');
    if (view.mode === 'pixel' || pixelReq) {
      const integer = view.mode === 'pixel' && Number.isInteger(view.k) && view.k >= 2 && view.W <= 480;
      add('pixel.mode', integer, `mode ${view.mode}, buffer ${view.W}x${view.H}, k ${view.k}`);
      await page.eval('window.__toon.tick(1)');
      const rect = await page.eval(`(() => { const r = document.querySelector(${JSON.stringify(view.canvas || 'canvas')}).getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; })()`);
      const shot = decodePNG(await page.screenshot(rect));
      const buf = fromB64(await page.eval('window.__toon.pixels("buffer")'));
      const k = shot.w / buf.w;
      let match = 0;
      let n = 0;
      if (Number.isInteger(k) && k >= 1) {
        for (let y = 0; y < shot.h; y += 3) {
          for (let x = 0; x < shot.w; x += 3) {
            const s = (y * shot.w + x) * 4;
            const b = (Math.floor(y / k) * buf.w + Math.floor(x / k)) * 4;
            n++;
            if (Math.abs(shot.data[s] - buf.data[b]) <= 6 && Math.abs(shot.data[s + 1] - buf.data[b + 1]) <= 6 && Math.abs(shot.data[s + 2] - buf.data[b + 2]) <= 6) match++;
          }
        }
      }
      metrics.upscale = { screenW: shot.w, bufferW: buf.w, k, match: +(match / Math.max(1, n)).toFixed(4) };
      add('pixel.no_filter_blur', Number.isInteger(k) && match / Math.max(1, n) >= THRESH.upscaleMatch,
        `on-screen ${shot.w}px / buffer ${buf.w}px = x${k}; nearest-upscale match ${(match / Math.max(1, n)).toFixed(4)} (min ${THRESH.upscaleMatch})`);
    }

    add('console.clean', page.errors.length === 0, page.errors.slice(0, 5).join(' | ') || 'no console errors');
  } catch (e) {
    add('harness.exception', false, String(e.stack || e).slice(0, 800));
  } finally {
    await sess.close();
  }
  const req = checks.filter((c) => c.required);
  return { checks, metrics, pass: req.every((c) => c.pass), passed: req.filter((c) => c.pass).length, total: req.length };
}

export function toMarkdown(r, title = 'score') {
  const lines = [`# ${title}`, '', `**${r.pass ? 'PASS' : 'FAIL'}**: ${r.passed}/${r.total} required checks`, '', '| check | result | detail |', '| --- | --- | --- |'];
  for (const c of r.checks) lines.push(`| ${c.id} | ${c.pass ? 'pass' : '**FAIL**'} | ${String(c.detail).replace(/\|/g, '/')} |`);
  lines.push('', '```json', JSON.stringify(r.metrics, null, 1).slice(0, 6000), '```');
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pos, o } = parseArgs(process.argv.slice(2));
  if (!pos[0]) {
    console.error('usage: node score.mjs <projectDir> [--query "mode=pixel"] [--require pixel] [--out dir] [--json]');
    process.exit(2);
  }
  const r = await score(pos[0], { query: o.query === true ? '' : o.query || '', require: String(o.require || '').split(',').filter(Boolean) });
  if (o.out) {
    mkdirSync(o.out, { recursive: true });
    writeFileSync(join(o.out, 'score.json'), JSON.stringify(r, null, 2));
    writeFileSync(join(o.out, 'score.md'), toMarkdown(r, `score: ${pos[0]} ${o.query || ''}`));
  }
  if (o.json) console.log(JSON.stringify(r, null, 2));
  else for (const c of r.checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id.padEnd(22)} ${c.detail}`);
  console.log(r.pass ? `\nPASS ${r.passed}/${r.total}` : `\nFAIL ${r.passed}/${r.total}`);
  process.exit(r.pass ? 0 : 1);
}
