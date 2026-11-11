import { tailgate } from '../art';
import { arc, blob, checkers, circ, ell, flameDecal, grille, lightbar, path, poly, rect, rr, seat, seg, stack, starShape, stripe, windows } from '../draw';
import { bike, boxy, fenders, loco, monsterChassis, pickup, sedan, tracks } from '../skins';
import type { CarPoly } from '../types';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });

export const SUMMER = group('summer', [
  ['harvester', 'Harvester', 'Зернозбиральний комбайн із мотовилом. Скидає тюки сіна.', 'box', ['#3aa04a', '#ffd23f'], {
    o: o({ len: 1.15, tall: 1.2 }), parts: ['plow'], cargo: ['hay', 2], hideParts: true,
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.3, 'accent'))],
    // The reel is absurdly big and really turns: it combs whatever is in front up and over the header.
    links: (f) => {
      const cx = f.nose.x + 0.75, cy = -0.75, r = 0.85;
      const art: CarPoly[] = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
        art.push(seg([cx, cy], [cx + c * r, cy + sn * r], 0.07, 'red'));
        art.push(seg([cx + c * r - sn * 0.22, cy + sn * r + c * 0.22], [cx + c * r + sn * 0.22, cy + sn * r - c * 0.22], 0.13, 'yellow'));
      }
      art.push(circ(cx, cy, 0.2, 'red'), circ(cx, cy, 0.08, 'dark'));
      return [{ at: [cx, cy], spin: -7, density: 0.03, hit: [ell(cx, cy, r, r, 'red', {}, 8)], art }];
    },
    skin: (f) => [
      rr(f.tail.x, f.roof.y + 0.15, f.nose.x - 0.2, 0.25, 0.1, 'body'),
      rr(f.nose.x - 1.05, f.roof.y - 0.35, f.nose.x - 0.25, f.roof.y + 0.5, 0.08, 'body'), rr(f.nose.x - 0.95, f.roof.y - 0.25, f.nose.x - 0.35, f.roof.y + 0.3, 0.05, 'glass'),
      ...path([[f.tail.x + 0.3, f.roof.y + 0.15], [f.tail.x + 0.2, f.roof.y - 0.5], [f.tail.x - 0.25, f.roof.y - 0.6]], 0.14, 'accent'),
      stripe(f.tail.x, f.nose.x - 0.2, -0.05, 0.08, 'accent'),
      poly([[f.nose.x - 0.2, -0.3], [f.nose.x + 0.7, -0.15], [f.nose.x + 0.75, 0.3], [f.nose.x - 0.2, 0.3]], 'yellow'),
      ...[0, 1, 2, 3].map((i) => poly([[f.nose.x + 0.05 + i * 0.17, 0.3], [f.nose.x + 0.13 + i * 0.17, 0.3], [f.nose.x + 0.09 + i * 0.17, 0.45]], 'chrome')),
      ...path([[f.nose.x - 0.3, -0.5], [f.nose.x + 0.75, -0.75]], 0.12, 'dark'),
      ...stack(f.tail.x + 0.8, f.roof.y + 0.15, 0.4, 0.09, 'dark'),
    ],
  }],
  ['sports-bike', 'Sports Bike', 'Шосейний спортбайк з обтічником.', 'bike', ['#e02a2a', '#ffffff'], {
    speed: 1.2, accel: 1.2,
    skin: (f) => [...bike(f, { style: 'sport' }), stripe(-0.6, 0.8, -0.05, 0.05, 'accent'), circ(0.6, -0.08, 0.1, 'white')],
  }],
  ['off-road-truck', 'Off-Road Truck', 'Експедиційний трак з ящиками спорядження в кузові.', 'pickup', ['#e0a020', '#2a2a2a'], {
    o: o({ wheel: 1.25 }), cargo: ['tire', 3],
    art: (f) => [hidden(tailgate(f.deck.x0, f.deck.y, 0.24, 'body'))],
    skin: (f) => [
      ...pickup(f), ...fenders(f, 'dark', 0.12),
      rr(f.roof.x0, f.roof.y - 0.1, f.roof.x1, f.roof.y, 0.03, 'black'), ...[0, 1, 2].map((i) => circ(f.roof.x0 + 0.15 + i * 0.25, f.roof.y - 0.14, 0.07, 'light')),
      ...path([[f.roof.x1 + 0.3, f.nose.y0 - 0.02], [f.nose.x + 0.1, f.nose.y0 + 0.05], [f.nose.x + 0.15, f.nose.y1 - 0.05]], 0.08, 'black'),
    ],
  }],
  ['classic-monster', 'Classic Monster', 'Оригінальний бігфут на величезних колесах.', 'monster', ['#2a6ae0', '#ffffff'], {
    o: o({ wheel: 1.1 }),
    skin: (f) => [
      ...monsterChassis(f),
      ...pickup({ ...f, nose: { ...f.nose, y0: -0.5, y1: 0.06 }, tail: { ...f.tail, y0: -0.5, y1: 0.06 }, roof: f.roof }),
      starShape(0.4, -0.25, 0.16, 'white'), stripe(f.tail.x, f.nose.x, -0.08, 0.06, 'white'),
    ],
  }],
  ['burger-bike', 'Burger Bike', 'Трицикл-бургерна. Жбурляє бургерами.', 'trike', ['#e0b060', '#7a3a1a'], {
    gun: () => ({ at: [[-0.65, -0.72]], aim: 35 }),
    parts: ['hump'], hideParts: true,
    skin: (f) => [
      ...bike(f, { style: 'scooter', mat: 'red' }),
      blob([[-1.3, -0.3], [-1.2, -0.6], [-0.65, -0.68], [-0.15, -0.55], [-0.12, -0.3]], 'body', {}, 2),
      ...[-1.0, -0.8, -0.55, -0.35].map((x) => ell(x, -0.55, 0.03, 0.02, 'white')),
      blob([[-1.32, -0.3], [-0.1, -0.3], [-0.15, -0.2], [-0.4, -0.25], [-0.7, -0.18], [-1.0, -0.25], [-1.25, -0.2]], 'leaf', {}, 1),
      rr(-1.3, -0.24, -0.12, -0.12, 0.05, 'accent'), rr(-1.25, -0.13, -0.17, -0.02, 0.04, 'body'),
    ],
  }],
  ['lowrider', 'Lowrider', 'Лоурайдер на гідравліці: підстрибує на місці.', 'sedan', ['#8a2ae0', '#ffd23f'], {
    o: o({ len: 1.1 }), arch: 'bouncy', bounce: 0.3,
    skin: (f) => [
      ...sedan(f, { roof: 'coupe', bumper: 'gold' }),
      ...flameDecal(f.nose.x - 0.1, -0.6, 0.05, 0.22),
      stripe(f.tail.x, f.nose.x, 0.2, 0.05, 'gold'),
      ...f.wheels.map((w) => seg([w.x, w.y], [w.x, 0.1], 0.08, 'gold')),
    ],
  }],
  ['yacht', 'Yacht', 'Моторна яхта з білою надбудовою і рятувальним колом.', 'boat', ['#ffffff', '#3a6ad8'], {
    o: o({ len: 1.15 }),
    skin: (f) => [
      blob([[f.tail.x, -0.45], [f.nose.x + 0.05, -0.55], [f.nose.x - 0.3, 0.0], [f.nose.x - 0.6, 0.12], [f.tail.x + 0.15, 0.12]], 'body', {}, 1),
      stripe(f.tail.x, f.nose.x - 0.2, -0.28, 0.08, 'accent'), stripe(f.tail.x + 0.1, f.nose.x - 0.5, 0.0, 0.06, 'accent'),
      blob([[-0.6, -0.45], [-0.55, -0.88], [0.6, -0.9], [0.95, -0.45]], 'white', {}, 1), ...windows(-0.4, 0.6, -0.8, -0.58, 3, 0.08),
      circ(0.1, -0.68, 0.16, 'red'), circ(0.1, -0.68, 0.08, 'white'),
      ...path([[0.3, -0.9], [0.3, -1.4]], 0.05, 'chrome'), poly([[0.33, -1.4], [0.33, -1.15], [0.75, -1.28]], 'accent'),
      ...[-1.6, -1.3, -1.0].map((x) => circ(x, -0.15, 0.06, 'glass')),
    ],
  }],
  ['coupe', 'Coupé', 'Компактне дводверне купе.', 'coupe', ['#3ab0b0', '#ffffff'], {
    skin: (f) => [...sedan(f, { roof: 'coupe' }), stripe(f.tail.x, f.nose.x, 0.0, 0.05, 'white'), ...grille(f.nose.x - 0.06, -0.1, f.nose.x + 0.03, 0.12, 2)],
  }],
  ['speedboat', 'Speedboat', 'Швидкісний катер із номером на борту.', 'boat', ['#e02a2a', '#ffffff'], {
    arch: 'fast',
    skin: (f) => [
      blob([[f.tail.x, -0.4], [f.nose.x + 0.25, -0.5], [f.nose.x - 0.2, 0.0], [f.nose.x - 0.6, 0.12], [f.tail.x + 0.1, 0.12]], 'body', {}, 1),
      poly([[f.tail.x, -0.15], [f.nose.x + 0.15, -0.3], [f.nose.x - 0.05, -0.15], [f.tail.x, 0.0]], 'white', { flat: true }),
      blob([[0.2, -0.45], [0.55, -0.82], [0.75, -0.48]], 'glass', {}, 1),
      circ(-0.6, -0.22, 0.14, 'white'), rect(-0.63, -0.3, -0.57, -0.14, 'black', { flat: true }),
      rr(f.tail.x - 0.35, -0.55, f.tail.x + 0.15, -0.15, 0.06, 'dark'), seg([f.tail.x - 0.25, -0.15], [f.tail.x - 0.3, 0.2], 0.08, 'grey'),
    ],
  }],
  ['swat-van', 'Swat Van', 'Броньовик спецпризначенців. Світлошумова глушить суперника поруч.', 'van', ['#2a2a3a', '#ffffff'], {
    parts: ['ram'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.3, round: 0.06, bumper: 'black' }),
      ...windows(f.tail.x + 0.3, f.tail.x + 1.2, f.roof.y + 0.15, f.roof.y + 0.32, 2, 0.15, 'dark'),
      stripe(f.tail.x, f.nose.x, -0.06, 0.08, 'white'),
      ...lightbar(f.roof.x0 + 0.2, f.roof.x0 + 0.7, f.roof.y),
      rect(f.nose.x - 0.12, f.nose.y0 + 0.1, f.nose.x + 0.25, f.nose.y1 - 0.05, 'black'),
      ...[0, 1, 2].map((i) => rect(f.nose.x + 0.05, f.nose.y0 + 0.15 + i * 0.15, f.nose.x + 0.25, f.nose.y0 + 0.2 + i * 0.15, 'grey', { flat: true })),
      ...[-0.9, -0.5, -0.1, 0.3].map((x) => circ(x, 0.2, 0.04, 'chrome')),
    ],
  }],
  ['dune-buggy', 'Dune Buggy', 'Легкий багі для дюн із прапорцем на щоглі.', 'buggy', ['#ff8a1a', '#2a2a2a'], {
    skin: (f) => [
      blob([[f.tail.x, 0.2], [f.tail.x + 0.1, -0.12], [-0.4, -0.12], [0.6, -0.16], [f.nose.x + 0.05, 0.02], [f.nose.x - 0.1, 0.22]], 'body', {}, 1),
      ...path([[-0.85, -0.1], [-0.65, -0.95], [0.25, -0.95]], 0.09, 'accent'), seg([0.62, -0.12], [0.48, -0.42], 0.09, 'accent'), seg([-0.65, -0.95], [-0.2, -0.1], 0.07, 'accent'),
      ...seat(f.head.x + 0.05, -0.12, 0.42),
      rr(f.tail.x - 0.1, -0.35, f.tail.x + 0.35, -0.05, 0.06, 'grey'), ...stack(f.tail.x + 0.05, -0.3, 0.25, 0.07),
      ...path([[f.tail.x + 0.2, -0.08], [f.tail.x + 0.1, -1.4]], 0.04, 'chrome'), poly([[f.tail.x + 0.1, -1.4], [f.tail.x + 0.1, -1.18], [f.tail.x + 0.45, -1.3]], 'red'),
      ...fenders(f, 'body', 0.08),
    ],
  }],
  ['taxi', 'Taxi', 'Жовте міське таксі з шашечками.', 'sedan', ['#ffd020', '#1a1a1a'], {
    parts: ['sign'], hideParts: true,
    skin: (f) => [
      ...sedan(f),
      ...checkers(f.tail.x + 0.1, -0.02, f.nose.x - 0.1, 0.1, 16),
      rr(-0.45, f.roof.y - 0.2, 0.05, f.roof.y, 0.04, 'white'), rect(-0.4, f.roof.y - 0.15, 0.0, f.roof.y - 0.05, 'black', { flat: true }),
    ],
  }],
  ['asphalt-paver', 'Asphalt Paver', 'Асфальтоукладач: важкий, низький, гарячий.', 'box', ['#f0a020', '#2a2a2a'], {
    o: o({ tall: 0.8 }), parts: ['stack', 'plow'], hideParts: true,
    skin: (f) => [
      rr(f.tail.x - 0.45, -0.05, f.tail.x + 0.1, 0.3, 0.04, 'black'), rr(f.tail.x - 0.5, 0.18, f.tail.x + 0.1, 0.32, 0.03, 'grey'),
      rr(f.tail.x, -0.35, f.nose.x - 0.1, 0.25, 0.08, 'body'),
      rr(-0.6, f.roof.y - 0.1, 0.4, -0.35, 0.06, 'dark'), ...seat(-0.1, -0.35, 0.4),
      ...path([[-0.65, -0.35], [-0.6, f.roof.y - 0.25], [0.5, f.roof.y - 0.25], [0.45, -0.35]], 0.07, 'dark'),
      rr(-0.75, f.roof.y - 0.33, 0.6, f.roof.y - 0.22, 0.04, 'accent'),
      ...stack(f.nose.x - 0.5, -0.35, 0.55, 0.1, 'black'),
      poly([[f.nose.x - 0.1, -0.3], [f.nose.x + 0.55, -0.4], [f.nose.x + 0.55, 0.15], [f.nose.x - 0.1, 0.25]], 'grey'), rect(f.nose.x, -0.2, f.nose.x + 0.45, 0.0, 'black', { flat: true }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.5, 0.2], [f.tail.x + 0.3 + i * 0.5, 0.2], [f.tail.x + 0.45 + i * 0.5, 0.0], [f.tail.x + 0.25 + i * 0.5, 0.0]], 'black', { flat: true })),
    ],
  }],
  ['bulldozer', 'Bulldozer', 'Бульдозер із масивним відвалом.', 'tracked', ['#f0b020', '#2a2a2a'], {
    o: o({ cab: true }), parts: ['blade'], hideParts: true,
    skin: (f) => [
      ...tracks(f),
      blob([[-1.6, 0.0], [-1.55, -0.45], [0.6, -0.5], [1.4, -0.3], [1.5, 0.0]], 'body', {}, 1),
      ...[0.7, 0.9, 1.1].map((x) => rect(x, -0.42, x + 0.06, -0.1, 'dark', { flat: true })),
      rr(f.roof.x0 - 0.45, f.roof.y, f.roof.x1 + 0.4, -0.45, 0.06, 'body'), rect(f.roof.x0 - 0.36, f.roof.y + 0.12, f.roof.x0 - 0.06, -0.6, 'glass'), rr(f.roof.x0 - 0.5, f.roof.y - 0.1, f.roof.x1 + 0.05, f.roof.y + 0.02, 0.04, 'dark'),
      ...stack(0.4, -0.45, 0.45, 0.09, 'black'),
      ...path([[0.9, -0.15], [f.nose.x + 0.2, -0.05]], 0.12, 'dark'),
      blob([[f.nose.x + 0.25, -1.2], [f.nose.x + 0.62, -1.05], [f.nose.x + 0.68, 0.42], [f.nose.x + 0.25, 0.42], [f.nose.x + 0.4, -0.35]], 'body', {}, 1),
      ...path([[f.nose.x + 0.3, 0.42], [f.nose.x + 0.6, 0.42]], 0.06, 'chrome'),
    ],
  }],
  ['locomotive', 'Locomotive', 'Паровоз із тендером вугілля: вугілля сиплеться на ходу.', 'loco', ['#2a2a2a', '#e02a2a'], {
    cargo: ['coal', 5],
    skin: (f) => [...loco(f, { mat: 'accent', boiler: 'black', trim: 'gold' })],
  }],
  ['turtle', 'Turtle', 'Бойова черепаха: ховає голову в панцир.', 'creature', ['#4a8a3a', '#c0a060'], {
    s: 0.9, o: o({ neck: 'raptor' }), parts: ['hump'], noLights: true, hideParts: true,
    skin: (f) => [
      ...f.wheels.map((w) => blob([[w.x - 0.18, -0.1], [w.x + 0.18, -0.1], [w.x + 0.16, w.y], [w.x - 0.16, w.y]], 'body', {}, 1)),
      ...path([[0.7, -0.3], [1.15, -0.55]], 0.32, 'body'), blob([[1.05, -0.75], [1.5, -0.8], [1.75, -0.6], [1.6, -0.42], [1.1, -0.42]], 'body', {}, 1),
      circ(1.5, -0.66, 0.05, 'black'),
      blob([[-1.15, -0.05], [-0.95, -0.7], [0.0, -0.95], [0.95, -0.7], [1.15, -0.05]], 'accent', {}, 2),
      ...[-0.5, 0.0, 0.5].map((x) => poly([[x - 0.2, -0.45], [x, -0.72 + Math.abs(x) * 0.15], [x + 0.2, -0.45], [x, -0.25]], 'brown')),
      rr(-1.15, -0.12, 1.15, 0.02, 0.05, 'yellow'),
      poly([[-1.1, -0.1], [-1.4, 0.05], [-1.1, 0.05]], 'body'),
    ],
  }],
  ['gyrocar', 'Gyrocar', 'Самобалансуючий гіромобіль із маховиком усередині.', 'blob', ['#e0e0e0', '#3a6ad8'], {
    s: 0.9, o: o({ shape: 'egg' }),
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      circ(-0.1, -0.35, 0.36, 'accent'), circ(-0.1, -0.35, 0.26, 'chrome'), circ(-0.1, -0.35, 0.1, 'accent'),
      ...[0, 1, 2, 3].map((i) => seg([-0.1, -0.35], [-0.1 + Math.cos(i * 0.8) * 0.26, -0.35 + Math.sin(i * 0.8) * 0.26], 0.04, 'dark')),
      blob([[0.2, -1.0], [0.7, -0.75], [0.75, -0.55], [0.3, -0.7]], 'glass', {}, 1),
      circ(0.82, -0.3, 0.07, 'light'),
    ],
  }],
  ['personal-transporter', 'Personal Transporter', 'Сегвей: платформа, стійка й кермо.', 'cart', ['#2a2a2a', '#5ef0ff'], {
    s: 0.8, o: o({ tall: 0.5 }), noLights: true,
    skin: (f) => [
      rr(f.tail.x, f.deck.y, f.nose.x, f.deck.y + 0.18, 0.06, 'body'), stripe(f.tail.x + 0.1, f.nose.x - 0.1, f.deck.y + 0.12, 0.04, 'accent'),
      ...path([[0.45, f.deck.y], [0.62, f.deck.y - 0.95]], 0.09, 'grey'), rr(0.45, f.deck.y - 1.02, 0.9, f.deck.y - 0.92, 0.04, 'black'),
      ...f.wheels.map((w) => arc(w.x, w.y, w.r + 0.08, Math.PI * 1.1, Math.PI * 1.9, 0.08, 'accent')),
    ],
  }],
]);

