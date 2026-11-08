import { O, P, R, T, angryEye, bar, checker, eye, flames, line, skullFace, slashes, star, teeth } from '../art';
import { group, o } from './util';

// Toy-track racers: original designs inspired by die-cast toy-car concepts.
export const TOYS = group('toys', [
  ['rattle-bones', 'Rattle Bones', 'Хот-род із решіткою-черепом і хромованими трубами.', 'sports', ['#1a1a1a', '#e8dcc0'], {
    parts: ['exhaust'],
    art: (f) => [...skullFace(f.nose.x - 0.35, -0.12, 0.2), R(-1.4, 0.0, 0.8, 0.05, 'bone')],
  }],
  ['fang-racer', 'Fang Racer', 'Звіроподібний болід із зубастою пащею на носі.', 'sports', ['#2a6ae0', '#ffffff'], {
    parts: ['fangs'],
    art: (f) => [...angryEye(f.nose.x - 0.5, -0.12, 0.1), ...teeth(f.nose.x - 0.5, f.nose.x, 0.12, 4, 0.1), ...slashes(-1.4, 0.4, -0.1, 0.2, 4, 'accent', 0.15)],
  }],
  ['turbo-bones', 'Turbo Bones', 'Кістяний турбо-болід із закисом азоту.', 'formula', ['#e8dcc0', '#e02a2a'], {
    o: o({ mat: 'bone' }), parts: ['exhaust'], ab: 'nitro|Турбо',
    art: () => [...[-1.0, -0.6, -0.2, 0.2, 0.6].map((x) => R(x, -0.04, x + 0.06, 0.16, 'dark')), O(1.6, 0.06, 0.1, 0.07, 'rocket')],
  }],
  ['star-coupe', 'Star Coupe', 'Космічний концепт-кар із зоряним бластером.', 'hover', ['#c0c8d0', '#3a6ad8'], {
    parts: ['fin'], ab: 'shoot:laser|Зоряний бластер',
    art: () => [...star(-0.6, -0.12, 0.13, 'gold'), R(-1.5, -0.02, 1.5, 0.04, 'accent')],
  }],
  ['dark-phantom', 'Dark Phantom', 'Бойова машина темного лорда: розчиняється в тіні.', 'sports', ['#7a3ae0', '#e8dcc0'], {
    parts: ['skull', 'roofspikes'], ab: 'phase|Тінь',
    art: () => [...flames(0.9, -0.9, 0.05, 0.2)],
  }],
  ['rex-dragster', 'Rex Dragster', 'Гібрид тиранозавра й дрегстера: ракета ззаду, рик спереду.', 'dragster', ['#3a8a3a', '#e0e0c0'], {
    parts: ['teeth', 'booster'], ab: 'roar|Рик рекса',
    art: (f) => [...angryEye(f.nose.x - 0.5, 0.0, 0.1, 'scoop'), ...slashes(-1.2, 1.4, -0.15, 0.2, 5, 'accent', 0.1)],
  }],
  ['horned-pickup', 'Horned Pickup', 'Пікап із головою трицератопса. Таранить рогами.', 'pickup', ['#e08a1a', '#e0d0a0'], {
    parts: ['horns'], ab: 'dash|Рогатий таран',
    art: (f) => [P([[f.nose.x - 0.2, -0.26], [f.nose.x + 0.05, -0.6], [f.nose.x + 0.2, -0.5], [f.nose.x, -0.2]], 'accent'), T([f.nose.x - 0.05, 0.0], [f.nose.x - 0.05, 0.15], [f.nose.x + 0.5, -0.05], 'accent', { deco: false, density: 0.3 }), ...eye(f.nose.x - 0.45, -0.1, 0.08)],
  }],
  ['dino-trike', 'Dino Trike', 'Трицикл-динозавр із зубатою мордою.', 'trike', ['#4a8a3a', '#ffd23f'], {
    parts: ['teeth'], noLights: true,
    art: () => [...eye(0.55, -0.15, 0.08, 'scoop'), ...[-0.8, -0.5, -0.2].map((x) => T([x - 0.12, -0.2], [x + 0.12, -0.2], [x, -0.45], 'accent'))],
  }],
  ['stinger-buggy', 'Stinger Buggy', 'Стелс-багі з жалом-ракетою.', 'buggy', ['#2a2a2a', '#e02a2a'], {
    parts: ['booster'], wheelie: 0.7, ab: 'shoot:missile|Жало',
    art: (f) => [P([[f.tail.x + 0.2, -0.08], [f.tail.x + 0.4, -0.08], [f.tail.x - 0.1, -1.0], [f.tail.x - 0.25, -0.95]], 'accent'), T([f.tail.x - 0.25, -0.95], [f.tail.x - 0.05, -1.05], [f.tail.x + 0.15, -0.75], 'spike')],
  }],
  ['swamp-monster', 'Swamp Monster', 'Монстр-трак із боліт, обвішаний твані й водоростями.', 'monster', ['#4a6a2a', '#a0c040'], {
    parts: ['teeth'],
    art: (f) => [...[-1.3, -0.8, -0.2, 0.5, 1.1].map((x, i) => P([[x, -0.1], [x + 0.18, -0.1], [x + 0.12, 0.2 + (i % 2) * 0.1], [x + 0.04, 0.12]], 'leaf')), ...angryEye(f.nose.x - 0.45, -0.38, 0.12, 'scoop')],
  }],
  ['jet-golf-cart', 'Jet Golf Cart', 'Гольф-кар із реактивним двигуном і драйвером.', 'buggy', ['#f0f0f0', '#3aa04a'], {
    s: 0.85, parts: ['booster'], wheelie: 0.7, ab: 'shoot:golf|Реактивний драйв',
    art: (f) => [R(f.roof.x0 - 0.1, f.roof.y - 0.12, f.roof.x1 + 0.1, f.roof.y, 'accent'), ...checker(-1.2, -0.05, 1.2, 0.05, 10, 'white', 'leaf')],
  }],
  ['bumper-concept', 'Bumper Concept', 'Концепт-бампер: гумове коло й удар з розгону.', 'blob', ['#ffd020', '#2a6ae0'], {
    o: o({ shape: 'flat' }), parts: ['ram'], bounce: 0.45, ab: 'dash|Бамс', noLights: true,
    art: () => [R(-1.3, -0.15, 1.3, 0.0, 'black'), O(0, -0.4, 0.3, 0.12, 'accent')],
  }],
  ['throne-racer', 'Throne Racer', 'Гоночний унітаз. Злив збиває суперника струменем.', 'cart', ['#f4f4f4', '#5ab0e0'], {
    o: o({ mat: 'white' }), ab: 'shoot:water|Злив', noLights: true,
    art: (f) => [P([[f.tail.x + 0.05, f.deck.y], [f.tail.x + 0.05, f.deck.y - 0.85], [f.tail.x + 0.55, f.deck.y - 0.85], [f.tail.x + 0.55, f.deck.y]], 'white'), R(f.tail.x + 0.15, f.deck.y - 0.95, f.tail.x + 0.45, f.deck.y - 0.85, 'accent'), O(0.15, f.deck.y, 0.75, 0.1, 'accent'), O(0.15, f.deck.y, 0.55, 0.06, 'glass')],
  }],
  ['wheelie-king', 'Wheelie King', 'Трюковий дрегстер, що весь час стає на диби.', 'dragster', ['#e02a8a', '#ffd23f'], {
    parts: ['booster'],
    art: () => [...star(0.6, 0.05, 0.15, 'accent'), ...[-1.2, -0.8].map((x) => T([x - 0.15, -0.05], [x + 0.15, -0.05], [x, -0.35], 'gold'))],
  }],
  ['bubble-blaster', 'Bubble Blaster', 'Фургон-бульбашкомет. Бульбашка піднімає суперника в повітря.', 'van', ['#5ab0ff', '#ffffff'], {
    s: 0.9, parts: ['bubble'], ab: 'shoot:bubble|Бульбашка',
    art: (f) => [O(f.nose.x - 0.1, -0.3, 0.2, 0.2, 'accent'), O(f.nose.x - 0.1, -0.3, 0.12, 0.12, 'glass'), ...[[-1.0, -0.2], [-0.4, -0.1], [0.2, -0.25]].map(([x, y]) => O(x, y, 0.12, 0.12, 'glass'))],
  }],
  ['chomp-shark', 'Chomp Shark', 'Авто з клацаючою пащею акули.', 'sports', ['#6a8ab0', '#ffffff'], {
    parts: ['fin'], ab: 'dash|Клац!', noLights: true,
    art: (f) => [P([[f.nose.x - 0.8, 0.05], [f.nose.x, -0.05], [f.nose.x - 0.05, 0.2], [f.nose.x - 0.8, 0.2]], 'black'), ...teeth(f.nose.x - 0.75, f.nose.x - 0.05, 0.02, 6, 0.1), ...teeth(f.nose.x - 0.75, f.nose.x - 0.1, 0.2, 5, 0.08, true), ...eye(f.nose.x - 0.65, -0.12, 0.07), P([[f.tail.x, 0.1], [0.6, 0.1], [0.6, 0.26], [f.tail.x, 0.26]], 'white')],
  }],
  ['rocket-board', 'Rocket Board', 'Скейт-ракета: дошка, двигун і ніякого здорового глузду.', 'rocket', ['#ff8a1a', '#2a2a2a'], {
    s: 0.9, parts: ['booster'],
    art: () => [R(-1.6, 0.3, 1.5, 0.4, 'wood'), ...flames(1.2, 0.0, 0.0, 0.24)],
  }],
  ['woodie-surfer', 'Woodie Surfer', 'Дерев\'яний універсал серфера з дошкою на даху.', 'sedan', ['#c08a4a', '#ffffff'], {
    o: o({ mat: 'wood' }),
    art: (f) => [O((f.roof.x0 + f.roof.x1) / 2, f.roof.y - 0.1, 1.2, 0.08, 'accent'), R(-0.3, f.roof.y - 0.15, 1.0, f.roof.y - 0.1, 'rocket'), R(f.nose.x - 0.5, -0.16, f.nose.x, 0.3, 'white')],
  }],
  ['piranha-racer', 'Piranha Racer', 'Хижа риба-болід із гострим плавником.', 'sports', ['#e04a2a', '#ffd23f'], {
    parts: ['teeth', 'fin'], noLights: true,
    art: (f) => [...angryEye(f.nose.x - 0.45, -0.1, 0.1, 'black'), T([f.tail.x, -0.1], [f.tail.x - 0.4, -0.45], [f.tail.x - 0.35, 0.2], 'accent'), ...slashes(-1.2, 0.5, -0.1, 0.2, 4, 'accent', 0.05)],
  }],
  ['soda-popper', 'Soda Popper', 'Пляшка газованки на колесах. Стріляє корком.', 'rocket', ['#3a8a3a', '#e02a2a'], {
    o: o({ mat: 'glass' }), ab: 'shoot:cork|Корок',
    art: () => [R(-1.2, -0.25, 0.4, 0.22, 'accent'), R(-0.9, -0.12, 0.1, 0.08, 'white'), ...[[-1.4, -0.1], [-1.2, 0.1], [0.7, -0.05]].map(([x, y]) => O(x, y, 0.05, 0.05, 'white'))],
  }],
  ['aero-fire-engine', 'Aero Fire Engine', 'Обтічна пожежна машина з водяною гарматою.', 'sports', ['#e02a2a', '#f0f0f0'], {
    o: o({ len: 1.15 }), parts: ['siren'], ab: 'shoot:water|Водомет',
    art: (f) => [R(f.tail.x, -0.02, f.nose.x - 0.1, 0.04, 'white'), line([-1.4, -0.3], [0.2, -0.3], 0.06), ...[-1.2, -0.8, -0.4, 0.0].map((x) => R(x, -0.33, x + 0.04, -0.14, 'metal'))],
  }],
  ['aero-bus', 'Aero Bus', 'Обтічний концептуальний автобус.', 'bus', ['#e0e0e0', '#3a6ad8'], {
    o: o({ tall: 0.8 }), speed: 1.1,
    art: (f) => [P([[f.tail.x, -0.05], [f.nose.x, -0.2], [f.nose.x, -0.1], [f.tail.x, 0.05]], 'accent')],
  }],
  ['school-racer', 'School Racer', 'Шкільний автобус із ракетним двигуном.', 'bus', ['#ffc020', '#1a1a1a'], {
    parts: ['booster'], speed: 1.1,
    art: (f) => [R(f.tail.x, -0.05, f.nose.x, 0.02, 'accent'), R(f.tail.x, 0.1, f.nose.x, 0.17, 'accent'), ...flames(f.nose.x - 0.2, f.nose.x - 1.6, 0.18, 0.18)],
  }],
  ['hot-dog-racer', 'Hot Dog Racer', 'Хот-дог на гоночному шасі: булка, сосиска, гірчиця.', 'blob', ['#c86a3a', '#ffd020'], {
    o: o({ shape: 'flat', len: 1.2 }), noLights: true,
    art: () => [O(0, -0.35, 1.55, 0.2, 'rocket'), P([[-1.2, -0.42], [-0.9, -0.55], [-0.6, -0.42], [-0.3, -0.55], [0.0, -0.42], [0.3, -0.55], [0.6, -0.42], [0.9, -0.55], [1.2, -0.42], [1.2, -0.38], [-1.2, -0.38]], 'accent'), O(0, 0.05, 1.4, 0.18, 'scoop')],
  }],
  ['turbo-taxi', 'Turbo Taxi', 'Тюнінговане спортивне таксі з антикрилом.', 'sports', ['#ffd020', '#1a1a1a'], {
    parts: ['wing', 'sign'],
    art: (f) => checker(f.tail.x + 0.2, -0.04, f.nose.x - 0.2, 0.06, 12),
  }],
  ['oval-racer', 'Oval Racer', 'Болід для кільцевих перегонів із номером.', 'formula', ['#2a6ae0', '#ffd23f'], {
    art: () => [O(-0.95, 0.06, 0.15, 0.13, 'white'), R(-1.0, 0.0, -0.9, 0.12, 'accent'), ...checker(0.6, -0.04, 1.5, 0.06, 6)],
  }],
  ['skull-ram', 'Skull Ram', 'Броньовик із велетенським черепом-тараном.', 'monster', ['#3a3a3a', '#e8dcc0'], {
    parts: ['skull'], arch: 'ram', ab: 'dash|Удар черепом',
    art: (f) => [...skullFace(f.nose.x - 0.35, -0.35, 0.25)],
  }],
  ['night-bat-rod', 'Night Bat Rod', 'Низький вампірський хот-род із крилами-плавниками.', 'sports', ['#2a1a3a', '#c02a3a'], {
    parts: ['fangs'],
    art: (f) => [P([[f.tail.x + 0.1, -0.14], [-0.4, -0.18], [-1.0, -0.5], [-1.2, -0.35], [-1.4, -0.48]], 'accent'), ...angryEye(f.nose.x - 0.5, -0.1, 0.1)],
  }],
  ['scorpion-gt', 'Scorpion GT', 'Спорткар-скорпіон: хвіст із жалом над дахом і клешні.', 'sports', ['#3a3a3a', '#ffd23f'], {
    noLights: true,
    art: (f) => [line([f.tail.x + 0.1, -0.1], [f.tail.x + 0.2, -0.75], 0.12, 'body'), line([f.tail.x + 0.2, -0.75], [f.tail.x + 0.7, -0.95], 0.12, 'body'), T([f.tail.x + 0.65, -1.05], [f.tail.x + 0.75, -0.88], [f.tail.x + 1.0, -0.85], 'accent'), P([[f.nose.x - 0.2, 0.0], [f.nose.x + 0.3, -0.15], [f.nose.x + 0.35, 0.0], [f.nose.x + 0.15, 0.15]], 'body'), ...slashes(-1.2, 0.4, -0.1, 0.2, 4, 'accent', 0.0)],
  }],
  ['spider-speedster', 'Spider Speedster', 'Концепт-павук: вісім очей і павутиномет.', 'sports', ['#7a3ae0', '#7aff3a'], {
    ab: 'shoot:web|Павутина', noLights: true,
    art: (f) => [...[0, 1, 2, 3].map((i) => O(f.nose.x - 0.45 + i * 0.1, -0.1 + (i % 2) * 0.08, 0.05, 0.05, 'accent')), ...[-1.2, -0.8, -0.4, 0.0].map((x) => line([x, 0.1], [x - 0.25, 0.4], 0.05, 'black'))],
  }],
  ['mini-tank', 'Mini Tank', 'Мініатюрний танк із короткою гарматою.', 'tracked', ['#3a8a3a', '#ffd23f'], {
    s: 0.9, parts: [['cannon', 0.7]], ab: 'shoot:cannon|Міні-постріл',
    art: () => [...star(-0.2, -0.36, 0.12, 'accent'), R(-1.75, 0.3, 1.75, 0.36, 'black')],
  }],
  ['bone-speedster', 'Bone Speedster', 'Низький спідстер із хребта й ребер.', 'formula', ['#e8dcc0', '#2a2a2a'], {
    o: o({ mat: 'bone' }),
    art: () => [...[-1.2, -0.9, -0.6, 0.6, 0.9, 1.2].map((x) => R(x, -0.06, x + 0.08, 0.18, 'dark')), ...skullFace(1.65, 0.0, 0.12)],
  }],
  ['twin-devil', 'Twin Devil', 'Дводвигунний дрегстер із рогами й вогнем.', 'dragster', ['#c02a2a', '#1a1a1a'], {
    parts: ['horns', 'booster'],
    art: () => [...flames(1.5, -0.2, 0.06, 0.2), R(-0.6, -0.4, 0.0, -0.18, 'metal'), R(-0.5, -0.5, -0.1, -0.4, 'metal')],
  }],
  ['big-head-racer', 'Big Head Racer', 'Вінтажний болід, у якому водій більший за машину.', 'formula', ['#c08a2a', '#2a2a2a'], {
    o: o({ rim: 'spokes' }),
    art: () => [O(0.4, 0.04, 0.15, 0.13, 'white'), R(0.36, -0.03, 0.45, 0.11, 'black'), line([-0.1, -0.06], [0.15, -0.28], 0.05, 'black')],
  }],
  ['knight-dragster', 'Knight Dragster', 'Болід-дракон у лицарському обладунку зі списом.', 'dragster', ['#a0a8b8', '#e02a2a'], {
    parts: ['spikes'], ab: 'shield|Лицарський обладунок',
    art: () => [line([0.0, -0.3], [2.6, -0.35], 0.06, 'wood'), T([2.5, -0.42], [2.5, -0.28], [2.9, -0.35], 'spike'), P([[-0.4, -0.15], [0.1, -0.15], [0.05, 0.25], [-0.15, 0.35], [-0.35, 0.25]], 'accent'), R(-0.17, -0.12, -0.13, 0.25, 'white')],
  }],
  ['rotty-racer', 'Rotty Racer', 'Машина-ротвейлер. Гавкає так, що суперника здуває.', 'creature', ['#3a2a1a', '#c08a4a'], {
    parts: ['ears', 'snout'], ab: 'roar|Гавкіт', noLights: true,
    art: () => [O(1.72, -0.68, 0.18, 0.12, 'accent'), O(1.95, -0.75, 0.07, 0.06, 'black'), ...eye(1.4, -1.0, 0.07), R(0.6, -0.55, 0.9, -0.45, 'rocket'), O(0, -0.1, 0.7, 0.15, 'accent')],
  }],
  ['six-wheel-mauler', 'Six-Wheel Mauler', 'Шестиколісний гірський всюдихід із лебідкою.', 'tracked', ['#e02a2a', '#2a2a2a'], {
    o: o({ wheels: 3, wheel: 1.6 }),
    art: (f) => [R(f.nose.x - 0.1, -0.15, f.nose.x + 0.15, 0.1, 'metal'), O(f.nose.x + 0.05, -0.02, 0.07, 0.07, 'dark'), R(f.roof.x0, f.roof.y - 0.1, f.roof.x1, f.roof.y, 'black')],
  }],
  ['volt-spike', 'Volt Spike', 'Електричний болід із шипами. Розряд глушить суперника поруч.', 'sports', ['#2a2a3a', '#ffd23f'], {
    parts: ['spikes'], ab: 'roar:stun|Розряд',
    art: () => [P([[-1.0, -0.12], [-0.5, -0.12], [-0.7, 0.02], [-0.2, 0.02], [-0.9, 0.24], [-0.7, 0.08], [-1.1, 0.08]], 'accent')],
  }],
  ['toaster-racer', 'Toaster Racer', 'Тостер на колесах. Стріляє гарячими тостами.', 'box', ['#c0c8d0', '#c08a4a'], {
    s: 0.8, o: o({ mat: 'metal' }), parts: ['toast'], wheelie: 0.7, air: 1.4, ab: 'shoot:toast|Тостомет',
    art: (f) => [R(f.roof.x0 + 0.2, f.roof.y, f.roof.x0 + 0.55, f.roof.y + 0.08, 'black'), R(f.roof.x0 + 0.65, f.roof.y, f.roof.x0 + 1.0, f.roof.y + 0.08, 'black'), R(f.nose.x - 0.25, -0.5, f.nose.x - 0.1, -0.1, 'dark'), O(-0.6, -0.25, 0.12, 0.12, 'black'), R(-1.4, -0.05, 1.4, 0.0, 'accent')],
  }],
]);

void bar;
