import { tailgate } from '../art';
import { blob, circ, ell, eyeball, path, poly, rect, rr, seat, seg, starShape, stripe, tank } from '../draw';
import { beast, bike, hover, monsterChassis, pickup, saucer, tracks, truckCab } from '../skins';
import type { CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/** Tracked hull + optional turret. */
function tankHull(f: Frame, mat: 'body' | 'accent' = 'body'): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [
    ...tracks(f),
    blob([[a.x - a.r - 0.2, y + 0.05], [a.x - a.r - 0.15, y - 0.32], [b.x + b.r - 0.4, y - 0.36], [b.x + b.r + 0.25, y - 0.05], [b.x + b.r, y + 0.06]], mat, {}, 1),
  ];
}
/** Satellite dish on a mast. */
const dish = (x: number, y: number): CarPoly[] => [rect(x - 0.04, y - 0.5, x + 0.04, y, 'grey'), blob([[x - 0.45, y - 0.9], [x + 0.2, y - 0.45], [x + 0.08, y - 0.38], [x - 0.5, y - 0.72]], 'white', {}, 1), seg([x - 0.12, y - 0.62], [x + 0.05, y - 0.82], 0.04, 'grey'), circ(x + 0.06, y - 0.84, 0.05, 'red')];
/** Army star in a circle. */
const armyStar = (x: number, y: number, r = 0.14): CarPoly[] => [circ(x, y, r * 1.15, 'white'), starShape(x, y, r, 'body')];

