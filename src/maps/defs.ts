import type { MapDef, Pt } from './types';

/** Samples y = f(x) between x0..x1 into an outline closed at `bottom`. */
export function heightfield(x0: number, x1: number, step: number, f: (x: number) => number, bottom: number): Pt[] {
  const top: Pt[] = [];
  const n = Math.round((x1 - x0) / step);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    top.push([+x.toFixed(3), +f(x).toFixed(3)]);
  }
  return [...top, [x1, bottom], [x0, bottom]];
}

/** A thin layer following y = f(x), `thick` meters deep. */
export function strip(x0: number, x1: number, step: number, f: (x: number) => number, thick: number): Pt[] {
  const top = heightfield(x0, x1, step, f, 0).slice(0, -2);
  return [...top, ...top.slice().reverse().map(([x, y]) => [x, +(y + thick).toFixed(3)] as Pt)];
}

/** Rectangle outline. */
export const slab = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

const smooth = (t: number) => t * t * (3 - 2 * t);
/** Piecewise-smooth profile through control points [x, y]. */
export function profile(points: Pt[]): (x: number) => number {
  return (x) => {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const [xa, ya] = points[i], [xb, yb] = points[i + 1];
      if (x <= xb) return ya + (yb - ya) * smooth((x - xa) / (xb - xa));
    }
    return points[points.length - 1][1];
  };
}

