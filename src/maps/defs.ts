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
  // ---------------------------------------------------------------- themed arenas (one per car collection)
  {
    id: 'graveyard',
    name: 'Нічний Цвинтар',
    theme: 'halloween',
    blurb: 'Пагорби між надгробків і дві ями з кованими шипами.',
    bounds: { x0: 0, y0: -6, x1: 46, y1: 26 },
    killY: 34,
    spawns: [[9, 13.2], [37, 13.2]],
    solids: [
      { mat: 'grave', pts: heightfield(0, 46, 0.5, profile([[0, 3], [3, 8], [6, 15.2], [9, 15.5], [11.6, 15.8], [12.6, 17.0], [14.2, 17.0], [15.4, 15.6], [19, 15.1], [23, 13.6], [27, 15.1], [30.6, 15.6], [31.8, 17.0], [33.4, 17.0], [34.4, 15.8], [37, 15.5], [40, 15.2], [43, 8], [46, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(45, -10, 50, 30) },
    ],
    spikes: [{ x: 12.6, y: 17.0, w: 1.6 }, { x: 31.8, y: 17.0, w: 1.6 }],
    decor: [
      { kind: 'deadtree', x: 4.6 }, { kind: 'deadtree', x: 41.6, flip: true },
      { kind: 'tombstone', x: 7.6 }, { kind: 'cross', x: 10.4 }, { kind: 'tombstone', x: 17.4 }, { kind: 'tombstone', x: 20.4 },
      { kind: 'tombstone', x: 25.8 }, { kind: 'tombstone', x: 28.8 }, { kind: 'cross', x: 35.6 }, { kind: 'tombstone', x: 38.6 },
      { kind: 'pumpkin', x: 6.8, front: true }, { kind: 'pumpkin', x: 18.8, front: true }, { kind: 'pumpkin', x: 27.4, front: true },
      { kind: 'pumpkin', x: 39.4, front: true }, { kind: 'skull', x: 23, front: true }, { kind: 'bones', x: 16.4, front: true },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'winter',
    name: 'Зимове Містечко',
    theme: 'winter',
    blurb: 'Снігові трампліни, крижана чаша і бурульки з неба.',
    bounds: { x0: 0, y0: -6, x1: 48, y1: 26 },
    killY: 34,
    spawns: [[9, 13.4], [39, 13.4]],
    solids: [
      { mat: 'snow', pts: heightfield(0, 48, 0.5, profile([[0, 3], [3, 7], [6, 14.5], [8, 15.6], [11, 15.8], [13.4, 15.2], [15, 14.0], [16.2, 14.2], [18, 16.4], [24, 17.0], [30, 16.4], [31.8, 14.2], [33, 14.0], [34.6, 15.2], [37, 15.8], [40, 15.6], [42, 14.5], [45, 7], [48, 3]]), 30) },
      { mat: 'ice', pts: strip(18.5, 29.5, 0.5, profile([[18.5, 16.62], [24, 17.02], [29.5, 16.62]]), 0.5) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(47, -10, 52, 30) },
    ],
    fallingBlocks: { x0: 19, x1: 29, y: -3, interval: 4.2, size: 0.8, style: 'ice' },
    decor: [
      { kind: 'spruce', x: 4.2 }, { kind: 'spruce', x: 7.2, s: 1 }, { kind: 'spruce', x: 12.2 }, { kind: 'spruce', x: 35.8 },
      { kind: 'spruce', x: 40.8 }, { kind: 'spruce', x: 43.8 }, { kind: 'snowman', x: 20.6 }, { kind: 'snowman', x: 27.4, flip: true },
      { kind: 'gift', x: 10.4, front: true }, { kind: 'gift', x: 11.4, front: true }, { kind: 'gift', x: 37.2, front: true },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'ufo-farm',
    name: 'Ферма Прибульців',
    theme: 'alien',
    blurb: 'Нічна ферма. Промінь НЛО в центрі підкидає авто вгору!',
    bounds: { x0: 0, y0: -6, x1: 46, y1: 26 },
    killY: 34,
    spawns: [[11, 13], [35, 13]],
    solids: [
      { mat: 'grass', pts: heightfield(0, 46, 0.5, profile([[0, 3], [3, 8], [6, 15], [10, 15.4], [15, 15.8], [19, 15.2], [21, 14.4], [23, 14.2], [25, 14.4], [27, 15.2], [31, 15.8], [36, 15.4], [40, 15], [43, 8], [46, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(45, -10, 50, 30) },
    ],
    pads: [{ x: 23, y: 14.2, w: 1.8, power: 17 }],
    decor: [
      { kind: 'silo', x: 4.4 }, { kind: 'barn', x: 8.6 }, { kind: 'fence', x: 13.4 }, { kind: 'fence', x: 32.6 }, { kind: 'barn', x: 38.4, flip: true },
      { kind: 'beam', x: 23, y: 14.2, s: 1.2 }, { kind: 'ufo', x: 23, y: 9.6 },
      { kind: 'cow', x: 17.2 }, { kind: 'cow', x: 29.6, flip: true },
      { kind: 'haybale', x: 15.4, front: true }, { kind: 'haybale', x: 31, front: true },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'motordrome',
    name: 'Мотодром',
    theme: 'dome',
    blurb: 'Глибока чаша зі стрімкими стінами — катайся по них!',
    bounds: { x0: 0, y0: -8, x1: 48, y1: 24 },
    killY: 34,
    spawns: [[12, 13.6], [36, 13.6]],
    solids: [
      { mat: 'asphalt', pts: heightfield(1, 47, 0.4, (x) => {
        const t = (x - 24) / 22;
        return 17 - 11 * Math.pow(Math.abs(t), 4) - 0.7 * Math.exp(-Math.pow((x - 24) / 1.6, 2));
      }, 30) },
      { mat: 'metal', pts: slab(-4, -12, 1.2, 30) },
      { mat: 'metal', pts: slab(46.8, -12, 52, 30) },
    ],
    decor: [
      { kind: 'tires', x: 7 }, { kind: 'tires', x: 41, flip: true }, { kind: 'tires', x: 10 },
      { kind: 'checkflag', x: 21.6 }, { kind: 'checkflag', x: 26.4, flip: true },
      { kind: 'cone', x: 15.6, front: true }, { kind: 'cone', x: 32.4, front: true }, { kind: 'cone', x: 18, front: true }, { kind: 'cone', x: 30, front: true },
    ],
    suddenDeathY: 24,
  },
  {
    id: 'volcano',
    name: 'Вулкан',
    theme: 'volcano',
    blurb: 'Між уступами — ями з лавою, з кратера летить каміння.',
    bounds: { x0: 0, y0: -6, x1: 48, y1: 26 },
    killY: 34,
    spawns: [[8, 13], [40, 13]],
    solids: [
      { mat: 'basalt', pts: heightfield(0, 48, 0.4, profile([[0, 3], [3, 8], [5.5, 15], [11, 15.2], [12.2, 15.6], [12.8, 17.6], [14.6, 17.6], [15.2, 15.8], [17, 14.6], [24, 10.8], [31, 14.6], [32.8, 15.8], [33.4, 17.6], [35.2, 17.6], [35.8, 15.6], [37, 15.2], [42.5, 15], [45, 8], [48, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(47, -10, 52, 30) },
    ],
    lava: [{ x: 12.6, y: 17.1, w: 2.4, h: 2 }, { x: 33, y: 17.1, w: 2.4, h: 2 }],
    fallingBlocks: { x0: 19, x1: 29, y: -4, interval: 3.6, size: 0.9, style: 'stone' },
    decor: [
      { kind: 'fern', x: 6.4, front: true }, { kind: 'fern', x: 41.6, front: true, flip: true }, { kind: 'rocks', x: 10 }, { kind: 'rocks', x: 38, flip: true },
      { kind: 'fern', x: 18.4 }, { kind: 'fern', x: 29.6, flip: true }, { kind: 'bones', x: 20.4, front: true }, { kind: 'skull', x: 27.4, front: true },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'beach',
    name: 'Тропічний Пляж',
    theme: 'beach',
    blurb: 'Піщаний острів без бортів — зіштовхни суперника в море!',
    bounds: { x0: -2, y0: -6, x1: 50, y1: 26 },
    killY: 30,
    spawns: [[13, 12.8], [35, 12.8]],
    solids: [
      { mat: 'sand', pts: heightfield(5, 43, 0.5, profile([[5, 18.6], [7, 16.2], [10, 15.2], [16, 15.5], [20, 14.6], [24, 13.9], [28, 14.6], [32, 15.5], [38, 15.2], [41, 16.2], [43, 18.6]]), 24) },
    ],
    water: [{ x: -14, y: 17.2, w: 76, h: 14 }],
    decor: [
      { kind: 'palm', x: 9 }, { kind: 'palm', x: 39.4, flip: true }, { kind: 'umbrella', x: 16.4 }, { kind: 'umbrella', x: 31.6, flip: true },
      { kind: 'sandcastle', x: 24 }, { kind: 'cactus', x: 6.6, front: true }, { kind: 'cactus', x: 41.4, front: true, flip: true },
    ],
    suddenDeathY: 22,
  },
  {
    id: 'stadium',
    name: 'Стадіон',
    theme: 'stadium',
    blurb: 'Футбольне поле з м\'ячем. Бережи голову від влучного удару!',
    bounds: { x0: 0, y0: -6, x1: 52, y1: 26 },
    killY: 34,
    spawns: [[14, 14], [38, 14]],
    solids: [
      { mat: 'turf', pts: heightfield(0, 52, 0.5, profile([[0, 2], [2.5, 6], [4.5, 15.6], [7, 16.2], [26, 16.6], [45, 16.2], [47.5, 15.6], [49.5, 6], [52, 2]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(51, -10, 56, 30) },
    ],
    balls: [{ x: 26, y: 12, r: 0.6 }],
    decor: [
      { kind: 'floodlight', x: 3.2 }, { kind: 'floodlight', x: 48.8, flip: true },
      { kind: 'goal', x: 8.6 }, { kind: 'goal', x: 43.4, flip: true },
      { kind: 'cornerflag', x: 11.8, front: true }, { kind: 'cornerflag', x: 40.2, front: true, flip: true },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'lantern',
    name: 'Свято Ліхтарів',
    theme: 'cny',
    blurb: 'Сходи храму, ворота і петарди-катапульти по краях.',
    bounds: { x0: 0, y0: -6, x1: 48, y1: 26 },
    killY: 34,
    spawns: [[11.4, 12], [36.6, 12]],
    solids: [
      { mat: 'tile', pts: heightfield(0, 48, 0.2, profile([[0, 3], [3, 8], [5, 15], [9, 15], [9.6, 14.2], [13, 14.2], [13.6, 13.4], [17, 13.4], [24, 12.4], [31, 13.4], [34.4, 13.4], [35, 14.2], [38.4, 14.2], [39, 15], [43, 15], [45, 8], [48, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(47, -10, 52, 30) },
    ],
    pads: [
      { x: 7, y: 15, w: 1.6, angle: 0.2, power: 15 },
      { x: 41, y: 15, w: 1.6, angle: -0.2, power: 15 },
    ],
    decor: [
      { kind: 'bamboo', x: 4.4 }, { kind: 'bamboo', x: 43.6, flip: true }, { kind: 'gate', x: 24 },
      { kind: 'lantern', x: 9.4 }, { kind: 'lantern', x: 13.4 }, { kind: 'lantern', x: 34.6 }, { kind: 'lantern', x: 38.6 },
    ],
    suddenDeathY: 26,
  },
  {
    id: 'rift',
    name: 'Розлом',
    theme: 'rift',
    blurb: 'Кристалеві острови над порожнечею, слабка гравітація і міст-платформа.',
    gravity: 15,
    bounds: { x0: 0, y0: -8, x1: 48, y1: 24 },
    killY: 30,
    spawns: [[9.5, 11.8], [38.5, 11.8]],
    solids: [
      { mat: 'void', pts: [...heightfield(3, 19, 0.5, profile([[3, 15.6], [5, 14.2], [12, 13.8], [17, 14.2], [19, 15.4]]), 15.4).slice(0, -2), [18, 17.2], [15, 19.6], [11, 20.6], [7, 19.2], [4.2, 17.2]] },
      { mat: 'void', pts: [...heightfield(29, 45, 0.5, profile([[29, 15.4], [31, 14.2], [36, 13.8], [43, 14.2], [45, 15.6]]), 15.4).slice(0, -2), [43.8, 17.2], [41, 19.2], [37, 20.6], [33, 19.6], [30, 17.2]] },
      { mat: 'void', pts: [[21.4, 7.6], [26.6, 7.6], [25.6, 8.7], [24, 9.3], [22.4, 8.7]] },
    ],
    platforms: [{ x: 24, y: 14.4, w: 4, h: 0.5, path: [[21.6, 14.4], [26.4, 14.4]], speed: 2, wait: 0.6, mat: 'void' }],
    pads: [
      { x: 16, y: 14.05, w: 1.4, angle: 0.3, power: 13 },
      { x: 32, y: 14.05, w: 1.4, angle: -0.3, power: 13 },
    ],
    decor: [
      { kind: 'crystal', x: 5.6 }, { kind: 'crystal', x: 13.2, seed: 2 }, { kind: 'crystal', x: 34.8, seed: 2 }, { kind: 'crystal', x: 42.4 },
      { kind: 'portal', x: 9.8 }, { kind: 'portal', x: 38.2, flip: true },
    ],
    suddenDeathY: 24,
  },
  {
    id: 'toytrack',
    name: 'Іграшковий Трек',
    theme: 'toys',
    blurb: 'Помаранчевий трек з бустерами і двома великими трамплінами.',
    bounds: { x0: 0, y0: -6, x1: 50, y1: 26 },
    killY: 34,
    spawns: [[8.4, 13], [41.6, 13]],
    solids: [
      { mat: 'track', pts: heightfield(0, 50, 0.25, profile([[0, 3], [3, 8], [5.5, 15], [9, 15.4], [12.5, 15.4], [16.6, 12.8], [17.4, 12.6], [17.9, 15.9], [25, 16.2], [32.1, 15.9], [32.6, 12.6], [33.4, 12.8], [37.5, 15.4], [41, 15.4], [44.5, 15], [47, 8], [50, 3]]), 30) },
      { mat: 'rock', pts: slab(-4, -10, 1, 30) },
      { mat: 'rock', pts: slab(49, -10, 54, 30) },
    ],
    pads: [
      { x: 11, y: 15.4, w: 1.6, angle: 0.35, power: 12 },
      { x: 39, y: 15.4, w: 1.6, angle: -0.35, power: 12 },
    ],
    decor: [
      { kind: 'loop', x: 25, s: 1.4 }, { kind: 'block', x: 4.4 }, { kind: 'block', x: 6, seed: 3 }, { kind: 'block', x: 44, seed: 5 },
      { kind: 'block', x: 45.6, seed: 8 }, { kind: 'checkflag', x: 13.6 }, { kind: 'checkflag', x: 36.4, flip: true },
    ],
    suddenDeathY: 26,
  },
];

export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map((m) => [m.id, m]));
