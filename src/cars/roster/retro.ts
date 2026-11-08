import { O, P, R, T, bar, checker, cross, flames, line, slashes, star, tailgate } from '../art';
import { group, o } from './util';

export const RETRO = group('retro', [
  ['monster-truck', 'Monster Truck', 'Позашляховик на колесах вище за людину. Стрибає через усе.', 'monster', ['#d83a2e', '#ffd23f'], {
    art: (f) => [...flames(f.nose.x - 0.15, -0.9, -0.28, 0.32), bar(f.nose.x - 0.1, -0.05, f.nose.x + 0.15, 0.1, 'metal'), R(-0.2, f.roof.y - 0.08, 0.5, f.roof.y, 'light')],
  }],
  ['dragster', 'Dragster', 'Довгий болід для дрег-рейсингу. Тримай «вперед» — вмикається ракета.', 'dragster', ['#ffcc1a', '#1a1a2e'], {
    parts: ['booster'],
    art: (f) => [O(0.6, 0.04, 0.17, 0.15, 'white'), R(0.55, -0.04, 0.65, 0.12, 'black'), ...checker(f.tail.x + 0.02, f.tail.y0 + 0.02, f.tail.x + 0.58, f.tail.y0 + 0.12, 5)],
  }],
  ['ambulance', 'Ambulance', 'Карета швидкої. Аптечка рятує голову водія від удару.', 'van', ['#f4f4f0', '#e83a3a'], {
    parts: ['siren'],
    art: (f) => [R(f.tail.x, -0.08, f.nose.x, 0.02, 'rocket'), ...cross(-0.55, -0.4, 0.42)],
  }],
  ['go-kart', 'Go-Kart', 'Компактний гоночний карт: низький, легкий і верткий.', 'kart', ['#3ad15a', '#ffffff'], {
    art: () => [O(0.45, 0.08, 0.13, 0.11, 'white'), R(-0.95, 0.1, 0.9, 0.16, 'black'), bar(-0.6, -0.55, -0.38, 0.05, 'black')],
  }],
  ['timber-lorry', 'Timber Lorry', 'Лісовоз. Колоди лежать у кузові вільно й розлітаються на поворотах.', 'truck', ['#3a7a3a', '#c8a060'], {
    cargo: ['log', 3],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.6, 'wood'), R(f.deck.x1 - 0.1, f.deck.y - 0.65, f.deck.x1 - 0.02, f.deck.y, 'wood'), R(-0.4, f.deck.y - 0.5, -0.32, f.deck.y, 'wood')],
  }],
  ['farm-tractor', 'Tractor', 'Колісний трактор: велетенське заднє колесо і страшна тяга.', 'tractor', ['#3aa84a', '#ffd23f'], {
    art: (f) => [R(f.nose.x - 0.12, -0.24, f.nose.x - 0.02, 0.16, 'dark'), ...slashes(1.0, 1.5, -0.22, 0.12, 3, 'dark', 0), O(f.nose.x - 0.05, -0.18, 0.08, 0.08, 'light')],
  }],
  ['garbage-truck', 'Garbage Truck', 'Сміттєвоз. Вивалює мішки сміття під колеса суперникові.', 'truck', ['#3a8a5a', '#c0c8d0'], {
    parts: [['cargo', 1]],
    art: (f) => [...slashes(f.deck.x0 + 0.2, f.deck.x1 - 0.2, f.deck.y - 0.7, f.deck.y - 0.1, 4, 'white', 0.2), R(f.deck.x0 - 0.12, f.deck.y - 0.85, f.deck.x0 + 0.05, f.deck.y + 0.1, 'dark')],
  }],
  ['minibus', 'Minibus', 'Пасажирський мікроавтобус на дев\'ять місць.', 'van', ['#f0c040', '#ffffff'], {
    o: o({ len: 1.1 }),
    art: (f) => [R(f.tail.x, -0.12, f.nose.x, -0.04, 'accent'), R(f.tail.x, 0.0, f.nose.x, 0.04, 'dark')],
  }],
  ['tourist-bus', 'Tourist Bus', 'Двоповерховий екскурсійний автобус з відкритим верхом.', 'bus', ['#e84040', '#fff0c0'], {
    o: o({ tall: 1.45, wheels: 3 }),
    art: (f) => {
      const out = [];
      for (let x = f.tail.x + 0.2; x < f.nose.x - 0.9; x += 0.62) out.push(R(x, -0.5, x + 0.46, -0.18, 'glass'));
      out.push(R(f.tail.x, -0.62, f.nose.x - 0.1, -0.56, 'accent'));
      for (let x = f.tail.x + 0.1; x < f.nose.x - 0.5; x += 0.5) out.push(R(x, f.roof.y - 0.28, x + 0.05, f.roof.y, 'metal'));
      out.push(R(f.tail.x + 0.1, f.roof.y - 0.3, f.nose.x - 0.5, f.roof.y - 0.24, 'metal'));
      return out;
    },
  }],
  ['off-road', 'Off-Road Vehicle', 'Цивільний джип з дугою безпеки і запаскою.', 'sedan', ['#6a7a3a', '#d0c080'], {
    o: o({ open: true, wheel: 1.2 }), parts: ['bigwheel'],
    art: () => [line([-0.9, -0.16], [-0.7, -0.95], 0.08), line([-0.7, -0.95], [0.1, -0.95], 0.08), R(1.45, -0.1, 1.7, 0.2, 'dark')],
  }],
  ['race-car-f1', 'Race Car F1', 'Болід Формули-1. DRS відкриває заднє крило для ривка.', 'formula', ['#e02020', '#ffffff'], {
    art: (f) => [O(-0.95, 0.06, 0.15, 0.13, 'white'), R(-1.0, 0.0, -0.9, 0.12, 'black'), R(0.5, 0.0, f.nose.x - 0.2, 0.06, 'white'), R(f.nose.x - 0.3, 0.14, f.nose.x + 0.05, 0.22, 'dark')],
  }],
  ['banana-car', 'Banana Car', 'Машина-банан. Розкидає бананові шкірки, на яких суперники крутяться.', 'blob', ['#ffe23a', '#6a4a1a'], {
    o: o({ shape: 'flat', len: 1.25 }), noLights: true,
    art: (f) => [
      P([[f.nose.x - 0.25, -0.42], [f.nose.x + 0.05, -0.62], [f.nose.x + 0.18, -0.55], [f.nose.x - 0.05, -0.3]], 'accent'),
      P([[f.tail.x - 0.05, -0.2], [f.tail.x + 0.3, -0.38], [f.tail.x + 0.35, -0.1], [f.tail.x + 0.1, 0.0]], 'accent'),
      P([[-1.1, -0.08], [1.1, -0.18], [1.0, -0.1], [-1.0, 0.0]], 'scoop'),
      P([[-0.9, 0.12], [0.9, 0.08], [0.8, 0.16], [-0.8, 0.18]], 'scoop'),
    ],
  }],
  ['antique-mobile', 'Antique Mobile', 'Безкінна карета 1905 року: латунь, спиці і ручне кермо.', 'carriage', ['#2a2a3a', '#c8a040'], {
    o: o({ tall: 0.8 }),
    art: (f) => [line([0.55, f.roof.y], [0.85, f.roof.y - 0.45], 0.06, 'gold'), O(0.88, f.roof.y - 0.48, 0.12, 0.04, 'black'), O(f.nose.x - 0.15, -0.15, 0.13, 0.13, 'gold'), O(f.nose.x - 0.1, -0.15, 0.08, 0.08, 'light'), R(f.tail.x, -0.05, f.nose.x, 0.02, 'gold')],
  }],
  ['skid-steer', 'Skid-Steer Loader', 'Компактний навантажувач із ковшем: підчіплює суперника знизу.', 'box', ['#f0b020', '#2a2a2a'], {
    s: 0.8, parts: ['scoop'],
    art: (f) => [line([-0.9, -0.2], [1.6, -0.55], 0.12, 'dark'), R(-1.4, f.roof.y - 0.05, 0.6, f.roof.y + 0.08, 'dark'), R(-1.4, f.roof.y, -1.3, 0.1, 'dark')],
  }],
  ['hippie-van', 'Hippie Van', 'Вінтажний мікроавтобус хіпі з квітами і знаком миру.', 'van', ['#f0e0b0', '#ff7aa0'], {
    parts: ['flag'],
    art: (f) => [
      P([[f.nose.x - 0.05, -0.32], [f.nose.x, 0.0], [f.nose.x - 0.55, 0.0], [f.nose.x - 0.45, -0.2]], 'accent'),
      R(f.tail.x, -0.05, f.nose.x - 0.4, 0.3, 'accent'),
      ...[[-1.0, -0.15, 'pink'], [-0.4, -0.25, 'gold'], [0.2, -0.1, 'white']].flatMap(([x, y, m]) => [O(x as number, y as number, 0.14, 0.14, m as 'pink'), O(x as number, y as number, 0.05, 0.05, 'scoop')]),
      O(0.75, -0.18, 0.16, 0.16, 'white'), O(0.75, -0.18, 0.11, 0.11, 'accent'), R(0.73, -0.32, 0.77, -0.04, 'white'),
    ],
  }],
  ['concrete-truck', 'Concrete Truck', 'Бетонозмішувач. Барабан крутиться, а бетон виливається назад брилами.', 'truck', ['#e0e0e0', '#ff8030'], {
    parts: ['drum'],
    art: (f) => [...slashes(f.deck.x0 + 0.3, f.deck.x1 - 0.2, f.deck.y - 0.75, f.deck.y - 0.12, 3, 'white', 0.3), line([f.deck.x0 + 0.05, f.deck.y - 0.2], [f.deck.x0 - 0.3, f.deck.y + 0.15], 0.1, 'metal')],
  }],
  ['excavator', 'Excavator', 'Будівельний екскаватор. Б\'є ковшем об землю — хвиля відкидає суперника.', 'digger', ['#ffc020', '#2a2a2a'], {
    parts: ['bucketarm'],
    art: (f) => [R(f.tail.x + 0.1, -0.15, 0.4, -0.08, 'dark'), ...slashes(0.5, 1.4, -0.16, 0.06, 4, 'black', 0.08)],
  }],
  ['antique-f1', 'Antique F1', 'Болід перших гран-прі: сигара на спицях і шкіряний шолом.', 'formula', ['#2a8a4a', '#e0d0a0'], {
    o: o({ wheel: 1.1, rim: 'spokes' }), accel: 1.15,
    art: () => [O(0.4, 0.04, 0.15, 0.13, 'white'), R(0.36, -0.03, 0.45, 0.11, 'black'), line([-0.1, -0.06], [0.15, -0.28], 0.05, 'black')],
  }],
  ['wrecking-crane', 'Wrecking Ball Crane', 'Кран зі справжнім ядром на ланцюгу: воно розгойдується і трощить усе.', 'truck', ['#f0b020', '#2a2a2a'], {
    flail: { from: [1.55, -1.45], len: 1.1, r: 0.36, look: 'wrecking' },
    art: (f) => [
      P([[f.deck.x0 + 0.3, f.deck.y], [f.deck.x0 + 0.6, f.deck.y], [1.6, -1.42], [1.5, -1.5]], 'scoop', { deco: false, density: 0.3 }),
      R(f.deck.x0 + 0.1, f.deck.y - 0.5, f.deck.x0 + 0.7, f.deck.y, 'dark'),
      R(f.deck.x0, f.deck.y - 0.35, f.deck.x0 + 0.3, f.deck.y, 'metal'),
    ],
  }],
  ['hot-rod', 'Hot Rod', 'Тюнінговане американське купе з вогняним малюнком і закисом азоту.', 'sports', ['#1a1a1a', '#ff5a1a'], {
    parts: ['exhaust'],
    art: (f) => [...flames(f.nose.x - 0.1, -0.6, 0.0, 0.26), R(0.7, -0.38, 1.1, -0.2, 'metal'), R(0.75, -0.46, 1.05, -0.38, 'metal')],
  }],
  ['travel-trailer', 'Travel Trailer', 'Легковик із житловим причепом-кемпером на буксирі.', 'coupe', ['#4a8ad8', '#ffffff'], {
    o: o({ len: 0.9 }), parts: ['trailer'], accel: 1.2,
    art: (f) => [R(f.tail.x - 1.2, f.tail.y0 - 0.32, f.tail.x - 0.35, f.tail.y0 - 0.22, 'accent'), R(f.tail.x - 1.0, f.tail.y0 - 0.15, f.tail.x - 0.75, f.tail.y0 + 0.05, 'glass'), R(f.tail.x - 0.6, f.tail.y0 - 0.15, f.tail.x - 0.42, f.tail.y0 + 0.12, 'dark')],
  }],
  ['amphibian', 'Amphibian', 'Колісний всюдихід-амфібія з гвинтом на кормі.', 'boat', ['#4a7a3a', '#e0c060'], {
    o: o({ wheel: 1.4 }),
    art: (f) => [line([f.tail.x + 0.05, 0.0], [f.tail.x - 0.25, 0.15], 0.06), P([[f.tail.x - 0.35, 0.0], [f.tail.x - 0.2, 0.12], [f.tail.x - 0.15, 0.3], [f.tail.x - 0.3, 0.18]], 'metal'), R(-0.9, -0.3, 1.2, -0.24, 'accent')],
  }],
  ['weevil', 'Weevil', 'Малолітражка-жучок: кругленька, як довгоносик.', 'coupe', ['#5ac0e0', '#ffffff'], {
    s: 0.8,
    art: (f) => [O(-0.15, f.roof.y + 0.15, 0.95, 0.2, 'body'), line([0.3, f.roof.y], [0.7, f.roof.y - 0.35], 0.04, 'black'), O(0.72, f.roof.y - 0.37, 0.06, 0.06, 'black'), O(f.nose.x - 0.15, -0.02, 0.12, 0.12, 'light')],
  }],
  ['bubble-car', 'Bubble Car', 'Мікромобіль-бульбашка: кабіна відкривається, як кришка.', 'blob', ['#e04a7a', '#ffffff'], {
    s: 0.85, parts: ['dome'],
    art: () => [R(-0.9, -0.05, 0.9, 0.02, 'white'), O(0.8, -0.3, 0.1, 0.1, 'light')],
  }],
  ['landfill-truck', 'Landfill Truck', 'Кар\'єрний самоскид. Каміння в кузові висипається на ходу, а за командою — все одразу.', 'truck', ['#f0a020', '#3a3a3a'], {
    o: o({ wheel: 1.3, wheels: 2 }), mass: 1.1, cargo: ['rock', 6],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.45, 'body'), P([[f.deck.x0, f.deck.y - 0.45], [f.deck.x1, f.deck.y - 0.6], [f.deck.x1, f.deck.y], [f.deck.x0, f.deck.y]], 'body', { deco: true }), R(f.deck.x0, f.deck.y - 0.08, f.deck.x1, f.deck.y, 'dark')],
  }],
  ['limousine', 'Limousine', 'Подовжений лімузин: довгий, важкий, з тонованими вікнами.', 'sedan', ['#1a1a24', '#d0d0d8'], {
    o: o({ len: 1.35 }),
    art: (f) => [R(f.tail.x, -0.02, f.nose.x - 0.05, 0.03, 'metal'), O(-0.3, f.roof.y - 0.04, 0.12, 0.05, 'gold')],
  }],
  ['american-car', 'American Car', 'Седан 70-х: хромовані бампери і хвостові плавники.', 'sedan', ['#4a6ad8', '#e0e0e0'], {
    o: o({ len: 1.1 }),
    art: (f) => [R(f.nose.x - 0.2, 0.16, f.nose.x + 0.08, 0.3, 'metal'), R(f.tail.x - 0.08, 0.16, f.tail.x + 0.2, 0.3, 'metal'), T([f.tail.x, -0.16], [f.tail.x + 0.5, -0.16], [f.tail.x - 0.05, -0.38], 'body'), R(f.tail.x, 0.04, f.nose.x, 0.08, 'metal')],
  }],
  ['steamroller', 'Steamroller', 'Паровий дорожній коток: розплющує все на шляху.', 'box', ['#e0b020', '#3a3a3a'], {
    s: 0.9, parts: ['roller', 'stack'],
    art: (f) => [R(f.roof.x0, f.roof.y - 0.55, f.roof.x0 + 0.9, f.roof.y - 0.45, 'dark'), R(f.roof.x0 + 0.05, f.roof.y - 0.5, f.roof.x0 + 0.12, f.roof.y, 'dark'), O(0.4, -0.3, 0.28, 0.28, 'gold'), O(0.4, -0.3, 0.12, 0.12, 'dark')],
  }],
  ['pickup-truck', 'Pickup Truck', 'Бортовий пікап із ящиками в кузові — вони падають на кожній ямі.', 'pickup', ['#c83a3a', '#f0f0f0'], {
    cargo: ['crate', 2],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.26, 'body'), R(f.deck.x0, f.deck.y - 0.26, f.deck.x1, f.deck.y - 0.2, 'body', { deco: true })],
  }],
  ['motocross-bike', 'Motocross Bike', 'Кросовий мотоцикл: високі крила, шипи на шинах і трамплінний стрибок.', 'bike', ['#ff7a1a', '#2a2a2a'], {
    o: o({ wheel: 1.1 }), arch: 'bouncy',
    art: () => [P([[0.45, -0.32], [1.05, -0.24], [1.0, -0.16], [0.5, -0.2]], 'accent'), P([[-0.4, -0.25], [-1.0, -0.45], [-1.05, -0.38], [-0.45, -0.18]], 'accent'), O(0.15, -0.05, 0.13, 0.11, 'white')],
  }],
  ['car-carrier', 'Car Carrier', 'Двоярусний автовоз із машинками на палубах.', 'truck', ['#3a5ab0', '#e0e0e0'], {
    parts: ['cage'],
    art: (f) => [
      P([[f.deck.x0 + 0.15, f.deck.y - 0.08], [f.deck.x0 + 1.15, f.deck.y - 0.08], [f.deck.x0 + 1.05, f.deck.y - 0.3], [f.deck.x0 + 0.35, f.deck.y - 0.32]], 'rocket'),
      P([[f.deck.x0 + 1.4, f.deck.y - 0.08], [f.deck.x0 + 2.4, f.deck.y - 0.08], [f.deck.x0 + 2.3, f.deck.y - 0.3], [f.deck.x0 + 1.6, f.deck.y - 0.32]], 'scoop'),
      P([[f.deck.x0 + 0.5, f.deck.y - 0.9], [f.deck.x0 + 1.5, f.deck.y - 0.9], [f.deck.x0 + 1.4, f.deck.y - 1.1], [f.deck.x0 + 0.7, f.deck.y - 1.12]], 'leaf'),
    ],
  }],
  ['bumper-car', 'Bumper Car', 'Атракціонна машинка на штанзі. Гумовий бампер — і бамс!', 'blob', ['#ff3a5a', '#ffd23f'], {
    s: 0.85, o: o({ shape: 'flat' }), parts: ['antenna'], bounce: 0.4, noLights: true,
    art: () => [R(-1.3, -0.12, 1.3, 0.05, 'black'), ...star(0.6, -0.28, 0.14, 'gold')],
  }],
  ['forklift-truck', 'Forklift Truck', 'Складський навантажувач: вила підхоплюють суперника.', 'box', ['#ffc020', '#2a2a2a'], {
    s: 0.85, parts: ['forks'],
    art: (f) => [R(f.roof.x0, f.roof.y - 0.6, f.roof.x0 + 0.08, f.roof.y, 'dark'), R(f.roof.x1 - 0.5, f.roof.y - 0.6, f.roof.x1 - 0.42, f.roof.y, 'dark'), R(f.roof.x0, f.roof.y - 0.68, f.roof.x1 - 0.42, f.roof.y - 0.6, 'dark'), O(f.tail.x + 0.3, -0.4, 0.32, 0.3, 'dark')],
  }],
  ['hog', 'Hog', 'Важкий круїзер-чопер: довга вилка, високий кермо, багато хрому.', 'bike', ['#2a2a2a', '#c0c0c8'], {
    o: o({ len: 1.15 }), mass: 1.3,
    art: () => [line([0.7, -0.2], [0.85, -0.85], 0.06, 'metal'), bar(0.7, -0.85, 0.95, 0.05), R(-0.55, 0.02, 0.1, 0.12, 'metal'), line([-0.2, 0.15], [-1.0, 0.1], 0.07, 'metal')],
  }],
  ['ice-cream-van', 'Ice Cream Van', 'Фургон морозива. Стріляє ріжками — суперник замерзає.', 'van', ['#ffb0d0', '#ffffff'], {
    parts: ['cone'],
    art: (f) => [R(-1.2, -0.62, 0.1, -0.2, 'dark'), R(-1.15, -0.25, 0.05, -0.18, 'white'), ...[-1.1, -0.8, -0.5, -0.2].map((x) => O(x, -0.62, 0.15, 0.08, 'white')), R(f.tail.x, 0.08, f.nose.x, 0.14, 'accent')],
  }],
  ['motorbike', 'Motorbike', 'Класичний швидкісний мотоцикл.', 'bike', ['#2a6ae0', '#ffffff'], {
    speed: 1.15,
    art: () => [P([[0.5, -0.2], [0.85, -0.3], [0.8, -0.05], [0.55, 0.0]], 'body'), R(-0.4, -0.08, 0.3, -0.02, 'accent'), line([-0.3, 0.15], [-0.95, 0.05], 0.06, 'metal')],
  }],
  ['fire-truck', 'Fire Truck', 'Пожежна машина з драбиною. Брандспойт збиває суперника струменем води.', 'truck', ['#e02a2a', '#f0f0f0'], {
    parts: ['ladder', 'siren'],
    art: (f) => [R(f.tail.x, 0.0, f.nose.x, 0.06, 'white'), O(-0.6, f.deck.y + 0.14, 0.18, 0.18, 'metal'), O(-0.6, f.deck.y + 0.14, 0.07, 0.07, 'dark'), R(f.deck.x0 + 0.2, f.deck.y - 0.02, f.deck.x1 - 0.2, f.deck.y + 0.25, 'body')],
  }],
  ['police-car', 'Police Car', 'Патрульний седан. Сирена відкидає суперника звуковою хвилею.', 'sedan', ['#1a2a5a', '#ffffff'], {
    parts: ['siren'],
    art: (f) => [R(-0.95, -0.16, 0.75, 0.16, 'white'), ...star(-0.1, 0.0, 0.13, 'gold'), R(f.nose.x - 0.15, 0.16, f.nose.x + 0.08, 0.3, 'black')],
  }],
  ['cherry-picker', 'Cherry Picker', 'Автовишка з люлькою на стрілі.', 'truck', ['#f0f0f0', '#ff8a1a'], {
    parts: ['boom'],
    art: (f) => [R(f.deck.x0 + 0.25, f.deck.y - 1.85, f.deck.x0 + 0.3, f.deck.y - 1.6, 'metal'), R(f.deck.x0 + 0.75, f.deck.y - 1.85, f.deck.x0 + 0.8, f.deck.y - 1.6, 'metal'), R(f.deck.x0 + 0.25, f.deck.y - 1.88, f.deck.x0 + 0.8, f.deck.y - 1.83, 'metal'), R(f.tail.x, 0.0, f.nose.x, 0.06, 'accent')],
  }],
  ['golf-cart', 'Golf Cart', 'Електричний гольф-кар. Б\'є м\'ячиком для гольфу точно в шолом.', 'buggy', ['#f0f0f0', '#3ab04a'], {
    s: 0.85,
    art: (f) => [R(f.roof.x0 - 0.1, f.roof.y - 0.12, f.roof.x1 + 0.1, f.roof.y, 'accent'), R(f.tail.x + 0.05, -0.75, f.tail.x + 0.32, -0.08, 'dark'), line([f.tail.x + 0.1, -0.75], [f.tail.x + 0.05, -1.05], 0.04, 'metal'), line([f.tail.x + 0.25, -0.75], [f.tail.x + 0.35, -1.0], 0.04, 'metal')],
  }],
  ['baby-carriage', 'Baby Carriage', 'Дитячий візочок з каптуром і брязкальцем.', 'cart', ['#7ab0f0', '#ffffff'], {
    noLights: true,
    art: (f) => [P([[f.tail.x, f.deck.y], [f.tail.x + 0.1, f.deck.y - 0.55], [f.tail.x + 0.55, f.deck.y - 0.75], [f.tail.x + 0.75, f.deck.y]], 'accent'), line([f.tail.x, f.deck.y + 0.1], [f.tail.x - 0.45, f.deck.y - 0.5], 0.05), bar(f.tail.x - 0.55, f.deck.y - 0.5, f.tail.x - 0.35, 0.07, 'black'), O(0.2, f.deck.y + 0.3, 0.12, 0.12, 'gold')],
  }],
  ['tanker-truck', 'Tanker Truck', 'Автоцистерна з небезпечним вантажем.', 'truck', ['#e0e0e0', '#3a6ad8'], {
    parts: ['tank'],
    art: (f) => [P([[0.0, f.deck.y - 0.55], [0.18, f.deck.y - 0.38], [0.0, f.deck.y - 0.21], [-0.18, f.deck.y - 0.38]], 'rocket'), R(f.deck.x0 + 0.1, f.deck.y - 0.42, f.deck.x1 - 0.1, f.deck.y - 0.34, 'accent')],
  }],
  ['roadster', 'Roadster', 'Відкритий дводверний спорткар зі стрічками на капоті.', 'coupe', ['#c02a2a', '#f0e0c0'], {
    o: o({ open: true }), speed: 1.1,
    art: (f) => [R(0.2, -0.16, f.nose.x - 0.05, -0.08, 'accent'), R(0.2, -0.04, f.nose.x - 0.02, 0.0, 'accent'), O(f.tail.x + 0.35, -0.3, 0.18, 0.12, 'black')],
  }],
  ['rowboat', 'Rowboat', 'Дерев\'яний човен із веслами на колесах.', 'boat', ['#a06a3a', '#e0c080'], {
    s: 0.85, o: o({ mat: 'wood' }), noLights: true,
    art: () => [line([-0.8, -0.5], [0.2, 0.25], 0.07, 'wood'), O(0.3, 0.3, 0.16, 0.06, 'wood'), line([-0.2, -0.5], [-1.2, 0.2], 0.07, 'wood'), O(-1.3, 0.25, 0.16, 0.06, 'wood')],
  }],
  ['sports-car', 'Sports Car', 'Низький швидкісний спорткар з антикрилом.', 'sports', ['#ff2a2a', '#1a1a1a'], {
    parts: ['wing'],
    art: (f) => [R(-1.4, -0.06, f.nose.x - 0.1, 0.0, 'accent'), P([[0.7, 0.02], [1.0, 0.02], [0.95, 0.12], [0.75, 0.12]], 'black')],
  }],
  ['superstar-dragster', 'Superstar Dragster', 'Зірковий дрегстер із ракетою й плавником.', 'dragster', ['#c02ae0', '#ffd23f'], {
    parts: ['booster', 'fin'],
    art: () => [...star(0.4, 0.04, 0.16), ...star(1.3, 0.08, 0.1)],
  }],
  ['toxic-truck', 'Toxic Waste Truck', 'Вантажівка з токсичними бочками. Скинута бочка вибухає від дотику.', 'truck', ['#3a3a3a', '#7aff3a'], {
    cargo: ['barrel', 3],
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.35, 'accent'), ...slashes(f.tail.x + 0.1, 1.0, 0.0, 0.25, 6, 'scoop', 0.12)],
  }],
  ['helmet-car', 'Helmet Car', 'Машина-шолом: візор, гребінь і шолом, який береже голову.', 'blob', ['#ffd23f', '#e02a2a'], {
    o: o({ shape: 'egg' }), noLights: true,
    art: () => [P([[0.1, -0.85], [0.92, -0.45], [0.95, -0.15], [0.2, -0.3]], 'glass'), R(-0.12, -1.3, 0.05, 0.15, 'accent'), R(-0.85, -0.1, 0.85, 0.0, 'accent')],
  }],
  ['muscle-car', 'Muscle Car', 'Потужне купе з подвійними гоночними смугами.', 'coupe', ['#ff8a1a', '#1a1a1a'], {
    parts: ['wing'], speed: 1.1, accel: 1.1,
    art: (f) => [R(f.tail.x, -0.14, f.nose.x - 0.1, -0.08, 'accent'), R(f.tail.x, -0.04, f.nose.x - 0.04, 0.02, 'accent'), P([[0.6, -0.16], [1.0, -0.16], [0.95, -0.28], [0.65, -0.28]], 'dark')],
  }],
]);
