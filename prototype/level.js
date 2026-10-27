// Test room data: floor polyline with slopes, one-way platforms, spikes, gems.
// A little tower of platforms on the right end for vertical-climber feel.

function polyline(points, kind) {
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    segs.push({ x1, y1, x2, y2, kind });
  }
  return segs;
}

const plat = (x, y, w) => ({ x1: x, y1: y, x2: x + w, y2: y, kind: 'platform' });

export const FLOOR_POINTS = [
  [0, 700], [640, 700], [940, 610], [1240, 610], [1300, 610], [1520, 720], [2500, 720],
];

export function createLevel() {
  const platforms = [
    plat(250, 590, 150), plat(450, 490, 140), plat(660, 390, 150), plat(900, 300, 130),
    plat(1110, 480, 150),
    // tower
    plat(1960, 620, 120), plat(2130, 520, 120), plat(1980, 420, 120), plat(2140, 320, 120),
    plat(1990, 220, 120), plat(2160, 130, 140),
  ];
  return {
    segments: [...polyline(FLOOR_POINTS, 'floor'), ...platforms],
    floor: FLOOR_POINTS,
    platforms,
    spikes: [{ x: 1640, y: 704, w: 110, h: 16 }],
    gems: [
      { x: 325, y: 555 }, { x: 735, y: 355 }, { x: 965, y: 265 }, { x: 1180, y: 445 },
      { x: 1100, y: 575 }, { x: 2200, y: 485 }, { x: 2200, y: 285 }, { x: 2230, y: 95 },
    ],
    bounds: { minX: 0, maxX: 2500 },
    world: { width: 2500, top: -120, bottom: 900 },
    killY: 1100,
    spawn: { x: 160, y: 700 },
  };
}
