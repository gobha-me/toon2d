// Tiny animation state machine with crossfades. Pure & immutable: every step
// returns a new state object.
//
// def = {
//   initial: 'idle',
//   states: { idle: { duration: 2.4, loop: true }, land: { duration: 0.25, loop: false } },
//   transitions: [
//     { from: 'idle' | '*' | ['a','b'], to: 'run', fade: 0.15, when: (params, ctx) => boolean },
//   ],
// }
// ctx passed to `when` = { state, time, duration, normalized, finished }.
// Transitions are checked in order; the first that matches wins.
import { smoothstep } from './mathx.js';

export function createStateMachine(def) {
  if (!def || !def.states || !def.states[def.initial]) throw new Error('state machine needs a valid initial state');
  for (const t of def.transitions || []) {
    if (!def.states[t.to]) throw new Error(`transition to unknown state ${t.to}`);
    const froms = t.from === '*' ? [] : [].concat(t.from);
    for (const f of froms) if (!def.states[f]) throw new Error(`transition from unknown state ${f}`);
  }
  return { state: def.initial, time: 0, prev: null, prevTime: 0, fade: 0, fadeDur: 0 };
}

function matchesFrom(from, state) {
  if (from === '*') return true;
  return Array.isArray(from) ? from.includes(state) : from === state;
}

export function stateContext(def, state, time) {
  const s = def.states[state];
  const duration = s.duration ?? 0;
  const finished = !s.loop && duration > 0 && time >= duration;
  return { state, time, duration, normalized: duration > 0 ? time / duration : 0, finished };
}

/** Advance time, then evaluate transitions. */
export function stepStateMachine(def, sm, params, dt) {
  const next = { ...sm, time: sm.time + dt, prevTime: sm.prev ? sm.prevTime + dt : 0, fade: sm.fade + dt };
  if (next.prev && next.fade >= next.fadeDur) {
    next.prev = null;
    next.prevTime = 0;
  }
  const ctx = stateContext(def, next.state, next.time);
  for (const t of def.transitions || []) {
    if (t.to === next.state || !matchesFrom(t.from, next.state)) continue;
    if (t.when(params, ctx)) return enterState(next, t.to, t.fade ?? 0);
  }
  return next;
}

/** Force a state change (e.g. from gameplay), crossfading from the current one. */
export function enterState(sm, to, fade = 0) {
  if (fade <= 0) return { state: to, time: 0, prev: null, prevTime: 0, fade: 0, fadeDur: 0 };
  return { state: to, time: 0, prev: sm.state, prevTime: sm.time, fade: 0, fadeDur: fade };
}

/** Weight of the CURRENT state in [0,1] (1 when not crossfading). Eased. */
export function currentWeight(sm) {
  if (!sm.prev || sm.fadeDur <= 0) return 1;
  return smoothstep(sm.fade / sm.fadeDur);
}
