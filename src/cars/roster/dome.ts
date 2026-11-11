import { blob, circ, ell, eyeball, fangs, flameDecal, path, poly, rect, rr, seg, spikesAlong, stripe, truss, windows } from '../draw';
import { bike, boxy, truckCab } from '../skins';
import { group, o } from './util';

export const DOME = group('dome', [
  ['rickshaw', 'Rickshaw', 'Триколісна рикша з парасолькою над пасажиром.', 'trike', ['#e0b020', '#2a6a3a'], {
    parts: ['umbrella'], hideParts: true,
    skin: (f) => [
      ...bike(f, { style: 'scooter' }),
      blob([[-1.45, 0.15], [-1.5, -0.45], [-1.2, -0.55], [-0.6, -0.45], [-0.55, 0.15]], 'accent', {}, 1),
      rr(-1.4, -0.4, -0.7, -0.25, 0.05, 'red'),
      ...path([[-1.45, -0.45], [-1.4, -1.0]], 0.05, 'chrome'), ...path([[-0.6, -0.45], [-0.65, -1.0]], 0.05, 'chrome'),
      blob([[-1.65, -0.95], [-1.0, -1.3], [-0.4, -0.95]], 'accent', {}, 1), ...[-1.45, -1.2, -0.95, -0.7].map((x) => poly([[x - 0.08, -0.97], [x + 0.08, -0.97], [x, -0.88]], 'yellow')),
    ],
  }],
  ['quad-bike', 'Quad Bike', 'Маневрений квадроцикл із багажником.', 'buggy', ['#e02a2a', '#2a2a2a'], {
    s: 0.85, o: o({ wheel: 1.1, open: true }),
    // Backrest and handlebar post are solid: they keep the quad off its back.
    art: () => [{ ...rect(-0.78, -0.82, -0.66, -0.25, 'black'), deco: false }, { ...rect(0.3, -0.7, 0.4, -0.25, 'chrome'), deco: false }],
    skin: (f) => [
      rr(f.tail.x - 0.05, -0.32, -0.6, -0.22, 0.03, 'black'), rr(0.6, -0.32, f.nose.x + 0.05, -0.22, 0.03, 'black'),
      ...f.wheels.map((w) => blob([[w.x - w.r - 0.1, -0.05], [w.x - w.r, -0.25], [w.x + w.r, -0.25], [w.x + w.r + 0.1, -0.05]], 'body', {}, 1)),
      blob([[-0.8, 0.15], [-0.75, -0.15], [-0.2, -0.32], [0.4, -0.3], [0.7, 0.15]], 'body', {}, 1),
      rr(-0.6, -0.28, -0.05, -0.16, 0.05, 'black'), rr(-0.2, 0.0, 0.3, 0.25, 0.05, 'grey'),
      seg([0.3, -0.3], [0.4, -0.55], 0.06, 'chrome'), seg([0.42, -0.55], [0.2, -0.58], 0.07, 'black'),
      ...[-1.0, -0.85, -0.7].map((x) => rect(x, -0.38, x + 0.04, -0.32, 'black')),
    ],
  }],
  ['compensator-bike', 'Compensator Bike', 'Надмірно довгий чопер: вилка до неба.', 'bike', ['#c0c0c8', '#e02a2a'], {
    o: o({ len: 1.4 }),
    skin: (f) => [
      ...bike(f, { style: 'chopper' }),
      ...path([[f.wheels[1].x, f.wheels[1].y], [1.15, -1.0]], 0.08, 'chrome'), ...path([[1.15, -1.0], [1.0, -1.15], [0.8, -1.12]], 0.07, 'black'),
      ...flameDecal(0.6, -0.5, -0.12, 0.18),
    ],
  }],
  ['lucky-shark', 'Lucky Shark Mobile', 'Машина-акула з плавником і зубатою пащею.', 'sports', ['#6a8ab0', '#ffffff'], {
    parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => [
      poly([[-0.6, -0.3], [-0.3, -1.0], [0.0, -0.95], [0.3, -0.3]], 'body'),
      poly([[f.tail.x + 0.2, -0.1], [f.tail.x - 0.35, -0.6], [f.tail.x - 0.25, 0.0], [f.tail.x - 0.35, 0.35], [f.tail.x + 0.2, 0.15]], 'body'),
      blob([[f.tail.x, 0.24], [f.tail.x, -0.12], [-0.6, -0.32], [0.6, -0.32], [f.nose.x + 0.05, -0.05], [f.nose.x, 0.2], [f.nose.x - 0.2, 0.26]], 'body', {}, 1),
      blob([[f.tail.x + 0.05, 0.1], [f.nose.x, 0.08], [f.nose.x - 0.1, 0.26], [f.tail.x + 0.05, 0.26]], 'white', {}, 1),
      poly([[f.nose.x - 0.7, 0.05], [f.nose.x + 0.02, -0.02], [f.nose.x - 0.05, 0.16], [f.nose.x - 0.7, 0.16]], 'black'),
      ...fangs(f.nose.x - 0.68, f.nose.x - 0.05, 0.03, 5, 0.1), ...fangs(f.nose.x - 0.65, f.nose.x - 0.1, 0.16, 4, 0.08, true),
      ...eyeball(f.nose.x - 0.55, -0.12, 0.07),
      ...[0.3, 0.45, 0.6].map((x) => rect(x, -0.08, x + 0.04, 0.06, 'dark', { flat: true })),
    ],
  }],
  ['prison-van', 'Prison Van', 'Броньований автозак із ґратами на вікнах і тараном.', 'van', ['#e0e0e0', '#3a3a6a'], {
    parts: ['ram'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { round: 0.06, bumper: 'grey' }),
      ...windows(f.tail.x + 0.2, f.tail.x + 1.3, f.roof.y + 0.12, f.roof.y + 0.48, 2, 0.15, 'dark'),
      ...[0, 1, 2, 3, 4, 5].map((i) => rect(f.tail.x + 0.27 + i * 0.19, f.roof.y + 0.12, f.tail.x + 0.31 + i * 0.19, f.roof.y + 0.48, 'chrome', { flat: true })),
      stripe(f.tail.x, f.nose.x, -0.02, 0.12, 'accent'),
      rect(f.nose.x - 0.12, f.nose.y0 + 0.1, f.nose.x + 0.25, f.nose.y1 - 0.05, 'grey'),
      ...[0, 1, 2].map((i) => rect(f.nose.x + 0.05, f.nose.y0 + 0.15 + i * 0.15, f.nose.x + 0.25, f.nose.y0 + 0.2 + i * 0.15, 'dark', { flat: true })),
      ...[f.roof.x1 - 0.5, f.roof.x1 - 0.3].map((x, i) => rr(x, f.roof.y - 0.14, x + 0.18, f.roof.y, 0.04, i ? 'blue' : 'red')),
    ],
  }],
  ['hovercraft', 'Hovercraft', 'Судно на повітряній подушці з великим гвинтом. Ширяє над землею.', 'boat', ['#e0c020', '#2a2a2a'], {
    parts: ['propeller'], float: 0.85, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, 0.05], [f.nose.x + 0.1, 0.0], [f.nose.x - 0.2, 0.32], [f.tail.x + 0.15, 0.32]], 'black', {}, 2),
      blob([[f.tail.x + 0.1, 0.05], [f.tail.x + 0.1, -0.42], [f.nose.x - 0.3, -0.5], [f.nose.x + 0.05, -0.2], [f.nose.x, 0.05]], 'body', {}, 1),
      rr(-0.2, -0.88, 0.75, -0.42, 0.08, 'white'), ...windows(-0.1, 0.65, -0.8, -0.55, 2, 0.08),
      stripe(f.tail.x + 0.1, f.nose.x, -0.2, 0.07, 'accent'),
      circ(f.tail.x + 0.15, -0.65, 0.48, 'dark'), circ(f.tail.x + 0.15, -0.65, 0.4, 'grey'),
      seg([f.tail.x + 0.15, -1.0], [f.tail.x + 0.15, -0.3], 0.1, 'black'), circ(f.tail.x + 0.15, -0.65, 0.08, 'red'),
    ],
  }],
  ['saw-bike', 'Saw Bike', 'Мотоцикл із циркулярною пилкою замість переднього крила.', 'bike', ['#3a3a3a', '#ffd23f'], {
    parts: [['saw', 0.7]], wheelie: 1.0, air: 1.4,
    skin: (f) => [...bike(f, { style: 'sport' }), stripe(-0.7, 0.5, -0.12, 0.06, 'accent'), ...spikesAlong(-0.6, -0.1, -0.24, 3, 0.12, 'spike')],
  }],
  ['shopping-cart', 'Shopping Cart', 'Візок із супермаркету з мотором. Покупки сиплються на ходу.', 'cart', ['#c0c8d0', '#e02a2a'], {
    o: o({ mat: 'metal' }), cargo: ['melon', 3], noLights: true,
    skin: (f) => [
      poly([[f.tail.x, f.deck.y], [f.nose.x, f.deck.y], [f.nose.x - 0.18, 0.12], [f.tail.x + 0.18, 0.12]], 'grey', { flat: true }),
      ...[0, 1, 2, 3, 4, 5].map((i) => seg([f.tail.x + 0.08 + i * 0.3, f.deck.y], [f.tail.x + 0.2 + i * 0.27, 0.12], 0.05, 'chrome')),
      ...[0, 1, 2].map((i) => seg([f.tail.x + 0.05 + i * 0.06, f.deck.y + 0.2 + i * 0.22], [f.nose.x - 0.05 - i * 0.06, f.deck.y + 0.2 + i * 0.22], 0.05, 'chrome')),
      seg([f.tail.x, f.deck.y], [f.nose.x, f.deck.y], 0.07, 'chrome'),
      ...path([[f.tail.x, f.deck.y], [f.tail.x - 0.35, f.deck.y - 0.4]], 0.06, 'chrome'), rr(f.tail.x - 0.55, f.deck.y - 0.47, f.tail.x - 0.2, f.deck.y - 0.33, 0.05, 'accent'),
      rr(f.tail.x + 0.1, 0.12, f.nose.x - 0.1, 0.2, 0.03, 'chrome'),
    ],
  }],
  ['two-sider', 'Two Sider', 'Двостороння машина: шипи спереду, кабіна по центру.', 'box', ['#7a3ae0', '#ffd23f'], {
    o: o({ tall: 0.7 }), parts: ['spikes'],
    skin: (f) => [
      blob([[f.tail.x, 0.3], [f.tail.x, -0.2], [f.tail.x + 0.4, f.roof.y], [f.nose.x - 0.4, f.roof.y], [f.nose.x, -0.2], [f.nose.x, 0.3]], 'body', {}, 1),
      poly([[f.tail.x + 0.05, -0.55], [f.tail.x + 0.05, -0.25], [f.tail.x - 0.4, -0.4]], 'spike'),
      rr(-0.6, f.roof.y + 0.1, 0.6, f.roof.y + 0.38, 0.06, 'glass'),
      stripe(f.tail.x, f.nose.x, 0.0, 0.08, 'accent'),
      ...[f.tail.x, f.nose.x - 0.15].map((x) => rr(x, 0.2, x + 0.15, 0.32, 0.03, 'chrome')),
    ],
  }],
  ['monster-bus', 'Monster Bus', 'Шкільний автобус на колесах монстр-трака.', 'bus', ['#ffd020', '#1a1a1a'], {
    o: o({ wheel: 1.5, rim: 'monster' }), arch: 'monster',
    skin: (f) => [
      ...boxy(f, { slope: 0.15, slopeH: 0.5, round: 0.1, win: 5, winX: [f.tail.x + 0.15, f.nose.x - 0.4], winY: [f.roof.y + 0.12, f.roof.y + 0.45] }),
      stripe(f.tail.x, f.nose.x, -0.05, 0.07, 'accent'), stripe(f.tail.x, f.nose.x, 0.12, 0.07, 'accent'),
      rect(f.nose.x - 0.05, 0.05, f.nose.x + 0.15, 0.3, 'black'),
      rr(-0.4, f.roof.y + 0.55, 0.6, f.roof.y + 0.68, 0.03, 'black'),
      rect(f.nose.x - 0.95, f.roof.y + 0.1, f.nose.x - 0.55, 0.22, 'body', { ring: true }),
    ],
  }],
  ['rock-wheel', 'Rock Wheel', 'Кам\'яна таратайка на важких кам\'яних колесах.', 'kart', ['#8a8070', '#c0b090'], {
    s: 1.1, o: o({ wheel: 1.5 }), mass: 1.2, noLights: true,
    skin: (f) => [
      blob([[f.tail.x, 0.15], [f.tail.x + 0.1, -0.15], [0.0, -0.1], [f.nose.x - 0.05, -0.12], [f.nose.x + 0.05, 0.15]], 'grey', {}, 2),
      ell(-0.3, -0.03, 0.2, 0.07, 'dark'), ell(0.4, 0.06, 0.15, 0.05, 'dark'),
      rr(f.head.x - 0.3, -0.5, f.head.x - 0.12, -0.1, 0.06, 'grey'),
      ...path([[-0.2, 0.0], [-0.3, -0.25]], 0.08, 'wood'),
    ],
  }],
  ['tow-truck', 'Tow Truck', 'Евакуатор із гаком на тросі: чіпляє суперника й тягне до себе.', 'truck', ['#f0a020', '#2a2a2a'], {
    o: o({ wheels: 2 }), parts: ['crane'], hideParts: true,
    // A real hook on a cable: it swings behind the truck and clouts whoever tailgates.
    flail: { from: [-2.05, -1.22], len: 0.75, r: 0.24, look: 'anchor' },
    skin: (f) => {
      const d = f.deck;
      return [
        ...truckCab(f),
        ...[f.roof.x0 + 0.15, f.roof.x0 + 0.4].map((x, i) => rr(x, f.roof.y - 0.14, x + 0.22, f.roof.y, 0.04, i ? 'orange' : 'red')),
        rr(d.x0, d.y - 0.2, d.x1, d.y + 0.08, 0.04, 'dark'),
        ...truss([d.x1 - 0.1, d.y - 0.1], [d.x0 - 0.1, d.y - 1.1], 0.2, 'yellow'),
        stripe(f.tail.x, f.nose.x, 0.06, 0.07, 'accent'),
      ];
    },
  }],
]);

