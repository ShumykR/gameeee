import { O, P, R, T, bar, eye, line, slashes, star, tailgate } from '../art';
import { group, o } from './util';

const ornaments = (cx: number, y: number): ReturnType<typeof O>[] => [
  O(cx - 0.3, y - 0.3, 0.07, 0.07, 'rocket'), O(cx + 0.25, y - 0.5, 0.07, 0.07, 'gold'), O(cx - 0.1, y - 0.75, 0.06, 0.06, 'white'),
  O(cx + 0.15, y - 1.0, 0.06, 0.06, 'rocket'), O(cx - 0.35, y - 0.15, 0.06, 0.06, 'white'),
];

export const WINTER = group('winter', [
  ['snowmobile', 'Snowmobile', 'Снігохід на лижі з вітровим склом.', 'sled', ['#e02a4a', '#2a2a2a'], {
    parts: ['wing'],
    art: (f) => [P([[0.3, -0.22], [0.9, -0.22], [0.55, -0.55], [0.4, -0.55]], 'glass'), R(-0.6, -0.1, 1.1, -0.02, 'accent'), line([f.nose.x - 0.1, 0.22], [f.nose.x + 0.3, -0.05], 0.06)],
  }],
  ['spruce-delivery', 'Spruce Delivery', 'Вантажівка, що везе на свято живу ялинку з іграшками.', 'truck', ['#c02a2a', '#ffffff'], {
    o: o({ wheels: 2 }), parts: ['tree'],
    art: (f) => [...ornaments((f.deck.x0 + f.deck.x1) / 2, f.deck.y), R(f.tail.x, 0.0, f.nose.x, 0.06, 'white')],
  }],
  ['snowcat', 'Snowcat', 'Важкий гусеничний ратрак із відвалом і прожекторами.', 'tracked', ['#e04a2a', '#f0f0f0'], {
    parts: ['plow'],
    art: (f) => [R(f.roof.x0 + 0.1, f.roof.y - 0.12, f.roof.x0 + 0.5, f.roof.y, 'dark'), O(f.roof.x0 + 0.2, f.roof.y - 0.16, 0.06, 0.06, 'light'), O(f.roof.x0 + 0.4, f.roof.y - 0.16, 0.06, 0.06, 'light'), R(-1.6, 0.2, 1.6, 0.26, 'black')],
  }],
  ['kicksled', 'Kicksled', 'Фінські сани з довгою ручкою: штовхаєшся ногою і летиш.', 'sled', ['#c08a4a', '#e02a2a'], {
    s: 0.85, o: o({ mat: 'wood' }), parts: ['seat'], noLights: true,
    art: (f) => [line([f.tail.x + 0.15, -0.2], [f.tail.x + 0.05, -1.2], 0.06, 'wood'), bar(f.tail.x - 0.05, -1.2, f.tail.x + 0.25, 0.07, 'accent'), R(-0.5, -0.2, 0.3, -0.12, 'accent')],
  }],
  ['snowman', 'Snowman', 'Сніговик на колесах: морквяний ніс, циліндр і сніжки напоготові.', 'blob', ['#f4f8ff', '#ff8a1a'], {
    o: o({ shape: 'snowman', mat: 'white' }), ballast: 0.15, ab: 'shoot:snowball|Сніжки', noLights: true,
    art: () => [
      ...eye(0.2, -1.15, 0.07, 'black'), ...eye(0.42, -1.12, 0.06, 'black'),
      T([0.5, -1.02], [0.5, -0.94], [0.85, -0.97], 'accent'),
      O(0.3, -0.42, 0.06, 0.06, 'black'), O(0.35, -0.2, 0.06, 0.06, 'black'),
      P([[-0.45, -0.72], [0.55, -0.72], [0.5, -0.6], [-0.4, -0.6]], 'rocket'), R(-0.45, -0.72, -0.3, -0.35, 'rocket'),
    ],
  }],
  ['snowball-cannon', 'Snowball Cannon', 'Гусенична сніжкова гармата: б\'є точно в шолом.', 'tracked', ['#5a8ad8', '#ffffff'], {
    s: 0.9, parts: ['cannon'], ab: 'shoot:snowball|Сніжкова гармата',
    art: (f) => [O(f.deck.x0 + 0.1, f.deck.y - 0.12, 0.12, 0.12, 'white'), O(f.deck.x0 + 0.32, f.deck.y - 0.1, 0.1, 0.1, 'white'), R(-1.6, 0.0, 1.6, 0.06, 'accent')],
  }],
  ['snowball-bike', 'Snowball Bike', 'Трицикл зі сніговою кулею за спиною — кидається сніжками.', 'trike', ['#3ab0e0', '#ffffff'], {
    parts: [['ball', 0.5]], ab: 'shoot:snowball|Сніжки',
    art: () => [R(0.2, -0.3, 0.55, -0.22, 'accent'), line([0.6, -0.2], [0.75, -0.6], 0.05), bar(0.68, -0.6, 0.9, 0.05)],
  }],
  ['santa-sleigh', 'Santa\'s Sleigh', 'Літаючі сани Санти. Подарунки в кузові вилітають на віражах.', 'sled', ['#d02a2a', '#ffd23f'], {
    float: 0.8, cargo: ['gift', 3], ab: 'fly|Політ над дахами',
    art: (f) => [
      tailgate(f.deck.x0, f.deck.y, 0.25, 'accent'),
      R(f.deck.x0, f.deck.y - 0.05, f.nose.x - 0.4, f.deck.y + 0.04, 'accent'),
      P([[f.nose.x - 0.3, -0.22], [f.nose.x, -0.55], [f.nose.x + 0.15, -0.5], [f.nose.x - 0.1, -0.15]], 'body'),
      O(f.nose.x + 0.1, -0.55, 0.1, 0.1, 'gold'),
    ],
  }],
  ['gift-box', 'Gift Box', 'Подарункова коробка на колесах. Сюрприз: вона підскакує!', 'blob', ['#e02a4a', '#ffd23f'], {
    o: o({ shape: 'square' }), ab: 'jump|Сюрприз', noLights: true,
    art: (f) => [R(-0.12, f.roof.y, 0.12, 0.2, 'accent'), R(-0.85, -0.6, 0.85, -0.4, 'accent'), O(-0.3, f.roof.y - 0.12, 0.25, 0.13, 'accent'), O(0.3, f.roof.y - 0.12, 0.25, 0.13, 'accent'), O(0, f.roof.y - 0.08, 0.1, 0.1, 'scoop')],
  }],
  ['firework-truck', 'Firework Truck', 'Вантажівка з батареєю феєрверків. Стріляє петардами.', 'truck', ['#3a3ad8', '#ffd23f'], {
    parts: ['launcher'], ab: 'shoot:firework|Салют',
    art: (f) => [...star(-0.2, 0.05, 0.12), ...star(0.4, 0.08, 0.09), ...star(f.deck.x0 + 0.5, f.deck.y - 0.3, 0.1)],
  }],
  ['firework', 'Firework', 'Ракета-петарда зі смугастим корпусом. Тримай «вперед» — летить.', 'rocket', ['#e02a2a', '#ffd23f'], {
    parts: ['booster'],
    art: () => slashes(-1.4, 0.8, -0.32, 0.3, 5, 'accent', 0.25),
  }],
  ['christmas-tree', 'Christmas Tree', 'Ялинка з іграшками на шестиколісній гусениці.', 'tracked', ['#2a8a3a', '#ffd23f'], {
    o: o({ wheels: 6 }), parts: ['tree'],
    art: (f) => [...ornaments((f.deck.x0 + f.deck.x1) / 2, f.deck.y), R(-1.7, -0.05, 1.7, 0.02, 'rocket')],
  }],
  ['snow-racer', 'Snow Racer', 'Одномісні спортивні сани з номером.', 'sled', ['#3a8ad8', '#ffd23f'], {
    speed: 1.05,
    art: () => [O(0.2, -0.05, 0.13, 0.11, 'white'), R(0.17, -0.12, 0.24, 0.02, 'black'), R(-1.4, -0.2, 0.9, -0.14, 'accent')],
  }],
  ['street-sweeper', 'Street Sweeper', 'Снігоприбиральна машина з відвалом і щіткою.', 'box', ['#f0a020', '#ffffff'], {
    parts: ['plow'],
    art: (f) => [O(0.2, 0.32, 0.3, 0.12, 'accent'), ...slashes(f.tail.x, f.nose.x, -0.05, 0.12, 6, 'black', 0.1), R(f.roof.x0 + 0.2, f.roof.y - 0.1, f.roof.x0 + 0.5, f.roof.y, 'scoop')],
  }],
  ['snowcycle', 'Snowcycle', 'Зимовий мотоцикл: лижа спереду, гусениця ззаду.', 'bike', ['#3a3ad8', '#e0e0e0'], {
    o: o({ rim: 'monster' }),
    art: () => [P([[0.7, 0.22], [1.3, 0.22], [1.4, 0.1], [1.25, 0.28], [0.7, 0.3]], 'metal'), P([[0.4, -0.2], [0.8, -0.3], [0.75, -0.05]], 'glass')],
  }],
  ['ice-glider', 'Ice Glider', 'Льодовий буєр під вітрилом: розганяється вітром.', 'sled', ['#a8e0ff', '#ffffff'], {
    o: o({ len: 1.15 }), parts: ['sail'], accel: 1.2,
    art: () => [R(-0.3, -1.3, 0.6, -1.22, 'accent')],
  }],
  ['snow-coach', 'Snow Coach', 'Пасажирський зимовий диліжанс із засніженим дахом.', 'carriage', ['#6a3a2a', '#e0c080'], {
    o: o({ len: 1.2 }),
    art: (f) => [P([[f.roof.x0 - 0.1, f.roof.y + 0.02], [f.roof.x1 + 0.1, f.roof.y + 0.02], [f.roof.x1, f.roof.y - 0.12], [f.roof.x0, f.roof.y - 0.14]], 'white'), R(-1.2, -0.1, 1.2, -0.04, 'accent'), O(1.15, -0.5, 0.1, 0.12, 'light')],
  }],
  ['dual-snowballer', 'Dual Snowballer', 'Здвоєна сніжкова установка на гусеницях.', 'tracked', ['#7ab0e0', '#ffffff'], {
    parts: ['twincannon'], ab: 'shoot:snowball|Подвійна сніжка',
    art: () => [O(-1.0, -0.35, 0.14, 0.14, 'white'), O(-0.7, -0.33, 0.12, 0.12, 'white'), R(-1.6, 0.0, 1.6, 0.06, 'accent')],
  }],
  ['frosty-car', 'Frosty Car', 'Крижаний легковик з бурульками. Дихає морозом — суперник замерзає.', 'sedan', ['#bfe8ff', '#ffffff'], {
    o: o({ mat: 'glass' }), ab: 'shoot:ice|Крижаний подих',
    art: (f) => [...[-1.3, -0.9, -0.5, -0.1, 0.3, 0.8, 1.2].map((x, i) => T([x - 0.08, 0.3], [x + 0.08, 0.3], [x, 0.45 + (i % 2) * 0.08], 'white')), R(f.roof.x0, f.roof.y - 0.06, f.roof.x1, f.roof.y + 0.02, 'white')],
  }],
  ['sleigh', 'Sleigh', 'Класичні дерев\'яні сани із загнутими полозами.', 'sled', ['#a0603a', '#e0c060'], {
    o: o({ mat: 'wood' }), noLights: true,
    art: (f) => [line([f.nose.x - 0.1, 0.1], [f.nose.x + 0.15, -0.45], 0.07, 'gold'), O(f.nose.x + 0.05, -0.48, 0.1, 0.1, 'gold'), R(-1.4, -0.24, 0.9, -0.18, 'accent')],
  }],
  ['rocket-sleigh', 'Rocket Sleigh', 'Сани з реактивним двигуном. Тримай «вперед» — летиш по льоду.', 'sled', ['#e02a2a', '#c0c0c0'], {
    parts: ['booster'],
    art: () => [P([[0.4, -0.22], [0.9, -0.22], [0.7, -0.45]], 'glass'), R(-1.3, -0.12, 0.9, -0.06, 'accent')],
  }],
  ['caterdog', 'Caterdog', 'Робопес-гусениця. Гавкає так, що суперника відкидає.', 'creature', ['#c0c8d0', '#3a8ad8'], {
    o: o({ len: 1.3, mat: 'metal' }), parts: ['tail', 'ears'], ab: 'roar|Гавкіт', noLights: true,
    art: () => [O(1.95, -0.98, 0.07, 0.07, 'light'), R(-1.1, -0.3, 1.1, -0.22, 'accent'), ...[-0.8, -0.3, 0.2, 0.7].map((x) => O(x, 0.1, 0.12, 0.12, 'dark'))],
  }],
  ['sled-dog', 'Sled Dog', 'Хаскі в упряжі тягне за собою сани.', 'creature', ['#8a6a4a', '#f0f0f0'], {
    parts: ['ears', 'trailer'], noLights: true,
    art: () => [O(0.1, -0.05, 0.75, 0.2, 'accent'), R(0.3, -0.6, 0.45, -0.1, 'rocket'), O(1.85, -0.9, 0.06, 0.06, 'black'), O(1.55, -0.72, 0.05, 0.05, 'black')],
  }],
  ['snow-truck', 'Snow Truck', 'Полярний вантажник, повний снігу. Висипає снігову лавину.', 'truck', ['#e06a1a', '#f0f0f0'], {
    o: o({ wheel: 1.3, wheels: 2 }), cargo: ['snowball', 7], ab: 'dump:snowball|Снігова лавина',
    art: (f) => [tailgate(f.deck.x0, f.deck.y, 0.3, 'body'), R(f.deck.x1 - 0.08, f.deck.y - 0.3, f.deck.x1, f.deck.y, 'body', { deco: false }), R(f.roof.x0, f.roof.y - 0.08, f.roof.x1, f.roof.y, 'white')],
  }],
  ['penguin-prisoner', 'Penguin Prisoner', 'Візок із пінгвіном у клітці. Пінгвін може вистрибнути!', 'cart', ['#3a3a4a', '#ffa020'], {
    parts: ['cage'], cargo: ['penguin', 1], noLights: true,
    art: (f) => [R(f.tail.x, f.deck.y + 0.15, f.nose.x, f.deck.y + 0.22, 'accent')],
  }],
  ['penguin-slider', 'Penguin Slider', 'Пінгвін ковзає на череві й таранить суперника.', 'creature', ['#1a1a2a', '#ffa020'], {
    o: o({ neck: 'none', len: 0.9 }), parts: ['snout'], ab: 'dash|Ковзання на череві', noLights: true,
    art: () => [O(0.2, 0.0, 0.7, 0.18, 'white'), ...eye(0.75, -0.42, 0.08), T([-0.9, -0.3], [-0.6, -0.1], [-1.15, 0.05], 'body')],
  }],
  ['penguin-minions', 'Penguin Minions', 'Пінгвін-солдат у касці зі сніжкометом.', 'blob', ['#1a1a2a', '#ffa020'], {
    o: o({ shape: 'egg' }), parts: ['gun'], ab: 'shoot:snowball|Сніжкомет', noLights: true,
    art: () => [O(0.25, -0.35, 0.55, 0.62, 'white'), ...eye(0.45, -0.95, 0.1), T([0.75, -0.82], [0.75, -0.7], [1.05, -0.76], 'accent'), P([[-0.6, -1.05], [0.6, -1.05], [0.4, -1.32], [-0.4, -1.32]], 'leaf')],
  }],
  ['snowball-tank', 'Snowball Tank', 'Білий броньовик для снігових баталій.', 'tracked', ['#e0e8f0', '#3a8ad8'], {
    parts: [['cannon', 0.8]], ab: 'shoot:snowball|Сніжковий постріл',
    art: () => [R(-1.6, 0.0, 1.6, 0.06, 'accent'), ...star(-0.2, -0.35, 0.12, 'accent')],
  }],
  ['electric-reindeer', 'Electric Reindeer', 'Механічний олень зі світним носом. Б\'є розрядом навколо.', 'creature', ['#a0a8b8', '#5ef0ff'], {
    o: o({ mat: 'metal' }), parts: ['horns'], ab: 'roar:stun|Розряд', noLights: true,
    art: () => [O(1.7, -0.88, 0.09, 0.09, 'rocket'), O(1.48, -1.0, 0.05, 0.05, 'accent'), ...[-0.6, 0.0, 0.6].map((x) => P([[x, -0.4], [x + 0.12, -0.25], [x + 0.02, -0.2], [x + 0.1, -0.02], [x - 0.08, -0.22], [x + 0.02, -0.25]], 'accent'))],
  }],
]);