export const MAPS: MapDef[] = [
  {
    id: 'meadow',
    name: 'Зелена Долина',
    theme: 'meadow',
    blurb: 'Класична чаша з пагорбами по краях.',
    bounds: { x0: 0, y0: -6, x1: 44, y1: 26 },
    killY: 40,
    spawns: [[11, 14], [33, 14]],
    solids: [
      {
        mat: 'grass',
        pts: heightfield(0, 44, 0.5, (x) => {
          const t = (x - 22) / 22;
          return 18 - 1.5 * (1 - Math.cos(t * Math.PI)) - 7 * Math.pow(Math.abs(t), 5) + 0.3 * Math.cos((x - 22) * 0.9);
        }, 30),
      },
      { mat: 'rock', pts: slab(-4, -10, 1.2, 30) },
      { mat: 'rock', pts: slab(42.8, -10, 48, 30) },
    ],
  },
  {
    id: 'foundry',
    name: 'Ливарня',
    theme: 'foundry',
    blurb: 'Між цехами — озеро лави. Переїжджай по рухомій платформі.',
    bounds: { x0: 0, y0: -5, x1: 46, y1: 25 },
    killY: 32,
    spawns: [[8, 12.5], [38, 12.5]],
    solids: [
      { mat: 'metal', pts: [[0, -10], [1.5, -10], [1.5, 8], [2.5, 11.5], [4.5, 14], [7, 15], [15.5, 15], [17.5, 13.9], [18.2, 14.2], [18.2, 30], [0, 30]] },
      { mat: 'metal', pts: [[46, -10], [44.5, -10], [44.5, 8], [43.5, 11.5], [41.5, 14], [39, 15], [30.5, 15], [28.5, 13.9], [27.8, 14.2], [27.8, 30], [46, 30]] },
      { mat: 'brick', pts: slab(18.2, 21.5, 27.8, 30) },
    ],
    lava: [{ x: 18.2, y: 19.6, w: 9.6, h: 2 }],
    platforms: [{ x: 23, y: 15.4, w: 4, h: 0.5, path: [[20.6, 15.4], [25.4, 15.4]], speed: 2.4, wait: 0.8 }],
    suddenDeathY: 26,
  },
  {
    id: 'sawmill',
    name: 'Тартак',
    theme: 'sawmill',
    blurb: 'Дерев\'яна арена з пилками, що ходять угору-вниз.',
    bounds: { x0: 0, y0: -4, x1: 44, y1: 24 },
    killY: 32,
    spawns: [[12, 12.5], [32, 12.5]],
    solids: [
      { mat: 'wood', pts: heightfield(0, 44, 0.5, profile([[0, 3], [3, 6], [6.5, 13.5], [10, 15.6], [22, 16.2], [34, 15.6], [37.5, 13.5], [41, 6], [44, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 0.8, 30) },
      { mat: 'rock', pts: slab(43.2, -10, 48, 30) },
    ],
    saws: [
      { x: 5.2, y: 9.5, r: 1.1, path: [[5.6, 7.5], [7.6, 12.2]], speed: 1.5 },
      { x: 38.8, y: 9.5, r: 1.1, path: [[38.4, 7.5], [36.4, 12.2]], speed: 1.5 },
      { x: 22, y: 6, r: 1.25, path: [[22, 5.5], [22, 11.2]], speed: 2.2 },
    ],
  },
  {
    id: 'sky',
    name: 'Небесний Острів',
    theme: 'sky',
    blurb: 'Острів у хмарах. Зіштовхни суперника за край!',
    bounds: { x0: -4, y0: -6, x1: 48, y1: 26 },
    killY: 30,
    spawns: [[13, 12], [31, 12]],
    solids: [
      {
        mat: 'grass',
        pts: [
          ...heightfield(6, 38, 0.5, profile([[6, 15.5], [8, 14.4], [14, 14.2], [22, 13.2], [30, 14.2], [36, 14.4], [38, 15.5]]), 16).slice(0, -2),
          [37.2, 17.5], [35, 19.5], [31, 21], [26, 22.5], [22, 23.2], [18, 22.5], [13, 21], [9, 19.5], [6.8, 17.5],
        ],
      },
      { mat: 'rock', pts: [[19.5, 7.2], [24.5, 7.2], [23.8, 8.2], [22, 8.8], [20.2, 8.2]] },
    ],
    pads: [
      { x: 9.8, y: 14.35, w: 1.6, angle: 0.18, power: 15 },
      { x: 34.2, y: 14.35, w: 1.6, angle: -0.18, power: 15 },
    ],
    suddenDeathY: 24,
  },
  {
    id: 'icecave',
    name: 'Крижана Печера',
    theme: 'ice',
    blurb: 'Слизький лід і бурульки, що падають зі стелі.',
    bounds: { x0: 0, y0: 4, x1: 42, y1: 22 },
    killY: 32,
    spawns: [[11, 13.5], [31, 13.5]],
    solids: [
      { mat: 'ice', pts: heightfield(0, 42, 0.5, profile([[0, 4], [3, 7], [7, 14.5], [12, 16], [16, 16.4], [21, 16.6], [26, 16.4], [30, 16], [35, 14.5], [39, 7], [42, 4]]), 30) },
      { mat: 'snow', pts: strip(14, 28, 0.5, profile([[14, 16.62], [16, 16.25], [21, 16.45], [26, 16.25], [28, 16.62]]), 0.55) },
      { mat: 'rock', pts: slab(-4, -10, 0.8, 30) },
      { mat: 'rock', pts: slab(41.2, -10, 46, 30) },
      { mat: 'rock', pts: [[-4, -10], [46, -10], [46, 3.5], [38, 6], [34, 8.4], [30, 7.6], [26, 8.8], [22, 7.8], [18, 8.8], [14, 7.6], [10, 8.4], [6, 6], [-4, 3.5]] },
    ],
    fallingBlocks: { x0: 11, x1: 31, y: 9.6, interval: 2.4, size: 0.9, style: 'ice' },
  },
  {
    id: 'neon',
    name: 'Неонові Дахи',
    theme: 'neon',
    blurb: 'Два дахи над прірвою і ліфт посередині.',
    bounds: { x0: 0, y0: -5, x1: 46, y1: 26 },
    killY: 32,
    spawns: [[10, 13], [36, 13]],
    solids: [
      { mat: 'neon', pts: [[0, -10], [1.6, -10], [1.6, 11], [3, 14], [4, 15.2], [18.6, 15.2], [19.2, 15.6], [19.2, 40], [0, 40]] },
      { mat: 'neon', pts: [[46, -10], [44.4, -10], [44.4, 11], [43, 14], [42, 15.2], [27.4, 15.2], [26.8, 15.6], [26.8, 40], [46, 40]] },
    ],
    platforms: [{ x: 23, y: 21, w: 7.2, h: 0.5, path: [[23, 22.5], [23, 15.45]], speed: 2.6, wait: 1.6 }],
    pads: [
      { x: 6, y: 15.2, w: 1.6, angle: 0.25, power: 14 },
      { x: 40, y: 15.2, w: 1.6, angle: -0.25, power: 14 },
    ],
    suddenDeathY: 28,
  },
  {
    id: 'desert',
    name: 'Пустельні Руїни',
    theme: 'desert',
    blurb: 'Піщана піраміда в центрі, трампліни і падаючі брили.',
    bounds: { x0: 0, y0: -6, x1: 50, y1: 26 },
    killY: 34,
    spawns: [[10, 13.5], [40, 13.5]],
    solids: [
      { mat: 'sand', pts: heightfield(0, 50, 0.5, profile([[0, 4], [3, 8], [6, 15.5], [12, 16.2], [18, 16], [21.5, 13.6], [25, 11.8], [28.5, 13.6], [32, 16], [38, 16.2], [44, 15.5], [47, 8], [50, 4]]), 30) },
      { mat: 'brick', pts: [[23.2, 12.6], [26.8, 12.6], [26.2, 12.0], [23.8, 12.0]] },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(49, -10, 54, 30) },
    ],
    pads: [
      { x: 14.5, y: 16.12, w: 1.8, angle: 0.12, power: 16 },
      { x: 35.5, y: 16.12, w: 1.8, angle: -0.12, power: 16 },
    ],
    fallingBlocks: { x0: 15, x1: 35, y: -4, interval: 3.2, size: 1.1, style: 'stone' },
  },
  {
    id: 'moon',
    name: 'Місячна База',
    theme: 'moon',
    blurb: 'Низька гравітація — довгі стрибки і сальто.',
    gravity: 9,
    bounds: { x0: 0, y0: -10, x1: 48, y1: 24 },
    killY: 32,
    spawns: [[11, 12.5], [37, 12.5]],
    solids: [
      { mat: 'moon', pts: heightfield(0, 48, 0.5, (x) => {
        const t = (x - 24) / 24;
        const crater = (c: number, w: number, d: number) => (Math.abs(x - c) < w ? -d * 0.6 + d * Math.pow((x - c) / w, 2) : Math.abs(x - c) < w * 1.4 ? -d * 0.6 + d * (1 - (Math.abs(x - c) - w) / (w * 0.4)) : 0);
        return 16 - 8 * Math.pow(Math.abs(t), 6) - 1.2 * (1 - Math.cos(t * Math.PI)) + crater(24, 3.2, 1.4) * -1 + crater(14, 2, 0.8) * -1 + crater(34, 2, 0.8) * -1;
      }, 30) },
      { mat: 'metal', pts: slab(-4, -14, 1, 30) },
      { mat: 'metal', pts: slab(47, -14, 52, 30) },
    ],
    platforms: [
      { x: 14, y: 10, w: 4, h: 0.5, path: [[12, 10.5], [17, 9]], speed: 1.6 },
      { x: 34, y: 10, w: 4, h: 0.5, path: [[36, 10.5], [31, 9]], speed: 1.6 },
    ],
  },
];

export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map((m) => [m.id, m]));
