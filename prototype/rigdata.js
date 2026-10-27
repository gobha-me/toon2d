// Character data: skeleton, keyframed clips and the animation state graph.
// Character space: origin at the feet, facing +x, y down. Limb bones point
// down their local +y. Forward limb swing = NEGATIVE rot; positive spine rot
// leans the torso forward; positive shin/forearm rot bends knee/elbow.

export const BONES = [
  { name: 'hips', parent: null, x: 0, y: -36 },
  { name: 'spine', parent: 'hips', x: 0, y: -2, length: 12 },
  { name: 'chest', parent: 'spine', x: 0, y: -12, length: 12 },
  { name: 'neck', parent: 'chest', x: 1, y: -13, length: 4 },
  { name: 'head', parent: 'neck', x: 0, y: -3 },
  { name: 'thighB', parent: 'hips', x: -3, y: 0, length: 18 },
  { name: 'shinB', parent: 'thighB', x: 0, y: 18, length: 18 },
  { name: 'footB', parent: 'shinB', x: 0, y: 18 },
  { name: 'thighF', parent: 'hips', x: 3, y: 0, length: 18 },
  { name: 'shinF', parent: 'thighF', x: 0, y: 18, length: 18 },
  { name: 'footF', parent: 'shinF', x: 0, y: 18 },
  { name: 'upperArmB', parent: 'chest', x: -2, y: -9, length: 12 },
  { name: 'foreArmB', parent: 'upperArmB', x: 0, y: 12, length: 11 },
  { name: 'handB', parent: 'foreArmB', x: 0, y: 11 },
  { name: 'upperArmF', parent: 'chest', x: 2, y: -9, length: 12 },
  { name: 'foreArmF', parent: 'upperArmF', x: 0, y: 12, length: 11 },
  { name: 'handF', parent: 'foreArmF', x: 0, y: 11 },
];

export const LEGS = [
  { thigh: 'thighF', shin: 'shinF', foot: 'footF' },
  { thigh: 'thighB', shin: 'shinB', foot: 'footB' },
];

const k = (t, pose) => ({ t, pose });

