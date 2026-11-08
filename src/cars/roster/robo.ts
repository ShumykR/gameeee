import { O, P, R, T, angryEye, bar, line, slashes } from '../art';
import { group, o } from './util';

export const ROBO = group('robo', [
  ['tentabot', 'Tentabot', 'Робот зі щупальцем-гарпуном: хапає суперника й тягне.', 'robot', ['#7a3ae0', '#5ef0ff'], {
    parts: ['tentacles'], ab: 'shoot:harpoon|Щупальце',
    art: (f) => [O(0, f.roof.y + 0.38, 0.1, 0.1, 'accent'), R(-0.4, -0.3, 0.4, -0.22, 'accent')],
  }],
  ['hexabot', 'Hexabot', 'Шестиногий шагохід на гусеницях-лапах.', 'tracked', ['#a0a8b8', '#e02a2a'], {
    o: o({ wheels: 6 }), parts: ['antenna'],
    art: () => [...[-1.3, -0.8, -0.3, 0.2, 0.7, 1.2].map((x) => line([x, 0.0], [x - 0.15, 0.45], 0.08, 'dark')), O(1.2, -0.05, 0.1, 0.1, 'rocket')],
  }],
  ['doom-bot', 'Doom Bot', 'Важкий бойовий андроїд із лазерними очима.', 'robot', ['#3a3a4a', '#e02a2a'], {
    o: o({ tall: 1.1 }), parts: ['antenna'], ab: 'shoot:laser|Лазерний погляд',
    art: (f) => [...angryEye(0.25, f.roof.y + 0.35, 0.12), ...angryEye(-0.15, f.roof.y + 0.35, 0.1), ...slashes(-0.5, 0.5, -0.4, -0.1, 3, 'scoop', 0.05)],
  }],
  ['rocket-fist', 'Rocket Fist', 'Ракетний кулак: летить уперед і б\'є з ривка.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster', 'ram'], ab: 'dash|Ракетний удар',
    art: (f) => [...[-0.15, 0.15].map((y) => R(f.nose.x - 0.55, y - 0.08, f.nose.x - 0.1, y + 0.06, 'body')), R(-0.8, -0.32, -0.6, 0.3, 'accent')],
  }],
  ['hovercar', 'Hovercar', 'Антигравітаційний седан без коліс-видимих: просто ширяє.', 'hover', ['#3a8ad8', '#ffffff'], {
    ab: 'fly|Антигравітація',
    art: () => [R(-1.5, -0.12, 1.5, -0.06, 'accent')],
  }],
  ['brass-bike', 'Brass Bike', 'Стімпанк-байк із латуні: шестерні, клепки й труба.', 'bike', ['#c8902a', '#5a3a1a'], {
    o: o({ mat: 'gold' }), parts: ['stack'],
    art: () => [O(-0.2, 0.05, 0.18, 0.18, 'wood'), O(-0.2, 0.05, 0.08, 0.08, 'gold'), O(0.25, 0.0, 0.12, 0.12, 'wood'), line([0.6, -0.2], [0.75, -0.6], 0.05, 'wood')],
  }],
  ['laser-tank', 'Laser Tank', 'Футуристичний танк із лазерною гарматою.', 'tracked', ['#2a2a3a', '#5ef0ff'], {
    parts: [['cannon', 1.2]], ab: 'shoot:laser|Лазерна гармата',
    art: () => [R(-1.6, -0.1, 1.6, -0.04, 'accent'), R(-1.75, 0.3, 1.75, 0.36, 'accent')],
  }],
  ['steel-crab', 'Steel Crab', 'Металевий краб із клешнею і очима на ніжках.', 'blob', ['#c0c8d0', '#e02a2a'], {
    o: o({ shape: 'flat', mat: 'metal' }), parts: ['claw'], noLights: true,
    art: () => [line([0.3, -0.5], [0.4, -0.85], 0.05, 'metal'), line([0.7, -0.45], [0.8, -0.8], 0.05, 'metal'), O(0.4, -0.9, 0.09, 0.09, 'rocket'), O(0.8, -0.85, 0.09, 0.09, 'rocket'), ...[-1.0, -0.6, -0.2].map((x) => line([x, 0.1], [x - 0.2, 0.42], 0.06, 'dark'))],
  }],
  ['sawbot', 'Sawbot', 'Робот-тесля з дисковою пилкою на руці.', 'robot', ['#5a5a6a', '#ffd23f'], {
    parts: ['saw'],
    art: (f) => [O(0, f.roof.y + 0.38, 0.12, 0.08, 'rocket'), ...slashes(-0.5, 0.5, -0.35, -0.1, 4, 'black', 0.05)],
  }],
  ['tripod', 'Tripod', 'Триногий крокохід прибульців із тепловим променем.', 'robot', ['#c0c8d0', '#3a8ad8'], {
    o: o({ tall: 1.2 }), parts: ['antenna'], ab: 'shoot:zap|Тепловий промінь',
    art: (f) => [line([-0.4, 0.0], [-0.95, 0.4], 0.08, 'dark'), line([0.4, 0.0], [0.95, 0.4], 0.08, 'dark'), line([0, 0.0], [0, 0.42], 0.08, 'dark'), O(0.35, f.roof.y + 0.38, 0.12, 0.12, 'accent'), O(0.38, f.roof.y + 0.38, 0.05, 0.05, 'white')],
  }],
  ['robo-bike', 'Robo Bike', 'Двоколісний дроїд-мотоцикл з одним оком-сенсором.', 'bike', ['#c0c8d0', '#e02a2a'], {
    noLights: true,
    art: () => [O(0.62, -0.08, 0.13, 0.13, 'black'), O(0.66, -0.08, 0.07, 0.07, 'rocket'), bar(-0.6, -0.1, 0.4, 0.06, 'accent'), T([-0.7, -0.2], [-0.5, -0.2], [-0.75, -0.45], 'accent')],
  }],
]);

void P;
