import { O, P, R, T, bar, checker, flames, line, slashes, star, tailgate } from '../art';
import { group, o } from './util';

export const SUMMER = group('summer', [
  ['harvester', 'Harvester', 'Зернозбиральний комбайн із мотовилом. Скидає тюки сіна.', 'box', ['#3aa04a', '#ffd23f'], {
    o: o({ len: 1.15, tall: 1.2 }), parts: ['plow'], cargo: ['hay', 2], ab: 'dump:hay|Тюки сіна',
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.3, 'accent'), O(f.nose.x + 0.35, -0.55, 0.32, 0.32, 'scoop'), O(f.nose.x + 0.35, -0.55, 0.1, 0.1, 'dark'), line([f.roof.x1 - 0.3, f.roof.y], [f.roof.x1 + 0.1, f.roof.y - 0.6], 0.1, 'body'), R(f.tail.x, 0.0, f.nose.x, 0.06, 'accent')],
  }],
  ['sports-bike', 'Sports Bike', 'Шосейний спортбайк з обтічником.', 'bike', ['#e02a2a', '#ffffff'], {
    speed: 1.2, accel: 1.2,
    art: () => [P([[0.35, -0.25], [0.95, -0.3], [0.85, 0.05], [0.45, 0.05]], 'body'), P([[0.55, -0.35], [0.85, -0.42], [0.85, -0.28]], 'glass'), R(-0.6, -0.08, 0.8, -0.03, 'accent')],
  }],
  ['off-road-truck', 'Off-Road Truck', 'Експедиційний трак з ящиками спорядження в кузові.', 'pickup', ['#e0a020', '#2a2a2a'], {
    o: o({ wheel: 1.25 }), cargo: ['crate', 2],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.24, 'body'), R(f.roof.x0, f.roof.y - 0.1, f.roof.x1, f.roof.y, 'dark'), ...[0, 1, 2].map((i) => O(f.roof.x0 + 0.15 + i * 0.25, f.roof.y - 0.14, 0.06, 0.06, 'light'))],
  }],
  ['classic-monster', 'Classic Monster', 'Оригінальний бігфут на величезних колесах.', 'monster', ['#2a6ae0', '#ffffff'], {
    o: o({ wheel: 1.1 }), ab: 'jump|Бігфут-стрибок',
    art: () => [...star(0.3, -0.3, 0.16, 'white'), R(-1.5, -0.12, 1.5, -0.05, 'white')],
  }],
  ['burger-bike', 'Burger Bike', 'Трицикл-бургерна. Жбурляє бургерами.', 'trike', ['#e0b060', '#7a3a1a'], {
    parts: ['hump'], ab: 'shoot:burger|Бургер',
    art: () => [P([[-1.15, -0.3], [-0.2, -0.3], [-0.25, -0.22], [-1.1, -0.22]], 'leaf'), R(-1.12, -0.22, -0.23, -0.12, 'accent'), ...[-1.0, -0.8, -0.6, -0.4].map((x) => O(x, -0.5, 0.025, 0.02, 'white'))],
  }],
  ['lowrider', 'Lowrider', 'Лоурайдер на гідравліці: підстрибує на місці.', 'sedan', ['#8a2ae0', '#ffd23f'], {
    o: o({ len: 1.1 }), arch: 'bouncy', bounce: 0.3, ab: 'jump|Гідравліка',
    art: (f) => [...flames(f.nose.x - 0.1, -0.6, 0.05, 0.2), R(f.tail.x, 0.18, f.nose.x, 0.24, 'metal')],
  }],
  ['yacht', 'Yacht', 'Моторна яхта з білою надбудовою і рятувальним колом.', 'boat', ['#ffffff', '#3a6ad8'], {
    o: o({ len: 1.15 }),
    art: (f) => [R(f.tail.x, -0.3, f.nose.x - 0.3, -0.22, 'accent'), O(0.2, -0.62, 0.15, 0.15, 'rocket'), O(0.2, -0.62, 0.07, 0.07, 'white'), line([0.6, -0.85], [0.6, -1.3], 0.04), T([0.6, -1.3], [0.6, -1.1], [0.95, -1.2], 'accent')],
  }],
  ['coupe', 'Coupé', 'Компактне дводверне купе.', 'coupe', ['#3ab0b0', '#ffffff'], {
    art: (f) => [R(f.tail.x, -0.02, f.nose.x, 0.03, 'white')],
  }],
  ['speedboat', 'Speedboat', 'Швидкісний катер із номером на борту.', 'boat', ['#e02a2a', '#ffffff'], {
    arch: 'fast',
    art: () => [P([[-1.75, -0.15], [1.9, -0.25], [1.6, -0.1], [-1.7, 0.0]], 'white'), O(-0.6, -0.25, 0.14, 0.12, 'white'), R(-0.63, -0.32, -0.57, -0.18, 'black')],
  }],
  ['swat-van', 'Swat Van', 'Броньовик спецпризначенців. Світлошумова глушить суперника поруч.', 'van', ['#2a2a3a', '#ffffff'], {
    parts: ['ram'], ab: 'roar:stun|Світлошумова',
    art: (f) => [R(f.tail.x, -0.1, f.nose.x, -0.02, 'white'), R(f.roof.x0 + 0.2, f.roof.y - 0.1, f.roof.x0 + 0.6, f.roof.y, 'rocket')],
  }],
  ['dune-buggy', 'Dune Buggy', 'Легкий багі для дюн із прапорцем на щоглі.', 'buggy', ['#ff8a1a', '#2a2a2a'], {
    art: (f) => [line([f.tail.x + 0.2, -0.08], [f.tail.x + 0.1, -1.4], 0.03), T([f.tail.x + 0.1, -1.4], [f.tail.x + 0.1, -1.2], [f.tail.x + 0.4, -1.3], 'rocket')],
  }],
  ['taxi', 'Taxi', 'Жовте міське таксі з шашечками.', 'sedan', ['#ffd020', '#1a1a1a'], {
    parts: ['sign'],
    art: (f) => checker(f.tail.x + 0.1, -0.02, f.nose.x - 0.1, 0.1, 14),
  }],
  ['asphalt-paver', 'Asphalt Paver', 'Асфальтоукладач: важкий, низький, гарячий.', 'box', ['#f0a020', '#2a2a2a'], {
    o: o({ tall: 0.8 }), parts: ['stack', 'plow'],
    art: (f) => [R(f.tail.x - 0.4, 0.0, f.tail.x, 0.3, 'black'), ...slashes(f.tail.x, f.nose.x, -0.1, 0.05, 6, 'black', 0.1)],
  }],
  ['bulldozer', 'Bulldozer', 'Бульдозер із масивним відвалом.', 'tracked', ['#f0b020', '#2a2a2a'], {
    parts: ['blade'],
    art: () => [R(-1.6, 0.0, 1.6, 0.06, 'black'), R(-0.5, -0.9, 0.3, -0.82, 'dark')],
  }],
  ['locomotive', 'Locomotive', 'Паровоз із тендером вугілля. Гудок відкидає суперника.', 'loco', ['#2a2a2a', '#e02a2a'], {
    cargo: ['coal', 5], ab: 'roar|Гудок',
    art: (f) => [O(f.nose.x - 0.4, -0.5, 0.12, 0.12, 'light'), R(-0.3, -0.42, f.nose.x - 0.3, -0.36, 'gold')],
  }],
  ['turtle', 'Turtle', 'Бойова черепаха: ховає голову в панцир.', 'creature', ['#4a8a3a', '#c0a060'], {
    s: 0.9, o: o({ neck: 'raptor' }), parts: ['hump'], ab: 'shield|Сховатися в панцир', noLights: true,
    art: () => [P([[-0.95, -0.25], [-0.6, -0.75], [0.6, -0.75], [0.95, -0.25]], 'accent'), ...[-0.45, 0.0, 0.45].map((x) => P([[x - 0.18, -0.45], [x, -0.65], [x + 0.18, -0.45], [x, -0.3]], 'scoop')), O(1.5, -0.68, 0.05, 0.05, 'black')],
  }],
  ['gyrocar', 'Gyrocar', 'Самобалансуючий гіромобіль із маховиком усередині.', 'blob', ['#e0e0e0', '#3a6ad8'], {
    s: 0.9, o: o({ shape: 'egg' }),
    art: () => [O(0, -0.45, 0.35, 0.35, 'accent'), O(0, -0.45, 0.12, 0.12, 'white'), P([[0.2, -1.0], [0.7, -0.75], [0.75, -0.55], [0.3, -0.7]], 'glass')],
  }],
  ['personal-transporter', 'Personal Transporter', 'Сегвей: платформа, стійка й кермо.', 'cart', ['#2a2a2a', '#5ef0ff'], {
    s: 0.8, o: o({ tall: 0.5 }), noLights: true,
    art: (f) => [line([0.5, f.deck.y], [0.65, f.deck.y - 0.9], 0.07), bar(0.5, f.deck.y - 0.9, 0.85, 0.06, 'accent'), R(f.tail.x, f.deck.y + 0.1, f.nose.x, f.deck.y + 0.15, 'accent')],
  }],
]);

