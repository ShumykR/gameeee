import type { MapDef, Pt, SolidDef, TerrainMat } from './types';

/*
 * Enclosed and girder arenas: caverns carved out of rock (with ceilings you can
 * drive along at speed), floating islands inside them, see-through girder bridges,
 * energy fields and pendulum saws.
 */

type Fn = (x: number) => number;
const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Piecewise-smooth curve through control points. */
export function curve(points: Pt[]): Fn {
  return (x) => {
    if (x <= points[0][0]) return points[0][1];
    for (let i = 0; i < points.length - 1; i++) {
      const [xa, ya] = points[i], [xb, yb] = points[i + 1];
      if (x <= xb) return ya + (yb - ya) * smoothstep((x - xa) / (xb - xa));
    }
    return points[points.length - 1][1];
  };
}
/** Sample y = f(x) from x0 to x1. */
export function sample(x0: number, x1: number, f: Fn, step = 0.35): Pt[] {
  const n = Math.max(2, Math.round((x1 - x0) / step));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push([+x.toFixed(3), +f(x).toFixed(3)]);
  }
  return out;
}
/** Ellipse outline. */
export function oval(cx: number, cy: number, rx: number, ry: number, n = 40): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([+(cx + Math.cos(a) * rx).toFixed(3), +(cy + Math.sin(a) * ry).toFixed(3)]);
  }
  return out;
}
/** Stadium / capsule outline (horizontal). */
export function capsule(x0: number, x1: number, cy: number, r: number, n = 10): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i / n) * Math.PI;
    out.push([+(x1 - r + Math.cos(a) * r).toFixed(3), +(cy + Math.sin(a) * r).toFixed(3)]);
  }
  for (let i = 0; i <= n; i++) {
    const a = Math.PI / 2 + (i / n) * Math.PI;
    out.push([+(x0 + r + Math.cos(a) * r).toFixed(3), +(cy + Math.sin(a) * r).toFixed(3)]);
  }
  return out;
}

/**
 * Carve a cavity out of a rock block. `top` and `bot` are the cavity's ceiling and
 * floor, both sampled left to right over the same x span; where they don't meet at
 * the ends, the side walls are vertical. Returns two solids (ceiling + floor) so each
 * outline stays a simple polygon.
 */
export function cavern(outer: { x0: number; y0: number; x1: number; y1: number }, top: Pt[], bot: Pt[], mat: TerrainMat): SolidDef[] {
  const tL = top[0], tR = top[top.length - 1], bL = bot[0], bR = bot[bot.length - 1];
  const mL = (tL[1] + bL[1]) / 2, mR = (tR[1] + bR[1]) / 2;
  const openL = bL[1] - tL[1] > 0.02, openR = bR[1] - tR[1] > 0.02;
  const ceiling: Pt[] = [[outer.x0, mL], [outer.x0, outer.y0], [outer.x1, outer.y0], [outer.x1, mR]];
  if (openR) ceiling.push([tR[0], mR]);
  ceiling.push(...[...top].reverse());
  if (openL) ceiling.push([tL[0], mL]);
  const floor: Pt[] = [[outer.x0, mL]];
  if (openL) floor.push([bL[0], mL]);
  floor.push(...bot);
  if (openR) floor.push([bR[0], mR]);
  floor.push([outer.x1, mR], [outer.x1, outer.y1], [outer.x0, outer.y1]);
  return [{ mat, pts: ceiling }, { mat, pts: floor }];
}

const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ---------------------------------------------------------------- arenas

const EIGHT_TOP = curve([[2, 12], [3, 8.5], [6, 5.5], [11, 4.2], [17, 4.6], [21, 6.4], [24, 9.0], [27, 6.4], [31, 4.6], [37, 4.2], [42, 5.5], [45, 8.5], [46, 12]]);
const EIGHT_BOT = curve([[2, 12], [3, 15.5], [5, 17.5], [10, 18.6], [16, 18.6], [21, 17.2], [24, 16.5], [27, 17.2], [32, 18.6], [38, 18.6], [43, 17.5], [45, 15.5], [46, 12]]);

