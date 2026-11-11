import { tailgate } from '../art';
import { beacon, blob, circ, ell, eyeball, headlight, path, poly, rect, rr, seg, starShape, stripe, tank, windows } from '../draw';
import { beast, bike, boxy, carriage, fenders, rocket, sedan, tracks, truckCab } from '../skins';
import type { CarMat, CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/** Sled runners with a curled front, joined to the body by struts. */
function runners(f: Frame, mat: CarMat = 'chrome', y = 0.2, struts = true): CarPoly[] {
  const x0 = f.tail.x - 0.05, x1 = f.nose.x - 0.35;
  const out = path([[x0 - 0.1, y - 0.08], [x0, y], [x1, y], [x1 + 0.3, y - 0.1], [x1 + 0.45, y - 0.32], [x1 + 0.38, y - 0.52], [x1 + 0.2, y - 0.55], [x1 + 0.12, y - 0.42]], 0.09, mat);
  if (struts) for (const x of [x0 + 0.35, (x0 + x1) / 2, x1 - 0.2]) out.push(seg([x, y], [x + 0.06, y - 0.2], 0.08, mat));
  return out;
}

/** Tracked hull sitting on a track loop. */
function trackedBody(f: Frame, mat: CarMat = 'body', h = 0.42): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - h], [b.x + b.r - 0.4, y - h], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], mat, {}, 1)];
}

/** Snow cap on top of a span. */
const snowCap = (x0: number, x1: number, y: number, t = 0.12): CarPoly => blob([[x0 - 0.05, y + 0.02], [x0 + 0.05, y - t], [(x0 + x1) / 2, y - t * 1.3], [x1 - 0.05, y - t], [x1 + 0.05, y + 0.02]], 'white', {}, 1);

/** Icicles hanging below a line. */
const icicles = (x0: number, x1: number, y: number, n: number): CarPoly[] => {
  const w = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i) => poly([[x0 + i * w, y], [x0 + (i + 0.8) * w, y], [x0 + (i + 0.4) * w, y + 0.12 + (i % 2) * 0.08]], 'sky'));
};

const ornaments = (cx: number, y: number): CarPoly[] => [
  circ(cx - 0.3, y - 0.3, 0.07, 'red'), circ(cx + 0.25, y - 0.5, 0.07, 'gold'), circ(cx - 0.1, y - 0.75, 0.06, 'white'),
  circ(cx + 0.15, y - 1.0, 0.06, 'red'), circ(cx - 0.35, y - 0.15, 0.06, 'blue'),
];
const fir = (cx: number, y: number, s = 1): CarPoly[] => [
  rect(cx - 0.08, y - 0.15, cx + 0.08, y, 'brown'),
  poly([[cx - 0.6 * s, y - 0.12], [cx + 0.6 * s, y - 0.12], [cx, y - 0.8 * s]], 'leaf'),
  poly([[cx - 0.47 * s, y - 0.55 * s], [cx + 0.47 * s, y - 0.55 * s], [cx, y - 1.15 * s]], 'leaf'),
  poly([[cx - 0.32 * s, y - 0.95 * s], [cx + 0.32 * s, y - 0.95 * s], [cx, y - 1.45 * s]], 'leaf'),
  starShape(cx, y - 1.5 * s, 0.13, 'gold'),
];

