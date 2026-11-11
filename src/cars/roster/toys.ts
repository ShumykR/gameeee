import { blob, checkers, circ, ell, eyeball, fangs, flameDecal, grille, lightbar, ladder, path, poly, rect, rr, seat, seg, spikesAlong, starShape, stripe, tank } from '../draw';
import { beast, boxy, dinoHead, fenders, formula, hover, monsterChassis, pickup, rocket, sedan, tracks } from '../skins';
import type { CarMat, CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

// Toy-track racers: original designs inspired by die-cast toy-car concepts.

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

/** Low wedge sports body used by most toy racers. */
function wedge(f: Frame, mat: CarMat = 'body', canopy: CarMat = 'glass'): CarPoly[] {
  const x0 = f.tail.x, x1 = f.nose.x;
  return [
    blob([[x0, 0.24], [x0 - 0.04, -0.14], [x0 + 0.5, -0.2], [-0.55, -0.24], [0.6, -0.24], [x1 - 0.2, -0.04], [x1 + 0.02, 0.1], [x1 - 0.1, 0.26]], mat, {}, 1),
    blob([[-0.55, -0.22], [-0.3, -0.48], [0.05, -0.5], [0.5, -0.22]], canopy, {}, 1),
    ...fenders(f, mat, 0.09),
  ];
}
const skull = (x: number, y: number, r: number): CarPoly[] => [
  circ(x, y, r, 'bone'), rr(x - r * 0.55, y + r * 0.45, x + r * 0.55, y + r * 1.1, r * 0.2, 'bone'),
  circ(x - r * 0.38, y, r * 0.28, 'black'), circ(x + r * 0.38, y, r * 0.28, 'black'),
  poly([[x - r * 0.1, y + r * 0.5], [x + r * 0.1, y + r * 0.5], [x, y + r * 0.25]], 'black'),
  ...[-0.3, 0, 0.3].map((d) => rect(x + d * r - r * 0.05, y + r * 0.75, x + d * r + r * 0.05, y + r * 1.1, 'black', { flat: true })),
];
const angry = (x: number, y: number, r: number, iris: CarMat = 'red'): CarPoly[] => [poly([[x - r, y - r * 0.5], [x + r, y], [x + r * 0.8, y + r * 0.8], [x - r * 0.8, y + r * 0.8]], 'white'), circ(x + r * 0.25, y + r * 0.35, r * 0.38, iris)];

export const TOYS = group('toys', [
  ['rattle-bones', 'Rattle Bones', 'Хот-род із решіткою-черепом і хромованими трубами.', 'sports', ['#1a1a1a', '#e8dcc0'], {
    parts: ['exhaust'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      ...skull(f.nose.x - 0.35, -0.12, 0.2),
      ...[0, 1, 2].map((i) => path([[0.2 + i * 0.15, -0.24], [0.1 + i * 0.15, -0.55]], 0.08, 'chrome')).flat(),
      ...path([[-0.5, 0.22], [f.tail.x - 0.2, 0.2]], 0.1, 'chrome'),
      stripe(-1.4, 0.6, 0.03, 0.06, 'bone'),
    ],
  }],
  ['fang-racer', 'Fang Racer', 'Звіроподібний болід із зубастою пащею на носі.', 'sports', ['#2a6ae0', '#ffffff'], {
    parts: ['fangs'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      ...angry(f.nose.x - 0.5, -0.12, 0.1),
      poly([[f.nose.x - 0.6, 0.06], [f.nose.x + 0.05, 0.05], [f.nose.x, 0.22], [f.nose.x - 0.6, 0.22]], 'black'),
      ...fangs(f.nose.x - 0.58, f.nose.x, 0.06, 4, 0.1), ...fangs(f.nose.x - 0.55, f.nose.x - 0.05, 0.22, 4, 0.08, true),
      ...[0, 1, 2, 3].map((i) => poly([[-1.4 + i * 0.45, -0.12], [-1.2 + i * 0.45, -0.12], [-1.35 + i * 0.45, 0.2], [-1.55 + i * 0.45, 0.2]], 'accent', { flat: true })),
    ],
  }],
  ['turbo-bones', 'Turbo Bones', 'Кістяний турбо-болід із закисом азоту.', 'formula', ['#e8dcc0', '#e02a2a'], {
    o: o({ mat: 'bone' }), parts: ['exhaust'], hideParts: true,
    skin: (f) => [
      ...formula(f, { mat: 'bone', wing: 'accent' }),
      ...[-1.0, -0.6, -0.2, 0.2, 0.6].map((x) => rect(x, -0.04, x + 0.06, 0.16, 'dark', { flat: true })),
      ...skull(f.nose.x - 0.15, 0.0, 0.12),
      ...[0, 1].map((i) => path([[-0.9 + i * 0.2, -0.2], [-1.0 + i * 0.2, -0.6]], 0.08, 'chrome')).flat(),
    ],
  }],
  ['star-coupe', 'Star Coupe', 'Космічний концепт-кар із зоряним бластером.', 'hover', ['#c0c8d0', '#3a6ad8'], {
    parts: ['fin'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.15, -0.8], [f.tail.x + 0.25, -0.8], [f.tail.x + 0.8, -0.3]], 'accent'),
      ...hover(f, { glow: 'yellow' }),
      starShape(-0.6, -0.12, 0.14, 'gold'), stripe(f.tail.x, f.nose.x - 0.2, 0.0, 0.05, 'accent'),
      ...path([[0.6, -0.3], [1.3, -0.45]], 0.08, 'grey'), circ(1.32, -0.45, 0.06, 'yellow'),
    ],
  }],
  ['dark-phantom', 'Dark Phantom', 'Бойова машина темного лорда: розчиняється в тіні.', 'sports', ['#7a3ae0', '#e8dcc0'], {
    parts: ['skull', 'roofspikes'],
    skin: (f) => [...wedge(f, 'body', 'dark'), ...flameDecal(0.9, -0.9, 0.05, 0.2), ...spikesAlong(-1.3, -0.6, -0.18, 3, 0.2, 'bone')],
  }],
  ['rex-dragster', 'Rex Dragster', 'Гібрид тиранозавра й дрегстера: ракета ззаду, паща спереду.', 'dragster', ['#3a8a3a', '#e0e0c0'], {
    parts: ['teeth', 'booster'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.18], [f.nose.x - 0.5, -0.15], [f.nose.x, 0.0], [f.nose.x, 0.18], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...seat(-0.95, -0.15, 0.45),
      ...spikesAlong(-0.5, 1.2, -0.18, 7, 0.14, 'accent'),
      ...angry(f.nose.x - 0.55, -0.02, 0.1, 'yellow'),
      rect(f.nose.x - 0.5, 0.08, f.nose.x, 0.12, 'black'), ...fangs(f.nose.x - 0.5, f.nose.x, 0.08, 4, 0.08),
    ],
  }],
  ['horned-pickup', 'Horned Pickup', 'Пікап із головою трицератопса.', 'pickup', ['#e08a1a', '#e0d0a0'], {
    parts: ['horns'], hideParts: true,
    art: (f) => [hidden(poly([[f.nose.x - 0.05, -0.05], [f.nose.x - 0.05, 0.2], [f.nose.x + 1.1, -0.3]], 'accent', { deco: false, density: 0.3 }))],
    skin: (f) => [
      ...pickup(f),
      blob([[f.nose.x - 0.25, -0.26], [f.nose.x + 0.0, -0.75], [f.nose.x + 0.25, -0.65], [f.nose.x + 0.05, -0.2]], 'accent', {}, 1),
      poly([[f.nose.x - 0.05, -0.05], [f.nose.x - 0.05, 0.2], [f.nose.x + 1.1, -0.3]], 'bone'),
      poly([[f.roof.x1 - 0.3, f.roof.y], [f.roof.x1 - 0.02, f.roof.y + 0.05], [f.roof.x1 + 0.7, f.roof.y - 0.75]], 'bone'),
      ...eyeball(f.nose.x - 0.45, -0.1, 0.08),
    ],
  }],
  ['dino-trike', 'Dino Trike', 'Трицикл-динозавр із зубатою мордою.', 'trike', ['#4a8a3a', '#ffd23f'], {
    parts: ['teeth'], noLights: true, hideParts: true,
    skin: (f) => [
      blob([[-1.3, 0.15], [-1.25, -0.2], [-0.2, -0.3], [0.5, -0.4], [0.95, -0.25], [0.95, 0.0], [0.4, 0.05], [-0.2, 0.2]], 'body', {}, 1),
      ...[-0.9, -0.6, -0.3].map((x) => poly([[x - 0.12, -0.24], [x + 0.12, -0.26], [x, -0.5]], 'accent')),
      ...eyeball(0.6, -0.25, 0.08, 'yellow'),
      rect(0.5, -0.06, 0.95, -0.02, 'black'), ...fangs(0.5, 0.95, -0.06, 4, 0.08),
      ...path([[-1.3, -0.1], [-1.7, -0.3]], 0.12, 'body'),
      ...path([[f.wheels[f.wheels.length - 1].x, 0.32], [0.65, -0.35]], 0.07, 'chrome'),
    ],
  }],
  ['stinger-buggy', 'Stinger Buggy', 'Стелс-багі з ракетним двигуном.', 'buggy', ['#2a2a2a', '#e02a2a'], {
    parts: ['booster'], wheelie: 0.7, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, 0.2], [f.tail.x + 0.05, -0.1], [0.0, -0.2], [f.nose.x - 0.1, -0.08], [f.nose.x + 0.08, 0.12], [f.nose.x - 0.1, 0.24]], 'body', {}, 1),
      ...path([[f.tail.x + 0.3, -0.1], [f.tail.x + 0.1, -0.7], [f.tail.x - 0.15, -1.0], [f.tail.x - 0.05, -1.15]], 0.12, 'accent'),
      poly([[f.tail.x - 0.1, -1.1], [f.tail.x + 0.15, -1.2], [f.tail.x + 0.25, -0.95]], 'spike'),
      rr(f.tail.x - 0.35, -0.05, f.tail.x + 0.05, 0.15, 0.04, 'grey'),
      ...path([[-0.8, -0.1], [-0.6, -0.9], [0.2, -0.9]], 0.08, 'accent'), seg([0.62, -0.12], [0.48, -0.42], 0.08, 'accent'),
      ...seat(f.head.x + 0.05, -0.12, 0.4),
    ],
  }],
  ['swamp-monster', 'Swamp Monster', 'Монстр-трак із боліт, обвішаний твані й водоростями.', 'monster', ['#4a6a2a', '#a0c040'], {
    o: o({ open: true }),
    parts: ['teeth'],
    skin: (f) => [
      ...monsterChassis(f, 'brown'),
      blob([[f.tail.x, 0.08], [f.tail.x + 0.05, -0.6], [-0.4, -1.0], [0.5, -1.0], [f.nose.x, -0.55], [f.nose.x + 0.05, 0.08]], 'body', {}, 2),
      ...[-1.3, -0.8, -0.2, 0.5, 1.1].map((x, i) => poly([[x, 0.0], [x + 0.2, 0.0], [x + 0.13, 0.3 + (i % 2) * 0.12], [x + 0.05, 0.18]], 'leaf')),
      ...[-0.9, -0.3, 0.2].map((x, i) => path([[x, -0.9 + i * 0.05], [x + 0.1, -0.6], [x - 0.05, -0.35]], 0.06, 'accent')).flat(),
      ...angry(f.nose.x - 0.45, -0.4, 0.13, 'yellow'),
    ],
  }],
  ['jet-golf-cart', 'Jet Golf Cart', 'Гольф-кар із реактивним двигуном і драйвером.', 'buggy', ['#f0f0f0', '#3aa04a'], {
    s: 0.85, parts: ['booster'], wheelie: 0.7, hideParts: true,
    skin: (f) => [
      tank(f.tail.x - 0.45, f.tail.x + 0.2, -0.15, 0.17, 'chrome'), rr(f.tail.x - 0.55, -0.24, f.tail.x - 0.4, -0.06, 0.03, 'red'),
      blob([[f.tail.x, 0.22], [f.tail.x, -0.15], [-0.3, -0.12], [0.6, -0.1], [f.nose.x, 0.0], [f.nose.x, 0.22]], 'body', {}, 1),
      ...seat(f.head.x + 0.05, -0.12, 0.42, 'accent'),
      seg([-0.85, -0.12], [-0.75, f.roof.y], 0.07, 'chrome'), seg([0.53, -0.1], [0.41, -0.36], 0.07, 'chrome'),
      rr(f.roof.x0 - 0.15, f.roof.y - 0.12, f.roof.x1 + 0.15, f.roof.y + 0.02, 0.05, 'accent'),
      ...checkers(-1.2, -0.03, 1.2, 0.07, 12, 2, 'white', 'leaf'),
      ...fenders(f, 'body', 0.08),
    ],
  }],
  ['bumper-concept', 'Bumper Concept', 'Концепт-бампер: гумове коло й удар з розгону.', 'blob', ['#ffd020', '#2a6ae0'], {
    o: o({ shape: 'flat' }), parts: ['ram'], bounce: 0.45, noLights: true, hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.05, -0.25, f.nose.x + 0.25, 0.08, 0.16, 'rubber'),
      blob([[f.tail.x + 0.1, -0.2], [f.tail.x + 0.1, -0.5], [-0.3, -0.58], [0.6, -0.45], [f.nose.x - 0.05, -0.2]], 'body', {}, 2),
      ell(0, -0.42, 0.32, 0.12, 'accent'), starShape(0.75, -0.35, 0.1, 'white'),
    ],
  }],
  ['throne-racer', 'Throne Racer', 'Гоночний унітаз. Так, справді.', 'cart', ['#f4f4f4', '#5ab0e0'], {
    o: o({ mat: 'white' }), noLights: true,
    skin: (f) => [
      rr(f.tail.x + 0.05, f.deck.y - 0.9, f.tail.x + 0.55, f.deck.y + 0.05, 0.06, 'white'), rr(f.tail.x, f.deck.y - 1.0, f.tail.x + 0.6, f.deck.y - 0.88, 0.04, 'accent'),
      rect(f.tail.x + 0.4, f.deck.y - 0.75, f.tail.x + 0.5, f.deck.y - 0.68, 'chrome'),
      blob([[f.tail.x + 0.3, f.deck.y + 0.08], [f.nose.x, f.deck.y], [f.nose.x - 0.1, f.deck.y + 0.25], [0.3, 0.12], [-0.2, 0.12]], 'white', {}, 2),
      ell(0.15, f.deck.y - 0.02, 0.72, 0.1, 'accent'), ell(0.15, f.deck.y - 0.02, 0.52, 0.06, 'glass'),
      rr(-0.25, 0.08, 0.35, 0.2, 0.04, 'white'),
    ],
  }],
  ['wheelie-king', 'Wheelie King', 'Трюковий дрегстер, що весь час стає на диби.', 'dragster', ['#e02a8a', '#ffd23f'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.16], [f.nose.x - 0.3, 0.02], [f.nose.x, 0.08], [f.nose.x, 0.16], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...seat(-0.95, -0.15, 0.45, 'accent'),
      starShape(0.6, 0.05, 0.15, 'accent'),
      ...[-1.2, -0.8].map((x) => poly([[x - 0.15, -0.15], [x + 0.15, -0.15], [x, -0.42]], 'gold')),
      ...path([[f.tail.x + 0.2, 0.2], [f.tail.x - 0.5, 0.35]], 0.05, 'chrome'), circ(f.tail.x - 0.55, 0.36, 0.08, 'rubber'),
    ],
  }],
  ['bubble-blaster', 'Bubble Blaster', 'Фургон-бульбашкомет. Бульбашка піднімає суперника в повітря.', 'van', ['#5ab0ff', '#ffffff'], {
    s: 0.9, parts: ['bubble'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { round: 0.2, slope: 0.3, slopeH: 0.45 }),
      circ(f.nose.x - 0.1, -0.3, 0.22, 'accent'), circ(f.nose.x - 0.1, -0.3, 0.13, 'glass'),
      ...[[-1.0, -0.25, 0.14], [-0.45, -0.1, 0.1], [0.15, -0.3, 0.12], [-0.7, f.roof.y - 0.25, 0.18], [-0.25, f.roof.y - 0.45, 0.13], [0.2, f.roof.y - 0.2, 0.1]].map(([x, y, r]) => circ(x, y, r, 'glass')),
      tank(f.tail.x + 0.1, f.tail.x + 0.9, f.roof.y - 0.1, 0.1, 'pink'),
    ],
  }],
  ['chomp-shark', 'Chomp Shark', 'Авто з клацаючою пащею акули.', 'sports', ['#6a8ab0', '#ffffff'], {
    parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => [
      poly([[-0.6, -0.25], [-0.25, -0.95], [0.05, -0.9], [0.3, -0.25]], 'body'),
      poly([[f.tail.x + 0.2, -0.05], [f.tail.x - 0.35, -0.55], [f.tail.x - 0.25, 0.0], [f.tail.x - 0.35, 0.35], [f.tail.x + 0.2, 0.15]], 'body'),
      blob([[f.tail.x, 0.24], [f.tail.x, -0.12], [-0.6, -0.28], [0.6, -0.28], [f.nose.x + 0.05, -0.05], [f.nose.x, 0.2], [f.nose.x - 0.2, 0.26]], 'body', {}, 1),
      blob([[f.tail.x + 0.05, 0.1], [f.nose.x, 0.08], [f.nose.x - 0.1, 0.26], [f.tail.x + 0.05, 0.26]], 'white', {}, 1),
      poly([[f.nose.x - 0.8, 0.0], [f.nose.x + 0.02, -0.08], [f.nose.x - 0.05, 0.2], [f.nose.x - 0.8, 0.2]], 'black'),
      ...fangs(f.nose.x - 0.78, f.nose.x - 0.02, -0.02, 6, 0.1), ...fangs(f.nose.x - 0.75, f.nose.x - 0.1, 0.2, 5, 0.08, true),
      ...eyeball(f.nose.x - 0.65, -0.14, 0.07),
      ...[0.1, 0.25, 0.4].map((x) => rect(x, -0.12, x + 0.04, 0.02, 'dark', { flat: true })),
    ],
  }],
  ['rocket-board', 'Rocket Board', 'Скейт-ракета: дошка, двигун і ніякого здорового глузду.', 'rocket', ['#ff8a1a', '#2a2a2a'], {
    s: 0.9, parts: ['booster'], hideParts: true,
    skin: (f) => [
      blob([[f.tail.x - 0.1, 0.28], [f.tail.x, 0.36], [f.nose.x - 0.1, 0.36], [f.nose.x + 0.1, 0.22], [f.nose.x - 0.05, 0.28]], 'wood', {}, 1),
      ...rocket(f, { glass: false, nose: 'accent' }),
      ...flameDecal(1.2, 0.0, 0.0, 0.24),
    ],
  }],
  ['woodie-surfer', 'Woodie Surfer', 'Дерев\'яний універсал серфера з дошкою на даху.', 'sedan', ['#c08a4a', '#ffffff'], {
    o: o({ mat: 'wood' }),
    skin: (f) => [
      ...sedan(f, { roof: 'wagon', mat: 'wood' }),
      blob([[f.nose.x - 0.5, -0.18], [f.nose.x - 0.25, -0.16], [f.nose.x, -0.05], [f.nose.x, 0.3], [f.nose.x - 0.5, 0.3]], 'white', {}, 1),
      ...grille(f.nose.x - 0.06, -0.08, f.nose.x + 0.04, 0.16, 2),
      blob([[f.roof.x0 - 0.6, f.roof.y - 0.08], [f.roof.x0 - 0.3, f.roof.y - 0.2], [f.roof.x1 + 0.4, f.roof.y - 0.22], [f.roof.x1 + 0.9, f.roof.y - 0.12], [f.roof.x1 + 0.4, f.roof.y - 0.04]], 'accent', {}, 1),
      stripe(f.roof.x0 - 0.3, f.roof.x1 + 0.6, f.roof.y - 0.13, 0.04, 'red'),
    ],
  }],
  ['piranha-racer', 'Piranha Racer', 'Хижа риба-болід із гострим плавником.', 'sports', ['#e04a2a', '#ffd23f'], {
    parts: ['teeth', 'fin'], noLights: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.05], [f.tail.x - 0.4, -0.45], [f.tail.x - 0.3, 0.05], [f.tail.x - 0.4, 0.3]], 'accent'),
      ...wedge(f, 'body', 'dark'),
      ...angry(f.nose.x - 0.45, -0.1, 0.1, 'black'),
      ...[0, 1, 2, 3].map((i) => poly([[-1.2 + i * 0.4, -0.1], [-1.05 + i * 0.4, -0.1], [-1.15 + i * 0.4, 0.2], [-1.3 + i * 0.4, 0.2]], 'accent', { flat: true })),
    ],
  }],
  ['soda-popper', 'Soda Popper', 'Пляшка газованки на колесах. Стріляє корком.', 'rocket', ['#3a8a3a', '#e02a2a'], {
    gun: (f) => ({ at: [[f.nose.x + 0.05, 0]], aim: 4 }),
    o: o({ mat: 'glass' }),
    skin: (f) => [
      blob([[f.tail.x, -0.32], [0.4, -0.32], [0.9, -0.15], [f.nose.x - 0.25, -0.12], [f.nose.x - 0.25, 0.12], [0.9, 0.15], [0.4, 0.32], [f.tail.x, 0.32]], 'green', {}, 1),
      rr(f.nose.x - 0.3, -0.16, f.nose.x + 0.05, 0.16, 0.04, 'tan'),
      rr(-1.2, -0.27, 0.35, 0.27, 0.04, 'accent'), rr(-0.9, -0.14, 0.05, 0.1, 0.04, 'white'), rect(-0.75, -0.06, -0.1, 0.02, 'red', { flat: true }),
      ...[[-1.4, -0.1], [-1.25, 0.15], [0.6, -0.05], [0.75, 0.08]].map(([x, y]) => circ(x, y, 0.05, 'white')),
      rect(f.tail.x, -0.32, f.tail.x + 0.12, 0.32, 'dark'),
    ],
  }],
  ['aero-fire-engine', 'Aero Fire Engine', 'Обтічна пожежна машина-концепт.', 'sports', ['#e02a2a', '#f0f0f0'], {
    o: o({ len: 1.15 }), parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...wedge(f),
      stripe(f.tail.x, f.nose.x - 0.1, 0.02, 0.06, 'white'),
      ...ladder([f.tail.x - 0.1, -0.32], [0.4, -0.36], 0.14, 'chrome'),
      ...lightbar(-0.35, 0.1, -0.48),
      circ(f.nose.x - 0.35, -0.08, 0.08, 'gold'),
    ],
  }],
  ['aero-bus', 'Aero Bus', 'Обтічний концептуальний автобус.', 'bus', ['#e0e0e0', '#3a6ad8'], {
    o: o({ tall: 0.8 }), speed: 1.1,
    skin: (f) => [
      blob([[f.tail.x, 0.3], [f.tail.x, f.roof.y + 0.2], [f.tail.x + 0.3, f.roof.y], [f.nose.x - 1.0, f.roof.y], [f.nose.x - 0.1, f.roof.y + 0.45], [f.nose.x, 0.3]], 'body', {}, 2),
      blob([[f.tail.x + 0.25, f.roof.y + 0.15], [f.nose.x - 1.0, f.roof.y + 0.12], [f.nose.x - 0.2, f.roof.y + 0.45], [f.nose.x - 0.25, f.roof.y + 0.5], [f.tail.x + 0.25, f.roof.y + 0.42]], 'glass', {}, 1),
      ...[-1.3, -0.7, -0.1, 0.5].map((x) => rect(x, f.roof.y + 0.12, x + 0.05, f.roof.y + 0.48, 'body', { flat: true })),
      poly([[f.tail.x, -0.05], [f.nose.x, -0.25], [f.nose.x, -0.12], [f.tail.x, 0.08]], 'accent', { flat: true }),
      ...fenders(f, 'body', 0.1),
    ],
  }],
  ['school-racer', 'School Racer', 'Шкільний автобус із ракетним двигуном.', 'bus', ['#ffc020', '#1a1a1a'], {
    parts: ['booster'], speed: 1.1, hideParts: true,
    skin: (f) => [
      tank(f.tail.x - 0.5, f.tail.x + 0.3, -0.3, 0.22, 'chrome'), rr(f.tail.x - 0.6, -0.42, f.tail.x - 0.45, -0.18, 0.03, 'red'),
      ...boxy(f, { slope: 0.15, slopeH: 0.5, round: 0.1, win: 5, winX: [f.tail.x + 0.15, f.nose.x - 0.4], winY: [f.roof.y + 0.12, f.roof.y + 0.45] }),
      stripe(f.tail.x, f.nose.x, -0.05, 0.07, 'accent'), stripe(f.tail.x, f.nose.x, 0.12, 0.07, 'accent'),
      ...flameDecal(f.nose.x - 0.2, f.nose.x - 1.6, 0.03, 0.2),
    ],
  }],
  ['hot-dog-racer', 'Hot Dog Racer', 'Хот-дог на гоночному шасі: булка, сосиска, гірчиця.', 'blob', ['#c86a3a', '#ffd020'], {
    o: o({ shape: 'flat', len: 1.2 }), noLights: true,
    skin: () => [
      rr(-1.6, -0.55, 1.6, -0.15, 0.2, 'red'),
      ...path([[-1.2, -0.48], [-0.9, -0.58], [-0.6, -0.46], [-0.3, -0.58], [0.0, -0.46], [0.3, -0.58], [0.6, -0.46], [0.9, -0.58], [1.2, -0.46]], 0.07, 'accent'),
      blob([[-1.45, -0.25], [-1.5, 0.05], [-1.2, 0.25], [1.2, 0.25], [1.5, 0.05], [1.45, -0.25]], 'tan', {}, 2),
      stripe(-1.3, 1.3, 0.05, 0.05, 'brown'),
    ],
  }],
  ['turbo-taxi', 'Turbo Taxi', 'Тюнінговане спортивне таксі з антикрилом.', 'sports', ['#ffd020', '#1a1a1a'], {
    parts: ['wing', 'sign'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', top: -0.5, rx0: -0.7, rx1: 0.05 }),
      ...checkers(f.tail.x + 0.2, -0.04, f.nose.x - 0.2, 0.06, 14),
      seg([f.tail.x + 0.25, -0.12], [f.tail.x + 0.2, -0.38], 0.07, 'black'), rr(f.tail.x - 0.1, -0.5, f.tail.x + 0.55, -0.36, 0.03, 'black'),
      rr(-0.45, -0.66, -0.05, -0.5, 0.04, 'white'), rect(-0.4, -0.62, -0.1, -0.54, 'black', { flat: true }),
    ],
  }],
  ['oval-racer', 'Oval Racer', 'Болід для кільцевих перегонів із номером.', 'formula', ['#2a6ae0', '#ffd23f'], {
    skin: (f) => [...formula(f, { num: true }), ...checkers(0.6, -0.04, 1.5, 0.06, 6), circ(-0.95, 0.06, 0.13, 'white')],
  }],
  ['skull-ram', 'Skull Ram', 'Броньовик із велетенським черепом-тараном.', 'monster', ['#3a3a3a', '#e8dcc0'], {
    o: o({ open: true }),
    parts: ['skull'], arch: 'ram', hideParts: true,
    skin: (f) => [
      ...monsterChassis(f),
      rr(f.tail.x, -0.6, f.nose.x - 0.3, 0.08, 0.1, 'body'),
      ...spikesAlong(f.tail.x + 0.2, f.nose.x - 0.6, -0.58, 5, 0.16, 'spike'),
      ...skull(f.nose.x - 0.3, -0.4, 0.32),
      poly([[f.nose.x - 0.7, -0.6], [f.nose.x - 0.95, -0.85], [f.nose.x - 0.55, -0.65]], 'bone'), poly([[f.nose.x + 0.05, -0.6], [f.nose.x + 0.3, -0.85], [f.nose.x - 0.05, -0.65]], 'bone'),
    ],
  }],
  ['night-bat-rod', 'Night Bat Rod', 'Низький вампірський хот-род із крилами-плавниками.', 'sports', ['#2a1a3a', '#c02a3a'], {
    parts: ['fangs'],
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.12], [-0.4, -0.18], [-0.9, -0.6], [-1.15, -0.4], [-1.35, -0.55], [-1.5, -0.3], [-1.7, -0.4]], 'accent'),
      ...wedge(f, 'body', 'dark'),
      ...angry(f.nose.x - 0.5, -0.1, 0.1, 'red'),
      poly([[f.nose.x - 0.25, 0.14], [f.nose.x - 0.15, 0.14], [f.nose.x - 0.2, 0.28]], 'white'),
    ],
  }],
  ['scorpion-gt', 'Scorpion GT', 'Спорткар-скорпіон: хвіст із жалом над дахом і клешні.', 'sports', ['#3a3a3a', '#ffd23f'], {
    noLights: true,
    skin: (f) => [
      ...wedge(f, 'body', 'dark'),
      ...path([[f.tail.x + 0.1, -0.1], [f.tail.x + 0.0, -0.6], [f.tail.x + 0.3, -0.95], [f.tail.x + 0.75, -1.0]], 0.14, 'body'),
      ...[0.15, 0.4, 0.6].map((d) => circ(f.tail.x + d * 0.7, -0.6 - d * 0.5, 0.05, 'accent')),
      poly([[f.tail.x + 0.7, -1.08], [f.tail.x + 0.8, -0.9], [f.tail.x + 1.05, -0.88]], 'accent'),
      blob([[f.nose.x - 0.25, 0.05], [f.nose.x + 0.3, -0.15], [f.nose.x + 0.45, -0.05], [f.nose.x + 0.2, 0.0], [f.nose.x + 0.4, 0.08], [f.nose.x + 0.15, 0.18]], 'body', {}, 1),
      ...[0, 1, 2, 3].map((i) => rect(-1.2 + i * 0.45, -0.1, -1.1 + i * 0.45, 0.2, 'accent', { flat: true })),
    ],
  }],
  ['spider-speedster', 'Spider Speedster', 'Концепт-павук: вісім очей і вісім лап.', 'sports', ['#7a3ae0', '#7aff3a'], {
    noLights: true,
    skin: (f) => [
      ...[-1.3, -0.9, -0.5, -0.1].map((x) => path([[x + 0.2, 0.0], [x, -0.35], [x - 0.3, 0.4]], 0.06, 'black')).flat(),
      ...wedge(f, 'body', 'dark'),
      ...[0, 1, 2, 3].map((i) => circ(f.nose.x - 0.5 + i * 0.12, -0.08 + (i % 2) * 0.08, 0.05, 'accent')),
      poly([[-0.7, -0.1], [-0.55, 0.0], [-0.7, 0.1], [-0.85, 0.0]], 'red'),
      ...fangs(f.nose.x - 0.15, f.nose.x, 0.18, 1, 0.12),
    ],
  }],
  ['mini-tank', 'Mini Tank', 'Мініатюрний танк із короткою гарматою.', 'tracked', ['#3a8a3a', '#ffd23f'], {
    gun: () => ({ at: [[1.3, -0.76]], aim: 12 }),
    s: 0.9, parts: [['cannon', 0.7]], hideParts: true,
    skin: (f) => [
      ...tracks(f),
      blob([[-1.6, 0.0], [-1.5, -0.32], [1.2, -0.36], [1.7, -0.05], [1.5, 0.05]], 'body', {}, 1),
      blob([[-0.8, -0.32], [-0.65, -0.78], [0.3, -0.8], [0.6, -0.32]], 'body', {}, 1),
      ...path([[0.4, -0.58], [1.2, -0.75]], 0.16, 'grey'), rr(1.1, -0.85, 1.3, -0.64, 0.04, 'dark'),
      starShape(-0.2, -0.55, 0.13, 'accent'),
    ],
  }],
  ['bone-speedster', 'Bone Speedster', 'Низький спідстер із хребта й ребер.', 'formula', ['#e8dcc0', '#2a2a2a'], {
    o: o({ mat: 'bone' }),
    skin: (f) => [
      ...path([[f.tail.x + 0.1, 0.06], [f.nose.x - 0.25, 0.04]], 0.16, 'bone'),
      ...[-1.2, -0.9, -0.6, 0.4, 0.7, 1.0].map((x) => path([[x, 0.05], [x + 0.06, -0.2], [x + 0.18, -0.24]], 0.08, 'bone')).flat(),
      ...seat(f.head.x + 0.05, -0.02, 0.4, 'dark'),
      ...skull(f.nose.x - 0.1, -0.02, 0.15),
      rr(f.tail.x - 0.05, -0.55, f.tail.x + 0.5, -0.42, 0.05, 'bone'), seg([f.tail.x + 0.22, -0.42], [f.tail.x + 0.22, 0.0], 0.07, 'bone'),
    ],
  }],
  ['twin-devil', 'Twin Devil', 'Дводвигунний дрегстер із рогами й вогнем.', 'dragster', ['#c02a2a', '#1a1a1a'], {
    parts: ['horns', 'booster'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.16], [f.nose.x - 0.3, 0.02], [f.nose.x, 0.08], [f.nose.x, 0.16], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...seat(-0.95, -0.15, 0.45, 'black'),
      ...[-0.55, -0.2].map((x) => [rr(x, -0.52, x + 0.28, -0.18, 0.05, 'chrome'), ...[0, 1, 2].map((i) => rect(x + 0.02 + i * 0.09, -0.66, x + 0.08 + i * 0.09, -0.52, 'chrome'))]).flat(),
      
      ...flameDecal(1.5, -0.2, 0.06, 0.2),
    ],
  }],
  ['big-head-racer', 'Big Head Racer', 'Вінтажний болід, у якому водій більший за машину.', 'formula', ['#c08a2a', '#2a2a2a'], {
    o: o({ rim: 'spokes' }),
    skin: (f) => [
      ell(0.0, 0.04, f.nose.x - 0.2, 0.2, 'body', {}, 28),
      ell(f.nose.x - 0.4, 0.04, 0.24, 0.17, 'grey'), ...[0, 1, 2].map((i) => rect(f.nose.x - 0.5 + i * 0.07, -0.06, f.nose.x - 0.46 + i * 0.07, 0.14, 'black', { flat: true })),
      circ(0.4, 0.04, 0.13, 'white'), rect(0.36, -0.03, 0.44, 0.11, 'black', { flat: true }),
      ...path([[-0.1, -0.06], [0.15, -0.28]], 0.05, 'black'),
      ...path([[0.0, 0.18], [-0.8, 0.22], [f.tail.x + 0.2, 0.16]], 0.06, 'chrome'),
    ],
  }],
  ['knight-dragster', 'Knight Dragster', 'Болід-дракон у лицарському обладунку зі списом.', 'dragster', ['#a0a8b8', '#e02a2a'], {
    parts: [['spikes', 0.55]],
    skin: (f) => [
      rr(f.tail.x - 0.1, -0.1, f.tail.x + 0.2, 0.12, 0.05, 'grey'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.16], [f.nose.x - 0.3, 0.02], [f.nose.x, 0.08], [f.nose.x, 0.16], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...[-1.6, -1.2, -0.8].map((x) => rect(x, -0.2, x + 0.3, 0.2, 'body', { ring: true })),
      ...path([[0.0, -0.32], [2.6, -0.36]], 0.07, 'wood'), poly([[2.5, -0.44], [2.5, -0.28], [2.95, -0.36]], 'spike'),
      blob([[-0.45, -0.18], [0.1, -0.18], [0.05, 0.22], [-0.15, 0.34], [-0.35, 0.22]], 'accent', {}, 1), rect(-0.18, -0.15, -0.12, 0.25, 'white', { flat: true }), rect(-0.35, 0.0, 0.05, 0.05, 'white', { flat: true }),
    ],
  }],
  ['rotty-racer', 'Rotty Racer', 'Машина-ротвейлер із шипованим нашийником.', 'creature', ['#3a2a1a', '#c08a4a'], {
    parts: ['ears', 'snout'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('short');
      return [
        ...path([[f.tail.x + 0.1, -0.35], [f.tail.x - 0.25, -0.65]], 0.14, 'body'),
        ...beast(f, { belly: 'accent' }), ...h.polys,
        blob([[1.45, -0.95], [1.95, -0.85], [1.95, -0.65], [1.45, -0.62]], 'accent', {}, 1), ell(1.95, -0.85, 0.08, 0.06, 'black'),
        poly([[1.05, -1.05], [0.95, -1.35], [1.3, -1.1]], 'body'), ...eyeball(1.4, -1.0, 0.07),
        ...[-0.2, 0.0, 0.2].map((d) => circ(1.25 + d * 0.3, -1.0, 0.04, 'accent')),
        rr(0.6, -0.65, 0.95, -0.5, 0.04, 'red'), ...spikesAlong(0.62, 0.94, -0.64, 3, 0.1, 'chrome'),
      ];
    },
  }],
  ['six-wheel-mauler', 'Six-Wheel Mauler', 'Шестиколісний гірський всюдихід із лебідкою.', 'tracked', ['#e02a2a', '#2a2a2a'], {
    o: o({ wheels: 3, wheel: 1.6, cab: true }),
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.8, -0.2], 0.1, 'dark')),
      blob([[f.tail.x - 0.05, 0.0], [f.tail.x, -0.4], [f.roof.x0 - 0.5, -0.45], [f.roof.x0 - 0.3, f.roof.y], [f.roof.x1, f.roof.y], [f.roof.x1 + 0.5, -0.45], [f.nose.x + 0.05, -0.3], [f.nose.x, 0.0]], 'body', {}, 1),
      rr(f.roof.x0 - 0.3, f.roof.y - 0.12, f.roof.x1, f.roof.y, 0.03, 'black'), ...[0, 1, 2].map((i) => circ(f.roof.x0 - 0.15 + i * 0.3, f.roof.y - 0.16, 0.06, 'light')),
      rr(f.nose.x - 0.1, -0.2, f.nose.x + 0.2, 0.1, 0.04, 'grey'), circ(f.nose.x + 0.05, -0.05, 0.08, 'dark'),
      stripe(f.tail.x, f.nose.x, -0.15, 0.07, 'accent'),
    ],
  }],
  ['volt-spike', 'Volt Spike', 'Електричний болід із шипами.', 'sports', ['#2a2a3a', '#ffd23f'], {
    parts: ['spikes'],
    skin: (f) => [...wedge(f), poly([[-1.0, -0.14], [-0.5, -0.14], [-0.7, 0.0], [-0.2, 0.0], [-0.9, 0.24], [-0.7, 0.08], [-1.1, 0.08]], 'accent', { flat: true }), ...spikesAlong(-1.4, -0.6, -0.2, 3, 0.15, 'accent')],
  }],
  ['toaster-racer', 'Toaster Racer', 'Тостер на колесах. Стріляє гарячими тостами.', 'box', ['#c0c8d0', '#c08a4a'], {
    gun: (f) => ({ at: [[f.roof.x0 + 0.42, f.roof.y - 0.38], [f.roof.x0 + 0.92, f.roof.y - 0.32]], aim: 72 }),
    s: 0.8, o: o({ mat: 'metal' }), parts: ['toast'], wheelie: 0.7, air: 1.4, hideParts: true,
    skin: (f) => [
      rr(f.roof.x0 + 0.25, f.roof.y - 0.35, f.roof.x0 + 0.6, f.roof.y + 0.1, 0.08, 'tan'), rr(f.roof.x0 + 0.75, f.roof.y - 0.28, f.roof.x0 + 1.1, f.roof.y + 0.1, 0.08, 'tan'),
      rr(f.tail.x, f.roof.y, f.nose.x, 0.3, 0.22, 'chrome'),
      rect(f.roof.x0 + 0.2, f.roof.y, f.roof.x0 + 0.65, f.roof.y + 0.08, 'black'), rect(f.roof.x0 + 0.7, f.roof.y, f.roof.x0 + 1.15, f.roof.y + 0.08, 'black'),
      rr(f.nose.x - 0.3, -0.55, f.nose.x - 0.12, -0.1, 0.04, 'dark'), circ(-0.6, -0.25, 0.13, 'black'), circ(-0.6, -0.25, 0.05, 'chrome'),
      stripe(f.tail.x + 0.1, f.nose.x - 0.1, -0.02, 0.06, 'accent'),
      ...[-0.9, 0.9].map((x) => rect(x - 0.2, 0.25, x + 0.2, 0.32, 'black')),
    ],
  }],
]);