export const CLIPS = {
  idle: {
    name: 'idle',
    duration: 2.4,
    loop: true,
    keys: [
      k(0, {
        hips: { y: 1 }, spine: { rot: 0.02 }, chest: { rot: 0 }, head: { rot: -0.02 },
        thighF: { rot: -0.14 }, thighB: { rot: 0.14 },
        upperArmF: { rot: 0.12 }, foreArmF: { rot: -0.25 }, upperArmB: { rot: -0.1 }, foreArmB: { rot: -0.3 },
      }),
      k(1.2, {
        hips: { y: 2.2 }, spine: { rot: 0.045 }, chest: { rot: -0.03, sy: 1.03 }, head: { rot: 0.03 },
        thighF: { rot: -0.14 }, thighB: { rot: 0.14 },
        upperArmF: { rot: 0.18 }, foreArmF: { rot: -0.32 }, upperArmB: { rot: -0.15 }, foreArmB: { rot: -0.35 },
      }),
    ],
  },
  run: {
    name: 'run',
    duration: 0.56,
    loop: true,
    keys: [
      k(0, {
        hips: { y: 3 }, spine: { rot: 0.2 }, head: { rot: -0.12 },
        thighF: { rot: -0.75 }, shinF: { rot: 0.25 }, thighB: { rot: 0.6 }, shinB: { rot: 0.9 },
        upperArmF: { rot: 0.75 }, foreArmF: { rot: -1.2 }, upperArmB: { rot: -0.8 }, foreArmB: { rot: -1.3 },
      }),
      k(0.14, {
        hips: { y: -2 }, spine: { rot: 0.24 }, head: { rot: -0.15 },
        thighF: { rot: 0.05 }, shinF: { rot: 0.2 }, thighB: { rot: -0.35 }, shinB: { rot: 1.7 },
        upperArmF: { rot: 0 }, foreArmF: { rot: -1.4 }, upperArmB: { rot: 0 }, foreArmB: { rot: -1.4 },
      }),
      k(0.28, {
        hips: { y: 3 }, spine: { rot: 0.2 }, head: { rot: -0.12 },
        thighF: { rot: 0.6 }, shinF: { rot: 0.9 }, thighB: { rot: -0.75 }, shinB: { rot: 0.25 },
        upperArmF: { rot: -0.8 }, foreArmF: { rot: -1.3 }, upperArmB: { rot: 0.75 }, foreArmB: { rot: -1.2 },
      }),
      k(0.42, {
        hips: { y: -2 }, spine: { rot: 0.24 }, head: { rot: -0.15 },
        thighF: { rot: -0.35 }, shinF: { rot: 1.7 }, thighB: { rot: 0.05 }, shinB: { rot: 0.2 },
        upperArmF: { rot: 0 }, foreArmF: { rot: -1.4 }, upperArmB: { rot: 0 }, foreArmB: { rot: -1.4 },
      }),
    ],
  },
  charge: {
    name: 'charge',
    duration: 0.3,
    loop: true,
    keys: [
      k(0, {
        hips: { y: 9, x: -0.5 }, spine: { rot: 0.38 }, head: { rot: -0.3 },
        thighF: { rot: -0.35 }, thighB: { rot: 0.3 },
        upperArmF: { rot: 1.0 }, foreArmF: { rot: -0.7 }, upperArmB: { rot: 1.2 }, foreArmB: { rot: -0.6 },
      }),
      k(0.15, {
        hips: { y: 9.5, x: 0.5 }, spine: { rot: 0.4 }, head: { rot: -0.32 },
        thighF: { rot: -0.35 }, thighB: { rot: 0.3 },
        upperArmF: { rot: 1.05 }, foreArmF: { rot: -0.75 }, upperArmB: { rot: 1.25 }, foreArmB: { rot: -0.65 },
      }),
    ],
  },
  jumpRise: {
    name: 'jumpRise',
    duration: 0.3,
    loop: false,
    keys: [
      k(0, {
        hips: { y: -2 }, spine: { rot: -0.1 }, head: { rot: -0.2 },
        thighF: { rot: -0.4 }, shinF: { rot: 0.3 }, thighB: { rot: 0.4 }, shinB: { rot: 0.4 },
        upperArmF: { rot: -1.2 }, foreArmF: { rot: -1.1 }, upperArmB: { rot: 2.2 }, foreArmB: { rot: -0.3 },
      }),
      k(0.3, {
        hips: { y: -1 }, spine: { rot: 0 }, head: { rot: -0.1 },
        thighF: { rot: -1.2 }, shinF: { rot: 1.8 }, thighB: { rot: 0.25 }, shinB: { rot: 0.7 },
        upperArmF: { rot: -1.0 }, foreArmF: { rot: -1.3 }, upperArmB: { rot: 2.5 }, foreArmB: { rot: -0.4 },
      }),
    ],
  },
  fall: {
    name: 'fall',
    duration: 0.5,
    loop: true,
    keys: [
      k(0, {
        spine: { rot: -0.08 }, head: { rot: 0.05 },
        thighF: { rot: -0.45 }, shinF: { rot: 0.7 }, thighB: { rot: 0.2 }, shinB: { rot: 0.35 },
        upperArmF: { rot: -1.45 }, foreArmF: { rot: -0.5 }, upperArmB: { rot: 1.9 }, foreArmB: { rot: -0.4 },
      }),
      k(0.25, {
        spine: { rot: -0.04 }, head: { rot: 0.0 },
        thighF: { rot: -0.35 }, shinF: { rot: 0.55 }, thighB: { rot: 0.28 }, shinB: { rot: 0.45 },
        upperArmF: { rot: -1.65 }, foreArmF: { rot: -0.2 }, upperArmB: { rot: 2.3 }, foreArmB: { rot: -0.1 },
      }),
    ],
  },
  land: {
    name: 'land',
    duration: 0.24,
    loop: false,
    keys: [
      k(0, {
        hips: { y: 4 }, spine: { rot: 0.2 },
        thighF: { rot: -0.3 }, thighB: { rot: 0.3 },
        upperArmF: { rot: -0.9 }, foreArmF: { rot: -0.3 }, upperArmB: { rot: 0.9 }, foreArmB: { rot: -0.3 },
      }),
      k(0.07, {
        hips: { y: 10 }, spine: { rot: 0.35 }, head: { rot: -0.1 },
        thighF: { rot: -0.3 }, thighB: { rot: 0.3 },
        upperArmF: { rot: -0.7 }, foreArmF: { rot: -0.5 }, upperArmB: { rot: 0.7 }, foreArmB: { rot: -0.5 },
      }),
      k(0.24, {
        hips: { y: 2 }, spine: { rot: 0.05 },
        thighF: { rot: -0.15 }, thighB: { rot: 0.15 },
        upperArmF: { rot: 0.1 }, foreArmF: { rot: -0.3 }, upperArmB: { rot: -0.1 }, foreArmB: { rot: -0.3 },
      }),
    ],
  },
  hurt: {
    name: 'hurt',
    duration: 0.3,
    loop: false,
    keys: [
      k(0, {
        spine: { rot: -0.45 }, head: { rot: -0.25 },
        thighF: { rot: -0.6 }, shinF: { rot: 0.9 }, thighB: { rot: 0.1 }, shinB: { rot: 0.6 },
        upperArmF: { rot: -1.0 }, foreArmF: { rot: -1.3 }, upperArmB: { rot: -1.6 }, foreArmB: { rot: -0.9 },
      }),
    ],
  },
};