export const ALIEN = group('alien', [
  ['cattle-trailer', 'Cattle Trailer', 'Фургон із викраденою коровою в клітці. Корова може й випасти.', 'truck', ['#8a5a3a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['cage'], cargo: ['cow', 1],
    skin: (f) => [
      ...truckCab(f),
      rr(f.deck.x0, f.deck.y - 0.05, f.deck.x1, f.deck.y + 0.1, 0.03, 'wood'),
      stripe(f.tail.x, f.nose.x, 0.06, 0.06, 'accent'),
    ],
  }],
  ['space-shuttle', 'Space Shuttle', 'Космічний човник: білий корпус, чорне черево, ракета ззаду.', 'rocket', ['#f0f0f0', '#2a2a2a'], {
    o: o({ len: 1.15 }), parts: ['fin', 'booster'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.1, -1.05], [f.tail.x + 0.3, -1.05], [f.tail.x + 0.9, -0.3]], 'body'),
      rr(f.tail.x - 0.25, -0.25, f.tail.x + 0.1, 0.05, 0.05, 'grey'), rr(f.tail.x - 0.25, 0.05, f.tail.x + 0.1, 0.25, 0.04, 'grey'),
      blob([[f.tail.x, -0.3], [f.nose.x - 0.9, -0.36], [f.nose.x - 0.3, -0.22], [f.nose.x + 0.05, 0.05], [f.nose.x - 0.2, 0.3], [f.tail.x, 0.3]], 'body', {}, 1),
      blob([[f.tail.x, 0.12], [f.nose.x - 0.3, 0.14], [f.nose.x + 0.05, 0.05], [f.nose.x - 0.2, 0.3], [f.tail.x, 0.3]], 'black', {}, 1),
      poly([[-1.3, 0.0], [0.4, 0.0], [-0.7, 0.42], [-1.4, 0.42]], 'white'), poly([[-1.3, 0.3], [0.2, 0.3], [-0.7, 0.42], [-1.4, 0.42]], 'black'),
      ...[0, 1, 2].map((i) => rr(f.nose.x - 0.85 + i * 0.16, -0.24, f.nose.x - 0.73 + i * 0.16, -0.1, 0.03, 'glass')),
      rect(-0.5, -0.24, 0.1, -0.12, 'red', { flat: true }), rect(-0.5, -0.24, -0.3, -0.12, 'blue', { flat: true }),
    ],
  }],
  ['flying-saucer', 'Flying Saucer', 'Тарілка прибульців із мигалками. Злітає й ширяє.', 'saucer', ['#a0a8b8', '#7aff7a'], {
    noLights: true,
    skin: (f) => [...saucer(f, { lights: 'accent' }), poly([[-0.35, 0.28], [0.35, 0.28], [0.5, 0.7], [-0.5, 0.7]], 'accent', { flat: true })],
  }],
  ['skater-cow', 'Skater Cow', 'Корова на скейті. Робить олі — і стрибає.', 'creature', ['#f4f4f4', '#2a2a2a'], {
    o: o({ wheel: 0.75 }), parts: ['horns'], noLights: true, hideParts: true,
    skin: (f) => [
      blob([[-1.15, 0.38], [-1.0, 0.46], [1.0, 0.46], [1.15, 0.38], [1.1, 0.33], [-1.1, 0.33]], 'wood', {}, 1),
      ...beast(f, { mat: 'white' }),
      ...[[-0.5, -0.35, 0.24], [0.25, -0.15, 0.2], [-0.05, -0.5, 0.13], [0.6, -0.4, 0.12]].map(([x, y, r]) => ell(x, y, r, r * 0.8, 'black')),
      ...path([[0.75, -0.4], [1.2, -0.75]], 0.3, 'white'),
      blob([[1.0, -0.95], [1.4, -1.05], [1.75, -0.95], [1.78, -0.7], [1.1, -0.68]], 'white', {}, 1),
      ell(1.65, -0.78, 0.17, 0.13, 'pink'), circ(1.6, -0.78, 0.03, 'black'), circ(1.72, -0.78, 0.03, 'black'),
      circ(1.32, -0.92, 0.05, 'black'), poly([[1.1, -1.0], [1.05, -1.25], [1.22, -1.02]], 'cream'), ell(1.2, -0.95, 0.12, 0.05, 'black'),
      ...path([[-1.0, -0.35], [-1.25, -0.2], [-1.3, 0.05]], 0.06, 'white'), circ(-1.3, 0.08, 0.06, 'black'),
      circ(0.0, 0.0, 0.1, 'pink'),
    ],
  }],
  ['gun-truck', 'Gun Truck', 'Пікап із гарматою в кузові.', 'pickup', ['#6a7a4a', '#3a3a3a'], {
    parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...pickup(f),
      circ((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.18, 0.3, 'dark'), ...path([[(f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.25], [(f.deck.x0 + f.deck.x1) / 2 + 1.05, f.deck.y - 0.72]], 0.16, 'grey'),
      ...armyStar(0.3, 0.05, 0.12),
    ],
  }],
  ['army-truck', 'Army Truck', 'Військова вантажівка з ящиками боєприпасів у кузові.', 'truck', ['#5a6a3a', '#3a4a2a'], {
    cargo: ['sandbag', 4],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'body'))],
    skin: (f) => [
      ...truckCab(f, { grille: true }),
      blob([[f.deck.x0 - 0.05, f.deck.y], [f.deck.x0 - 0.05, f.deck.y - 0.95], [f.deck.x0 + 0.2, f.deck.y - 1.1], [f.deck.x1 - 0.1, f.deck.y - 1.1], [f.deck.x1 + 0.05, f.deck.y - 0.95], [f.deck.x1 + 0.05, f.deck.y]], 'accent', {}, 1),
      ...[0.6, 1.2, 1.8, 2.4].map((dx) => rect(f.deck.x0 + dx, f.deck.y - 1.08, f.deck.x0 + dx + 0.05, f.deck.y, 'body', { flat: true })),
      rect(f.deck.x0 - 0.05, f.deck.y - 0.5, f.deck.x0 + 0.3, f.deck.y, 'dark'),
      ...armyStar(f.nose.x - 0.5, -0.38, 0.12),
    ],
  }],
  ['shredder', 'Shredder', 'Броньовик-подрібнювач із дисковою пилкою.', 'tracked', ['#5a5a6a', '#ffd23f'], {
    parts: [['saw', 0.8]], accel: 1.15,
    skin: (f) => [
      ...tankHull(f),
      rr(-0.8, -0.72, 0.4, -0.35, 0.08, 'body'), rect(-0.6, -0.62, 0.2, -0.52, 'black', { flat: true }),
      ...[0, 1, 2, 3, 4, 5].map((i) => poly([[-1.6 + i * 0.5, -0.12], [-1.4 + i * 0.5, -0.12], [-1.55 + i * 0.5, 0.0], [-1.75 + i * 0.5, 0.0]], 'yellow', { flat: true })),
    ],
  }],
  ['monster-cannon', 'Monster Cannon', 'Самохідна гармата на колесах монстр-трака.', 'monster', ['#4a5a3a', '#ffd23f'], {
    parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...monsterChassis(f),
      rr(f.tail.x, -0.55, f.nose.x, 0.08, 0.12, 'body'),
      circ(f.deck.x0 + 0.3, -0.75, 0.38, 'body'), ...path([[f.deck.x0 + 0.3, -0.8], [f.deck.x0 + 1.6, -1.45]], 0.22, 'grey'), ...path([[f.deck.x0 + 1.5, -1.4], [f.deck.x0 + 1.65, -1.48]], 0.3, 'dark'),
      ...armyStar(0.45, -0.25, 0.14),
      rr(f.nose.x - 0.25, -0.5, f.nose.x + 0.08, 0.05, 0.04, 'grey'),
    ],
  }],
  ['army-bike', 'Army Bike', 'Армійський мотоцикл із кулеметом на кермі.', 'trike', ['#5a6a3a', '#2a2a2a'], {
    parts: ['gun'], hideParts: true,
    skin: (f) => [
      blob([[-1.35, 0.2], [-1.35, -0.25], [-0.6, -0.3], [-0.5, 0.2]], 'body', {}, 1), // sidecar
      ...bike(f, { style: 'road' }),
      ...armyStar(0.2, -0.15, 0.09),
      ...path([[0.5, -0.5], [1.1, -0.55]], 0.08, 'dark'), rr(0.45, -0.6, 0.65, -0.42, 0.03, 'dark'),
    ],
  }],
  ['gunboat', 'Gunboat', 'Броньований річковий катер із гарматою на носі.', 'boat', ['#5a6a7a', '#ffd23f'], {
    parts: [['cannon', 0.7]], hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, -0.45], [f.nose.x + 0.05, -0.55], [f.nose.x - 0.4, 0.0], [f.nose.x - 0.7, 0.12], [f.tail.x + 0.2, 0.12]], 'body', {}, 1),
      stripe(f.tail.x, f.nose.x - 0.1, -0.3, 0.07, 'accent'),
      rr(-0.3, -0.95, 0.75, -0.45, 0.06, 'grey'), rect(0.35, -0.85, 0.65, -0.65, 'glass'), seg([0.1, -0.95], [0.1, -1.4], 0.05, 'dark'),
      ...[-1.0, -0.5, 0.0].map((x) => circ(x, -0.15, 0.06, 'black')),
      circ(f.deck.x0 + 0.2, -0.6, 0.2, 'dark'), ...path([[f.deck.x0 + 0.2, -0.65], [f.deck.x0 + 0.9, -0.95]], 0.12, 'grey'),
    ],
  }],
  ['rocket-launcher', 'Rocket Launcher', 'Система залпового вогню: ракети вибухають і відкидають суперника.', 'truck', ['#5a6a3a', '#e02a2a'], {
    parts: ['launcher'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        rr(d.x0 + 0.1, d.y - 0.3, d.x0 + 0.9, d.y + 0.05, 0.04, 'dark'),
        poly([[d.x0 + 0.1, d.y - 0.25], [d.x1 - 0.1, d.y - 0.95], [d.x1, d.y - 0.75], [d.x0 + 0.2, d.y - 0.05]], 'body'),
        ...[0, 1, 2].map((i) => seg([d.x0 + 0.3 + i * 0.05, d.y - 0.32 - i * 0.12], [d.x1 + 0.1, d.y - 1.0 - i * 0.12], 0.1, 'red')),
        ...armyStar(f.nose.x - 0.5, -0.4, 0.12),
      ];
    },
  }],
  ['tank', 'Tank', 'Бойовий танк: башта, довгий ствол і п\'ять котків.', 'tracked', ['#5a6a3a', '#3a4a2a'], {
    o: o({ wheels: 5 }), parts: ['cannon'], hideParts: true,
    skin: (f) => [
      ...tankHull(f),
      blob([[-0.9, -0.32], [-0.8, -0.75], [0.35, -0.78], [0.7, -0.35]], 'body', {}, 1),
      ...path([[0.5, -0.58], [1.85, -0.75]], 0.13, 'grey'), rr(1.7, -0.84, 1.95, -0.66, 0.04, 'dark'),
      ...armyStar(-0.25, -0.5, 0.12),
      seg([-0.6, -0.78], [-0.75, -1.2], 0.04, 'dark'),
    ],
  }],
  ['space-bike', 'Space Bike', 'Світловий мотоцикл зі смугами неону.', 'bike', ['#1a1a2a', '#5ef0ff'], {
    o: o({ rim: 'disc' }), speed: 1.15,
    skin: (f) => [
      blob([[f.wheels[0].x - 0.3, 0.1], [-0.6, -0.3], [0.4, -0.35], [f.wheels[1].x + 0.35, 0.0], [f.wheels[1].x, 0.15], [-0.2, 0.25]], 'body', {}, 2),
      stripe(-0.9, 0.9, -0.05, 0.06, 'accent'), stripe(-0.6, 0.6, 0.12, 0.04, 'accent'),
      blob([[0.35, -0.3], [0.7, -0.5], [0.85, -0.25]], 'glass', {}, 1),
      rr(-0.55, -0.42, 0.0, -0.3, 0.05, 'black'),
    ],
  }],
  ['alien-drone', 'Alien Attack Drone', 'Бойовий дрон прибульців із червоним оком-лазером.', 'saucer', ['#3a3a4a', '#ff3a3a'], {
    s: 0.85, parts: ['antenna'], noLights: true, hideParts: true,
    skin: (f) => [
      ...saucer(f, { dome: 'dark', lights: 'red' }),
      circ(f.nose.x - 0.25, -0.05, 0.2, 'red'), circ(f.nose.x - 0.22, -0.05, 0.1, 'light'),
      ...path([[-0.6, -0.75], [-0.8, -1.25]], 0.05, 'grey'), circ(-0.8, -1.3, 0.08, 'red'),
      ...path([[f.tail.x + 0.3, 0.2], [f.tail.x + 0.1, 0.5]], 0.07, 'grey'), ...path([[f.nose.x - 0.3, 0.2], [f.nose.x - 0.1, 0.5]], 0.07, 'grey'),
    ],
  }],
  ['celestial-teapot', 'Celestial Teapot', 'Космічний чайник на реактивній тязі. Хлюпає окропом.', 'blob', ['#f0f0f0', '#4a8ad8'], {
    parts: ['booster', 'lid'], noLights: true, hideParts: true,
    skin: () => [
      ...path([[0.65, -0.4], [1.0, -0.5], [1.35, -1.05]], 0.18, 'body'),
      blob([[-1.25, -0.9], [-1.4, -0.5], [-1.25, -0.15], [-0.85, -0.2], [-0.85, -0.3], [-1.15, -0.32], [-1.22, -0.5], [-1.15, -0.75], [-0.85, -0.75], [-0.85, -0.88]], 'accent', {}, 1),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      rr(-0.55, -1.12, 0.55, -1.0, 0.04, 'accent'), ell(0, -1.12, 0.4, 0.12, 'body'), circ(0, -1.28, 0.08, 'accent'),
      ...[-0.45, 0.0, 0.45].map((x) => circ(x, -0.35, 0.12, 'accent')), stripe(-0.85, 0.85, 0.05, 0.06, 'accent'),
      rr(-0.7, 0.2, 0.7, 0.36, 0.05, 'grey'), poly([[-0.5, 0.36], [0.5, 0.36], [0.3, 0.55], [-0.3, 0.55]], 'orange'),
    ],
  }],
  ['moon-rover', 'Moon Rover', 'Місяцехід з антеною-тарілкою. Стрибає, як у невагомості.', 'buggy', ['#e0e0e0', '#ffd23f'], {
    o: o({ wheel: 1.1 }), parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.6, -0.05], 0.08, 'grey')),
      rr(f.tail.x, -0.25, f.nose.x - 0.1, 0.05, 0.05, 'gold'),
      rr(f.tail.x + 0.1, -0.12, f.nose.x - 0.2, 0.0, 0.03, 'body', { flat: true }),
      ...seat(f.head.x + 0.05, -0.25, 0.4, 'white'),
      ...dish(f.tail.x + 0.35, -0.25),
      rr(0.4, -0.55, 0.7, -0.25, 0.04, 'grey'), circ(0.55, -0.4, 0.06, 'red'),
      ...path([[0.9, -0.25], [1.0, -0.6]], 0.05, 'grey'),
    ],
  }],
  ['alien-spaceship', 'Alien Spaceship', 'Винищувач прибульців із реактивними дюзами і лазером.', 'hover', ['#3a8a3a', '#7aff7a'], {
    parts: ['fin', 'jets'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.2, -0.3], [f.tail.x - 0.2, -0.95], [f.tail.x + 0.2, -0.95], [f.tail.x + 0.9, -0.3]], 'accent'),
      rr(f.tail.x - 0.35, -0.25, f.tail.x + 0.05, -0.05, 0.05, 'grey'), rr(f.tail.x - 0.35, 0.0, f.tail.x + 0.05, 0.18, 0.05, 'grey'),
      ...hover(f, { glow: 'accent' }),
      ...eyeball(0.0, -0.48, 0.12, 'leaf'), ...eyeball(-0.3, -0.5, 0.1, 'leaf'),
      poly([[-0.4, 0.05], [0.8, 0.05], [-0.6, 0.45]], 'body'),
    ],
  }],
  ['planet-explorer', 'Planet Explorer', 'Шестиколісний планетохід із тарілкою зв\'язку.', 'tracked', ['#e0e0e0', '#ff8a1a'], {
    o: o({ wheels: 6 }), parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.9, -0.1], 0.08, 'grey')),
      rr(-1.6, -0.45, 1.65, -0.05, 0.08, 'body'), stripe(-1.6, 1.65, -0.2, 0.08, 'accent'),
      rr(-0.8, -0.85, 0.5, -0.45, 0.1, 'gold'), rect(-0.6, -0.75, 0.3, -0.6, 'black', { flat: true }),
      ...dish(0.9, -0.45),
      ...[1.3, 1.5].map((x) => circ(x, -0.3, 0.06, 'light')),
    ],
  }],
  ['space-interceptor', 'Space Interceptor', 'Перехоплювач із самонавідними ракетами.', 'hover', ['#e0e0e0', '#3a6ad8'], {
    parts: ['wing', 'booster'], speed: 1.05, hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.15, -0.8], [f.tail.x + 0.25, -0.8], [f.tail.x + 0.8, -0.3]], 'accent'),
      rr(f.tail.x - 0.4, -0.2, f.tail.x + 0.05, 0.1, 0.05, 'grey'),
      ...hover(f, { glow: 'sky' }),
      poly([[-0.8, 0.0], [0.6, 0.0], [-0.4, 0.42], [-0.9, 0.42]], 'accent'),
      ...[[-0.6, 0.38], [-0.2, 0.38]].map(([x, y]) => tank(x - 0.3, x + 0.2, y, 0.06, 'red')),
      starShape(0.8, -0.12, 0.1, 'accent'),
    ],
  }],
]);

