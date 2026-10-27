#!/usr/bin/env node
// Advisory take-off check: torso pitch during the jump-squat and the first airborne ticks, plus crouch depth.
//   node scripts/takeoff.mjs <projectDir> [--query "mode=pixel"] [--json]
// Exit 0 when every check passes, 1 otherwise. Targets are documented in SKILL.md and reference/review-rubric.md.
// This is a self-check for the agent. It is NOT part of score.mjs, so the score total is unchanged.
import { resolve } from 'node:path';
import { open, record } from './lib/drive.mjs';
import { parseArgs } from './capture.mjs';

export const TAKEOFF = {
  crouchLeanMin: 5, // deg forward at the deepest crouch tick: some lean reads as loading
  crouchLeanMax: 30, // deg forward: more reads as a bow or a stumble
  launchLeanMax: 30, // deg forward on any of the first launchTicks airborne ticks: more reads as a dive
  launchSettleMax: 15, // deg forward on the last checked airborne tick: the crouch lean must unwind
  launchLeanBackMax: 15, // deg backward on those ticks
  launchTicks: 8, // airborne ticks after the 'jump' event that are checked
  crouchDepthMin: 0.15, // hip drop at the deepest crouch tick / standing hip height
};

const hasEvent = (s, name) => (s.events || []).some((e) => e === name || (e && e.type === name));
const bone = (s, name) => (s.joints || []).find((j) => j.name === name);

/** Signed torso pitch in degrees from vertical; + = leaning toward the facing direction. Needs the 'spine' bone. */
export function torsoPitch(s) {
  const sp = bone(s, 'spine');
  if (!sp) return null;
  const dx = (sp.ex - sp.x) * (s.facing || 1);
  const up = sp.y - sp.ey; // y grows down
  return (Math.atan2(dx, up) * 180) / Math.PI;
}

/** Hip height above the root (ground point), in world px. */
export function hipHeight(s) {
  const hip = bone(s, 'hip') || bone(s, 'spine');
  if (!hip || !s.root) return null;
  return s.root.y - hip.y;
}

/**
 * Pure analysis over per-tick state() snapshots of ONE jump (standing or running).
 * standHip: hip height before the crouch (defaults to the tick before the 'crouch' event).
 * Returns { checks:[{id,pass,detail}], metrics, pass }.
 */
export function analyzeTakeoff(states, { standHip = null, t = TAKEOFF, label = 'jump' } = {}) {
  const checks = [];
  const add = (id, pass, detail) => checks.push({ id: `${label}.${id}`, pass: !!pass, detail });
  const iJump = states.findIndex((s) => hasEvent(s, 'jump'));
  if (iJump < 0) {
    add('launch', false, "no 'jump' event in the recorded ticks");
    return { checks, metrics: {}, pass: false };
  }
  let iCrouch = -1;
  for (let i = iJump; i >= 0; i--) if (hasEvent(states[i], 'crouch')) { iCrouch = i; break; }
  const crouch = iCrouch >= 0 ? states.slice(iCrouch, iJump) : [];
  const base = standHip ?? (iCrouch > 0 ? hipHeight(states[iCrouch - 1]) : null);
  const launch = states.slice(iJump, iJump + t.launchTicks).filter((s) => !s.grounded);

  const metrics = { crouchTicks: crouch.length };
  if (!crouch.length) add('crouch', false, "no grounded 'crouch' ticks before the 'jump' event (no anticipation)");
  else {
    let deep = crouch[0];
    for (const s of crouch) if ((hipHeight(s) ?? Infinity) < (hipHeight(deep) ?? Infinity)) deep = s;
    const lean = torsoPitch(deep);
    const depth = base && hipHeight(deep) !== null ? (base - hipHeight(deep)) / base : null;
    metrics.crouchLean = lean === null ? null : +lean.toFixed(1);
    metrics.crouchDepth = depth === null ? null : +depth.toFixed(3);
    add('crouch_lean', lean !== null && lean >= t.crouchLeanMin && lean <= t.crouchLeanMax,
      `torso ${lean === null ? 'n/a (no spine bone)' : lean.toFixed(1) + '°'} forward at deepest crouch (target ${t.crouchLeanMin}-${t.crouchLeanMax}°)`);
    add('crouch_depth', depth !== null && depth >= t.crouchDepthMin,
      `hip drop ${depth === null ? 'n/a' : (depth * 100).toFixed(0) + '%'} of standing hip height (min ${t.crouchDepthMin * 100}%)`);
  }
  const leans = launch.map(torsoPitch).filter((v) => v !== null);
  metrics.launchLean = leans.map((v) => +v.toFixed(1));
  const fwd = leans.length ? Math.max(...leans) : null;
  const back = leans.length ? Math.min(...leans) : null;
  add('launch_lean', fwd !== null && fwd <= t.launchLeanMax && back >= -t.launchLeanBackMax,
    leans.length ? `torso ${back.toFixed(1)}..${fwd.toFixed(1)}° over the first ${leans.length} airborne ticks (target -${t.launchLeanBackMax}..${t.launchLeanMax}°)` : 'no airborne ticks with a spine bone after launch');
  const last = leans.length ? leans[leans.length - 1] : null;
  add('launch_unwind', last !== null && leans.length >= t.launchTicks && last <= t.launchSettleMax,
    last !== null ? `torso ${last.toFixed(1)}° forward on airborne tick ${leans.length} (max ${t.launchSettleMax}°, needs ${t.launchTicks} ticks)` : 'no airborne ticks with a spine bone after launch');
  return { checks, metrics, pass: checks.every((c) => c.pass) };
}

/** Drives a standing jump and a run-jump through window.__toon and analyses both. */
export async function takeoff(projectDir, { query = '' } = {}) {
  const sess = await open(resolve(projectDir), query);
  try {
    const { page } = sess;
    await page.eval('window.__toon.reset({ seed: 1 })');
    const a = await record(page, [{ name: 'settle', ticks: 30, input: {} }, { name: 'jump', ticks: 40, input: { jump: true } }]);
    const standHip = hipHeight(a.settle.states.at(-1));
    const stand = analyzeTakeoff(a.jump.states, { standHip, label: 'stand' });
    await page.eval('window.__toon.reset({ seed: 1 })');
    const b = await record(page, [{ name: 'run', ticks: 90, input: { right: true } }, { name: 'jump', ticks: 40, input: { right: true, jump: true } }]);
    const run = analyzeTakeoff(b.jump.states, { standHip, label: 'run' });
    const checks = [...stand.checks, ...run.checks];
    return { checks, metrics: { standHip, stand: stand.metrics, run: run.metrics }, pass: checks.every((c) => c.pass) };
  } finally {
    await sess.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pos, o } = parseArgs(process.argv.slice(2));
  if (!pos[0]) {
    console.error('usage: node takeoff.mjs <projectDir> [--query "mode=pixel"] [--json]');
    process.exit(2);
  }
  const r = await takeoff(pos[0], { query: o.query === true ? '' : o.query || '' });
  if (o.json) console.log(JSON.stringify(r, null, 2));
  else for (const c of r.checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id.padEnd(18)} ${c.detail}`);
  console.log(r.pass ? '\nPASS take-off' : '\nFAIL take-off');
  process.exit(r.pass ? 0 : 1);
}
