import { blob, bumper, circ, ell, eyeball, fangs, headlight, path, poly, rect, rr, seat, seg, spikesAlong, stripe, taillight, windows } from '../draw';
import { beast, bike, carriage, fenders, hover, loco, pickup } from '../skins';
import type { CarPoly } from '../types';
import { group, o } from './util';

/** Pumpkin with ribs and a carved face, centred at (cx, cy). */
function jackOLantern(cx: number, cy: number, rx: number, ry: number, face = true): CarPoly[] {
  const out: CarPoly[] = [
    ell(cx - rx * 0.45, cy, rx * 0.6, ry, 'orange'), ell(cx + rx * 0.45, cy, rx * 0.6, ry, 'orange'), ell(cx, cy, rx * 0.6, ry * 1.02, 'orange'),
    rr(cx - 0.06, cy - ry - 0.2, cx + 0.06, cy - ry + 0.05, 0.03, 'leaf'),
  ];
  if (face) {
    out.push(poly([[cx + rx * 0.05, cy - ry * 0.15], [cx + rx * 0.35, cy - ry * 0.15], [cx + rx * 0.2, cy - ry * 0.5]], 'yellow'));
    out.push(poly([[cx + rx * 0.45, cy - ry * 0.15], [cx + rx * 0.75, cy - ry * 0.15], [cx + rx * 0.6, cy - ry * 0.5]], 'yellow'));
    out.push(poly([[cx - rx * 0.05, cy + ry * 0.15], [cx + rx * 0.85, cy + ry * 0.15], [cx + rx * 0.7, cy + ry * 0.5], [cx + rx * 0.1, cy + ry * 0.5]], 'yellow'));
  }
  return out;
}

