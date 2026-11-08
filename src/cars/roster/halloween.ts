import { O, P, R, T, angryEye, eye, line, skullFace, slashes, teeth } from '../art';
import { group, o } from './util';

export const HALLOWEEN = group('halloween', [
  ['hearse', 'Hearse', 'Чорний катафалк із труною в кузові та фіранками на вікнах.', 'van', ['#1a1a1a', '#b090e0'], {
    o: o({ len: 1.15, tall: 0.8 }), parts: ['coffin'],
    art: (f) => [
      R(f.tail.x + 0.2, f.roof.y + 0.12, f.tail.x + 0.4, f.roof.y + 0.5, 'accent'), R(f.tail.x + 0.82, f.roof.y + 0.12, f.tail.x + 1.02, f.roof.y + 0.5, 'accent'),
      line([f.tail.x + 1.3, f.roof.y + 0.2], [f.tail.x + 1.6, f.roof.y + 0.5], 0.06, 'gold'), line([f.tail.x + 1.6, f.roof.y + 0.2], [f.tail.x + 1.3, f.roof.y + 0.5], 0.06, 'gold'),
      R(f.tail.x, 0.0, f.nose.x, 0.05, 'metal'),
    ],
  }],
  ['rocking-horse', 'Horse', 'Іграшковий кінь-гойдалка на коліщатках. Стає дибки й стрибає.', 'creature', ['#8a5a3a', '#f0e0c0'], {
    parts: ['tail'], ab: 'jump|Дибки', noLights: true,
    art: () => [
      ...[0.7, 0.85, 1.0, 1.15].map((x, i) => T([x - 0.1, -0.5 - i * 0.12], [x + 0.08, -0.6 - i * 0.12], [x - 0.15, -0.85 - i * 0.12], 'black')),
      P([[-0.45, -0.62], [0.25, -0.62], [0.2, -0.3], [-0.4, -0.3]], 'rocket'),
      R(-0.12, -0.3, -0.05, 0.15, 'gold'), T([1.22, -1.1], [1.36, -1.12], [1.26, -1.3], 'body'),
      O(1.75, -0.86, 0.06, 0.05, 'black'),
    ],
  }],
  ['chariot', 'Chariot', 'Антична бойова колісниця з шипами на осях. Атакує ривком.', 'cart', ['#c8a040', '#e02a2a'], {
    o: o({ len: 1.2, wheel: 1.6, rim: 'spokes' }), parts: ['spikes'], ab: 'dash|Атака колісниці',
    art: (f) => [R(f.tail.x, f.deck.y, f.nose.x, f.deck.y + 0.1, 'gold'), O(0.1, -0.25, 0.28, 0.28, 'accent'), O(0.1, -0.25, 0.1, 0.1, 'gold'), line([f.nose.x - 0.2, f.deck.y - 0.1], [f.nose.x + 0.4, f.deck.y - 0.6], 0.05, 'wood')],
  }],
  ['spiky-car', 'Spiky Car', 'Шипований броньовик пустельних рейдерів: шипи спереду й на даху.', 'pickup', ['#6a5a4a', '#c0c0c0'], {
    parts: ['spikes', 'roofspikes'],
    art: (f) => [...[[-1.2, 0.0], [-0.2, 0.1], [0.9, -0.05]].map(([x, y]) => O(x, y, 0.16, 0.1, 'scoop')), R(f.nose.x - 0.1, -0.2, f.nose.x + 0.05, 0.3, 'metal'), R(0.2, -0.8, 0.6, -0.7, 'metal')],
  }],
  ['pumpkin-carriage', 'Pumpkin Carriage', 'Казкова карета-гарбуз. Метає гарбузи, що вибухають.', 'carriage', ['#ff8a1a', '#3aa04a'], {
    ab: 'shoot:pumpkin|Гарбуз-бомба', noLights: true,
    art: (f) => [
      ...slashes(-0.9, 0.9, f.roof.y + 0.1, 0.15, 4, 'scoop', 0),
      line([0.05, f.roof.y], [0.25, f.roof.y - 0.3], 0.08, 'leaf'), O(0.35, f.roof.y - 0.12, 0.18, 0.08, 'leaf'),
      line([-0.6, f.roof.y], [-0.85, f.roof.y - 0.25], 0.04, 'leaf'),
    ],
  }],
  ['ghost-train', 'Ghost Train', 'Примарний паротяг: проходить крізь суперника, як туман.', 'loco', ['#d0d8e4', '#8a7ab0'], {
    float: 0.85, ab: 'phase|Примарний рейс', noLights: true,
    art: (f) => [O(1.2, -0.25, 0.12, 0.16, 'black'), O(1.55, -0.25, 0.12, 0.16, 'black'), O(1.38, 0.0, 0.12, 0.08, 'black'), ...[-1.3, -0.6, 0.2].map((x) => O(x, f.roof.y - 0.25, 0.2, 0.12, 'white'))],
  }],
  ['broom-bike', 'Broom Bike', 'Відьмина мітла з моторчиком. Злітає й ширяє над ареною.', 'bike', ['#a0703a', '#e0c060'], {
    o: o({ mat: 'wood' }), float: 0.7, ab: 'fly|Чари мітли', noLights: true,
    art: () => [
      ...[-0.1, 0.0, 0.1].map((d) => T([-0.65, -0.15 + d], [-0.65, -0.05 + d], [-1.35, d * 3], 'scoop')),
      R(-0.72, -0.2, -0.6, 0.05, 'rocket'),
      T([-0.4, -1.0], [0.1, -1.0], [-0.1, -1.45], 'black'), R(-0.5, -1.02, 0.2, -0.95, 'black'),
    ],
  }],
  ['invisible-car', 'Invisible Car', 'Прозорий парящий кузов. На мить зникає зовсім.', 'hover', ['#c0e8ff', '#ffffff'], {
    o: o({ mat: 'glass' }), ab: 'phase|Невидимість',
    art: (f) => [R(f.tail.x + 0.1, -0.05, f.nose.x - 0.2, 0.0, 'white'), O(f.nose.x - 0.3, -0.12, 0.07, 0.07, 'light')],
  }],
  ['skeletal-ride', 'Skeletal Ride', 'Багі з кісток із черепом спереду. Кидається кістками.', 'buggy', ['#e8dcc0', '#2a2a2a'], {
    o: o({ mat: 'bone' }), parts: ['skull'], ab: 'shoot:bone|Кістки',
    art: () => [...[-1.0, -0.7, -0.4, -0.1, 0.2].map((x) => R(x, -0.1, x + 0.08, 0.2, 'black')), R(-1.2, 0.0, 0.5, 0.06, 'black')],
  }],
  ['beast', 'Beast', 'Ікластий монстр-кар із рогами. Ричить так, що відлітають машини.', 'monster', ['#5a2a6a', '#ff3a3a'], {
    parts: ['fangs', 'horns'], ab: 'roar|Рик звіра',
    art: (f) => [...angryEye(f.nose.x - 0.55, -0.42, 0.13), ...angryEye(f.nose.x - 0.22, -0.42, 0.11), ...teeth(f.nose.x - 0.7, f.nose.x - 0.05, -0.12, 5, 0.14)],
  }],
  ['ghost-bike', 'Ghost Bike', 'Мотоцикл-привид. Проходить крізь суперника.', 'bike', ['#d0e0f0', '#7a6ab0'], {
    float: 0.8, ab: 'phase|Примара', noLights: true,
    art: () => [P([[-0.6, -0.1], [-1.4, -0.3], [-1.2, 0.0], [-1.5, 0.15], [-0.6, 0.2]], 'white'), O(0.4, -0.15, 0.06, 0.08, 'black'), O(0.55, -0.15, 0.06, 0.08, 'black')],
  }],
  ['pumpkin-car', 'Pumpkin Car', 'Гарбуз-ліхтар на колесах із вирізаною усмішкою.', 'blob', ['#ff7a1a', '#2a8a3a'], {
    noLights: true,
    art: () => [
      ...slashes(-0.75, 0.75, -0.95, 0.2, 3, 'scoop', 0),
      T([0.15, -0.6], [0.45, -0.6], [0.3, -0.85], 'light'), T([0.55, -0.6], [0.8, -0.6], [0.68, -0.82], 'light'),
      P([[0.1, -0.35], [0.9, -0.35], [0.75, -0.12], [0.25, -0.12]], 'light'), ...teeth(0.25, 0.75, -0.35, 3, 0.1, false, 'scoop'),
      R(-0.1, -1.4, 0.05, -1.05, 'accent'), O(0.2, -1.12, 0.18, 0.07, 'leaf'),
    ],
  }],
  ['dracula-carriage', 'Dracula\'s Carriage', 'Готична карета вампіра. Розкриває кажанячі крила й летить.', 'carriage', ['#2a1a2a', '#c02a3a'], {
    parts: ['lantern'], ab: 'fly|Кажанячі крила',
    art: (f) => [
      P([[-0.6, f.roof.y + 0.3], [-1.6, f.roof.y - 0.4], [-1.3, f.roof.y + 0.05], [-1.7, f.roof.y + 0.2], [-0.6, f.roof.y + 0.55]], 'black'),
      R(-0.38, f.roof.y + 0.2, -0.1, f.roof.y + 0.58, 'accent'), R(0.1, f.roof.y + 0.2, 0.38, f.roof.y + 0.58, 'accent'),
      ...[-0.8, -0.4, 0.0, 0.4, 0.8].map((x) => T([x - 0.08, f.roof.y], [x + 0.08, f.roof.y], [x, f.roof.y - 0.2], 'gold')),
    ],
  }],
]);

void eye;
void skullFace;
