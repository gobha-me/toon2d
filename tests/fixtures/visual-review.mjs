// Generated pixels and telemetry, deliberately simple enough to audit by eye.
export const view = { mode: 'pixel', s: 1, k: 3, W: 320, H: 180 };

export function pose({ tick = 0, height = 40, pitch = 0, arm = 0, grounded = true, events = [] } = {}) {
  const root = { x: tick * 2, y: 60 };
  const y = root.y - height;
  return { tick, root, grounded, facing: 1, events, joints: [
    { name: 'hip', x: root.x, y, ex: root.x, ey: y },
    { name: 'spine', x: root.x, y, ex: root.x + Math.sin(pitch * Math.PI / 180) * 20, ey: y - Math.cos(pitch * Math.PI / 180) * 20 },
    { name: 'armLF', x: root.x + 10, y: y - 15, ex: root.x + 18, ey: y - 15 + arm },
  ] };
}

export function image(variant = 'clear', phase = 0) {
  const w = 72;
  const h = 72;
  const data = new Uint8Array(w * h * 4);
  const rect = (x, y, width, height, alpha = 255) => {
    for (let yy = y; yy < y + height; yy++) {
      for (let xx = x; xx < x + width; xx++) data.set([120, 180, 220, alpha], (yy * w + xx) * 4);
    }
  };
  if (variant === 'empty') return { w, h, data };
  if (variant === 'solid') rect(18, 5, 28, 50);
  else {
    rect(27, 15, 10, 25);
    rect(26, 5, 12, 10);
    rect(18, 20 + phase, 9, 4);
    rect(37, 20 - phase, 9, 4);
    rect(27, 40, 4, 15);
    rect(33, 40, 4, 15);
    if (variant === 'detached') rect(55, 15, 10, 15);
    if (variant === 'blurred') rect(17, 20 + phase, 1, 4, 100);
  }
  return { w, h, data };
}

export function recording() {
  const segment = (n, stateAt, imageAt = (i) => image('clear', Math.floor(i / 2) % 2)) => {
    const states = Array.from({ length: n }, (_, i) => stateAt(i));
    return { states, frames: states.map((s, i) => ({ i, img: imageAt(i), root: s.root, joints: s.joints })) };
  };
  return {
    idle: segment(30, (i) => pose({ tick: i })),
    run: segment(60, (i) => pose({ tick: i, arm: 4 * Math.sin(i * Math.PI / 15) })),
    stop: segment(45, (i) => pose({ tick: i, pitch: [8, 6, 4, 1, -4, -3, -2, -1][i] || 0 })),
    jump: segment(90, (i) => pose({ tick: i,
      height: i >= 2 && i < 8 ? 40 - (i - 1) * 2 : i >= 51 && i < 57 ? 32 + (i - 51) : 40,
      grounded: i < 8 || i >= 51,
      events: i === 2 ? ['crouch'] : i === 8 ? ['jump'] : i === 51 ? ['land'] : [],
    })),
  };
}