export const HALLOWEEN = group('halloween', [
  ['hearse', 'Hearse', 'Чорний катафалк із труною в кузові та фіранками на вікнах.', 'pickup', ['#1a1a1a', '#b090e0'], {
    // Physically an open bed (the coffin lies in it); the skin closes it into a hearse body.
    o: o({ len: 1.15 }), cargo: ['coffin', 1],
    skin: (f) => {
      const x0 = f.tail.x, x1 = f.nose.x, top = f.roof.y, bot = f.nose.y1;
      return [
        blob([[x0, bot], [x0, top + 0.15], [x0 + 0.15, top], [f.roof.x1 + 0.05, top], [0.95, -0.3], [x1 - 0.1, -0.22], [x1, -0.05], [x1, bot]], 'body', {}, 1),
        poly([[f.roof.x1 + 0.05, top + 0.08], [0.88, -0.32], [f.roof.x1 + 0.05, -0.32]], 'glass'),
        ...windows(x0 + 0.2, x0 + 1.1, top + 0.12, top + 0.45, 2, 0.12),
        ...[x0 + 0.2, x0 + 0.67].flatMap((x) => [rect(x, top + 0.12, x + 0.12, top + 0.45, 'accent', { flat: true }), rect(x + 0.31, top + 0.12, x + 0.43, top + 0.45, 'accent', { flat: true })]),
        ...path([[x0 + 1.3, top + 0.15], [x0 + 1.55, top + 0.35], [x0 + 1.3, top + 0.55]], 0.05, 'chrome'),
        stripe(x0, x1, 0.02, 0.05, 'chrome'),
        rr(x0 + 0.1, top - 0.06, f.roof.x1 - 0.1, top + 0.02, 0.03, 'chrome'),
        headlight(x1 - 0.06, 0.08, 0.09), taillight(x0, 0.06, 0.09),
        bumper(x1 - 0.2, x1 + 0.06, bot - 0.04, 0.12), bumper(x0 - 0.06, x0 + 0.2, bot - 0.04, 0.12),
      ];
    },
  }],
  ['rocking-horse', 'Horse', 'Іграшковий кінь-гойдалка на коліщатках. Стає дибки й стрибає.', 'creature', ['#8a5a3a', '#f0e0c0'], {
    parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => [
      ...path([[-1.15, 0.5], [-0.6, 0.6], [0.6, 0.6], [1.15, 0.5]], 0.12, 'red'),
      ...beast(f, { mat: 'tan', rx: 0.95, ry: 0.36 }),
      ...[-0.75, -0.4, 0.3, 0.65].map((x, i) => circ(x, -0.25 + (i % 2) * 0.12, 0.08, 'brown')),
      ...path([[0.7, -0.35], [1.15, -0.85]], 0.3, 'tan'),
      blob([[1.0, -1.0], [1.3, -1.12], [1.85, -0.9], [1.8, -0.72], [1.1, -0.78]], 'tan', {}, 1),
      ...[0.75, 0.9, 1.05, 1.2].map((x, i) => poly([[x - 0.12, -0.45 - i * 0.12], [x + 0.08, -0.58 - i * 0.12], [x - 0.18, -0.85 - i * 0.12]], 'brown')),
      poly([[1.22, -1.08], [1.34, -1.1], [1.27, -1.3]], 'tan'),
      circ(1.5, -0.95, 0.05, 'black'), circ(1.82, -0.82, 0.04, 'black'),
      blob([[-0.45, -0.58], [0.25, -0.58], [0.2, -0.3], [-0.4, -0.3]], 'red', {}, 1), rect(-0.12, -0.3, -0.05, 0.15, 'gold'),
      ...path([[-0.95, -0.3], [-1.35, -0.1], [-1.4, 0.2]], 0.14, 'brown'),
    ],
  }],
  ['chariot', 'Chariot', 'Антична бойова колісниця з шипами на осях. Атакує ривком.', 'cart', ['#c8a040', '#e02a2a'], {
    o: o({ len: 1.2, wheel: 1.6, rim: 'spokes' }), parts: ['spikes'],
    skin: (f) => [
      blob([[f.tail.x + 0.1, f.deck.y + 0.15], [f.tail.x, f.deck.y - 0.35], [f.tail.x + 0.3, f.deck.y - 0.1], [f.nose.x - 0.2, f.deck.y - 0.15], [f.nose.x, f.deck.y - 0.6], [f.nose.x + 0.05, f.deck.y + 0.1], [f.nose.x - 0.2, 0.18], [f.tail.x + 0.2, 0.18]], 'gold', {}, 1),
      circ(0.05, -0.2, 0.26, 'accent'), circ(0.05, -0.2, 0.1, 'gold'),
      ...path([[f.nose.x - 0.1, f.deck.y], [f.nose.x + 0.55, f.deck.y - 0.25]], 0.06, 'wood'),
      ...path([[f.tail.x + 0.2, f.deck.y - 0.1], [f.tail.x + 0.15, f.deck.y - 0.7]], 0.05, 'wood'), poly([[f.tail.x + 0.18, f.deck.y - 0.7], [f.tail.x + 0.6, f.deck.y - 0.6], [f.tail.x + 0.18, f.deck.y - 0.45]], 'accent'),
    ],
  }],
  ['spiky-car', 'Spiky Car', 'Шипований броньовик пустельних рейдерів: шипи спереду й на даху.', 'pickup', ['#6a5a4a', '#c0c0c0'], {
    parts: ['spikes', 'roofspikes'],
    skin: (f) => [
      ...pickup(f),
      ...[[-1.2, 0.0], [-0.2, 0.1], [0.9, -0.05]].map(([x, y]) => ell(x, y, 0.16, 0.1, 'orange')),
      ...[-1.4, -0.95, -0.5].flatMap((x) => [rect(x, f.deck.y - 0.25, x + 0.06, f.deck.y, 'grey')]),
      rect(f.roof.x0 + 0.1, f.roof.y + 0.08, f.roof.x1 - 0.05, f.roof.y + 0.2, 'grey'), ...[0, 1, 2, 3].map((i) => rect(f.roof.x0 + 0.15 + i * 0.16, f.roof.y + 0.2, f.roof.x0 + 0.2 + i * 0.16, f.nose.y0 - 0.06, 'grey', { flat: true })),
    ],
  }],
  ['pumpkin-carriage', 'Pumpkin Carriage', 'Казкова карета-гарбуз. Метає гарбузи, що вибухають.', 'carriage', ['#ff8a1a', '#3aa04a'], {
    noLights: true,
    skin: (f) => [
      rr(f.tail.x + 0.05, 0.06, f.nose.x - 0.05, 0.18, 0.04, 'gold'),
      ...jackOLantern(0, (f.roof.y + 0.2) / 2, 1.0, (0.2 - f.roof.y) / 2, false),
      ...path([[0.05, f.roof.y], [0.25, f.roof.y - 0.3], [0.45, f.roof.y - 0.35]], 0.07, 'leaf'), ell(0.35, f.roof.y - 0.12, 0.18, 0.08, 'leaf'),
      ...path([[-0.6, f.roof.y + 0.1], [-0.9, f.roof.y - 0.2], [-1.0, f.roof.y - 0.05]], 0.04, 'leaf'),
      ...[-1.0, 1.0].map((x) => path([[x, 0.12], [x * 1.1, 0.4]], 0.05, 'gold')).flat(),
    ],
  }],
  ['ghost-train', 'Ghost Train', 'Примарний паротяг: проходить крізь суперника, як туман.', 'loco', ['#d0d8e4', '#8a7ab0'], {
    float: 0.85, noLights: true,
    skin: (f) => [
      ...loco(f, { boiler: 'body', trim: 'accent' }),
      ell(f.nose.x - 0.3, -0.32, 0.26, 0.26, 'white'), circ(f.nose.x - 0.38, -0.38, 0.05, 'black'), circ(f.nose.x - 0.22, -0.38, 0.05, 'black'), ell(f.nose.x - 0.3, -0.22, 0.06, 0.08, 'black'),
      ...[-1.3, -0.6, 0.1].map((x, i) => ell(x, f.roof.y - 0.3 - i * 0.12, 0.25, 0.14, 'white')),
    ],
  }],
  ['broom-bike', 'Broom Bike', 'Відьмина мітла з моторчиком. Злітає й ширяє над ареною.', 'bike', ['#a0703a', '#e0c060'], {
    o: o({ mat: 'wood' }), float: 0.7, noLights: true,
    skin: (f) => [
      ...path([[-0.65, -0.1], [f.nose.x + 0.2, -0.25]], 0.1, 'wood'),
      ...[-0.15, -0.05, 0.05, 0.15].map((d) => poly([[-0.6, -0.12 + d * 0.5], [-0.6, -0.04 + d * 0.5], [-1.4, d * 2.5]], 'tan')),
      rr(-0.72, -0.22, -0.58, 0.05, 0.03, 'red'),
      rr(-0.1, -0.12, 0.35, 0.15, 0.05, 'grey'), ...path([[0.0, 0.15], [-0.4, 0.22]], 0.06, 'chrome'),
      seg([-0.4, -0.1], [-0.6, 0.3], 0.05, 'wood'), seg([0.6, -0.2], [0.85, 0.3], 0.05, 'wood'),
      poly([[-0.42, -0.95], [0.12, -0.95], [-0.05, -1.5], [-0.25, -1.3]], 'black'), rr(-0.55, -1.0, 0.25, -0.92, 0.03, 'black'), rect(-0.4, -1.06, 0.1, -1.0, 'purple', { flat: true }),
    ],
  }],
  ['invisible-car', 'Invisible Car', 'Прозорий парящий кузов. На мить зникає зовсім.', 'hover', ['#c0e8ff', '#ffffff'], {
    o: o({ mat: 'glass' }),
    skin: (f) => [...hover(f, { mat: 'glass', glow: 'white', canopy: 'white' }), stripe(f.tail.x + 0.1, f.nose.x - 0.2, -0.05, 0.05, 'white')],
  }],
  ['skeletal-ride', 'Skeletal Ride', 'Багі з кісток із черепом спереду. Кидається кістками.', 'buggy', ['#e8dcc0', '#2a2a2a'], {
    o: o({ mat: 'bone' }), parts: ['skull'], hideParts: true,
    skin: (f) => [
      ...path([[f.tail.x, 0.1], [f.nose.x - 0.2, 0.05]], 0.14, 'bone'),
      ...[-1.0, -0.7, -0.4, -0.1, 0.2].map((x) => path([[x, 0.05], [x + 0.05, -0.25], [x + 0.15, -0.3]], 0.07, 'bone')).flat(),
      ...path([[-0.8, 0.05], [-0.65, -0.95], [0.3, -0.95]], 0.09, 'bone'), seg([0.62, -0.05], [0.48, -0.42], 0.09, 'bone'),
      ...seat(f.head.x + 0.05, -0.1, 0.4, 'black'),
      circ(f.nose.x - 0.25, -0.18, 0.3, 'bone'), rr(f.nose.x - 0.42, -0.02, f.nose.x - 0.08, 0.15, 0.04, 'bone'),
      circ(f.nose.x - 0.32, -0.2, 0.08, 'black'), circ(f.nose.x - 0.12, -0.2, 0.07, 'black'),
      ...[0, 1, 2].map((i) => rect(f.nose.x - 0.38 + i * 0.1, 0.04, f.nose.x - 0.34 + i * 0.1, 0.15, 'black', { flat: true })),
    ],
  }],
  ['beast', 'Beast', 'Ікластий монстр-кар із рогами. Ричить так, що відлітають машини.', 'monster', ['#5a2a6a', '#ff3a3a'], {
    o: o({ open: true }),
    parts: ['fangs', 'horns'], hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x * 0.8, -0.1], 0.14, 'dark')),
      blob([[f.tail.x - 0.1, 0.1], [f.tail.x, -0.6], [-0.6, -1.0], [0.4, -1.1], [f.nose.x - 0.1, -0.7], [f.nose.x + 0.1, -0.2], [f.nose.x - 0.1, 0.15]], 'body', {}, 2),
      ...[-1.2, -0.8, -0.4].map((x) => poly([[x, -0.85 + x * 0.15], [x + 0.25, -0.95 + x * 0.12], [x + 0.05, -1.25 + x * 0.1]], 'accent')),
      
      poly([[f.nose.x - 0.75, -0.55], [f.nose.x - 0.35, -0.42], [f.nose.x - 0.4, -0.32], [f.nose.x - 0.72, -0.4]], 'yellow'),
      circ(f.nose.x - 0.5, -0.4, 0.04, 'black'),
      poly([[f.nose.x - 0.9, -0.15], [f.nose.x + 0.05, -0.2], [f.nose.x - 0.05, 0.05], [f.nose.x - 0.85, 0.05]], 'black'),
      ...fangs(f.nose.x - 0.85, f.nose.x - 0.05, -0.17, 5, 0.14), ...fangs(f.nose.x - 0.8, f.nose.x - 0.1, 0.05, 4, 0.1, true),
    ],
  }],
  ['ghost-bike', 'Ghost Bike', 'Мотоцикл-привид у примарному сяйві.', 'bike', ['#d0e0f0', '#7a6ab0'], {
    float: 0.8, noLights: true,
    skin: (f) => [
      blob([[-0.6, -0.15], [-1.0, -0.5], [-1.5, -0.4], [-1.25, -0.1], [-1.6, 0.1], [-1.2, 0.2], [-0.6, 0.2]], 'white', {}, 1),
      ...bike(f, { mat: 'accent' }),
      ell(0.42, -0.15, 0.06, 0.08, 'black'), ell(0.57, -0.15, 0.06, 0.08, 'black'),
    ],
  }],
  ['pumpkin-car', 'Pumpkin Car', 'Гарбуз-ліхтар на колесах із вирізаною усмішкою.', 'blob', ['#ff7a1a', '#2a8a3a'], {
    noLights: true,
    skin: () => [
      ...jackOLantern(0, -0.38, 0.98, 0.72),
      ...path([[-0.05, -1.08], [0.05, -1.4], [0.25, -1.45]], 0.1, 'leaf'), ell(0.25, -1.12, 0.2, 0.08, 'leaf'),
    ],
  }],
  ['dracula-carriage', 'Dracula\'s Carriage', 'Готична карета вампіра. Розкриває кажанячі крила й летить.', 'carriage', ['#2a1a2a', '#c02a3a'], {
    parts: ['lantern'], hideParts: true,
    skin: (f) => [
      poly([[-0.6, f.roof.y + 0.3], [-1.6, f.roof.y - 0.4], [-1.45, f.roof.y - 0.05], [-1.75, f.roof.y + 0.05], [-1.5, f.roof.y + 0.25], [-1.7, f.roof.y + 0.4], [-0.6, f.roof.y + 0.55]], 'black'),
      ...carriage(f, { trim: 'accent' }),
      rr(-0.45, f.roof.y + 0.2, 0.45, f.roof.y + 0.6, 0.15, 'accent'), rr(-0.38, f.roof.y + 0.26, 0.38, f.roof.y + 0.55, 0.12, 'glass'),
      ...spikesAlong(-0.9, 0.9, f.roof.y - 0.06, 6, 0.2, 'gold'),
      ...fenders(f, 'black', 0.08),
      ...path([[f.nose.x - 0.3, -0.2], [f.nose.x - 0.3, -0.75]], 0.05, 'black'), ell(f.nose.x - 0.3, -0.85, 0.12, 0.15, 'red'), rect(f.nose.x - 0.42, -1.04, f.nose.x - 0.18, -0.98, 'gold'),
      ...eyeball(-0.25, f.roof.y + 0.35, 0.05, 'red'), ...eyeball(0.0, f.roof.y + 0.35, 0.05, 'red'),
    ],
  }],
]);