const BONE_BOT = curve([[2, 12], [2.6, 15.2], [4.2, 17.6], [7, 18.1], [9.6, 16.9], [11.2, 16.2], [36.8, 16.2], [38.4, 16.9], [41, 18.1], [43.8, 17.6], [45.4, 15.2], [46, 12]]);
const BONE_TOP: (x: number) => number = (x) => 24 - BONE_BOT(x);

const DONUT = { cx: 24, cy: 12.5, rx: 21, ry: 9.5 };
const ell = (e: typeof DONUT, s: 1 | -1) => (x: number) => e.cy + s * e.ry * Math.sqrt(Math.max(0, 1 - ((x - e.cx) / e.rx) ** 2));
/** The ring's floor: a squarer curve (superellipse) so there's level ground to start on and steep sides to climb. */
const DONUT_FLOOR = (x: number) => DONUT.cy + DONUT.ry * Math.max(0, 1 - Math.abs((x - DONUT.cx) / DONUT.rx) ** 4.5) ** (1 / 4.5);

const MINE_TOP = curve([[2, 13], [3, 8], [6, 5.2], [14, 4.4], [24, 5.0], [34, 4.4], [42, 5.2], [45, 8], [46, 13]]);

const CRYPT_TOP = curve([[3, 15], [4, 10], [8, 6], [15, 3.6], [24, 2.6], [33, 3.6], [40, 6], [44, 10], [45, 15]]);
const CRYPT_BOT = curve([[3, 15], [4, 17.4], [7, 18.4], [14, 18.6], [20, 17.8], [24, 17.4], [28, 17.8], [34, 18.6], [41, 18.4], [44, 17.4], [45, 15]]);

