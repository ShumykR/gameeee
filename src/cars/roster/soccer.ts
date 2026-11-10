import { blob, circ, ell, fangs, path, poly, rect, rr, seg, stripe } from '../draw';
import { monsterChassis, tracks, truckCab } from '../skins';
import type { CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

/** Football: white ball with black pentagons. */
function football(cx: number, cy: number, r: number): CarPoly[] {
  const pent = (x: number, y: number, s: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i < 5; i++) pts.push([x + Math.cos(-Math.PI / 2 + i * 1.2566) * s, y + Math.sin(-Math.PI / 2 + i * 1.2566) * s]);
    return poly(pts, 'black', { flat: true });
  };
  const out: CarPoly[] = [circ(cx, cy, r, 'white')];
  out.push(pent(cx, cy, r * 0.28));
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 1.2566;
    out.push(pent(cx + Math.cos(a) * r * 0.78, cy + Math.sin(a) * r * 0.78, r * 0.2));
  }
  return out;
}
function tankBody(f: Frame): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - 0.38], [b.x + b.r - 0.35, y - 0.4], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], 'body', {}, 1)];
}
/** Striped football-pitch band. */
const pitch = (x0: number, x1: number, y: number): CarPoly[] => Array.from({ length: 8 }, (_, i) => rect(x0 + ((x1 - x0) * i) / 8, y - 0.06, x0 + ((x1 - x0) * (i + 1)) / 8, y + 0.06, i % 2 ? 'green' : 'leaf', { flat: true }));

export const SOCCER = group('soccer', [
  ['soccer-monster', 'Soccer Monster', 'Монстр-трак футбольної арени з вирячкуватими очима.', 'monster', ['#ffffff', '#2a2a2a'], {
    o: o({ open: true }),
    skin: (f) => [
      ...monsterChassis(f),
      blob([[f.tail.x, 0.08], [f.tail.x + 0.05, -0.75], [-0.5, -1.05], [0.5, -1.05], [f.nose.x, -0.6], [f.nose.x + 0.05, 0.08]], 'body', {}, 2),
      ...[[-1.0, -0.55], [-0.4, -0.75], [0.1, -0.3], [-0.7, -0.15]].map(([x, y]) => poly(Array.from({ length: 5 }, (_, i) => [x + Math.cos(i * 1.2566) * 0.14, y + Math.sin(i * 1.2566) * 0.14] as [number, number]), 'black', { flat: true })),
      ell(f.nose.x - 0.55, -0.45, 0.16, 0.18, 'white'), circ(f.nose.x - 0.5, -0.42, 0.08, 'black'),
      ell(f.nose.x - 0.2, -0.45, 0.13, 0.15, 'white'), circ(f.nose.x - 0.16, -0.42, 0.06, 'black'),
      poly([[f.nose.x - 0.8, -0.15], [f.nose.x + 0.02, -0.18], [f.nose.x - 0.05, 0.05], [f.nose.x - 0.75, 0.05]], 'black'),
      ...fangs(f.nose.x - 0.78, f.nose.x - 0.05, -0.16, 5, 0.12),
    ],
  }],
  ['soccer-ball', 'Soccer Ball', 'Футбольний м\'яч на шасі: пружинить і відскакує.', 'blob', ['#ffffff', '#2a2a2a'], {
    o: o({ mat: 'white' }), bounce: 0.5, noLights: true,
    skin: () => [...football(0, -0.35, 0.9)],
  }],
  ['soccer-delivery', 'Soccer Delivery Truck', 'Вантажівка з сіткою м\'ячів. М\'ячі розлітаються по арені.', 'truck', ['#3aa04a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['net'], cargo: ['ball', 6], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        rr(d.x0, d.y - 0.05, d.x1, d.y + 0.1, 0.03, 'white'),
        ...[d.x0, d.x1 - 0.08].map((x) => rect(x, d.y - 0.85, x + 0.08, d.y, 'white')), rect(d.x0, d.y - 0.9, d.x1, d.y - 0.82, 'white'),
        ...Array.from({ length: 9 }, (_, i) => seg([d.x0 + 0.08 + i * ((d.x1 - d.x0 - 0.16) / 8), d.y - 0.82], [d.x0 + 0.08 + i * ((d.x1 - d.x0 - 0.16) / 8), d.y], 0.03, 'grey', { flat: true })),
        ...Array.from({ length: 4 }, (_, i) => seg([d.x0 + 0.08, d.y - 0.18 - i * 0.18], [d.x1 - 0.08, d.y - 0.18 - i * 0.18], 0.03, 'grey', { flat: true })),
        stripe(f.tail.x, f.nose.x, 0.05, 0.07, 'white'),
      ];
    },
  }],
  ['soccer-cannon', 'Soccer Cannon', 'Пневматична гармата для футбольних м\'ячів.', 'tracked', ['#3aa04a', '#ffffff'], {
    gun: () => ({ at: [[1.14, -1.22]], aim: 27 }),
    s: 0.9, parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...tankBody(f), ...pitch(-1.6, 1.6, -0.2),
      circ(0.0, -0.6, 0.3, 'body'), ...path([[0.0, -0.65], [1.0, -1.15]], 0.32, 'white'), ...path([[0.95, -1.12], [1.1, -1.2]], 0.42, 'grey'),
      ...football(-0.95, -0.72, 0.22),
    ],
  }],
  ['dual-soccer-cannon', 'Dual Soccer Cannon', 'Здвоєний футбольний міномет.', 'tracked', ['#2a6ae0', '#ffffff'], {
    gun: () => ({ at: [[1.48, -0.86], [1.33, -1.2]], aim: 20 }),
    parts: ['twincannon'], hideParts: true,
    skin: (f) => [
      ...tankBody(f), ...pitch(-1.6, 1.6, -0.2),
      rr(-0.3, -0.75, 0.5, -0.3, 0.1, 'body'),
      ...path([[0.3, -0.48], [1.45, -0.85]], 0.2, 'white'), ...path([[0.2, -0.64], [1.3, -1.18]], 0.2, 'white'),
      ...football(-1.0, -0.65, 0.2), ...football(-0.6, -0.6, 0.16),
    ],
  }],
  ['soccer-shoe', 'Soccer Shoe', 'Бутса на роликах: шнурки, шипи і удар з розгону.', 'sports', ['#1a1a1a', '#ffffff'], {
    parts: ['hump'], noLights: true, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, 0.18], [f.tail.x - 0.08, -0.3], [f.tail.x + 0.05, -0.85], [-0.55, -0.9], [-0.45, -0.45], [0.3, -0.35], [1.0, -0.25], [f.nose.x + 0.05, -0.05], [f.nose.x, 0.18]], 'body', {}, 2),
      rr(f.tail.x + 0.05, -0.95, -0.5, -0.82, 0.05, 'accent'),
      rr(f.tail.x - 0.05, 0.08, f.nose.x + 0.05, 0.28, 0.08, 'white'),
      ...[f.tail.x + 0.2, -0.8, 0.4, 1.0].map((x) => poly([[x - 0.08, 0.27], [x + 0.08, 0.27], [x, 0.4]], 'white')),
      ...[0, 1, 2].map((i) => poly([[-0.2 + i * 0.22, -0.4], [-0.08 + i * 0.22, -0.4], [-0.3 + i * 0.22, 0.08], [-0.42 + i * 0.22, 0.08]], 'white', { flat: true })),
      ...[-1.1, -0.9, -0.7].map((x, i) => seg([x, -0.75 + i * 0.12], [x + 0.35, -0.6 + i * 0.12], 0.05, 'white')),
    ],
  }],
]);

