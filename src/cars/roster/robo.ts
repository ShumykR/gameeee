import { blob, circ, ell, path, poly, rect, rr, seg, spikesAlong, stack, stripe } from '../draw';
import { bike, hover, robot, rocket, tracks } from '../skins';
import type { CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

const visor = (x0: number, x1: number, y: number, mat: 'red' | 'accent' | 'light' = 'red'): CarPoly[] => [rr(x0, y - 0.08, x1, y + 0.08, 0.06, mat), rect(x0 + 0.05, y - 0.04, x1 - 0.05, y - 0.01, 'white', { flat: true })];
const bolts = (xs: number[], y: number): CarPoly[] => xs.map((x) => circ(x, y, 0.04, 'chrome'));
function trackedBase(f: Frame): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - 0.35], [b.x + b.r - 0.3, y - 0.38], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], 'body', {}, 1)];
}

export const ROBO = group('robo', [
  ['tentabot', 'Tentabot', 'Робот зі щупальцем-гарпуном: хапає суперника й тягне.', 'robot', ['#7a3ae0', '#5ef0ff'], {
    parts: ['tentacles'], hideParts: true,
    skin: (f) => [
      ...[0, 1, 2].map((i) => path([[f.tail.x + 0.3, f.roof.y + 0.5 + i * 0.15], [f.tail.x - 0.2, f.roof.y + 0.7 + i * 0.25], [f.tail.x - 0.45, f.roof.y + 0.55 + i * 0.35]], 0.1, 'accent')).flat(),
      ...robot(f, { arms: false }),
      circ(0.05, f.roof.y + 0.36, 0.14, 'accent'), circ(0.08, f.roof.y + 0.36, 0.06, 'white'),
      ...path([[f.roof.x1, f.roof.y + 0.5], [f.roof.x1 + 0.4, f.roof.y + 0.65], [f.roof.x1 + 0.55, f.roof.y + 0.45]], 0.12, 'accent'),
      stripe(-0.5, 0.5, -0.3, 0.06, 'accent'),
    ],
  }],
  ['hexabot', 'Hexabot', 'Шестиногий шагохід на гусеницях-лапах.', 'tracked', ['#a0a8b8', '#e02a2a'], {
    o: o({ wheels: 6 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w, i) => path([[w.x + 0.05, -0.1], [w.x + (i < 3 ? -0.25 : 0.25), -0.35], [w.x, w.y]], 0.09, 'dark')).flat(),
      blob([[-1.6, 0.0], [-1.4, -0.55], [0.8, -0.6], [1.6, -0.25], [1.5, 0.05]], 'body', {}, 2),
      ...bolts([-1.2, -0.7, -0.2, 0.3, 0.8], -0.15),
      blob([[1.1, -0.45], [1.55, -0.45], [1.7, -0.15], [1.2, -0.05]], 'dark', {}, 1), ...visor(1.25, 1.6, -0.28),
      ...path([[-1.2, -0.55], [-1.3, -1.0]], 0.04, 'grey'), circ(-1.3, -1.05, 0.06, 'red'),
    ],
  }],
  ['doom-bot', 'Doom Bot', 'Важкий бойовий андроїд із лазерними очима.', 'robot', ['#3a3a4a', '#e02a2a'], {
    o: o({ tall: 1.1 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...robot(f, { face: 'dark' }),
      poly([[-0.4, f.roof.y + 0.25], [-0.05, f.roof.y + 0.33], [-0.05, f.roof.y + 0.43], [-0.4, f.roof.y + 0.38]], 'red'),
      poly([[0.4, f.roof.y + 0.25], [0.05, f.roof.y + 0.33], [0.05, f.roof.y + 0.43], [0.4, f.roof.y + 0.38]], 'red'),
      ...[-0.3, -0.1, 0.1, 0.3].map((x) => poly([[x - 0.06, -0.55], [x + 0.06, -0.55], [x + 0.1, -0.2], [x - 0.02, -0.2]], 'yellow', { flat: true })),
      ...spikesAlong(-0.55, 0.55, f.roof.y, 4, 0.18, 'spike'),
    ],
  }],
  ['rocket-fist', 'Rocket Fist', 'Ракетний кулак: летить уперед і б\'є з ривка.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster', 'ram'], hideParts: true,
    skin: (f) => [
      ...rocket(f, { nose: 'body', glass: false }),
      blob([[f.nose.x - 0.75, -0.42], [f.nose.x - 0.1, -0.45], [f.nose.x + 0.25, -0.2], [f.nose.x + 0.25, 0.25], [f.nose.x - 0.1, 0.42], [f.nose.x - 0.75, 0.38]], 'body', {}, 1),
      ...[-0.3, -0.1, 0.1, 0.3].map((y) => rr(f.nose.x - 0.25, y - 0.09, f.nose.x + 0.25, y + 0.09, 0.07, 'body', { ring: true })),
      rr(f.nose.x - 0.7, -0.6, f.nose.x - 0.35, -0.3, 0.08, 'body', { ring: true }),
      rr(f.nose.x - 0.95, -0.36, f.nose.x - 0.75, 0.36, 0.04, 'accent'),
    ],
  }],
  ['hovercar', 'Hovercar', 'Антигравітаційний седан без коліс-видимих: просто ширяє.', 'hover', ['#3a8ad8', '#ffffff'], {
    skin: (f) => [...hover(f, { glow: 'sky' }), stripe(f.tail.x, f.nose.x - 0.1, -0.12, 0.06, 'accent')],
  }],
  ['brass-bike', 'Brass Bike', 'Стімпанк-байк із латуні: шестерні, клепки й труба.', 'bike', ['#c8902a', '#5a3a1a'], {
    o: o({ mat: 'gold' }), parts: ['stack'], hideParts: true,
    skin: (f) => [
      ...bike(f, { mat: 'gold' }),
      ...stack(-0.55, -0.15, 0.6, 0.12, 'gold'),
      circ(-0.2, 0.05, 0.2, 'brown'), circ(-0.2, 0.05, 0.08, 'gold'), ...[0, 1, 2, 3, 4, 5].map((i) => circ(-0.2 + Math.cos(i * 1.05) * 0.22, 0.05 + Math.sin(i * 1.05) * 0.22, 0.04, 'brown')),
      circ(0.25, 0.0, 0.12, 'brown'), ...bolts([0.0, 0.2, 0.4], -0.22),
    ],
  }],
  ['laser-tank', 'Laser Tank', 'Футуристичний танк із лазерною гарматою.', 'tracked', ['#2a2a3a', '#5ef0ff'], {
    parts: [['cannon', 1.2]], hideParts: true,
    skin: (f) => [
      ...trackedBase(f),
      blob([[-0.8, -0.32], [-0.6, -0.75], [0.5, -0.75], [0.75, -0.32]], 'body', {}, 1),
      ...path([[0.5, -0.55], [1.7, -0.9]], 0.16, 'grey'), ...[0.8, 1.1, 1.4].map((x) => ell(x, -0.64 - (x - 0.5) * 0.29, 0.06, 0.12, 'accent')),
      circ(1.75, -0.92, 0.09, 'accent'),
      stripe(-1.6, 1.6, -0.15, 0.06, 'accent'), rr(-0.4, -0.65, 0.2, -0.55, 0.04, 'accent'),
    ],
  }],
  ['steel-crab', 'Steel Crab', 'Металевий краб із клешнею і очима на ніжках.', 'blob', ['#c0c8d0', '#e02a2a'], {
    o: o({ shape: 'flat', mat: 'metal' }), parts: ['claw'], noLights: true,
    skin: (f) => [
      ...[-1.0, -0.6, -0.2].map((x) => path([[x, 0.0], [x - 0.15, -0.2], [x - 0.3, 0.42]], 0.07, 'dark')).flat(),
      ell(0, -0.15, f.nose.x, 0.42, 'metal', {}, 28),
      blob([[-1.1, -0.2], [-0.6, -0.5], [0.6, -0.5], [1.1, -0.2], [0.0, -0.3]], 'accent', {}, 1),
      ...bolts([-0.8, -0.4, 0.0, 0.4, 0.8], 0.05),
      ...path([[0.3, -0.5], [0.4, -0.85]], 0.05, 'chrome'), ...path([[0.7, -0.45], [0.8, -0.8]], 0.05, 'chrome'),
      circ(0.4, -0.9, 0.09, 'red'), circ(0.8, -0.85, 0.09, 'red'),
    ],
  }],
  ['sawbot', 'Sawbot', 'Робот-тесля з дисковою пилкою на руці.', 'robot', ['#5a5a6a', '#ffd23f'], {
    parts: ['saw'],
    skin: (f) => [
      ...robot(f),
      ...visor(-0.35, 0.4, f.roof.y + 0.36, 'red'),
      ...[-0.4, -0.15, 0.1, 0.35].map((x) => poly([[x - 0.06, -0.55], [x + 0.06, -0.55], [x + 0.12, -0.2], [x, -0.2]], 'black', { flat: true })),
      rr(-0.45, -0.6, 0.45, -0.18, 0.04, 'accent', { ring: true }),
    ],
  }],
  ['tripod', 'Tripod', 'Триногий крокохід прибульців із тепловим променем.', 'robot', ['#c0c8d0', '#3a8ad8'], {
    o: o({ tall: 1.2 }), parts: ['antenna'], hideParts: true,
    skin: (f) => [
      ...path([[-0.3, -0.2], [-0.75, 0.0], [-0.95, 0.4]], 0.1, 'dark'), ...path([[0.3, -0.2], [0.75, 0.0], [0.95, 0.4]], 0.1, 'dark'), ...path([[0, -0.2], [0, 0.42]], 0.1, 'dark'),
      ell(0, f.roof.y + 0.55, 0.85, 0.5, 'body', {}, 24),
      ell(0, f.roof.y + 0.25, 0.55, 0.3, 'glass', {}, 20),
      circ(0.55, f.roof.y + 0.65, 0.14, 'accent'), circ(0.6, f.roof.y + 0.65, 0.06, 'white'),
      stripe(-0.8, 0.8, f.roof.y + 0.8, 0.06, 'accent'),
      ...path([[-0.5, f.roof.y + 0.85], [-0.8, f.roof.y + 1.1]], 0.06, 'grey'),
    ],
  }],
  ['robo-bike', 'Robo Bike', 'Двоколісний дроїд-мотоцикл з одним оком-сенсором.', 'bike', ['#c0c8d0', '#e02a2a'], {
    noLights: true,
    skin: (f) => [
      blob([[f.wheels[0].x - 0.1, 0.1], [-0.65, -0.35], [0.3, -0.35], [0.8, -0.05], [0.7, 0.2], [-0.2, 0.25]], 'body', {}, 2),
      circ(0.62, -0.08, 0.15, 'black'), circ(0.66, -0.08, 0.08, 'red'),
      stripe(-0.6, 0.4, -0.12, 0.06, 'accent'), poly([[-0.7, -0.25], [-0.5, -0.25], [-0.75, -0.55]], 'accent'),
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.6, 0.0], 0.08, 'dark')),
    ],
  }],
]);