/** Gameplay params expected by the graph: grounded, speed, vy, charging, hurt. */
export const STATE_GRAPH = {
  initial: 'idle',
  states: Object.fromEntries(Object.values(CLIPS).map((c) => [c.name, { duration: c.duration, loop: c.loop }])),
  transitions: [
    { from: '*', to: 'hurt', fade: 0.06, when: (p) => p.hurt },
    { from: 'hurt', to: 'fall', fade: 0.2, when: (p, c) => !p.hurt && !p.grounded && c.finished },
    { from: 'hurt', to: 'land', fade: 0.08, when: (p) => !p.hurt && p.grounded },
    { from: ['idle', 'run', 'land'], to: 'charge', fade: 0.08, when: (p) => p.charging },
    { from: ['idle', 'run', 'land', 'charge'], to: 'jumpRise', fade: 0.06, when: (p) => !p.grounded && p.vy < 0 },
    { from: ['idle', 'run', 'land', 'charge'], to: 'fall', fade: 0.15, when: (p) => !p.grounded && p.vy >= 0 },
    { from: 'charge', to: 'idle', fade: 0.12, when: (p) => !p.charging && p.grounded },
    { from: 'jumpRise', to: 'fall', fade: 0.25, when: (p) => p.vy > -60 },
    { from: ['jumpRise', 'fall'], to: 'land', fade: 0.05, when: (p) => p.grounded },
    { from: 'land', to: 'run', fade: 0.12, when: (p, c) => p.speed > 40 && c.time > 0.08 },
    { from: 'land', to: 'idle', fade: 0.15, when: (p, c) => c.finished },
    { from: 'idle', to: 'run', fade: 0.15, when: (p) => p.speed > 40 },
    { from: 'run', to: 'idle', fade: 0.2, when: (p) => p.speed <= 25 },
  ],
};

/** Which states keep feet glued to the ground with IK ('plant') vs only correct for slopes ('adjust'). */
export const IK_MODE = { idle: 'plant', charge: 'plant', land: 'plant', run: 'adjust' };