export const CAVE_MAPS: MapDef[] = [
  {
    id: 'eight',
    name: 'Вісімка',
    theme: 'cavern',
    blurb: 'Печера з двох залів під одним склепінням. Розженись — і їдь по стінах.',
    bounds: { x0: 1, y0: 3, x1: 47, y1: 20 },
    killY: 34,
    spawns: [[10.5, 16.2], [37.5, 16.2]],
    solids: [
      ...cavern({ x0: -10, y0: -10, x1: 58, y1: 34 }, sample(2, 46, EIGHT_TOP), sample(2, 46, EIGHT_BOT), 'cave'),
      { mat: 'amber', pts: capsule(10.5, 17.5, 10.2, 0.45) },
      { mat: 'amber', pts: capsule(30.5, 37.5, 10.2, 0.45) },
    ],
    backdrop: [rect(-10, -10, 58, 34)],
    suddenDeathY: 22,
  },
  {
    id: 'bone',
    name: 'Кістка',
    theme: 'catacomb',
    blurb: 'Катакомба у формі кістки: сталева балка посередині ділить її на два поверхи.',
    bounds: { x0: 1, y0: 4.5, x1: 47, y1: 19.5 },
    killY: 34,
    spawns: [[13, 15.4], [35, 15.4]],
    solids: [
      ...cavern({ x0: -10, y0: -10, x1: 58, y1: 34 }, sample(2, 46, BONE_TOP), sample(2, 46, BONE_BOT), 'cave'),
      { mat: 'steel', pts: capsule(16.5, 31.5, 12, 0.42) },
    ],
    backdrop: [rect(-10, -10, 58, 34)],
    decor: [{ kind: 'skull', x: 13.5 }, { kind: 'bones', x: 34.5, front: true }, { kind: 'skull', x: 24, y: 11.58 }],
    suddenDeathY: 22,
  },
  {
    id: 'donut',
    name: 'Пончик',
    theme: 'grotto',
    blurb: 'Кільцевий грот довкола острова. Сині промені на краях закидають нагору.',
    bounds: { x0: 2, y0: 2.5, x1: 46, y1: 22.5 },
    killY: 36,
    spawns: [[11.5, 21], [36.5, 21]],
    solids: [
      ...cavern({ x0: -10, y0: -10, x1: 58, y1: 36 }, sample(3, 45, ell(DONUT, -1), 0.3), sample(3, 45, DONUT_FLOOR, 0.3), 'cave'),
      { mat: 'cave', pts: oval(24, 12.5, 10.5, 3.1, 44) },
    ],
    fields: [
      { kind: 'lift', x: 6.4, y: 7.2, w: 2.4, h: 14 },
      { kind: 'lift', x: 39.2, y: 7.2, w: 2.4, h: 14 },
    ],
    backdrop: [rect(-10, -10, 58, 36)],
    decor: [{ kind: 'crystal', x: 16.5, y: 10.4 }, { kind: 'crystal', x: 31.5, y: 10.4, seed: 2 }],
    suddenDeathY: 24,
  },
  {
    id: 'mineshaft',
    name: 'Т-шахта',
    theme: 'mine',
    blurb: 'Штрек над бездонною шахтою. Через провал ходить лише вагонетка-платформа.',
    bounds: { x0: 1, y0: 3.5, x1: 47, y1: 22 },
    killY: 32,
    spawns: [[10, 13.4], [38, 13.4]],
    solids: [
      { mat: 'cave', pts: [[-10, 13], [-10, -10], [58, -10], [58, 13], ...[...sample(2, 46, MINE_TOP)].reverse()] },
      { mat: 'cave', pts: [[-10, 13], [2, 13], [2.6, 15.0], [4.5, 16.0], [12, 16.2], [19, 16.0], [21.3, 16.3], [21.3, 40], [-10, 40]] },
      { mat: 'cave', pts: [[58, 13], [46, 13], [45.4, 15.0], [43.5, 16.0], [36, 16.2], [29, 16.0], [26.7, 16.3], [26.7, 40], [58, 40]] },
      { mat: 'girder', pts: rect(8, 9.3, 15, 10.0) },
      { mat: 'girder', pts: rect(33, 9.3, 40, 10.0) },
    ],
    platforms: [{ x: 24, y: 16.3, w: 3.6, h: 0.5, path: [[23.1, 16.3], [24.9, 16.3]], speed: 1.6, wait: 1.0, mat: 'metal' }],
    backdrop: [rect(-10, -10, 58, 40)],
    decor: [{ kind: 'lantern', x: 11.5, y: 9.3 }, { kind: 'lantern', x: 36.5, y: 9.3 }],
    suddenDeathY: 26,
  },
  {
    id: 'girders',
    name: 'Ферми над Прірвою',
    theme: 'chasm',
    blurb: 'Ґратчастий міст над прірвою і верхні ферми. Трампліни на скелях закидають на них.',
    bounds: { x0: 0, y0: -2, x1: 48, y1: 24 },
    killY: 32,
    spawns: [[6.3, 13.8], [41.7, 13.8]],
    solids: [
      { mat: 'cave', pts: [[-6, -10], [1.2, -10], [1.2, 9], [2.5, 13.5], [4.5, 15.0], [11.6, 15.0], [12.4, 15.6], [11.8, 18], [10.2, 21], [9.6, 30], [-6, 30]] },
      { mat: 'cave', pts: [[54, -10], [46.8, -10], [46.8, 9], [45.5, 13.5], [43.5, 15.0], [36.4, 15.0], [35.6, 15.6], [36.2, 18], [37.8, 21], [38.4, 30], [54, 30]] },
      { mat: 'girder', pts: rect(11.4, 15.0, 36.6, 15.9) },
      { mat: 'girder', pts: rect(17.6, 15.9, 18.6, 32) },
      { mat: 'girder', pts: rect(29.4, 15.9, 30.4, 32) },
      { mat: 'girder', pts: rect(19.5, 9.6, 28.5, 10.4) },
    ],
    pads: [
      { x: 9.6, y: 15.0, w: 1.6, angle: 0.25, power: 15 },
      { x: 38.4, y: 15.0, w: 1.6, angle: -0.25, power: 15 },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'bunker',
    name: 'Сталевий Бункер',
    theme: 'bunker',
    blurb: 'Сталева зала з лазером посередині: він вмикається й вимикається. Пилки в стінах.',
    bounds: { x0: 1.5, y0: 3, x1: 46.5, y1: 20 },
    killY: 34,
    spawns: [[10, 16.6], [38, 16.6]],
    solids: [
      ...cavern({ x0: -10, y0: -10, x1: 58, y1: 34 },
        [[3, 16], [3, 7.5], [5.5, 5], [42.5, 5], [45, 7.5], [45, 16]],
        [[3, 16], [3, 17.8], [5, 19], [22, 19], [24, 18.6], [26, 19], [43, 19], [45, 17.8], [45, 16]], 'steel'),
      { mat: 'steel', pts: rect(8, 11.6, 14, 12.4) },
      { mat: 'steel', pts: rect(34, 11.6, 40, 12.4) },
    ],
    saws: [
      { x: 3.2, y: 13.4, r: 1.1 },
      { x: 44.8, y: 13.4, r: 1.1 },
      { x: 24, y: 5.2, r: 1.0 },
    ],
    fields: [{ kind: 'laser', x: 23.9, y: 5.8, w: 0.2, h: 12.6, cycle: [2.2, 2.6], phase: 1.5 }],
    backdrop: [rect(-10, -10, 58, 34)],
    suddenDeathY: 22,
  },
  {
    id: 'crypt',
    name: 'Маятник',
    theme: 'crypt',
    blurb: 'Склеп під куполом, де над головами гойдається пилка на ланцюгу.',
    bounds: { x0: 2, y0: 2, x1: 46, y1: 20 },
    killY: 34,
    spawns: [[9.5, 16.2], [38.5, 16.2]],
    solids: [
      ...cavern({ x0: -10, y0: -10, x1: 58, y1: 34 }, sample(3, 45, CRYPT_TOP), sample(3, 45, CRYPT_BOT), 'cave'),
    ],
    saws: [{ x: 24, y: 3.4, r: 1.15, swing: { len: 9.4, amp: 0.95, period: 3.6 } }],
    backdrop: [rect(-10, -10, 58, 34)],
    decor: [{ kind: 'tombstone', x: 14 }, { kind: 'cross', x: 17 }, { kind: 'tombstone', x: 31 }, { kind: 'cross', x: 34, flip: true }],
    suddenDeathY: 22,
  },
  {
    id: 'amber-crown',
    name: 'Бурштинова Корона',
    theme: 'amber',
    blurb: 'Чаша з бурштину між зеленими пружними стінами. У центрі — синій промінь.',
    bounds: { x0: 0, y0: -4, x1: 48, y1: 24 },
    killY: 34,
    spawns: [[11, 13.2], [37, 13.2]],
    solids: [
      { mat: 'amber', pts: [
        [-4, 30], [-4, 2], [2.6, 2], [3.4, 5.5], [2.8, 7.8], [3.6, 9.5], [4.2, 13], [6, 15.2], [10, 15.6],
        ...sample(13, 35, curve([[13, 15.7], [17, 16.2], [21, 16.9], [24, 17.0], [27, 16.9], [31, 16.2], [35, 15.7]]), 0.4),
        [38, 15.6], [42, 15.2], [43.8, 13], [44.4, 9.5], [45.2, 7.8], [44.6, 5.5], [45.4, 2], [52, 2], [52, 30],
      ] },
      { mat: 'amber', pts: [[21.5, 7.6], [26.5, 7.6], [25.4, 8.6], [24, 9.1], [22.6, 8.6]] },
    ],
    fields: [
      { kind: 'bounce', x: 3.2, y: 2.6, w: 0.4, h: 4.5 },
      { kind: 'bounce', x: 44.4, y: 2.6, w: 0.4, h: 4.5 },
      { kind: 'lift', x: 22.8, y: 9.2, w: 2.4, h: 7.6, cycle: [3, 2] },
    ],
    suddenDeathY: 26,
  },
];
