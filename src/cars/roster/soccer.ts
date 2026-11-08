import { O, P, R, T, angryEye, checker, line, teeth } from '../art';
import { group, o } from './util';

export const SOCCER = group('soccer', [
  ['soccer-monster', 'Soccer Monster', 'Монстр-трак футбольної арени з вирячкуватими очима.', 'monster', ['#ffffff', '#2a2a2a'], {
    art: (f) => [...angryEye(f.nose.x - 0.55, -0.4, 0.13, 'black'), ...angryEye(f.nose.x - 0.22, -0.4, 0.11, 'black'), ...teeth(f.nose.x - 0.7, f.nose.x - 0.05, -0.1, 5, 0.12), ...[-1.1, -0.5].map((x) => P([[x, -0.45], [x + 0.2, -0.45], [x + 0.25, -0.25], [x + 0.1, -0.15], [x - 0.05, -0.25]], 'black'))],
  }],
  ['soccer-ball', 'Soccer Ball', 'Футбольний м\'яч на шасі: пружинить і відскакує.', 'blob', ['#ffffff', '#2a2a2a'], {
    o: o({ mat: 'white' }), bounce: 0.5, noLights: true,
    art: () => [...[[0, -0.35, 0.22], [-0.6, -0.65, 0.16], [0.6, -0.65, 0.16], [-0.62, 0.05, 0.14], [0.62, 0.05, 0.14]].map(([x, y, r]) => P([[x, y - r], [x + r, y - r * 0.3], [x + r * 0.6, y + r], [x - r * 0.6, y + r], [x - r, y - r * 0.3]], 'black'))],
  }],
  ['soccer-delivery', 'Soccer Delivery Truck', 'Вантажівка з сіткою м\'ячів. М\'ячі розлітаються по арені.', 'truck', ['#3aa04a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['net'], cargo: ['ball', 6],
    art: (f) => [R(f.tail.x, 0.0, f.nose.x, 0.06, 'white')],
  }],
  ['soccer-cannon', 'Soccer Cannon', 'Пневматична гармата для футбольних м\'ячів.', 'tracked', ['#3aa04a', '#ffffff'], {
    s: 0.9, parts: ['cannon'],
    art: () => checker(-1.6, -0.05, 1.6, 0.08, 12),
  }],
  ['dual-soccer-cannon', 'Dual Soccer Cannon', 'Здвоєний футбольний міномет.', 'tracked', ['#2a6ae0', '#ffffff'], {
    parts: ['twincannon'],
    art: () => checker(-1.6, -0.05, 1.6, 0.08, 12),
  }],
  ['soccer-shoe', 'Soccer Shoe', 'Бутса на роликах: шнурки, шипи і удар з розгону.', 'sports', ['#1a1a1a', '#ffffff'], {
    parts: ['hump'], noLights: true,
    art: (f) => [...[-0.6, -0.35, -0.1, 0.15].map((x) => line([x, -0.35], [x + 0.2, -0.15], 0.05, 'white')), ...[-1.3, -0.8, 0.4, 0.9].map((x) => T([x - 0.08, 0.26], [x + 0.08, 0.26], [x, 0.38], 'white')), P([[f.tail.x, -0.14], [-0.8, -0.18], [-0.8, 0.0], [f.tail.x, 0.0]], 'accent'), O(1.2, -0.05, 0.2, 0.1, 'rocket')],
  }],
]);

void R;
void O;
