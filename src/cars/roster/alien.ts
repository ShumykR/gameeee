import { O, P, R, T, bar, eye, line, spots, star, tailgate } from '../art';
import { group, o } from './util';

export const ALIEN = group('alien', [
  ['cattle-trailer', 'Cattle Trailer', 'Фургон із викраденою коровою в клітці. Корова може й випасти.', 'truck', ['#8a5a3a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['cage'], cargo: ['cow', 1],
    art: (f) => [R(f.tail.x, 0.0, f.nose.x, 0.06, 'accent'), R(f.deck.x0, f.deck.y - 0.42, f.deck.x1, f.deck.y - 0.38, 'metal')],
  }],
  ['space-shuttle', 'Space Shuttle', 'Космічний човник: білий корпус, чорне черево, ракета ззаду.', 'rocket', ['#f0f0f0', '#2a2a2a'], {
    o: o({ len: 1.15 }), parts: ['fin', 'booster'],
    art: (f) => [P([[-1.6, 0.15], [f.nose.x - 0.4, 0.15], [f.nose.x, 0.02], [f.nose.x - 0.2, 0.3], [-1.6, 0.3]], 'black'), P([[-1.2, 0.0], [0.3, 0.0], [-0.6, 0.45]], 'white'), R(-0.2, -0.2, 0.3, -0.1, 'rocket')],
  }],
  ['flying-saucer', 'Flying Saucer', 'Тарілка прибульців із мигалками. Злітає й ширяє.', 'saucer', ['#a0a8b8', '#7aff7a'], {
    ab: 'fly|Антигравітація', noLights: true,
    art: () => [...[-1.1, -0.55, 0.0, 0.55, 1.1].map((x, i) => O(x, 0.0, 0.07, 0.07, i % 2 ? 'accent' : 'light')), T([-0.3, 0.2], [0.3, 0.2], [0, 0.55], 'accent')],
  }],
  ['skater-cow', 'Skater Cow', 'Корова на скейті. Робить олі — і стрибає.', 'creature', ['#f4f4f4', '#2a2a2a'], {
    o: o({ wheel: 0.75 }), parts: ['horns'], ab: 'jump|Олі', noLights: true,
    art: () => [...spots([[-0.5, -0.35, 0.22], [0.2, -0.15, 0.18], [-0.1, -0.5, 0.12]]), R(-1.0, 0.36, 1.0, 0.44, 'wood'), O(1.62, -0.82, 0.14, 0.1, 'pink'), O(1.12, -0.95, 0.06, 0.06, 'black')],
  }],
  ['gun-truck', 'Gun Truck', 'Пікап із гарматою в кузові.', 'pickup', ['#6a7a4a', '#3a3a3a'], {
    parts: ['cannon'], ab: 'shoot:cannon|Гармата',
    art: () => [...star(0.3, 0.05, 0.13, 'white'), R(-1.6, 0.25, 1.6, 0.3, 'dark')],
  }],
  ['army-truck', 'Army Truck', 'Військова вантажівка з ящиками боєприпасів у кузові.', 'truck', ['#5a6a3a', '#3a4a2a'], {
    cargo: ['crate', 4],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.3, 'body'), ...star(1.55, -0.45, 0.13, 'white'), R(f.deck.x0, f.deck.y - 1.0, f.deck.x1, f.deck.y - 0.95, 'dark'), R(f.deck.x0, f.deck.y - 1.0, f.deck.x0 + 0.05, f.deck.y, 'dark')],
  }],
  ['shredder', 'Shredder', 'Броньовик-подрібнювач із дисковою пилкою.', 'tracked', ['#5a5a6a', '#ffd23f'], {
    parts: [['saw', 0.8]], accel: 1.15,
    art: () => [R(-1.6, -0.1, 1.6, -0.02, 'scoop'), R(-0.6, -0.7, 0.2, -0.6, 'metal')],
  }],
  ['monster-cannon', 'Monster Cannon', 'Самохідна гармата на колесах монстр-трака.', 'monster', ['#4a5a3a', '#ffd23f'], {
    parts: ['cannon'], ab: 'shoot:cannon|Надважка гармата',
    art: () => [...star(0.4, -0.3, 0.14, 'accent')],
  }],
  ['army-bike', 'Army Bike', 'Армійський мотоцикл із кулеметом на кермі.', 'trike', ['#5a6a3a', '#2a2a2a'], {
    parts: ['gun'], ab: 'shoot:bullet|Кулемет',
    art: () => [R(-1.2, -0.45, -0.7, -0.2, 'dark'), ...star(0.2, -0.02, 0.1, 'white')],
  }],
  ['gunboat', 'Gunboat', 'Броньований річковий катер із гарматою на носі.', 'boat', ['#5a6a7a', '#ffd23f'], {
    parts: [['cannon', 0.7]], ab: 'shoot:cannon|Корабельна гармата',
    art: () => [R(-1.5, -0.25, 1.6, -0.18, 'accent'), ...[-1.0, -0.5, 0.0].map((x) => O(x, -0.08, 0.06, 0.06, 'black'))],
  }],
  ['rocket-launcher', 'Rocket Launcher', 'Система залпового вогню: ракети вибухають і відкидають суперника.', 'truck', ['#5a6a3a', '#e02a2a'], {
    parts: ['launcher'], ab: 'shoot:missile|Залп',
    art: () => [...star(1.5, -0.45, 0.12, 'white')],
  }],
  ['tank', 'Tank', 'Бойовий танк: башта, довгий ствол і п\'ять котків.', 'tracked', ['#5a6a3a', '#3a4a2a'], {
    o: o({ wheels: 5 }), parts: ['cannon'], ab: 'shoot:cannon|Танковий постріл',
    art: () => [...star(-0.2, -0.36, 0.12, 'white'), R(-1.6, 0.0, 1.6, 0.06, 'dark'), R(-1.75, 0.3, 1.75, 0.36, 'black')],
  }],
  ['space-bike', 'Space Bike', 'Світловий мотоцикл зі смугами неону.', 'bike', ['#1a1a2a', '#5ef0ff'], {
    o: o({ rim: 'disc' }), speed: 1.15,
    art: () => [R(-0.7, -0.08, 0.65, -0.03, 'accent'), P([[0.4, -0.25], [0.9, -0.15], [0.9, 0.05], [0.5, 0.0]], 'body'), R(0.5, -0.12, 0.85, -0.08, 'accent')],
  }],
  ['alien-drone', 'Alien Attack Drone', 'Бойовий дрон прибульців із червоним оком-лазером.', 'saucer', ['#3a3a4a', '#ff3a3a'], {
    s: 0.85, parts: ['antenna'], ab: 'shoot:laser|Лазер', noLights: true,
    art: () => [O(1.1, -0.02, 0.15, 0.15, 'rocket'), O(1.15, -0.02, 0.07, 0.07, 'light')],
  }],
  ['celestial-teapot', 'Celestial Teapot', 'Космічний чайник на реактивній тязі. Хлюпає окропом.', 'blob', ['#f0f0f0', '#4a8ad8'], {
    parts: ['booster', 'lid'], ab: 'shoot:water|Окріп', noLights: true,
    art: () => [P([[0.7, -0.5], [0.9, -0.55], [1.35, -1.0], [1.25, -1.05], [0.75, -0.3]], 'body'), O(-1.0, -0.5, 0.3, 0.35, 'accent'), O(-1.0, -0.5, 0.17, 0.22, 'white'), ...[-0.4, 0.0, 0.4].map((x) => O(x, -0.35, 0.1, 0.1, 'accent'))],
  }],
  ['moon-rover', 'Moon Rover', 'Місяцехід з антеною-тарілкою. Стрибає, як у невагомості.', 'buggy', ['#e0e0e0', '#ffd23f'], {
    o: o({ wheel: 1.1 }), parts: ['dish'], ab: 'jump|Місячний стрибок',
    art: (f) => [R(-1.3, -0.2, 0.9, -0.08, 'gold'), R(f.roof.x0, f.roof.y - 0.05, f.roof.x1, f.roof.y + 0.04, 'gold')],
  }],
  ['alien-spaceship', 'Alien Spaceship', 'Винищувач прибульців із реактивними дюзами і лазером.', 'hover', ['#3a8a3a', '#7aff7a'], {
    parts: ['fin', 'jets'], ab: 'shoot:laser|Бластер',
    art: () => [...eye(0.1, -0.45, 0.1, 'leaf'), R(-1.5, -0.1, 1.5, -0.04, 'accent')],
  }],
  ['planet-explorer', 'Planet Explorer', 'Шестиколісний планетохід із тарілкою зв\'язку.', 'tracked', ['#e0e0e0', '#ff8a1a'], {
    o: o({ wheels: 6 }), parts: ['dish'],
    art: () => [R(-1.6, -0.12, 1.6, -0.04, 'accent'), R(-0.7, -0.7, 0.3, -0.6, 'gold')],
  }],
  ['space-interceptor', 'Space Interceptor', 'Перехоплювач із самонавідними ракетами.', 'hover', ['#e0e0e0', '#3a6ad8'], {
    parts: ['wing', 'booster'], speed: 1.05, ab: 'shoot:missile|Ракета',
    art: () => [P([[-0.8, 0.0], [0.6, 0.0], [-0.4, 0.4]], 'accent'), ...star(0.8, -0.12, 0.1, 'accent')],
  }],
]);

void bar;
void line;
