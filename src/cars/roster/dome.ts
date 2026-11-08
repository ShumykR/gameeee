import { O, P, R, T, bar, eye, flames, line, teeth } from '../art';
import { group, o } from './util';

export const DOME = group('dome', [
  ['rickshaw', 'Rickshaw', 'Триколісна рикша з парасолькою над пасажиром.', 'trike', ['#e0b020', '#2a6a3a'], {
    parts: ['umbrella'],
    art: () => [R(-1.3, -0.3, -0.6, -0.05, 'accent'), line([0.6, -0.2], [0.8, -0.65], 0.05), bar(0.7, -0.65, 0.95, 0.05)],
  }],
  ['quad-bike', 'Quad Bike', 'Маневрений квадроцикл із багажником.', 'buggy', ['#e02a2a', '#2a2a2a'], {
    s: 0.85, o: o({ wheel: 1.1 }),
    art: () => [bar(-1.4, -0.25, -0.7, 0.06), bar(0.7, -0.25, 1.4, 0.06), P([[0.3, -0.12], [0.8, -0.3], [0.85, -0.1]], 'accent')],
  }],
  ['compensator-bike', 'Compensator Bike', 'Надмірно довгий чопер: вилка до неба.', 'bike', ['#c0c0c8', '#e02a2a'], {
    o: o({ len: 1.4 }),
    art: () => [line([0.9, -0.2], [1.25, -1.0], 0.06), bar(1.1, -1.0, 1.4, 0.05), ...flames(0.6, -0.5, -0.05, 0.16)],
  }],
  ['lucky-shark', 'Lucky Shark Mobile', 'Машина-акула з плавником і зубатою пащею.', 'sports', ['#6a8ab0', '#ffffff'], {
    parts: ['fin'], noLights: true,
    art: (f) => [P([[f.tail.x, 0.08], [f.nose.x, 0.08], [f.nose.x - 0.1, 0.26], [f.tail.x, 0.26]], 'white'), ...teeth(f.nose.x - 0.6, f.nose.x - 0.05, 0.06, 5, 0.12), ...eye(f.nose.x - 0.55, -0.1, 0.07), ...[0.4, 0.55, 0.7].map((x) => R(x, -0.05, x + 0.04, 0.08, 'dark'))],
  }],
  ['prison-van', 'Prison Van', 'Броньований автозак із ґратами на вікнах і тараном.', 'van', ['#e0e0e0', '#3a3a6a'], {
    parts: ['ram'],
    art: (f) => [R(f.tail.x, -0.05, f.nose.x, 0.05, 'accent'), ...[-1.3, -1.15, -1.0, -0.7, -0.55, -0.4].map((x) => R(x, f.roof.y + 0.12, x + 0.04, f.roof.y + 0.48, 'black'))],
  }],
  ['hovercraft', 'Hovercraft', 'Судно на повітряній подушці з великим гвинтом. Ширяє над землею.', 'boat', ['#e0c020', '#2a2a2a'], {
    parts: ['propeller'], float: 0.85,
    art: () => [P([[-1.75, 0.05], [1.9, 0.0], [1.6, 0.3], [-1.6, 0.3]], 'black'), O(-1.75, -0.65, 0.12, 0.42, 'dark')],
  }],
  ['saw-bike', 'Saw Bike', 'Мотоцикл із циркулярною пилкою замість переднього крила.', 'bike', ['#3a3a3a', '#ffd23f'], {
    parts: [['saw', 0.7]], wheelie: 1.0, air: 1.4,
    art: () => [R(-0.7, -0.15, 0.5, -0.08, 'accent')],
  }],
  ['shopping-cart', 'Shopping Cart', 'Візок із супермаркету з мотором. Покупки сиплються на ходу.', 'cart', ['#c0c8d0', '#e02a2a'], {
    o: o({ mat: 'metal' }), cargo: ['melon', 3], noLights: true,
    art: (f) => [
      ...[-0.6, -0.3, 0.0, 0.3, 0.6].map((x) => R(x, f.deck.y + 0.05, x + 0.04, 0.12, 'dark')),
      R(f.tail.x, f.deck.y + 0.25, f.nose.x, f.deck.y + 0.29, 'dark'),
      line([f.tail.x, f.deck.y], [f.tail.x - 0.35, f.deck.y - 0.4], 0.06), bar(f.tail.x - 0.5, f.deck.y - 0.4, f.tail.x - 0.25, 0.08, 'accent'),
    ],
  }],
  ['two-sider', 'Two Sider', 'Двостороння машина: шипи спереду, кабіна по центру.', 'box', ['#7a3ae0', '#ffd23f'], {
    o: o({ tall: 0.7 }), parts: ['spikes'],
    art: (f) => [T([f.tail.x + 0.05, -0.55], [f.tail.x + 0.05, -0.25], [f.tail.x - 0.4, -0.4], 'spike'), R(f.tail.x, -0.05, f.nose.x, 0.05, 'accent')],
  }],
  ['monster-bus', 'Monster Bus', 'Шкільний автобус на колесах монстр-трака.', 'bus', ['#ffd020', '#1a1a1a'], {
    o: o({ wheel: 1.5, rim: 'monster' }), arch: 'monster',
    art: (f) => [R(f.tail.x, -0.05, f.nose.x, 0.02, 'accent'), R(f.tail.x, 0.1, f.nose.x, 0.17, 'accent'), R(f.nose.x - 0.05, 0.1, f.nose.x + 0.15, 0.3, 'black')],
  }],
  ['rock-wheel', 'Rock Wheel', 'Кам\'яна таратайка на важких кам\'яних колесах.', 'kart', ['#8a8070', '#c0b090'], {
    s: 1.1, o: o({ wheel: 1.5 }), mass: 1.2, noLights: true,
    art: () => [O(-0.3, -0.05, 0.2, 0.08, 'dark'), O(0.4, 0.1, 0.15, 0.06, 'dark')],
  }],
  ['tow-truck', 'Tow Truck', 'Евакуатор із гаком на тросі: чіпляє суперника й тягне до себе.', 'truck', ['#f0a020', '#2a2a2a'], {
    o: o({ wheels: 2 }), parts: ['crane'],
    art: (f) => [R(f.roof.x0 + 0.1, f.roof.y - 0.1, f.roof.x0 + 0.5, f.roof.y, 'rocket'), R(f.tail.x, 0.0, f.nose.x, 0.06, 'accent')],
  }],
]);