export const WINTER = group('winter', [
  ['snowmobile', 'Snowmobile', 'Снігохід на лижі з вітровим склом.', 'sled', ['#e02a4a', '#2a2a2a'], {
    parts: ['wing'], hideParts: true,
    skin: (f) => {
      const a = f.wheels[0];
      return [
        // Rear drive track down to the snow (the wheels are hidden under it).
        rr(f.tail.x - 0.05, a.y + a.r - 0.5, -0.1, a.y + a.r, 0.2, 'rubber'),
        ...[f.tail.x + 0.2, -0.65, -0.3].map((x) => circ(x, a.y + a.r - 0.25, 0.1, 'dark')),
        ...path([[0.3, 0.08], [f.nose.x - 0.1, 0.24], [f.nose.x + 0.15, 0.18], [f.nose.x + 0.25, 0.02]], 0.08, 'chrome'),
        seg([0.6, 0.0], [0.65, 0.22], 0.07, 'dark'),
        blob([[f.tail.x, 0.1], [f.tail.x, -0.18], [-0.6, -0.22], [0.2, -0.28], [f.nose.x - 0.1, -0.12], [f.nose.x + 0.15, 0.06], [0.4, 0.12]], 'body', {}, 1),
        rr(-1.05, -0.36, -0.15, -0.22, 0.05, 'black'),
        blob([[0.2, -0.26], [0.45, -0.58], [0.6, -0.55], [0.55, -0.24]], 'glass', {}, 1),
        stripe(-1.2, 1.0, -0.06, 0.07, 'accent'),
        headlight(f.nose.x - 0.05, -0.04, 0.07),
        rr(f.tail.x - 0.1, -0.42, f.tail.x + 0.35, -0.3, 0.03, 'accent'),
      ];
    },
  }],
  ['spruce-delivery', 'Spruce Delivery', 'Вантажівка, що везе на свято живу ялинку з іграшками.', 'truck', ['#c02a2a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['tree'], hideParts: true,
    skin: (f) => [
      ...truckCab(f),
      snowCap(f.roof.x0, f.nose.x - 0.3, f.roof.y),
      rr(f.deck.x0, f.deck.y - 0.25, f.deck.x1, f.deck.y + 0.1, 0.04, 'wood'),
      ...fir((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.2),
      ...ornaments((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.2),
      stripe(f.tail.x, f.nose.x, 0.08, 0.06, 'white'),
    ],
  }],
  ['snowcat', 'Snowcat', 'Важкий гусеничний ратрак із відвалом і прожекторами.', 'tracked', ['#e04a2a', '#f0f0f0'], {
    o: o({ cab: true }), parts: ['plow'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f, 'body', 0.3),
      rr(f.roof.x0 - 0.5, f.roof.y, f.roof.x1 + 0.5, -0.3, 0.08, 'body'),
      ...windows(f.roof.x0 - 0.42, f.roof.x0 - 0.06, f.roof.y + 0.1, -0.5, 1, 0.1),
      rr(f.roof.x0 - 0.45, f.roof.y - 0.13, f.roof.x1, f.roof.y, 0.04, 'dark'), ...[0.0, 0.3, 0.6, 0.9].map((x) => circ(f.roof.x0 - 0.3 + x, f.roof.y - 0.15, 0.06, 'light')),
      stripe(-1.6, 1.5, -0.25, 0.08, 'accent'),
      poly([[f.nose.x - 0.1, -0.35], [f.nose.x + 0.2, -0.4], [f.nose.x + 0.75, 0.22], [f.nose.x + 0.1, 0.3]], 'chrome'),
      seg([f.nose.x - 0.4, -0.1], [f.nose.x + 0.25, -0.05], 0.1, 'dark'),
    ],
  }],
  ['kicksled', 'Kicksled', 'Фінські сани з довгою ручкою: штовхаєшся ногою і летиш.', 'sled', ['#c08a4a', '#e02a2a'], {
    s: 0.85, o: o({ mat: 'wood' }), parts: ['seat'], noLights: true, hideParts: true,
    skin: (f) => [
      ...runners(f, 'chrome', 0.2, false),
      ...path([[f.tail.x + 0.05, 0.2], [f.tail.x + 0.15, -1.2]], 0.08, 'wood'), ...path([[0.4, 0.2], [0.35, -0.45]], 0.08, 'wood'),
      rr(f.tail.x + 0.05, -1.28, f.tail.x + 0.4, -1.16, 0.04, 'accent'),
      rr(-0.6, -0.25, 0.5, -0.12, 0.04, 'wood'),
      rr(-0.4, -0.55, 0.45, -0.42, 0.04, 'accent'),
      seg([0.0, -0.12], [0.0, 0.2], 0.08, 'wood'),
    ],
  }],
  ['snowman', 'Snowman', 'Сніговик на колесах: морквяний ніс, циліндр і сніжки напоготові.', 'blob', ['#f4f8ff', '#ff8a1a'], {
    gun: () => ({ at: [[0.98, -0.87]], aim: 25 }),
    o: o({ shape: 'snowman', mat: 'white' }), ballast: 0.15, noLights: true,
    skin: () => [
      circ(0, -0.2, 0.75, 'white'), circ(0.05, -1.05, 0.48, 'white'),
      ...path([[-0.5, -0.72], [-0.95, -1.05], [-1.1, -0.95]], 0.06, 'brown'), ...path([[0.55, -0.6], [0.95, -0.85]], 0.06, 'brown'),
      ...eyeball(0.2, -1.15, 0.07), ...eyeball(0.42, -1.12, 0.06),
      poly([[0.45, -1.02], [0.45, -0.92], [0.9, -0.97]], 'orange'),
      rr(-0.48, -0.74, 0.55, -0.6, 0.05, 'red'), rr(-0.48, -0.74, -0.32, -0.32, 0.05, 'red'),
      circ(0.35, -0.42, 0.06, 'black'), circ(0.4, -0.2, 0.06, 'black'), circ(0.4, 0.02, 0.06, 'black'),
    ],
  }],
  ['snowball-cannon', 'Snowball Cannon', 'Гусенична сніжкова гармата: б\'є точно в шолом.', 'tracked', ['#5a8ad8', '#ffffff'], {
    gun: () => ({ at: [[1.66, -1.11]], aim: 28 }),
    s: 0.9, parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      rr(-0.6, -0.72, 0.6, -0.3, 0.12, 'body'), circ(0.6, -0.55, 0.22, 'dark'),
      ...path([[0.6, -0.55], [1.55, -1.05]], 0.24, 'grey'), ...path([[1.45, -0.99], [1.6, -1.08]], 0.3, 'dark'),
      circ(f.tail.x + 0.4, -0.72, 0.15, 'white'), circ(f.tail.x + 0.7, -0.7, 0.13, 'white'), circ(f.tail.x + 0.55, -0.92, 0.12, 'white'),
      stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
    ],
  }],
  ['snowball-bike', 'Snowball Bike', 'Трицикл зі сніговою кулею за спиною.', 'trike', ['#3ab0e0', '#ffffff'], {
    parts: [['ball', 0.5]], hideParts: true,
    skin: (f) => [...bike(f, { style: 'scooter' }), circ(f.deck.x0 - 0.05, f.deck.y - 0.3, 0.4, 'white'), circ(f.deck.x0 + 0.05, f.deck.y - 0.42, 0.1, 'sky')],
  }],
  ['santa-sleigh', 'Santa\'s Sleigh', 'Літаючі сани Санти. Подарунки в кузові вилітають на віражах.', 'sled', ['#d02a2a', '#ffd23f'], {
    float: 0.8, cargo: ['gift', 3],
    skin: () => [
      ...path([[-1.6, 0.12], [-1.55, 0.2], [1.15, 0.2], [1.45, 0.1], [1.6, -0.15], [1.52, -0.38], [1.32, -0.42], [1.24, -0.28]], 0.1, 'gold'),
      ...[-1.1, -0.2, 0.7].map((x) => seg([x, 0.2], [x + 0.05, 0.02], 0.08, 'gold')),
      blob([[-1.62, 0.06], [-1.66, -0.72], [-1.5, -0.98], [-1.25, -0.92], [-1.15, -0.55], [-0.95, -0.38], [0.05, -0.38], [0.55, -0.45], [0.95, -0.72], [1.2, -0.7], [1.22, -0.45], [0.95, 0.06]], 'body', {}, 2),
      stripe(-1.55, 1.0, -0.1, 0.12, 'gold'),
      ...[-1.0, -0.4, 0.2].map((x) => starShape(x, 0.0, 0.09, 'gold')),
      ...path([[-1.6, -0.9], [-1.4, -0.95], [-1.2, -0.85], [-1.0, -0.42], [0.05, -0.4], [0.55, -0.47], [0.95, -0.74], [1.18, -0.72]], 0.1, 'white'),
      circ(1.2, -0.72, 0.11, 'gold'),
    ],
  }],
  ['gift-box', 'Gift Box', 'Подарункова коробка на колесах. Сюрприз: вона підскакує!', 'blob', ['#e02a4a', '#ffd23f'], {
    o: o({ shape: 'square' }), noLights: true,
    skin: (f) => [
      rect(-0.85, -1.15, 0.85, 0.2, 'body'), rect(-0.95, -1.3, 0.95, -1.1, 'body'),
      rect(-0.12, -1.3, 0.12, 0.2, 'accent'), rect(-0.95, -0.55, 0.95, -0.35, 'accent'),
      ell(-0.3, f.roof.y - 0.28, 0.28, 0.16, 'accent'), ell(0.3, f.roof.y - 0.28, 0.28, 0.16, 'accent'), circ(0, f.roof.y - 0.22, 0.12, 'gold'),
      poly([[-0.05, f.roof.y - 0.2], [-0.3, f.roof.y + 0.1], [-0.15, f.roof.y + 0.1]], 'accent'),
    ],
  }],
  ['firework-truck', 'Firework Truck', 'Вантажівка з батареєю феєрверків. Стріляє петардами.', 'truck', ['#3a3ad8', '#ffd23f'], {
    gun: (f) => ({ at: [0, 1, 2, 3, 4].map((i) => [f.deck.x0 + 0.675 + i * 0.4, f.deck.y - 1.55 + i * 0.07]), aim: 62 }),
    parts: ['launcher'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        rr(d.x0, d.y - 0.35, d.x1, d.y + 0.08, 0.04, 'dark'),
        poly([[d.x0 + 0.2, d.y - 0.3], [d.x1 - 0.2, d.y - 0.3], [d.x1 - 0.4, d.y - 0.95], [d.x0 + 0.5, d.y - 1.1]], 'grey'),
        ...[0, 1, 2, 3, 4].map((i) => rr(d.x0 + 0.55 + i * 0.4, d.y - 1.4 + i * 0.07, d.x0 + 0.8 + i * 0.4, d.y - 0.85 + i * 0.07, 0.05, (['red', 'yellow', 'green', 'pink', 'orange'] as CarMat[])[i])),
        ...[0, 1, 2, 3, 4].map((i) => poly([[d.x0 + 0.55 + i * 0.4, d.y - 1.4 + i * 0.07], [d.x0 + 0.8 + i * 0.4, d.y - 1.4 + i * 0.07], [d.x0 + 0.675 + i * 0.4, d.y - 1.6 + i * 0.07]], 'white')),
        starShape(-0.2, 0.05, 0.12), starShape(0.4, 0.08, 0.09),
      ];
    },
  }],
  ['firework', 'Firework', 'Ракета-петарда зі смугастим корпусом. Тримай «вперед» — летить.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      ...rocket(f, { nose: 'yellow', fin: 'yellow', glass: false }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[-1.3 + i * 0.45, -0.32], [-1.1 + i * 0.45, -0.32], [-1.35 + i * 0.45, 0.32], [-1.55 + i * 0.45, 0.32]], 'accent', { flat: true })),
      ...path([[f.tail.x - 0.05, 0.0], [f.tail.x - 0.3, -0.12], [f.tail.x - 0.45, 0.05]], 0.05, 'tan'),
    ],
  }],
  ['christmas-tree', 'Christmas Tree', 'Ялинка з іграшками на шестиколісній гусениці.', 'tracked', ['#2a8a3a', '#ffd23f'], {
    o: o({ wheels: 6 }), parts: [['tree', 1.3]], hideParts: true,
    skin: (f) => [
      ...tracks(f, 'red'),
      rr(-1.3, -0.45, 1.3, -0.1, 0.06, 'gold'), stripe(-1.3, 1.3, -0.28, 0.07, 'red'),
      ...fir(0.6, -0.4, 1.3), ...ornaments(0.6, -0.5), ...ornaments(0.7, -0.8),
      ...path([[-0.1, -0.65], [0.6, -0.9], [1.3, -0.65]], 0.05, 'yellow'), ...path([[0.25, -1.2], [0.6, -1.32], [0.95, -1.2]], 0.05, 'yellow'),
    ],
  }],
  ['snow-racer', 'Snow Racer', 'Одномісні спортивні сани з номером.', 'sled', ['#3a8ad8', '#ffd23f'], {
    speed: 1.05,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x + 0.05, 0.06], [f.tail.x + 0.05, -0.28], [-0.4, -0.3], [0.6, -0.22], [f.nose.x - 0.05, -0.08], [f.nose.x - 0.2, 0.08]], 'body', {}, 1),
      stripe(f.tail.x + 0.1, 0.9, -0.2, 0.06, 'accent'),
      circ(0.2, -0.06, 0.13, 'white'), rect(0.17, -0.13, 0.23, 0.01, 'black', { flat: true }),
      rr(f.tail.x + 0.05, -0.55, f.tail.x + 0.2, -0.25, 0.04, 'accent'),
    ],
  }],
  ['street-sweeper', 'Street Sweeper', 'Снігоприбиральна машина з відвалом і щіткою.', 'box', ['#f0a020', '#ffffff'], {
    parts: ['plow'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { x0: f.tail.x, slope: 0.25, slopeH: 0.45, win: 0, bumper: null }),
      rr(f.tail.x + 0.1, f.roof.y + 0.1, 0.4, f.nose.y1 - 0.2, 0.04, 'accent'),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.2 + i * 0.5, 0.15], [f.tail.x + 0.4 + i * 0.5, 0.15], [f.tail.x + 0.55 + i * 0.5, -0.05], [f.tail.x + 0.35 + i * 0.5, -0.05]], 'black', { flat: true })),
      circ(0.05, 0.36, 0.22, 'orange'), ...[0, 1, 2, 3, 4, 5].map((i) => seg([0.05, 0.36], [0.05 + Math.cos(i) * 0.3, 0.36 + Math.sin(i) * 0.3], 0.04, 'brown')),
      poly([[f.nose.x - 0.05, f.nose.y0 + 0.25], [f.nose.x + 0.2, f.nose.y0 + 0.15], [f.nose.x + 0.75, f.nose.y1 - 0.05], [f.nose.x - 0.05, f.nose.y1 - 0.05]], 'chrome'),
      ...beacon(f.roof.x1 - 0.5, f.roof.y, 'orange', 0.16),
    ],
  }],
  ['snowcycle', 'Snowcycle', 'Зимовий мотоцикл: лижа спереду, гусениця ззаду.', 'bike', ['#3a3ad8', '#e0e0e0'], {
    o: o({ rim: 'monster' }),
    skin: (f) => {
      const a = f.wheels[0];
      return [
        rr(a.x - a.r - 0.08, a.y - a.r - 0.08, a.x + a.r + 0.3, a.y + a.r + 0.08, a.r + 0.06, 'rubber'),
        ...bike(f, { style: 'sport' }),
        ...path([[0.7, 0.28], [1.3, 0.28], [1.45, 0.15]], 0.08, 'chrome'),
      ];
    },
  }],
  ['ice-glider', 'Ice Glider', 'Льодовий буєр під вітрилом: розганяється вітром.', 'sled', ['#a8e0ff', '#ffffff'], {
    o: o({ len: 1.15 }), parts: ['sail'], accel: 1.2, hideParts: true,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x, 0.05], [f.tail.x + 0.1, -0.2], [f.nose.x - 0.4, -0.18], [f.nose.x, 0.0], [f.nose.x - 0.3, 0.08]], 'body', {}, 1),
      ...path([[0.0, -0.18], [0.0, -2.0]], 0.08, 'wood'),
      poly([[0.06, -1.95], [0.06, -0.3], [1.1, -0.32]], 'white'), poly([[-0.06, -1.7], [-0.06, -0.35], [-0.8, -0.38]], 'sky'),
      stripe(0.06, 0.8, -0.9, 0.06, 'accent'),
    ],
  }],
  ['snow-coach', 'Snow Coach', 'Пасажирський зимовий диліжанс із засніженим дахом.', 'carriage', ['#6a3a2a', '#e0c080'], {
    o: o({ len: 1.2 }),
    skin: (f) => [
      ...carriage(f, { trim: 'accent' }),
      snowCap(f.roof.x0 - 0.05, f.roof.x1 + 0.05, f.roof.y - 0.06, 0.14),
      ...windows(-0.75, 0.75, f.roof.y + 0.18, f.roof.y + 0.55, 2, 0.15),
      rect(-0.08, f.roof.y + 0.15, 0.08, 0.1, 'accent', { flat: true }),
      ...icicles(-1.0, 1.0, f.roof.y + 0.05, 8),
      circ(f.nose.x - 0.35, -0.55, 0.1, 'light'), ...path([[f.nose.x - 0.4, -0.45], [f.nose.x - 0.2, -0.45]], 0.04, 'black'),
    ],
  }],
  ['dual-snowballer', 'Dual Snowballer', 'Здвоєна сніжкова установка на гусеницях.', 'tracked', ['#7ab0e0', '#ffffff'], {
    gun: () => ({ at: [[1.58, -0.91], [1.43, -1.22]], aim: 23 }),
    parts: ['twincannon'], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      rr(-0.3, -0.75, 0.7, -0.3, 0.1, 'body'),
      ...path([[0.6, -0.5], [1.55, -0.9]], 0.18, 'grey'), ...path([[0.5, -0.66], [1.4, -1.2]], 0.18, 'grey'),
      circ(-1.0, -0.65, 0.14, 'white'), circ(-0.72, -0.63, 0.12, 'white'),
      stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
    ],
  }],
  ['frosty-car', 'Frosty Car', 'Крижаний легковик з бурульками. Дихає морозом — суперник замерзає.', 'sedan', ['#bfe8ff', '#ffffff'], {
    o: o({ mat: 'glass' }),
    skin: (f) => [
      ...sedan(f, { mat: 'sky', glass: 'white', bumper: 'white' }),
      snowCap(f.roof.x0 - 0.05, f.roof.x1 + 0.05, f.roof.y, 0.1),
      ...icicles(f.tail.x + 0.2, f.nose.x - 0.2, 0.28, 10),
      ...[[-1.0, 0.0], [0.6, 0.05], [-0.2, -0.05]].map(([x, y]) => starShape(x, y, 0.09, 'white')),
    ],
  }],
  ['sleigh', 'Sleigh', 'Класичні дерев\'яні сани із загнутими полозами.', 'sled', ['#a0603a', '#e0c060'], {
    o: o({ mat: 'wood' }), noLights: true,
    skin: (f) => [
      ...runners(f, 'gold'),
      blob([[f.tail.x, 0.05], [f.tail.x - 0.02, -0.55], [f.tail.x + 0.15, -0.6], [f.tail.x + 0.3, -0.3], [0.5, -0.3], [f.nose.x - 0.35, -0.45], [f.nose.x - 0.25, -0.3], [f.nose.x - 0.4, 0.05]], 'wood', {}, 1),
      stripe(f.tail.x + 0.05, f.nose.x - 0.4, -0.05, 0.08, 'accent'),
      rr(f.tail.x + 0.2, -0.38, -0.2, -0.26, 0.04, 'red'),
    ],
  }],
  ['rocket-sleigh', 'Rocket Sleigh', 'Сани з реактивним двигуном. Тримай «вперед» — летиш по льоду.', 'sled', ['#e02a2a', '#c0c0c0'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      ...runners(f, 'chrome'),
      blob([[f.tail.x + 0.05, 0.05], [f.tail.x + 0.05, -0.32], [0.3, -0.3], [f.nose.x - 0.2, -0.15], [f.nose.x - 0.2, 0.05]], 'body', {}, 1),
      tank(f.tail.x - 0.4, -0.6, -0.5, 0.18, 'chrome'), poly([[f.tail.x - 0.4, -0.62], [f.tail.x - 0.7, -0.6], [f.tail.x - 0.7, -0.4], [f.tail.x - 0.4, -0.38]], 'dark'),
      poly([[-0.9, -0.66], [-1.2, -0.95], [-1.0, -0.95], [-0.7, -0.66]], 'accent'),
      blob([[0.35, -0.3], [0.65, -0.55], [0.85, -0.22]], 'glass', {}, 1),
      stripe(f.tail.x + 0.1, 0.9, -0.1, 0.06, 'accent'),
    ],
  }],
  ['caterdog', 'Caterdog', 'Робопес-гусениця на широких траках.', 'creature', ['#c0c8d0', '#3a8ad8'], {
    o: o({ len: 1.3, mat: 'metal' }), parts: ['tail', 'ears'], noLights: true, hideParts: true,
    skin: () => [
      rr(-1.0, 0.18, 1.0, 0.75, 0.28, 'rubber'), rr(-0.9, 0.26, 0.9, 0.67, 0.2, 'dark'),
      rr(-1.25, -0.6, 1.0, 0.18, 0.2, 'metal'),
      ...[-0.8, -0.3, 0.2, 0.7].map((x) => circ(x, -0.15, 0.08, 'dark')),
      stripe(-1.2, 0.95, -0.45, 0.07, 'accent'),
      ...path([[0.8, -0.4], [1.3, -0.85]], 0.22, 'metal'),
      blob([[1.1, -1.0], [1.3, -1.15], [1.95, -1.05], [2.0, -0.85], [1.2, -0.78]], 'metal', {}, 1),
      poly([[1.25, -1.12], [1.35, -1.45], [1.48, -1.1]], 'accent'),
      circ(1.6, -0.98, 0.07, 'light'), circ(2.0, -0.95, 0.06, 'black'),
      ...path([[-1.2, -0.4], [-1.55, -0.9], [-1.45, -1.05]], 0.08, 'metal'),
    ],
  }],
  ['sled-dog', 'Sled Dog', 'Хаскі в упряжі тягне за собою сани.', 'creature', ['#8a6a4a', '#f0f0f0'], {
    parts: ['ears'], noLights: true, hideParts: true,
    // The sled is towed on a harness: it fishtails behind the dog and bucks over bumps.
    links: () => [{
      at: [-1.0, 0.1], swing: [-40, 40], density: 0.5, behind: true,
      wheels: [{ x: -2.25, y: 0.58, r: 0.22, hidden: true, drive: false }, { x: -1.6, y: 0.58, r: 0.22, hidden: true, drive: false }],
      hit: [rect(-2.5, 0.2, -1.4, 0.62)],
      art: [
        seg([-1.0, 0.1], [-1.45, 0.45], 0.05, 'red'),
        ...path([[-2.55, 0.62], [-2.45, 0.78], [-1.45, 0.78], [-1.3, 0.6]], 0.07, 'chrome'),
        seg([-2.3, 0.6], [-2.3, 0.78], 0.05, 'chrome'), seg([-1.65, 0.6], [-1.65, 0.78], 0.05, 'chrome'),
        blob([[-2.5, 0.62], [-2.58, 0.15], [-2.38, 0.1], [-2.28, 0.38], [-1.45, 0.38], [-1.4, 0.62]], 'wood', {}, 1),
        rect(-2.2, 0.2, -1.85, 0.4, 'red', { ring: true }), rect(-2.05, 0.2, -2.0, 0.4, 'gold', { flat: true }),
      ],
    }],
    skin: (f) => [
      ...beast(f, { mat: 'grey', belly: 'white', cx: 0.1, ry: 0.36 }),
      ...path([[0.7, -0.35], [1.25, -0.8]], 0.3, 'grey'),
      blob([[1.05, -0.95], [1.25, -1.15], [1.6, -1.05], [1.95, -0.88], [1.9, -0.75], [1.3, -0.7]], 'grey', {}, 1),
      poly([[1.2, -1.05], [1.25, -1.35], [1.4, -1.1]], 'grey'), poly([[1.35, -1.05], [1.45, -1.32], [1.55, -1.05]], 'grey'),
      blob([[1.35, -0.92], [1.95, -0.88], [1.9, -0.75], [1.4, -0.75]], 'white', {}, 1),
      circ(1.95, -0.88, 0.06, 'black'), circ(1.55, -0.95, 0.05, 'sky'),
      rr(0.2, -0.65, 0.45, -0.05, 0.04, 'red'), seg([-0.4, 0.2], [0.3, -0.35], 0.05, 'red'),
      ...path([[-1.05, -0.4], [-1.3, -0.8], [-1.15, -0.95]], 0.12, 'grey'),
    ],
  }],
  ['snow-truck', 'Snow Truck', 'Полярний вантажник, повний снігу. Висипає снігову лавину.', 'truck', ['#e06a1a', '#f0f0f0'], {
    o: o({ wheel: 1.3, wheels: 2 }), cargo: ['snowball', 7],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'body')), hidden(rect(f.deck.x1 - 0.08, f.deck.y - 0.3, f.deck.x1, f.deck.y, 'body', { deco: false }))],
    skin: (f) => [
      ...truckCab(f),
      snowCap(f.roof.x0, f.nose.x - 0.3, f.roof.y),
      poly([[f.deck.x0, f.deck.y - 0.32], [f.deck.x1, f.deck.y - 0.32], [f.deck.x1, f.deck.y + 0.1], [f.deck.x0, f.deck.y + 0.1]], 'body'),
      rect(f.deck.x0 + 0.08, f.deck.y - 0.24, f.deck.x1 - 0.08, f.deck.y + 0.02, 'dark', { flat: true }),
      ...fenders(f, 'dark', 0.12),
    ],
  }],
  ['penguin-prisoner', 'Penguin Prisoner', 'Візок із пінгвіном у клітці. Пінгвін може вистрибнути!', 'cart', ['#3a3a4a', '#ffa020'], {
    parts: ['cage'], cargo: ['penguin', 1], noLights: true,
    skin: (f) => [
      rr(f.tail.x, f.deck.y, f.nose.x, 0.18, 0.05, 'body'),
      stripe(f.tail.x, f.nose.x, f.deck.y + 0.2, 0.08, 'accent'),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.32, 0.12], [f.tail.x + 0.25 + i * 0.32, 0.12], [f.tail.x + 0.35 + i * 0.32, f.deck.y + 0.08], [f.tail.x + 0.2 + i * 0.32, f.deck.y + 0.08]], 'yellow', { flat: true })),
    ],
  }],
  ['penguin-slider', 'Penguin Slider', 'Пінгвін ковзає на череві й таранить суперника.', 'creature', ['#1a1a2a', '#ffa020'], {
    o: o({ neck: 'none', len: 0.9 }), parts: ['snout'], noLights: true, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x - 0.2, 0.0], [-0.6, -0.55], [0.3, -0.62], [0.9, -0.45], [f.nose.x + 0.05, -0.2], [0.8, 0.12], [-0.6, 0.12]], 'body', {}, 2),
      blob([[-0.6, 0.1], [0.0, -0.1], [0.8, -0.2], [f.nose.x - 0.05, -0.1], [0.75, 0.1]], 'white', {}, 2),
      ...eyeball(0.72, -0.4, 0.08),
      poly([[f.nose.x - 0.05, -0.32], [f.nose.x + 0.35, -0.24], [f.nose.x - 0.05, -0.16]], 'orange'),
      poly([[-0.5, -0.4], [-0.1, -0.2], [-0.7, -0.05]], 'body'),
      poly([[f.tail.x - 0.1, -0.05], [f.tail.x - 0.45, -0.2], [f.tail.x - 0.4, 0.1]], 'orange'),
    ],
  }],
  ['penguin-minions', 'Penguin Minions', 'Пінгвін-солдат у касці зі сніжкометом.', 'blob', ['#1a1a2a', '#ffa020'], {
    o: o({ shape: 'egg' }), parts: ['gun'], noLights: true, hideParts: true,
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      ell(0.25, -0.35, 0.55, 0.6, 'white'), ...eyeball(0.45, -0.95, 0.1),
      poly([[0.75, -0.85], [0.75, -0.72], [1.1, -0.78]], 'orange'),
      blob([[-0.65, -1.05], [0.65, -1.05], [0.45, -1.38], [-0.45, -1.38]], 'leaf', {}, 1), rr(-0.75, -1.1, 0.75, -1.0, 0.04, 'leaf'),
      rr(-0.2, -0.55, 0.25, -0.35, 0.04, 'dark'), ...path([[0.2, -0.45], [1.05, -0.55]], 0.12, 'grey'), circ(-0.3, -0.42, 0.12, 'white'),
    ],
  }],
  ['snowball-tank', 'Snowball Tank', 'Білий броньовик для снігових баталій.', 'tracked', ['#e0e8f0', '#3a8ad8'], {
    gun: () => ({ at: [[1.38, -0.89]], aim: 21 }),
    parts: [['cannon', 0.8]], hideParts: true,
    skin: (f) => [
      ...trackedBody(f),
      blob([[-0.7, -0.3], [-0.6, -0.72], [0.4, -0.72], [0.65, -0.3]], 'body', {}, 1),
      ...path([[0.5, -0.55], [1.35, -0.88]], 0.14, 'grey'),
      starShape(-0.15, -0.5, 0.14, 'accent'), stripe(-1.6, 1.5, -0.2, 0.07, 'accent'),
      snowCap(-0.55, 0.4, -0.72, 0.1),
    ],
  }],
  ['electric-reindeer', 'Electric Reindeer', 'Механічний олень зі світним носом. Б\'є розрядом навколо.', 'creature', ['#a0a8b8', '#5ef0ff'], {
    o: o({ mat: 'metal' }), noLights: true,
    skin: (f) => [
      ...beast(f, { mat: 'brown', belly: 'tan' }),
      ...path([[0.75, -0.4], [1.25, -0.85]], 0.28, 'brown'),
      blob([[1.05, -1.05], [1.4, -1.12], [1.8, -0.95], [1.75, -0.78], [1.15, -0.78]], 'brown', {}, 1),
      ...path([[1.2, -1.05], [0.95, -1.75], [0.6, -2.15]], 0.1, 'tan'), ...path([[1.02, -1.5], [1.35, -1.95]], 0.09, 'tan'), ...path([[0.82, -1.9], [1.05, -2.25]], 0.08, 'tan'),
      ...path([[1.38, -1.1], [1.45, -1.8], [1.8, -2.2]], 0.1, 'tan'), ...path([[1.43, -1.55], [1.85, -1.7]], 0.09, 'tan'),
      circ(1.8, -0.88, 0.1, 'red'), circ(1.5, -0.98, 0.05, 'black'),
      ...[-0.6, 0.0, 0.6].map((x) => poly([[x, -0.45], [x + 0.14, -0.28], [x + 0.03, -0.24], [x + 0.12, -0.04], [x - 0.08, -0.25], [x + 0.03, -0.28]], 'accent', { flat: true })),
      ...path([[-1.0, -0.4], [-1.2, -0.6]], 0.1, 'tan'),
      rr(-0.6, -0.68, 0.2, -0.55, 0.04, 'red'),
    ],
  }],
]);

