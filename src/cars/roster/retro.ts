import { tailgate } from '../art';
import { beacon, blob, bumper, checkers, circ, door, ell, flameDecal, grille, headlight, ladder, lightbar, pane, path, plus, poly, rect, rr, seat, seg, spare, stack, starShape, stripe, taillight, tank, truss, windows } from '../draw';
import { bike, boxy, carriage, fenders, formula, kart, monsterChassis, pickup, sedan, tracks, tractor, truckCab } from '../skins';
import type { CarPoly } from '../types';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

export const RETRO = group('retro', [
  ['monster-truck', 'Monster Truck', 'Позашляховик на колесах вище за людину. Стрибає через усе.', 'monster', ['#d83a2e', '#ffd23f'], {
    hideParts: true,
    skin: (f) => [
      ...monsterChassis(f),
      ...pickup({ ...f, nose: { ...f.nose, y0: -0.5, y1: 0.06 }, tail: { ...f.tail, y0: -0.5, y1: 0.06 }, roof: { x0: -1.05, x1: -0.1, y: -1.15 } }),
      ...flameDecal(f.nose.x - 0.25, -0.6, -0.22, 0.28),
      rr(-1.0, -1.28, -0.15, -1.17, 0.04, 'black'), ...[-0.85, -0.6, -0.35].map((x) => circ(x, -1.23, 0.05, 'light')),
    ],
  }],
  ['dragster', 'Dragster', 'Довгий болід для дрег-рейсингу. Тримай «вперед» — вмикається ракета.', 'dragster', ['#ffcc1a', '#1a1a2e'], {
    parts: ['booster'], hideParts: true,
    skin: (f) => [
      seg([f.tail.x + 0.3, -0.15], [f.tail.x + 0.25, -0.75], 0.08, 'black'), seg([f.tail.x + 0.55, -0.15], [f.tail.x + 0.4, -0.75], 0.08, 'black'),
      rr(f.tail.x - 0.05, -0.92, f.tail.x + 0.65, -0.72, 0.04, 'accent'), ...checkers(f.tail.x + 0.0, -0.88, f.tail.x + 0.6, -0.76, 6),
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.16], [f.nose.x - 0.3, 0.02], [f.nose.x, 0.08], [f.nose.x, 0.16], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...seat(-0.95, -0.15, 0.45),
      rr(-0.5, -0.5, -0.15, -0.28, 0.05, 'chrome'), rect(-0.45, -0.58, -0.2, -0.5, 'black'),
      stripe(-0.6, f.nose.x - 0.3, -0.02, 0.07, 'accent'),
      circ(0.7, 0.06, 0.12, 'white'), rect(0.66, 0.0, 0.73, 0.12, 'black', { flat: true }),
    ],
  }],
  ['ambulance', 'Ambulance', 'Карета швидкої. Аптечка рятує голову водія від удару.', 'van', ['#f4f4f0', '#e83a3a'], {
    parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { win: 1, winX: [f.nose.x - 1.0, f.nose.x - 0.55], doors: [f.nose.x - 1.05], bumper: 'grey' }),
      stripe(f.tail.x, f.nose.x, -0.02, 0.1, 'red'), stripe(f.tail.x, f.nose.x, 0.08, 0.04, 'red'),
      circ(-0.55, -0.45, 0.24, 'white'), plus(-0.55, -0.45, 0.34, 'red'),
      ...lightbar(f.roof.x1 - 0.7, f.roof.x1 - 0.15, f.roof.y), ...beacon(f.tail.x + 0.25, f.roof.y, 'red', 0.16),
      rect(f.tail.x + 0.08, -0.75, f.tail.x + 0.14, 0.1, 'grey', { flat: true }),
    ],
  }],
  ['go-kart', 'Go-Kart', 'Компактний гоночний карт: низький, легкий і верткий.', 'kart', ['#3ad15a', '#ffffff'], {
    skin: (f) => [...kart(f), circ(0.45, 0.06, 0.11, 'white'), rect(0.41, 0.0, 0.48, 0.12, 'black', { flat: true })],
  }],
  ['timber-lorry', 'Timber Lorry', 'Лісовоз. Колоди лежать у кузові вільно й розлітаються на поворотах.', 'truck', ['#3a7a3a', '#c8a060'], {
    cargo: ['log', 3],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.6, 'wood')), hidden(rect(f.deck.x1 - 0.1, f.deck.y - 0.65, f.deck.x1 - 0.02, f.deck.y, 'wood', { deco: false }))],
    skin: (f) => [
      ...truckCab(f, { stack: true }),
      rr(f.deck.x0, f.deck.y - 0.02, f.deck.x1, f.deck.y + 0.1, 0.03, 'brown'),
      ...[f.deck.x0 + 0.02, -0.36, f.deck.x1 - 0.08].map((x) => rr(x, f.deck.y - 0.7, x + 0.08, f.deck.y, 0.03, 'black')),
      ...fenders({ ...f, wheels: f.wheels.slice(0, 2) }, 'dark'),
    ],
  }],
  ['farm-tractor', 'Tractor', 'Колісний трактор: велетенське заднє колесо і страшна тяга.', 'tractor', ['#3aa84a', '#ffd23f'], {
    skin: (f) => [...tractor(f), ...[1.0, 1.15, 1.3].map((x) => rect(x, -0.2, x + 0.06, 0.1, 'dark', { flat: true }))],
  }],
  ['garbage-truck', 'Garbage Truck', 'Сміттєвоз. Вивалює мішки сміття під колеса суперникові.', 'truck', ['#3a8a5a', '#c0c8d0'], {
    parts: [['cargo', 1]], hideParts: true,
    skin: (f) => [
      ...truckCab(f),
      rr(f.deck.x0 + 0.1, f.deck.y - 0.95, f.deck.x1 + 0.02, f.deck.y + 0.12, 0.06, 'accent'),
      ...[0.5, 1.0, 1.5, 2.0].map((dx) => rect(f.deck.x0 + dx, f.deck.y - 0.88, f.deck.x0 + dx + 0.05, f.deck.y + 0.05, 'grey', { flat: true })),
      blob([[f.deck.x0 - 0.3, f.deck.y + 0.15], [f.deck.x0 - 0.35, f.deck.y - 0.75], [f.deck.x0 - 0.1, f.deck.y - 1.02], [f.deck.x0 + 0.2, f.deck.y - 1.02], [f.deck.x0 + 0.2, f.deck.y + 0.15]], 'body', {}, 1),
      rect(f.deck.x0 - 0.28, f.deck.y - 0.25, f.deck.x0 + 0.05, f.deck.y + 0.08, 'black'),
      stripe(f.deck.x0 + 0.25, f.deck.x1, f.deck.y - 0.42, 0.14, 'body'),
      ...beacon(f.roof.x0 + 0.35, f.roof.y, 'orange', 0.14),
    ],
  }],
  ['minibus', 'Minibus', 'Пасажирський мікроавтобус на дев\'ять місць.', 'van', ['#f0c040', '#ffffff'], {
    o: o({ len: 1.1 }),
    skin: (f) => [
      ...boxy(f, { win: 3, winX: [f.tail.x + 0.15, f.nose.x - 0.55], winY: [f.roof.y + 0.12, f.roof.y + 0.45] }),
      stripe(f.tail.x, f.nose.x, -0.12, 0.1, 'accent'), stripe(f.tail.x, f.nose.x, 0.0, 0.05, 'dark'),
      rect(-0.2, -0.32, 0.22, 0.2, 'body', { ring: true }),
      rr(f.tail.x + 0.3, f.roof.y - 0.08, f.nose.x - 0.8, f.roof.y, 0.03, 'grey'),
    ],
  }],
  ['tourist-bus', 'Tourist Bus', 'Двоповерховий екскурсійний автобус з відкритим верхом.', 'bus', ['#e84040', '#fff0c0'], {
    o: o({ tall: 1.45, wheels: 3 }),
    skin: (f) => {
      const t = f.roof.y;
      return [
        ...boxy(f, { slope: 0.2, slopeH: 0.3, screen: false, round: 0.12 }),
        ...windows(f.tail.x + 0.15, f.nose.x - 0.25, t + 0.12, t + 0.5, 5),
        ...windows(f.tail.x + 0.15, f.nose.x - 0.55, -0.5, -0.16, 4),
        rr(f.nose.x - 0.5, -0.55, f.nose.x - 0.04, -0.12, 0.05, 'glass'),
        stripe(f.tail.x, f.nose.x, -0.66, 0.1, 'accent'), stripe(f.tail.x, f.nose.x, 0.02, 0.08, 'accent'),
        rect(f.nose.x - 1.05, -0.5, f.nose.x - 0.62, 0.22, 'body', { ring: true }), rect(f.nose.x - 1.0, -0.45, f.nose.x - 0.67, -0.1, 'glass'),
        rr(f.nose.x - 0.55, t - 0.02, f.nose.x - 0.1, t + 0.1, 0.03, 'black'),
      ];
    },
  }],
  ['off-road', 'Off-Road Vehicle', 'Цивільний джип з дугою безпеки і запаскою.', 'sedan', ['#6a7a3a', '#d0c080'], {
    o: o({ open: true, wheel: 1.2 }), parts: ['bigwheel'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'open', top: -0.6, rx1: 0.35, doors: 1, bumper: 'black' }),
      ...path([[-0.95, -0.16], [-0.8, -0.95], [0.05, -0.95], [0.32, -0.55]], 0.09, 'black'),
      ...spare(f.tail.x - 0.12, -0.3, 0.3),
      ...fenders(f, 'dark', 0.1),
      grille(f.nose.x - 0.08, -0.12, f.nose.x + 0.02, 0.18, 2)[0],
      rect(f.nose.x - 0.05, 0.0, f.nose.x + 0.2, 0.22, 'black'),
    ],
  }],
  ['race-car-f1', 'Race Car F1', 'Болід Формули-1. DRS відкриває заднє крило для ривка.', 'formula', ['#e02020', '#ffffff'], {
    skin: (f) => [...formula(f, { wing: 'black', num: true }), stripe(0.2, f.nose.x - 0.3, 0.0, 0.06, 'white')],
  }],
  ['banana-car', 'Banana Car', 'Машина-банан. Розкидає бананові шкірки, на яких суперники крутяться.', 'blob', ['#ffe23a', '#6a4a1a'], {
    o: o({ shape: 'flat', len: 1.25 }), noLights: true,
    skin: (f) => [
      blob([[f.tail.x - 0.05, -0.35], [f.tail.x + 0.1, -0.15], [-0.6, 0.12], [0.4, 0.14], [f.nose.x - 0.2, -0.05], [f.nose.x + 0.05, -0.45], [f.nose.x + 0.15, -0.62], [f.nose.x - 0.05, -0.62], [f.nose.x - 0.4, -0.35], [0.4, -0.25], [-0.5, -0.28], [f.tail.x + 0.3, -0.45]], 'body', {}, 2),
      rr(f.nose.x - 0.02, -0.74, f.nose.x + 0.2, -0.58, 0.04, 'accent'),
      rr(f.tail.x - 0.15, -0.5, f.tail.x + 0.05, -0.3, 0.04, 'accent'),
      ...path([[-0.9, -0.02], [-0.2, 0.06], [0.6, 0.02], [1.0, -0.15]], 0.06, 'yellow'),
      ...path([[-0.7, -0.22], [0.2, -0.16], [0.9, -0.3]], 0.05, 'brown'),
      rr(-0.15, 0.02, 0.35, 0.14, 0.04, 'brown'),
    ],
  }],
  ['antique-mobile', 'Antique Mobile', 'Безкінна карета 1905 року: латунь, спиці і ручне кермо.', 'carriage', ['#2a2a3a', '#c8a040'], {
    o: o({ tall: 0.8 }),
    skin: (f) => [
      ...carriage(f, { trim: 'gold' }),
      rr(f.tail.x + 0.55, f.roof.y - 0.55, f.tail.x + 1.0, f.roof.y + 0.1, 0.12, 'black'),
      ...path([[0.55, f.roof.y + 0.2], [0.85, f.roof.y - 0.4]], 0.07, 'gold'), ell(0.9, f.roof.y - 0.42, 0.14, 0.05, 'black'),
      circ(f.nose.x - 0.3, -0.25, 0.13, 'gold'), circ(f.nose.x - 0.27, -0.25, 0.08, 'light'),
      ...fenders(f, 'black', 0.08),
      rr(f.nose.x - 0.4, 0.0, f.nose.x - 0.05, 0.1, 0.03, 'gold'),
    ],
  }],
  ['skid-steer', 'Skid-Steer Loader', 'Компактний навантажувач із ковшем: підчіплює суперника знизу.', 'box', ['#f0b020', '#2a2a2a'], {
    s: 0.8, parts: ['scoop'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x, -0.3, f.nose.x - 0.2, 0.3, 0.12, 'body'),
      rect(f.tail.x + 0.1, f.roof.y, f.tail.x + 0.2, -0.3, 'dark'), rect(0.0, f.roof.y, 0.1, -0.3, 'dark'), rr(f.tail.x, f.roof.y - 0.1, 0.3, f.roof.y + 0.04, 0.04, 'body'),
      ...[0, 1, 2, 3].map((i) => rect(0.15, f.roof.y + 0.1 + i * 0.13, 0.2, f.roof.y + 0.15 + i * 0.13, 'dark', { flat: true })),
      ...path([[f.tail.x + 0.2, -0.2], [0.9, -0.75], [f.nose.x + 0.2, -0.2]], 0.16, 'dark'),
      poly([[f.nose.x + 0.15, -0.35], [f.nose.x + 0.35, -0.38], [f.nose.x + 0.85, 0.22], [f.nose.x + 0.35, 0.28]], 'scoop'),
      rr(f.tail.x - 0.08, 0.05, f.tail.x + 0.15, 0.25, 0.04, 'black'),
    ],
  }],
  ['hippie-van', 'Hippie Van', 'Вінтажний мікроавтобус хіпі з квітами і знаком миру.', 'van', ['#f0e0b0', '#ff7aa0'], {
    parts: ['flag'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.25, slopeH: 0.45, round: 0.22, win: 3, winX: [f.tail.x + 0.15, f.nose.x - 0.4], bumper: 'chrome' }),
      blob([[f.tail.x, -0.08], [f.nose.x, -0.08], [f.nose.x, 0.3], [f.tail.x, 0.3]], 'accent', {}, 1),
      poly([[f.nose.x - 0.02, -0.3], [f.nose.x - 0.7, -0.08], [f.nose.x - 0.02, -0.08]], 'accent'),
      circ(f.nose.x - 0.12, 0.05, 0.13, 'white'), circ(f.nose.x - 0.12, 0.05, 0.09, 'accent'), rect(f.nose.x - 0.135, -0.04, f.nose.x - 0.105, 0.14, 'white', { flat: true }),
      ...[[-1.0, -0.24, 'yellow'], [-0.45, -0.18, 'orange'], [0.15, -0.26, 'sky']].flatMap(([x, y, m]) => [starShape(x as number, y as number, 0.15, m as 'yellow'), circ(x as number, y as number, 0.05, 'white')]),
      rr(f.tail.x + 0.25, f.roof.y - 0.1, f.nose.x - 0.6, f.roof.y, 0.04, 'brown'),
      rr(f.tail.x + 0.3, f.roof.y - 0.28, f.tail.x + 0.9, f.roof.y - 0.1, 0.05, 'orange'),
    ],
  }],
  ['concrete-truck', 'Concrete Truck', 'Бетонозмішувач. Барабан крутиться, а бетон виливається назад брилами.', 'truck', ['#e0e0e0', '#ff8030'], {
    parts: ['drum'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        ...seg([d.x0 + 0.1, d.y - 0.15], [d.x0 - 0.35, d.y + 0.12], 0.1, 'grey') && [seg([d.x0 + 0.1, d.y - 0.15], [d.x0 - 0.35, d.y + 0.12], 0.1, 'grey')],
        blob([[d.x0 + 0.05, d.y - 0.2], [d.x0 + 0.2, d.y - 0.62], [d.x0 + 1.4, d.y - 0.95], [d.x1 - 0.2, d.y - 0.75], [d.x1, d.y - 0.4], [d.x1 - 0.3, d.y - 0.02], [d.x0 + 0.5, d.y]], 'accent', {}, 2),
        blob([[d.x0 + 0.05, d.y - 0.2], [d.x0 + 0.2, d.y - 0.62], [d.x0 + 0.45, d.y - 0.7], [d.x0 + 0.45, d.y - 0.1]], 'grey', {}, 1),
        ...[0.5, 1.1, 1.7, 2.3].map((dx) => poly([[d.x0 + dx, d.y - 0.85], [d.x0 + dx + 0.18, d.y - 0.88], [d.x0 + dx + 0.38, d.y - 0.05], [d.x0 + dx + 0.2, d.y - 0.02]], 'body', { flat: true })),
        rect(d.x0 + 0.2, d.y - 0.1, d.x1, d.y + 0.02, 'dark'),
        poly([[d.x0 + 0.05, d.y - 0.6], [d.x0 + 0.25, d.y - 0.75], [d.x0 + 0.1, d.y - 0.35]], 'grey'),
      ];
    },
  }],
  ['excavator', 'Excavator', 'Будівельний екскаватор. Б\'є ковшем об землю — хвиля відкидає суперника.', 'digger', ['#ffc020', '#2a2a2a'], {
    parts: ['bucketarm'], hideParts: true,
    skin: (f) => [
      ...tracks(f),
      rr(f.tail.x + 0.05, -0.32, f.nose.x - 0.15, -0.08, 0.06, 'dark'),
      rr(f.tail.x - 0.05, -0.75, -0.05, -0.28, 0.08, 'body'),
      rr(f.tail.x + 0.1, f.roof.y, -0.05, -0.3, 0.08, 'body'), rect(f.tail.x + 0.28, f.roof.y + 0.1, -0.15, -0.5, 'glass'),
      rr(f.tail.x - 0.12, -0.7, f.tail.x + 0.3, -0.32, 0.08, 'dark'),
      ...path([[0.05, -0.55], [0.9, -1.4], [1.75, -1.25], [f.nose.x + 0.85, -0.4]], 0.2, 'body'),
      seg([0.3, -0.5], [0.95, -1.15], 0.07, 'chrome'),
      poly([[f.nose.x + 0.6, -0.55], [f.nose.x + 1.0, -0.35], [f.nose.x + 0.9, 0.02], [f.nose.x + 0.55, 0.1], [f.nose.x + 0.5, -0.1]], 'dark'),
      ...[0, 1, 2].map((i) => poly([[f.nose.x + 0.55 + i * 0.12, 0.08], [f.nose.x + 0.63 + i * 0.12, 0.08], [f.nose.x + 0.58 + i * 0.12, 0.2]], 'chrome')),
    ],
  }],
  ['antique-f1', 'Antique F1', 'Болід перших гран-прі: сигара на спицях і шкіряний шолом.', 'formula', ['#2a8a4a', '#e0d0a0'], {
    o: o({ wheel: 1.1, rim: 'spokes' }), accel: 1.15,
    skin: (f) => [
      ell(0.0, 0.02, f.nose.x - 0.1, 0.24, 'body', {}, 28),
      ell(f.nose.x - 0.3, 0.02, 0.28, 0.2, 'grey'), ...[0, 1, 2].map((i) => rect(f.nose.x - 0.25 + i * 0.07, -0.1, f.nose.x - 0.21 + i * 0.07, 0.14, 'black', { flat: true })),
      poly([[f.tail.x + 0.05, 0.02], [f.tail.x - 0.25, -0.05], [f.tail.x - 0.25, 0.1]], 'body'),
      rr(f.head.x - 0.35, -0.3, f.head.x + 0.3, -0.18, 0.05, 'brown'),
      circ(0.45, 0.04, 0.13, 'white'), rect(0.41, -0.03, 0.48, 0.11, 'black', { flat: true }),
      ...path([[0.0, 0.18], [-0.6, 0.24], [f.tail.x + 0.1, 0.18]], 0.07, 'chrome'),
    ],
  }],
  ['wrecking-crane', 'Wrecking Ball Crane', 'Кран зі справжнім ядром на ланцюгу: воно розгойдується і трощить усе.', 'truck', ['#f0b020', '#2a2a2a'], {
    flail: { from: [1.55, -1.45], len: 1.1, r: 0.36, look: 'wrecking' },
    art: (f) => [hidden(poly([[f.deck.x0 + 0.3, f.deck.y], [f.deck.x0 + 0.6, f.deck.y], [1.6, -1.42], [1.5, -1.5]], 'scoop', { deco: false, density: 0.3 }))],
    skin: (f) => [
      ...truckCab(f),
      rr(f.deck.x0, f.deck.y - 0.5, f.deck.x0 + 1.0, f.deck.y + 0.05, 0.05, 'body'), rect(f.deck.x0 + 0.55, f.deck.y - 0.45, f.deck.x0 + 0.9, f.deck.y - 0.15, 'glass'),
      rect(f.deck.x0 - 0.05, f.deck.y - 0.35, f.deck.x0 + 0.3, f.deck.y, 'grey'),
      ...truss([f.deck.x0 + 0.45, f.deck.y - 0.3], [1.55, -1.45], 0.2, 'body'),
      circ(1.55, -1.45, 0.08, 'dark'),
    ],
  }],
  ['hot-rod', 'Hot Rod', 'Тюнінговане американське купе з вогняним малюнком і закисом азоту.', 'sports', ['#1a1a1a', '#ff5a1a'], {
    parts: ['exhaust'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', top: -0.6, rx0: -0.85, rx1: 0.05, bumper: 'chrome' }),
      ...flameDecal(f.nose.x - 0.1, -0.5, 0.02, 0.26),
      rr(0.75, -0.36, 1.15, -0.12, 0.04, 'chrome'), ...[0.8, 0.92, 1.04].map((x) => rect(x, -0.5, x + 0.07, -0.34, 'chrome')),
      ...path([[-0.5, 0.24], [-1.2, 0.22], [f.tail.x - 0.2, 0.18]], 0.08, 'chrome'),
    ],
  }],
  ['travel-trailer', 'Travel Trailer', 'Легковик із житловим причепом-кемпером на буксирі.', 'coupe', ['#4a8ad8', '#ffffff'], {
    o: o({ len: 0.9 }), parts: ['trailer'], accel: 1.2, hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'hatch' }),
      seg([f.tail.x + 0.05, 0.16], [f.tail.x - 0.35, 0.16], 0.06, 'dark'),
      blob([[f.tail.x - 1.4, 0.18], [f.tail.x - 1.42, f.tail.y0 - 0.25], [f.tail.x - 1.1, f.tail.y0 - 0.45], [f.tail.x - 0.5, f.tail.y0 - 0.45], [f.tail.x - 0.25, f.tail.y0 - 0.15], [f.tail.x - 0.25, 0.18]], 'white', {}, 1),
      stripe(f.tail.x - 1.4, f.tail.x - 0.25, f.tail.y0 + 0.05, 0.06, 'accent'),
      rr(f.tail.x - 1.25, f.tail.y0 - 0.32, f.tail.x - 0.95, f.tail.y0 - 0.08, 0.04, 'glass'),
      rect(f.tail.x - 0.75, f.tail.y0 - 0.32, f.tail.x - 0.48, 0.12, 'white', { ring: true }),
    ],
  }],
  ['amphibian', 'Amphibian', 'Колісний всюдихід-амфібія з гвинтом на кормі.', 'boat', ['#4a7a3a', '#e0c060'], {
    o: o({ wheel: 1.4 }),
    skin: (f) => [
      blob([[f.tail.x, -0.45], [f.nose.x - 0.3, -0.5], [f.nose.x + 0.05, -0.3], [f.nose.x - 0.25, 0.1], [f.tail.x + 0.15, 0.1]], 'body', {}, 1),
      rr(-0.25, -0.9, 0.75, -0.44, 0.06, 'accent'), pane(0.35, -0.85, 0.68, -0.5, 0.05), pane(-0.15, -0.85, 0.25, -0.5),
      stripe(f.tail.x, f.nose.x - 0.15, -0.3, 0.06, 'accent'),
      seg([f.tail.x + 0.05, -0.05], [f.tail.x - 0.25, 0.12], 0.06, 'chrome'),
      poly([[f.tail.x - 0.32, -0.08], [f.tail.x - 0.18, 0.12], [f.tail.x - 0.32, 0.32], [f.tail.x - 0.24, 0.12]], 'chrome'),
      headlight(f.nose.x - 0.25, -0.38, 0.08), ...[-1.2, -0.95].map((x) => circ(x, -0.22, 0.07, 'white')),
    ],
  }],
  ['weevil', 'Weevil', 'Малолітражка-жучок: кругленька, як довгоносик.', 'coupe', ['#5ac0e0', '#ffffff'], {
    s: 0.8,
    skin: (f) => [
      blob([[f.tail.x + 0.05, 0.3], [f.tail.x - 0.05, 0.0], [f.tail.x + 0.4, -0.45], [-0.5, f.roof.y - 0.02], [0.3, f.roof.y - 0.02], [0.95, -0.2], [f.nose.x, 0.05], [f.nose.x - 0.05, 0.3]], 'body', {}, 2),
      poly([[-0.6, -0.2], [-0.45, f.roof.y + 0.08], [-0.1, f.roof.y + 0.06], [-0.1, -0.2]], 'glass'),
      poly([[0.0, -0.2], [0.0, f.roof.y + 0.06], [0.3, f.roof.y + 0.08], [0.7, -0.2]], 'glass'),
      ...fenders(f, 'body', 0.12), ...door(-0.6, -0.16, 0.65, 0.2),
      headlight(f.nose.x - 0.2, -0.05, 0.1), bumper(f.nose.x - 0.25, f.nose.x + 0.05, 0.26, 0.09), bumper(f.tail.x - 0.05, f.tail.x + 0.25, 0.26, 0.09),
      ...path([[0.3, f.roof.y + 0.02], [0.6, f.roof.y - 0.3]], 0.05, 'black'), circ(0.62, f.roof.y - 0.33, 0.06, 'black'),
    ],
  }],
  ['bubble-car', 'Bubble Car', 'Мікромобіль-бульбашка: кабіна відкривається, як кришка.', 'blob', ['#e04a7a', '#ffffff'], {
    s: 0.85, parts: ['dome'], hideParts: true,
    skin: () => [
      ell(0.05, -0.3, 0.98, 0.72, 'body', {}, 28),
      blob([[-0.25, -0.6], [0.0, -1.0], [0.55, -0.9], [0.85, -0.45]], 'glass', {}, 2),
      stripe(-0.9, 0.95, -0.05, 0.07, 'white'),
      headlight(0.88, -0.25, 0.1), rect(-0.2, -0.5, -0.12, 0.2, 'body', { ring: true }),
      bumper(-1.0, 1.05, 0.28, 0.08),
    ],
  }],
  ['landfill-truck', 'Landfill Truck', 'Кар\'єрний самоскид. Каміння в кузові висипається на ходу, а за командою — все одразу.', 'truck', ['#f0a020', '#3a3a3a'], {
    o: o({ wheel: 1.3, wheels: 2 }), mass: 1.1, cargo: ['rock', 6],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.45, 'body'))],
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        poly([[d.x0 - 0.1, d.y - 0.5], [d.x1 + 0.05, d.y - 0.75], [d.x1 + 0.05, d.y + 0.1], [d.x0 + 0.1, d.y + 0.1]], 'body'),
        ...[0.5, 1.2, 1.9].map((dx) => rect(d.x0 + dx, d.y - 0.55, d.x0 + dx + 0.08, d.y + 0.05, 'dark', { flat: true })),
        poly([[d.x1 - 0.1, d.y - 0.75], [f.nose.x - 0.1, f.roof.y - 0.1], [f.nose.x - 0.1, f.roof.y], [d.x1 - 0.1, d.y - 0.62]], 'body'),
        ...fenders(f, 'dark', 0.12),
      ];
    },
  }],
  ['limousine', 'Limousine', 'Подовжений лімузин: довгий, важкий, з тонованими вікнами.', 'sedan', ['#1a1a24', '#d0d0d8'], {
    o: o({ len: 1.35 }),
    skin: (f) => [
      ...sedan(f, { glass: 'dark', doors: 3, rx0: f.roof.x0 - 0.3 }),
      stripe(f.tail.x, f.nose.x - 0.05, 0.04, 0.05, 'chrome'),
      ...grille(f.nose.x - 0.08, -0.1, f.nose.x + 0.03, 0.14),
      circ(f.nose.x - 0.25, -0.22, 0.05, 'chrome'),
    ],
  }],
  ['american-car', 'American Car', 'Седан 70-х: хромовані бампери і хвостові плавники.', 'sedan', ['#4a6ad8', '#e0e0e0'], {
    o: o({ len: 1.1 }),
    skin: (f) => [
      ...sedan(f, { fins: true, roof: 'sedan', bumper: null }),
      poly([[f.tail.x - 0.02, -0.14], [f.tail.x + 0.55, -0.16], [f.tail.x + 0.02, -0.36]], 'body'),
      bumper(f.nose.x - 0.25, f.nose.x + 0.1, 0.24, 0.14), bumper(f.tail.x - 0.1, f.tail.x + 0.25, 0.24, 0.14),
      stripe(f.tail.x, f.nose.x, 0.04, 0.05, 'chrome'), ...grille(f.nose.x - 0.06, -0.1, f.nose.x + 0.04, 0.14),
      taillight(f.tail.x - 0.02, -0.22, 0.07),
    ],
  }],
  ['steamroller', 'Steamroller', 'Паровий дорожній коток: розплющує все на шляху.', 'box', ['#e0b020', '#3a3a3a'], {
    s: 0.9, parts: ['roller', 'stack'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x, -0.4, f.nose.x - 0.1, 0.25, 0.08, 'body'),
      tank(-0.3, f.nose.x - 0.05, -0.6, 0.28, 'black'), rect(0.2, -0.88, 0.28, -0.32, 'gold', { flat: true }),
      ...stack(f.nose.x - 0.35, -0.85, 0.7, 0.14, 'black'),
      rect(f.tail.x + 0.05, f.roof.y - 0.55, f.tail.x + 0.15, -0.4, 'dark'), rect(-0.5, f.roof.y - 0.55, -0.4, -0.4, 'dark'),
      rr(f.tail.x - 0.05, f.roof.y - 0.65, -0.3, f.roof.y - 0.5, 0.05, 'accent'),
      rect(f.nose.x - 0.2, -0.3, f.nose.x + 0.3, 0.0, 'dark'),
      circ(f.nose.x + 0.42, 0.06, 0.38, 'grey'), circ(f.nose.x + 0.42, 0.06, 0.26, 'dark'), circ(f.nose.x + 0.42, 0.06, 0.08, 'gold'),
    ],
  }],
  ['pickup-truck', 'Pickup Truck', 'Бортовий пікап із ящиками в кузові — вони падають на кожній ямі.', 'pickup', ['#c83a3a', '#f0f0f0'], {
    cargo: ['crate', 2],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.26, 'body'))],
    skin: (f) => [...pickup(f), ...grille(f.nose.x - 0.06, -0.14, f.nose.x + 0.03, 0.14, 2), stripe(f.tail.x, f.nose.x, 0.06, 0.06, 'accent')],
  }],
  ['motocross-bike', 'Motocross Bike', 'Кросовий мотоцикл: високі крила, шипи на шинах і трамплінний стрибок.', 'bike', ['#ff7a1a', '#2a2a2a'], {
    o: o({ wheel: 1.1 }), arch: 'bouncy',
    skin: (f) => [...bike(f, { style: 'dirt' }), circ(0.15, -0.12, 0.12, 'white'), rect(0.12, -0.18, 0.18, -0.06, 'black', { flat: true })],
  }],
  ['car-carrier', 'Car Carrier', 'Двоярусний автовоз із машинками на палубах.', 'truck', ['#3a5ab0', '#e0e0e0'], {
    parts: ['cage'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      const mini = (x: number, y: number, m: 'red' | 'yellow' | 'green' | 'blue') => [
        blob([[x, y], [x, y - 0.2], [x + 0.25, y - 0.22], [x + 0.4, y - 0.38], [x + 0.7, y - 0.38], [x + 0.85, y - 0.2], [x + 1.0, y - 0.18], [x + 1.0, y]], m, {}, 1),
        poly([[x + 0.45, y - 0.22], [x + 0.48, y - 0.33], [x + 0.68, y - 0.33], [x + 0.78, y - 0.22]], 'glass'),
        circ(x + 0.22, y, 0.1, 'rubber'), circ(x + 0.8, y, 0.1, 'rubber'),
      ];
      return [
        ...truckCab(f),
        ...[d.x0 + 0.05, (d.x0 + d.x1) / 2, d.x1 - 0.1].map((x) => rect(x, d.y - 0.95, x + 0.07, d.y, 'chrome')),
        rect(d.x0, d.y - 0.62, d.x1, d.y - 0.56, 'chrome'), rect(d.x0, d.y - 0.04, d.x1, d.y + 0.04, 'chrome'),
        ...mini(d.x0 + 0.2, d.y - 0.12, 'red'), ...mini(d.x0 + 1.5, d.y - 0.12, 'yellow'), ...mini(d.x0 + 0.6, d.y - 0.7, 'green'),
      ];
    },
  }],
  ['bumper-car', 'Bumper Car', 'Атракціонна машинка на штанзі. Гумовий бампер — і бамс!', 'kart', ['#ff3a5a', '#ffd23f'], {
    // No visible wheels: it rolls on hidden casters under the rubber skirt.
    s: 0.85, arch: 'tiny', glide: 0.27, parts: ['antenna'], bounce: 0.4, noLights: true, hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.12, -0.02, f.nose.x + 0.1, 0.27, 0.13, 'rubber'),
      rr(f.tail.x - 0.05, 0.12, f.nose.x + 0.03, 0.17, 0.02, 'dark', { flat: true }),
      blob([[f.tail.x + 0.02, 0.0], [f.tail.x - 0.02, -0.4], [f.tail.x + 0.2, -0.5], [-0.35, -0.3], [0.35, -0.22], [f.nose.x - 0.15, -0.3], [f.nose.x, -0.15], [f.nose.x - 0.05, 0.0]], 'body', {}, 2),
      starShape(0.6, -0.1, 0.11, 'gold'),
      ...path([[f.tail.x + 0.2, -0.45], [f.tail.x + 0.25, -1.45]], 0.07, 'chrome'), circ(f.tail.x + 0.25, -1.5, 0.08, 'yellow'),
      ...seat(-0.32, -0.22, 0.32, 'accent'),
      seg([0.45, -0.24], [0.3, -0.45], 0.05, 'black'), seg([0.2, -0.5], [0.4, -0.4], 0.06, 'black'),
    ],
  }],
  ['forklift-truck', 'Forklift Truck', 'Складський навантажувач: вила підхоплюють суперника.', 'box', ['#ffc020', '#2a2a2a'], {
    s: 0.85, parts: ['forks'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x, -0.35, f.nose.x - 0.1, 0.3, 0.08, 'body'),
      rr(f.tail.x - 0.1, -0.55, f.tail.x + 0.55, 0.15, 0.12, 'dark'),
      ...path([[f.tail.x + 0.4, -0.35], [f.tail.x + 0.45, f.roof.y - 0.6], [f.nose.x - 0.45, f.roof.y - 0.6], [f.nose.x - 0.2, -0.35]], 0.09, 'dark'),
      ...seat(f.head.x - 0.05, -0.35, 0.4),
      rect(f.nose.x - 0.05, f.nose.y0 - 1.0, f.nose.x + 0.12, f.nose.y1, 'dark'), rect(f.nose.x + 0.02, f.nose.y0 - 1.0, f.nose.x + 0.07, f.nose.y1, 'grey', { flat: true }),
      rect(f.nose.x + 0.12, f.nose.y1 - 0.12, f.nose.x + 1.0, f.nose.y1 - 0.03, 'chrome'),
      ...beacon(f.tail.x + 0.6, f.roof.y - 0.65, 'orange', 0.14),
    ],
  }],
  ['hog', 'Hog', 'Важкий круїзер-чопер: довга вилка, високий кермо, багато хрому.', 'bike', ['#2a2a2a', '#c0c0c8'], {
    o: o({ len: 1.15 }), mass: 1.3,
    skin: (f) => [...bike(f, { style: 'chopper' }), ...path([[-0.35, -0.25], [-0.55, -0.7], [-0.62, -0.72]], 0.06, 'chrome')],
  }],
  ['ice-cream-van', 'Ice Cream Van', 'Фургон морозива. Стріляє ріжками — суперник замерзає.', 'van', ['#ffb0d0', '#ffffff'], {
    parts: ['cone'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { round: 0.18 }),
      rr(-1.25, -0.68, 0.1, -0.22, 0.04, 'cream'), rect(-1.2, -0.62, 0.05, -0.28, 'dark', { flat: true }),
      ...[-1.15, -0.85, -0.55, -0.25].map((x, i) => poly([[x - 0.06, -0.72], [x + 0.06, -0.72], [x, -0.42]], i % 2 ? 'pink' : 'white')),
      rect(-1.3, -0.24, 0.15, -0.17, 'white'),
      stripe(f.tail.x, f.nose.x, 0.1, 0.08, 'accent'), ...[-1.3, -0.9, -0.5, -0.1, 0.3].map((x) => ell(x, 0.02, 0.18, 0.08, 'white')),
      poly([[0.4, f.roof.y - 0.05], [0.52, f.roof.y - 0.05], [0.46, f.roof.y - 0.4]], 'tan'), circ(0.46, f.roof.y - 0.48, 0.13, 'pink'), circ(0.46, f.roof.y - 0.62, 0.08, 'red'),
    ],
  }],
  ['motorbike', 'Motorbike', 'Класичний швидкісний мотоцикл.', 'bike', ['#2a6ae0', '#ffffff'], {
    speed: 1.15,
    skin: (f) => [...bike(f, { style: 'sport' }), stripe(-0.2, 0.5, -0.02, 0.05, 'accent')],
  }],
  ['fire-truck', 'Fire Truck', 'Пожежна машина з драбиною. Брандспойт збиває суперника струменем води.', 'truck', ['#e02a2a', '#f0f0f0'], {
    gun: (f) => ({ at: [[f.deck.x1 + 0.85, -0.86]], aim: 4 }),
    parts: ['ladder', 'siren'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        rr(d.x0, -0.65, d.x1 + 0.05, 0.25, 0.06, 'body'),
        ...[0.15, 0.95, 1.75].map((dx) => rect(d.x0 + dx, -0.55, d.x0 + dx + 0.65, -0.1, 'grey', { ring: true })),
        ...[0.15, 0.95, 1.75].flatMap((dx) => [0.2, 0.4].map((dy) => rect(d.x0 + dx + 0.05, -0.55 + dy, d.x0 + dx + 0.6, -0.53 + dy, 'chrome', { flat: true }))),
        stripe(f.tail.x, f.nose.x, 0.02, 0.08, 'white'),
        ...ladder([d.x0 - 0.15, -0.75], [d.x1 + 0.8, -0.85], 0.16, 'chrome'),
        rect(d.x1 - 0.2, -0.88, d.x1 - 0.05, -0.65, 'dark'),
        ...lightbar(f.roof.x0 + 0.05, f.roof.x1 - 0.1, f.roof.y, 'red', 'red'),
        circ(-0.65, 0.05, 0.14, 'gold'), circ(-0.65, 0.05, 0.06, 'dark'),
      ];
    },
  }],
  ['police-car', 'Police Car', 'Патрульний седан. Сирена відкидає суперника звуковою хвилею.', 'sedan', ['#1a2a5a', '#ffffff'], {
    parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { bumper: 'black' }),
      blob([[-1.0, -0.14], [0.85, -0.14], [0.85, 0.16], [-1.0, 0.16]], 'white', {}, 1),
      ...door(-1.0, -0.14, -0.08, 0.22, 'white'), ...door(-0.04, -0.14, 0.85, 0.22, 'white'),
      starShape(-0.5, 0.02, 0.12, 'gold'),
      ...lightbar(-0.65, 0.15, f.roof.y),
      rect(f.nose.x - 0.12, 0.0, f.nose.x + 0.1, 0.28, 'black'),
    ],
  }],
  ['cherry-picker', 'Cherry Picker', 'Автовишка з люлькою на стрілі.', 'truck', ['#f0f0f0', '#ff8a1a'], {
    parts: ['boom'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        stripe(f.tail.x, f.nose.x, 0.04, 0.08, 'accent'),
        rr(d.x0 + 0.05, d.y - 0.3, d.x0 + 0.7, d.y + 0.05, 0.04, 'grey'),
        ...path([[d.x0 + 0.35, d.y - 0.2], [d.x0 + 0.48, d.y - 1.45]], 0.16, 'accent'),
        seg([d.x0 + 0.5, d.y - 0.15], [d.x0 + 0.5, d.y - 1.0], 0.06, 'chrome'),
        rr(d.x0 + 0.2, d.y - 1.62, d.x0 + 0.85, d.y - 1.38, 0.04, 'accent'),
        ...[0.25, 0.5, 0.75].map((dx) => rect(d.x0 + dx, d.y - 1.88, d.x0 + dx + 0.06, d.y - 1.6, 'chrome')),
        rect(d.x0 + 0.2, d.y - 1.92, d.x0 + 0.85, d.y - 1.85, 'chrome'),
        ...beacon(f.roof.x0 + 0.35, f.roof.y, 'orange', 0.14),
        ...[0.1, 1.4].map((dx) => rect(d.x0 + dx, d.y, d.x0 + dx + 0.08, 0.3, 'dark')),
      ];
    },
  }],
  ['golf-cart', 'Golf Cart', 'Електричний гольф-кар. Б\'є м\'ячиком для гольфу точно в шолом.', 'buggy', ['#f0f0f0', '#3ab04a'], {
    s: 0.85,
    skin: (f) => [
      blob([[f.tail.x, 0.22], [f.tail.x, -0.15], [-0.3, -0.12], [0.6, -0.1], [f.nose.x, 0.0], [f.nose.x, 0.22]], 'body', {}, 1),
      ...seat(f.head.x + 0.05, -0.12, 0.42, 'accent'),
      seg([-0.85, -0.12], [-0.75, f.roof.y], 0.07, 'chrome'), seg([0.6, -0.12], [0.35, f.roof.y], 0.07, 'chrome'),
      rr(f.roof.x0 - 0.15, f.roof.y - 0.12, f.roof.x1 + 0.15, f.roof.y + 0.02, 0.05, 'accent'),
      pane(0.3, f.roof.y + 0.05, 0.58, -0.15, 0.2),
      rr(f.tail.x + 0.02, -0.72, f.tail.x + 0.32, -0.08, 0.06, 'black'),
      ...[0.06, 0.16, 0.24].map((dx, i) => seg([f.tail.x + dx + 0.04, -0.72], [f.tail.x + dx - 0.02 + i * 0.05, -1.05], 0.05, 'chrome')),
      ...fenders(f, 'body', 0.08), wheelPlate(f.nose.x - 0.25),
    ],
  }],
  ['baby-carriage', 'Baby Carriage', 'Дитячий візочок з каптуром і брязкальцем.', 'cart', ['#7ab0f0', '#ffffff'], {
    noLights: true,
    skin: (f) => [
      blob([[f.tail.x + 0.05, f.deck.y], [f.nose.x - 0.05, f.deck.y], [f.nose.x - 0.15, 0.12], [f.tail.x + 0.15, 0.12]], 'body', {}, 2),
      blob([[f.tail.x - 0.05, f.deck.y + 0.05], [f.tail.x + 0.05, f.deck.y - 0.6], [f.tail.x + 0.55, f.deck.y - 0.85], [f.tail.x + 0.85, f.deck.y + 0.05]], 'accent', {}, 2),
      ...[0.25, 0.45, 0.65].map((dx) => seg([f.tail.x + 0.1, f.deck.y], [f.tail.x + dx, f.deck.y - 0.75 + dx * 0.4], 0.05, 'white')),
      stripe(f.tail.x + 0.1, f.nose.x - 0.1, f.deck.y + 0.12, 0.08, 'white'),
      ...path([[f.tail.x + 0.05, f.deck.y + 0.1], [f.tail.x - 0.45, f.deck.y - 0.5]], 0.06, 'chrome'), rr(f.tail.x - 0.6, f.deck.y - 0.56, f.tail.x - 0.35, f.deck.y - 0.44, 0.04, 'black'),
      seg([0.0, 0.12], [-0.3, 0.4], 0.05, 'chrome'), seg([0.0, 0.12], [0.3, 0.4], 0.05, 'chrome'),
      circ(0.25, f.deck.y + 0.3, 0.1, 'gold'), circ(0.25, f.deck.y + 0.3, 0.05, 'red'),
    ],
  }],
  ['tanker-truck', 'Tanker Truck', 'Автоцистерна з небезпечним вантажем.', 'truck', ['#e0e0e0', '#3a6ad8'], {
    parts: ['tank'], hideParts: true,
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f, { mat: 'accent' }),
        tank(d.x0 - 0.05, d.x1 + 0.02, d.y - 0.4, 0.42, 'chrome'),
        stripe(d.x0, d.x1, d.y - 0.42, 0.1, 'accent'),
        ...[0.7, 1.5, 2.3].map((dx) => rect(d.x0 + dx, d.y - 0.82, d.x0 + dx + 0.06, d.y + 0.02, 'grey', { flat: true })),
        poly([[-0.4, d.y - 0.62], [-0.2, d.y - 0.42], [-0.4, d.y - 0.22], [-0.6, d.y - 0.42]], 'orange'), rect(-0.42, d.y - 0.5, -0.38, d.y - 0.36, 'black', { flat: true }),
        rr(d.x0 + 0.3, d.y - 0.9, d.x0 + 0.6, d.y - 0.8, 0.03, 'grey'),
      ];
    },
  }],
  ['roadster', 'Roadster', 'Відкритий дводверний спорткар зі стрічками на капоті.', 'coupe', ['#c02a2a', '#f0e0c0'], {
    o: o({ open: true }), speed: 1.1,
    skin: (f) => [
      ...sedan(f, { roof: 'open', top: -0.55, rx1: 0.3 }),
      stripe(0.3, f.nose.x - 0.1, -0.12, 0.05, 'accent'), stripe(0.3, f.nose.x - 0.1, -0.03, 0.05, 'accent'),
      ...seat(f.head.x + 0.02, -0.16, 0.35, 'brown'),
      ell(f.tail.x + 0.4, -0.22, 0.2, 0.08, 'black'),
    ],
  }],
  ['rowboat', 'Rowboat', 'Дерев\'яний човен із веслами на колесах.', 'boat', ['#a06a3a', '#e0c080'], {
    s: 0.85, o: o({ mat: 'wood' }), noLights: true,
    skin: (f) => [
      blob([[f.tail.x - 0.05, -0.5], [f.nose.x + 0.1, -0.6], [f.nose.x - 0.2, -0.1], [f.nose.x - 0.6, 0.12], [f.tail.x + 0.3, 0.12]], 'wood', {}, 1),
      stripe(f.tail.x, f.nose.x - 0.1, -0.42, 0.08, 'accent'),
      ...path([[-0.7, -0.7], [0.3, 0.25]], 0.07, 'tan'), ell(0.35, 0.28, 0.18, 0.07, 'tan'),
      ...path([[-0.3, -0.7], [-1.3, 0.2]], 0.07, 'tan'), ell(-1.35, 0.24, 0.18, 0.07, 'tan'),
      ell(-1.05, -0.62, 0.16, 0.08, 'orange'),
    ],
  }],
  ['sports-car', 'Sports Car', 'Низький швидкісний спорткар з антикрилом.', 'sports', ['#ff2a2a', '#1a1a1a'], {
    parts: ['wing'], hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', top: -0.5, rx0: -0.7, rx1: 0.05, glass: 'dark', bumper: 'black' }),
      seg([f.tail.x + 0.25, -0.12], [f.tail.x + 0.2, -0.38], 0.07, 'black'), rr(f.tail.x - 0.1, -0.5, f.tail.x + 0.55, -0.36, 0.03, 'black'),
      stripe(f.tail.x, f.nose.x - 0.1, -0.03, 0.06, 'accent'),
      poly([[0.65, 0.04], [1.0, 0.04], [0.95, 0.14], [0.7, 0.14]], 'black'),
    ],
  }],
  ['superstar-dragster', 'Superstar Dragster', 'Зірковий дрегстер із ракетою й плавником.', 'dragster', ['#c02ae0', '#ffd23f'], {
    parts: ['booster', 'fin'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.4, -0.15], [f.tail.x - 0.1, -1.0], [f.tail.x + 0.35, -0.95], [f.tail.x + 1.0, -0.15]], 'accent'),
      rr(f.tail.x - 0.35, -0.12, f.tail.x + 0.1, 0.12, 0.05, 'grey'), rr(f.tail.x - 0.45, -0.08, f.tail.x - 0.3, 0.08, 0.03, 'red'),
      blob([[f.tail.x + 0.3, 0.22], [f.tail.x + 0.35, -0.22], [-0.6, -0.3], [-0.2, -0.16], [f.nose.x - 0.3, 0.02], [f.nose.x, 0.08], [f.nose.x, 0.16], [f.tail.x + 0.4, 0.26]], 'body', {}, 1),
      ...seat(-0.95, -0.15, 0.45, 'accent'),
      starShape(0.4, 0.02, 0.16), starShape(1.3, 0.08, 0.1), starShape(f.tail.x + 0.4, -0.6, 0.14, 'white'),
    ],
  }],
  ['toxic-truck', 'Toxic Waste Truck', 'Вантажівка з токсичними бочками. Скинута бочка вибухає від дотику.', 'truck', ['#3a3a3a', '#7aff3a'], {
    cargo: ['barrel', 3],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.35, 'accent'))],
    skin: (f) => [
      ...truckCab(f),
      rr(f.deck.x0, f.deck.y - 0.3, f.deck.x0 + 0.1, f.deck.y + 0.05, 0.02, 'accent'),
      rr(f.deck.x0, f.deck.y - 0.02, f.deck.x1, f.deck.y + 0.1, 0.03, 'accent'),
      ...[0, 1, 2, 3, 4, 5].map((i) => poly([[f.tail.x + 0.1 + i * 0.5, 0.3], [f.tail.x + 0.3 + i * 0.5, 0.3], [f.tail.x + 0.45 + i * 0.5, 0.1], [f.tail.x + 0.25 + i * 0.5, 0.1]], 'yellow', { flat: true })),
      circ(1.45, -0.2, 0.12, 'yellow'), ...[0, 1, 2].map((i) => poly([[1.45, -0.2], [1.45 + Math.cos(i * 2.1) * 0.11, -0.2 + Math.sin(i * 2.1) * 0.11], [1.45 + Math.cos(i * 2.1 + 0.8) * 0.11, -0.2 + Math.sin(i * 2.1 + 0.8) * 0.11]], 'black', { flat: true })),
    ],
  }],
  ['helmet-car', 'Helmet Car', 'Машина-шолом: візор, гребінь і шолом, який береже голову.', 'blob', ['#ffd23f', '#e02a2a'], {
    o: o({ shape: 'egg' }), noLights: true,
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      blob([[0.1, -0.85], [0.9, -0.5], [0.95, -0.15], [0.2, -0.28]], 'glass', {}, 1),
      blob([[-0.15, -1.28], [0.05, -1.32], [0.05, 0.15], [-0.15, 0.15]], 'accent', {}, 1),
      stripe(-0.85, 0.85, -0.05, 0.1, 'accent'), circ(-0.5, -0.5, 0.1, 'white'),
    ],
  }],
  ['muscle-car', 'Muscle Car', 'Потужне купе з подвійними гоночними смугами.', 'coupe', ['#ff8a1a', '#1a1a1a'], {
    parts: ['wing'], speed: 1.1, accel: 1.1, hideParts: true,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', bumper: 'chrome' }),
      stripe(f.tail.x, f.nose.x - 0.1, -0.12, 0.05, 'accent'), stripe(f.tail.x, f.nose.x - 0.05, -0.04, 0.05, 'accent'),
      rr(0.55, -0.3, 1.0, -0.14, 0.04, 'black'),
      seg([f.tail.x + 0.2, -0.14], [f.tail.x + 0.15, -0.34], 0.06, 'black'), rr(f.tail.x - 0.05, -0.42, f.tail.x + 0.45, -0.32, 0.03, 'black'),
      ...grille(f.nose.x - 0.06, -0.1, f.nose.x + 0.03, 0.14, 2),
    ],
  }],
]);

function wheelPlate(x: number): CarPoly {
  return rr(x - 0.1, -0.1, x + 0.1, 0.0, 0.03, 'chrome');
}
