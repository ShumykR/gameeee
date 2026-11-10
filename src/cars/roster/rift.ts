import { blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, stack, stripe, tank } from '../draw';
import { beast, boxy, carriage, dinoHead, hover, monsterChassis, pickup, tail, tracks } from '../skins';
import type { CarMat, CarPoly } from '../types';
import type { Frame } from '../factory';
import { group, o } from './util';

function base(f: Frame, mat: CarMat = 'body', h = 0.38): CarPoly[] {
  const a = f.wheels[0], b = f.wheels[f.wheels.length - 1];
  const y = a.y - a.r - 0.06;
  return [...tracks(f), blob([[a.x - a.r - 0.15, y + 0.04], [a.x - a.r - 0.05, y - h], [b.x + b.r - 0.35, y - h - 0.02], [b.x + b.r + 0.15, y - 0.06], [b.x + b.r, y + 0.04]], mat, {}, 1)];
}
const crystal = (x: number, y: number, h: number, w: number, mat: CarMat = 'glass'): CarPoly => poly([[x - w / 2, y], [x - w * 0.6, y - h * 0.6], [x, y - h], [x + w * 0.6, y - h * 0.6], [x + w / 2, y]], mat);
const tentacles = (x: number, y: number, n: number, len: number, mat: CarMat = 'accent', dir = -1): CarPoly[] =>
  Array.from({ length: n }, (_, i) => path([[x, y + i * 0.12], [x + dir * len * 0.5, y + 0.15 + i * 0.2], [x + dir * len, y + 0.05 + i * 0.3], [x + dir * len * 1.1, y - 0.1 + i * 0.3]], 0.1 - i * 0.01, mat)).flat();
const glowEyes = (x: number, y: number, n: number, mat: CarMat = 'accent'): CarPoly[] => Array.from({ length: n }, (_, i) => circ(x + i * 0.2, y - (i % 2) * 0.08, 0.07, mat));

export const RIFT = group('rift', [
  ['crystallizer', 'CrystalLizer', 'Гусеничний кристалізатор: обростає кристалічною бронею.', 'tracked', ['#5ad0f0', '#ffffff'], {
    parts: ['crystals'], hideParts: true,
    skin: (f) => [
      ...base(f, 'purple'),
      crystal(-1.0, -0.5, 0.7, 0.35), crystal(-0.6, -0.5, 1.0, 0.4, 'body'), crystal(-0.15, -0.5, 0.6, 0.3, 'sky'), crystal(0.35, -0.5, 0.85, 0.35), crystal(0.8, -0.5, 0.5, 0.28, 'body'),
      stripe(-1.6, 1.6, -0.2, 0.06, 'white'),
    ],
  }],
  ['freezer', 'Freezer', 'Кріогенна машина з балоном рідкого азоту. Заморожує суперника.', 'box', ['#a8e0ff', '#ffffff'], {
    parts: ['tank'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { x0: f.nose.x - 1.2, slope: 0.3, slopeH: 0.4 }),
      rr(f.tail.x, -0.25, f.nose.x - 1.15, 0.3, 0.04, 'dark'),
      tank(f.tail.x + 0.05, f.nose.x - 1.25, -0.6, 0.32, 'chrome'), ...[-1.1, -0.6].map((x) => rect(x, -0.92, x + 0.06, -0.28, 'grey', { flat: true })),
      rr(-0.95, -0.72, -0.5, -0.48, 0.04, 'blue'), rect(-0.9, -0.66, -0.55, -0.62, 'white', { flat: true }),
      ...path([[-0.2, -0.85], [0.1, -1.05], [0.3, -1.05]], 0.06, 'grey'),
      ...[-1.2, -0.7, -0.2, 0.3].map((x) => poly([[x - 0.08, 0.3], [x + 0.08, 0.3], [x, 0.48]], 'white')),
      ...[0.5, 0.75].map((x) => ell(x, f.roof.y - 0.1, 0.1, 0.06, 'white')),
    ],
  }],
  ['harpoon', 'Harpoon', 'Платформа з гарпунною гарматою: б\'є і притягує суперника.', 'pickup', ['#5a6a7a', '#ffd23f'], {
    gun: (f) => ({ at: [[1.12, f.deck.y - 1.02]], aim: 20 }),
    parts: [['cannon', 1.2]], hideParts: true,
    skin: (f) => [
      ...pickup(f),
      circ(f.deck.x0 + 0.35, f.deck.y - 0.2, 0.22, 'wood'), circ(f.deck.x0 + 0.35, f.deck.y - 0.2, 0.09, 'dark'),
      ...path([[-0.6, f.deck.y - 0.1], [-0.2, f.deck.y - 0.55]], 0.18, 'dark'),
      ...path([[-0.2, f.deck.y - 0.55], [0.9, f.deck.y - 0.95]], 0.08, 'chrome'),
      poly([[0.9, f.deck.y - 1.05], [1.15, f.deck.y - 1.02], [0.95, f.deck.y - 0.85]], 'chrome'),
      stripe(f.tail.x, f.nose.x, 0.06, 0.06, 'accent'),
    ],
  }],
  ['mine-lander', 'Mine Lander', 'Гусеничний мінний загороджувач: ставить міни позаду.', 'tracked', ['#3a3a4a', '#ff3a3a'], {
    parts: ['barrels'], hideParts: true,
    skin: (f) => [
      ...base(f),
      ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => poly([[-1.6 + i * 0.4, -0.18], [-1.4 + i * 0.4, -0.18], [-1.5 + i * 0.4, 0.0], [-1.7 + i * 0.4, 0.0]], 'yellow', { flat: true })),
      ...[0, 1, 2].map((i) => [circ(-0.9 + i * 0.5, -0.65, 0.2, 'dark'), circ(-0.9 + i * 0.5, -0.65, 0.07, 'red'), ...spikesAlong(-1.05 + i * 0.5, -0.75 + i * 0.5, -0.82, 2, 0.1, 'grey')]).flat(),
      rr(0.75, -0.95, 1.4, -0.5, 0.06, 'body'), rect(0.95, -0.88, 1.32, -0.68, 'glass'),
    ],
  }],
  ['kraken-bait', 'Kraken\'s Bait', 'Бочка-приманка, з якої вже лізуть щупальця.', 'blob', ['#8a5a2a', '#3a3a3a'], {
    o: o({ mat: 'wood' }), parts: ['tentacles'], noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.8, -0.5, 3, 0.7, 'pink'),
      blob([[-0.95, 0.35], [-1.0, -0.35], [-0.95, -1.05], [0.95, -1.05], [1.0, -0.35], [0.95, 0.35]], 'wood', {}, 1),
      ...[-0.85, -0.25, 0.25].map((y) => rr(-1.0, y - 0.06, 1.0, y + 0.06, 0.03, 'dark')),
      ...eyeball(0.5, -0.55, 0.12, 'red'),
      ...path([[0.6, -1.0], [0.75, -1.4], [0.95, -1.35]], 0.12, 'pink'), ...path([[-0.4, -1.0], [-0.5, -1.35], [-0.3, -1.45]], 0.1, 'pink'),
    ],
  }],
  ['bat-holder', 'Bat Holder', 'Візок-сідало, повний кажанів.', 'cart', ['#3a2a4a', '#a050e0'], {
    parts: ['wings'], noLights: true, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x, f.deck.y], [f.nose.x, f.deck.y], [f.nose.x - 0.18, 0.16], [f.tail.x + 0.18, 0.16]], 'body', {}, 1),
      ...path([[f.tail.x + 0.1, f.deck.y], [f.tail.x + 0.1, f.deck.y - 0.7], [f.nose.x - 0.1, f.deck.y - 0.7], [f.nose.x - 0.1, f.deck.y]], 0.07, 'wood'),
      ...[-0.5, 0.0, 0.5].map((x) => [
        poly([[x - 0.25, f.deck.y - 0.55], [x - 0.05, f.deck.y - 0.62], [x, f.deck.y - 0.45], [x + 0.05, f.deck.y - 0.62], [x + 0.25, f.deck.y - 0.55], [x + 0.12, f.deck.y - 0.35], [x, f.deck.y - 0.3], [x - 0.12, f.deck.y - 0.35]], 'black'),
        circ(x - 0.04, f.deck.y - 0.45, 0.025, 'red'), circ(x + 0.04, f.deck.y - 0.45, 0.025, 'red'),
      ]).flat(),
      stripe(f.tail.x + 0.1, f.nose.x - 0.1, f.deck.y + 0.25, 0.06, 'accent'),
    ],
  }],
  ['ghost-ship', 'Ghost Ship', 'Летючий корабель-привид із подертими вітрилами.', 'boat', ['#4a5a6a', '#a0f0d0'], {
    parts: ['sail'], float: 0.85, noLights: true, hideParts: true,
    skin: (f) => [
      blob([[f.tail.x - 0.1, -0.85], [f.tail.x + 0.4, -0.55], [f.nose.x - 0.3, -0.5], [f.nose.x + 0.3, -0.6], [f.nose.x - 0.3, 0.05], [f.tail.x + 0.3, 0.1]], 'body', {}, 1),
      rr(f.tail.x - 0.1, -0.95, f.tail.x + 0.6, -0.5, 0.04, 'body'),
      ...[-1.0, -0.5, 0.0, 0.5].map((x) => circ(x, -0.22, 0.08, 'accent')),
      ...path([[0.1, -0.5], [0.1, -2.0]], 0.08, 'wood'),
      poly([[0.15, -1.9], [0.75, -1.85], [0.6, -1.5], [0.85, -1.3], [0.6, -1.1], [0.75, -0.75], [0.15, -0.7]], 'accent'),
      poly([[0.05, -1.75], [-0.6, -1.6], [-0.45, -1.2], [-0.65, -0.85], [0.05, -0.75]], 'accent'),
      ...path([[f.nose.x + 0.2, -0.6], [f.nose.x + 0.7, -0.95]], 0.05, 'wood'),
      poly([[-0.1, -2.05], [-0.1, -1.9], [-0.45, -1.95]], 'black'),
    ],
  }],
  ['urn-launcher', 'Urn Launcher', 'Мобільна катапульта: метає урни, що розбиваються з вибухом.', 'tracked', ['#7a5a3a', '#e0c080'], {
    gun: (f) => ({ at: [[f.deck.x1 + 0.27, f.deck.y - 1.32]], aim: 45 }),
    skin: (f) => [
      ...base(f, 'body', 0.3),
      poly([[f.deck.x0 + 0.1, f.deck.y], [f.deck.x0 + 0.5, f.deck.y - 0.7], [f.deck.x0 + 0.9, f.deck.y]], 'wood'),
      ...path([[f.deck.x0 + 0.5, f.deck.y - 0.6], [f.deck.x1 + 0.2, f.deck.y - 1.1]], 0.1, 'wood'),
      blob([[f.deck.x1 + 0.0, f.deck.y - 1.1], [f.deck.x1 + 0.5, f.deck.y - 1.15], [f.deck.x1 + 0.45, f.deck.y - 1.0], [f.deck.x1 + 0.05, f.deck.y - 0.98]], 'wood', {}, 1),
      blob([[f.deck.x1 + 0.12, f.deck.y - 1.12], [f.deck.x1 + 0.08, f.deck.y - 1.35], [f.deck.x1 + 0.2, f.deck.y - 1.5], [f.deck.x1 + 0.35, f.deck.y - 1.5], [f.deck.x1 + 0.45, f.deck.y - 1.35], [f.deck.x1 + 0.4, f.deck.y - 1.12]], 'accent', {}, 1),
      stripe(f.deck.x1 + 0.1, f.deck.x1 + 0.42, f.deck.y - 1.3, 0.04, 'brown'),
      circ(f.deck.x0 + 0.5, f.deck.y - 0.6, 0.08, 'dark'),
    ],
  }],
  ['ghost-dragon-summoner', 'Ghost Dragon Summoner', 'Платформа заклинача: кристали кличуть примарного дракона, що дихає вогнем.', 'carriage', ['#2a2a4a', '#7aff9a'], {
    parts: ['crystals'], hideParts: true,
    skin: (f) => [
      ...carriage(f, { trim: 'accent' }),
      crystal(-0.5, f.roof.y - 0.05, 0.6, 0.3, 'accent'), crystal(-0.2, f.roof.y - 0.05, 0.4, 0.22, 'sky'),
      ...path([[f.roof.x1 - 0.2, f.roof.y + 0.1], [f.roof.x1 + 0.3, f.roof.y - 0.3], [f.roof.x1 + 0.6, f.roof.y - 0.6]], 0.2, 'accent'),
      blob([[f.roof.x1 + 0.45, f.roof.y - 0.7], [f.roof.x1 + 0.85, f.roof.y - 0.78], [f.roof.x1 + 1.1, f.roof.y - 0.55], [f.roof.x1 + 0.55, f.roof.y - 0.45]], 'accent', {}, 1),
      circ(f.roof.x1 + 0.75, f.roof.y - 0.65, 0.05, 'white'), ...fangs(f.roof.x1 + 0.7, f.roof.x1 + 1.05, -0.0 + f.roof.y - 0.52, 3, 0.07),
      ...[-0.6, 0.0, 0.6].map((x) => circ(x, f.roof.y + 0.45, 0.08, 'accent')),
    ],
  }],
  ['jelly-shock', 'Jelly Shock', 'Електрична медуза: б\'є струмом блискавкою.', 'blob', ['#ff7ad0', '#5ef0ff'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], bounce: 0.5, noLights: true, hideParts: true,
    skin: () => [
      ...[-0.6, -0.3, 0.0, 0.3, 0.6].map((x, i) => path([[x, -0.1], [x + (i % 2 ? 0.1 : -0.1), 0.15], [x, 0.4]], 0.08, 'pink')).flat(),
      blob([[-0.95, -0.05], [-0.95, -0.6], [-0.5, -1.15], [0.5, -1.15], [0.95, -0.6], [0.95, -0.05]], 'body', {}, 2),
      ell(0, -0.75, 0.55, 0.3, 'pink'),
      ...eyeball(0.45, -0.5, 0.09), ...eyeball(0.15, -0.5, 0.08),
      ...[-0.5, 0.0].map((x) => poly([[x, -0.15], [x + 0.1, -0.15], [x + 0.04, 0.0], [x + 0.12, 0.0], [x - 0.04, 0.25], [x + 0.02, 0.05], [x - 0.06, 0.05]], 'accent', { flat: true })),
    ],
  }],
  ['abyss-eel', 'Abyss Eel', 'Глибоководний вугор зі світними плямами.', 'creature', ['#2a4a6a', '#5ef0ff'], {
    o: o({ neck: 'raptor', len: 1.3, tall: 0.7 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const L = 1.3;
      return [
        ...path([[f.tail.x + 0.2, -0.25], [f.tail.x - 0.3, -0.45], [f.tail.x - 0.7, -0.2], [f.tail.x - 1.0, -0.35]], 0.22, 'body'),
        ...beast(f, { rx: 1.35, ry: 0.3, belly: 'teal' }),
        ...path([[0.9 * L, -0.25], [1.2 * L, -0.55]], 0.3, 'body'),
        blob([[1.05 * L, -0.8], [1.5 * L, -0.85], [1.8 * L, -0.65], [1.75 * L, -0.45], [1.15 * L, -0.42]], 'body', {}, 1),
        ...[[-0.9, -0.3], [-0.4, -0.35], [0.1, -0.35], [0.6, -0.3]].map(([x, y]) => circ(x, y, 0.07, 'accent')),
        circ(1.5 * L, -0.68, 0.08, 'accent'), rect(1.35 * L, -0.55, 1.78 * L, -0.5, 'black'), ...fangs(1.38 * L, 1.75 * L, -0.55, 4, 0.07),
        ...path([[1.3 * L, -0.85], [1.25 * L, -1.15], [1.45 * L, -1.3]], 0.04, 'grey'), circ(1.47 * L, -1.32, 0.07, 'light'),
        ...spikesAlong(-1.0, 0.8, -0.3, 8, 0.12, 'teal'),
      ];
    },
  }],
  ['blast-fish', 'Blast Fish', 'Механічна риба-їжак. Скидає вибухову ікру.', 'blob', ['#e0a020', '#e02a2a'], {
    parts: ['fin', 'spikes'], noLights: true,
    skin: () => [
      poly([[-0.85, -0.35], [-1.3, -0.75], [-1.2, -0.35], [-1.3, 0.05]], 'accent'),
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return poly([[Math.cos(a - 0.12) * 0.85, -0.35 + Math.sin(a - 0.12) * 0.65], [Math.cos(a) * 1.15, -0.35 + Math.sin(a) * 0.9], [Math.cos(a + 0.12) * 0.85, -0.35 + Math.sin(a + 0.12) * 0.65]], 'spike');
      }),
      ell(0, -0.35, 0.92, 0.7, 'body', {}, 28),
      ell(0.1, -0.1, 0.6, 0.35, 'cream'),
      ...eyeball(0.45, -0.55, 0.15),
      ell(0.88, -0.22, 0.09, 0.07, 'black'),
      poly([[-0.2, -0.95], [0.1, -1.25], [0.25, -0.9]], 'accent'),
    ],
  }],
  ['cosmic-squid', 'Cosmic Squid', 'Космічний кальмар: пливе крізь повітря на щупальцях.', 'blob', ['#7a3ae0', '#ff7ad0'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], float: 0.8, noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.6, -0.3, 4, 0.9, 'body'),
      blob([[-0.8, 0.15], [-0.95, -0.4], [-0.5, -1.0], [0.1, -1.45], [0.55, -0.95], [0.95, -0.35], [0.8, 0.15]], 'body', {}, 2),
      poly([[-0.2, -1.2], [0.1, -1.55], [0.4, -1.2]], 'accent'),
      ...eyeball(0.4, -0.45, 0.14),
      ...[[-0.3, -0.9, 0.1], [0.2, -1.05, 0.07], [-0.5, -0.4, 0.08], [0.0, -0.2, 0.06]].map(([x, y, r]) => circ(x, y, r, 'accent')),
    ],
  }],
  ['space-scallop', 'Space Scallop', 'Броньований гребінець зі стулками-панцирем.', 'blob', ['#f0a0c0', '#ffffff'], {
    o: o({ shape: 'flat' }), parts: ['plates'], noLights: true, hideParts: true,
    skin: () => [
      blob([[-1.25, -0.05], [-1.1, -0.55], [-0.5, -0.85], [0.5, -0.85], [1.1, -0.55], [1.25, -0.05]], 'body', {}, 2),
      ...[-0.95, -0.55, -0.15, 0.25, 0.65, 1.0].map((x) => seg([0, 0.1], [x, -0.65 + Math.abs(x) * 0.15], 0.07, 'accent')),
      rr(-1.3, -0.08, 1.3, 0.18, 0.1, 'pink'), poly([[-0.3, 0.1], [0.3, 0.1], [0.2, 0.3], [-0.2, 0.3]], 'accent'),
      ...[-0.6, -0.2, 0.2, 0.6].map((x) => circ(x, 0.05, 0.05, 'sky')),
    ],
  }],
  ['atomic-ray', 'Atomic Ray', 'Гусеничний випромінювач атомних променів.', 'tracked', ['#3a3a4a', '#7aff3a'], {
    gun: () => ({ at: [[1.42, -1.38]], aim: 37 }),
    parts: ['dish'], hideParts: true,
    skin: (f) => [
      ...base(f),
      circ(0, -0.35, 0.22, 'yellow'), ...[0, 1, 2].map((i) => poly([[0, -0.35], [Math.cos(i * 2.1) * 0.2, -0.35 + Math.sin(i * 2.1) * 0.2], [Math.cos(i * 2.1 + 0.8) * 0.2, -0.35 + Math.sin(i * 2.1 + 0.8) * 0.2]], 'black', { flat: true })),
      rr(0.5, -0.9, 0.9, -0.45, 0.05, 'dark'), ...path([[0.7, -0.9], [1.3, -1.35]], 0.12, 'grey'),
      blob([[1.05, -1.55], [1.6, -1.35], [1.4, -1.05]], 'chrome', {}, 1), circ(1.32, -1.3, 0.08, 'accent'),
      ...[-1.2, -0.9, -0.6].map((x) => tank(x - 0.12, x + 0.12, -0.68, 0.18, 'accent')),
    ],
  }],
  ['doom-bomber', 'Doom Bomber', 'Важкий бомбардувальник розломів: скидає бомби з ґнотом.', 'hover', ['#3a3a4a', '#e02a2a'], {
    o: o({ len: 1.15 }), parts: ['wing', 'jets'], hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.2, -0.85], [f.tail.x + 0.25, -0.85], [f.tail.x + 0.8, -0.3]], 'accent'),
      rr(f.tail.x - 0.35, -0.22, f.tail.x + 0.05, 0.0, 0.05, 'grey'), rr(f.tail.x - 0.35, 0.02, f.tail.x + 0.05, 0.2, 0.05, 'grey'),
      ...hover(f, { glow: 'red', canopy: 'dark' }),
      ...[-0.8, -0.4, 0.0].map((x) => [circ(x, 0.28, 0.12, 'black'), seg([x, 0.16], [x + 0.06, 0.08], 0.03, 'tan')]).flat(),
      poly([[1.0, -0.2], [1.35, -0.12], [1.3, -0.05], [1.0, -0.1]], 'yellow'), circ(1.2, -0.12, 0.03, 'black'),
      poly([[-0.6, 0.0], [0.6, 0.0], [-0.5, 0.4], [-0.9, 0.4]], 'body'),
    ],
  }],
  ['specimen-x', 'Specimen X', 'Колба з мутантом на гусеницях. Мутант дивиться на тебе.', 'tracked', ['#5a6a7a', '#7aff3a'], {
    parts: ['tank'], hideParts: true,
    skin: (f) => {
      const cx = (f.deck.x0 + f.deck.x1) / 2, y = f.deck.y;
      return [
        ...base(f),
        rr(cx - 0.75, y - 0.2, cx + 0.75, y + 0.05, 0.04, 'grey'), rr(cx - 0.75, y - 1.05, cx + 0.75, y - 0.92, 0.04, 'grey'),
        rr(cx - 0.68, y - 0.95, cx + 0.68, y - 0.18, 0.15, 'glass'),
        ell(cx, y - 0.45, 0.4, 0.28, 'accent'), ...eyeball(cx + 0.05, y - 0.5, 0.15, 'red'),
        ...path([[cx - 0.3, y - 0.3], [cx - 0.5, y - 0.2]], 0.07, 'accent'), ...path([[cx + 0.3, y - 0.3], [cx + 0.5, y - 0.2]], 0.07, 'accent'),
        ...[cx - 0.45, cx + 0.15].map((x) => circ(x, y - 0.8, 0.04, 'white')),
      ];
    },
  }],
  ['rcu', 'Rift Containment Unit', 'Контейнер стримування: поле глушить усе поруч.', 'box', ['#e0e0e0', '#ff3a3a'], {
    parts: ['siren'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.25, slopeH: 0.4, round: 0.06 }),
      ...[0, 1, 2, 3, 4].map((i) => poly([[f.tail.x + 0.1 + i * 0.36, f.roof.y + 0.1], [f.tail.x + 0.28 + i * 0.36, f.roof.y + 0.1], [f.tail.x + 0.12 + i * 0.36, f.roof.y + 0.4], [f.tail.x - 0.06 + i * 0.36, f.roof.y + 0.4]], 'accent', { flat: true })),
      circ(-0.4, -0.1, 0.22, 'black'), circ(-0.4, -0.1, 0.13, 'purple'), circ(-0.4, -0.1, 0.05, 'white'),
      ...[f.roof.x1 - 0.7, f.roof.x1 - 0.45].map((x) => rr(x, f.roof.y - 0.16, x + 0.2, f.roof.y, 0.05, 'red')),
    ],
  }],
  ['void-hopper', 'Void Hopper', 'Ровер порожнечі: стрибає крізь портали на кілька метрів.', 'buggy', ['#2a1a3a', '#c07aff'], {
    bounce: 0.5,
    skin: (f) => [
      ...f.wheels.map((w) => path([[w.x, w.y], [w.x * 0.7, -0.3], [w.x * 0.4, -0.05]], 0.08, 'purple')).flat(),
      blob([[f.tail.x + 0.1, 0.1], [f.tail.x + 0.2, -0.2], [0.0, -0.25], [f.nose.x - 0.2, -0.18], [f.nose.x, 0.05], [0.0, 0.15]], 'body', {}, 1),
      ell(0, 0.15, 0.35, 0.13, 'accent'), ell(0, 0.15, 0.2, 0.07, 'black'),
      ...path([[-0.85, -0.2], [-0.65, -0.95], [0.25, -0.95], [0.55, -0.2]], 0.08, 'accent'),
      circ(f.nose.x - 0.15, -0.1, 0.07, 'light'),
    ],
  }],
  ['rift-monster', 'Rift Monster', 'Істота з порталу: зникає й з\'являється ближче до тебе.', 'monster', ['#3a1a4a', '#ff3aa0'], {
    o: o({ open: true }),
    parts: ['fangs'], hideParts: true,
    skin: (f) => [
      ...monsterChassis(f, 'purple'),
      blob([[f.tail.x, 0.08], [f.tail.x - 0.1, -0.6], [-0.7, -1.05], [0.2, -1.15], [f.nose.x - 0.1, -0.75], [f.nose.x + 0.1, -0.2], [f.nose.x, 0.08]], 'body', {}, 2),
      ...[[-1.0, -0.6], [-0.5, -0.8], [-0.1, -0.5]].map(([x, y]) => ell(x, y, 0.12, 0.06, 'accent')),
      ...eyeball(f.nose.x - 0.6, -0.55, 0.12, 'accent'), ...eyeball(f.nose.x - 0.25, -0.55, 0.1, 'accent'), ...eyeball(f.nose.x - 0.42, -0.8, 0.07, 'accent'),
      poly([[f.nose.x - 0.85, -0.25], [f.nose.x + 0.08, -0.28], [f.nose.x, 0.05], [f.nose.x - 0.8, 0.05]], 'black'),
      ...fangs(f.nose.x - 0.83, f.nose.x + 0.05, -0.26, 6, 0.13), ...fangs(f.nose.x - 0.75, f.nose.x, 0.05, 5, 0.1, true),
    ],
  }],
  ['void-engine', 'Void Engine', 'Монолітний двигун порожнечі: телепортується вперед.', 'box', ['#1a1a24', '#c07aff'], {
    o: o({ tall: 1.2 }), parts: ['stack'], hideParts: true,
    skin: (f) => [
      ...boxy(f, { slope: 0.15, slopeH: 0.3, round: 0.04, bumper: 'purple' }),
      ...stack(f.roof.x1 - 0.4, f.roof.y, 0.45, 0.14, 'dark'), circ(f.roof.x1 - 0.4, f.roof.y - 0.5, 0.08, 'accent'),
      circ(-0.3, -0.45, 0.36, 'accent'), circ(-0.3, -0.45, 0.25, 'black'), circ(-0.3, -0.45, 0.12, 'purple'), circ(-0.3, -0.45, 0.05, 'white'),
      ...[0, 1, 2, 3, 4, 5].map((i) => seg([-0.3 + Math.cos(i * 1.05) * 0.38, -0.45 + Math.sin(i * 1.05) * 0.38], [-0.3 + Math.cos(i * 1.05) * 0.48, -0.45 + Math.sin(i * 1.05) * 0.48], 0.06, 'accent')),
      stripe(f.tail.x, f.nose.x, -0.02, 0.05, 'accent'),
    ],
  }],
  ['mantis-shrimp', 'Mantis Shrimp', 'Рак-богомол: найсильніший удар клешнею у світі.', 'creature', ['#e04a3a', '#5ad0f0'], {
    o: o({ neck: 'raptor' }), parts: ['claw'], noLights: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        poly([[f.tail.x + 0.1, -0.3], [f.tail.x - 0.45, -0.55], [f.tail.x - 0.35, -0.2], [f.tail.x - 0.45, 0.1]], 'accent'),
        ...beast(f, { ry: 0.38 }),
        ...[-0.8, -0.5, -0.2, 0.1, 0.4, 0.7].map((x, i) => rect(x, -0.58, x + 0.1, 0.15, i % 2 ? 'accent' : 'orange', { flat: true })),
        ...h.polys,
        ...path([[1.3, -0.85], [1.4, -1.15]], 0.05, 'accent'), circ(1.42, -1.2, 0.09, 'yellow'), circ(1.45, -1.2, 0.04, 'black'),
        ...path([[1.55, -0.85], [1.75, -1.15]], 0.04, 'accent'), ...path([[1.7, -0.72], [2.05, -1.0]], 0.04, 'accent'),
      ];
    },
  }],
  ['hercules-beetle', 'Hercules Beetle', 'Всюдихід-жук із рогом. Таранить з розгону.', 'blob', ['#3a2a1a', '#c0a040'], {
    o: o({ shape: 'flat' }), parts: [['drill', 1.5]], noLights: true, hideParts: true,
    skin: (f) => [
      ...[-0.7, -0.2, 0.3].map((x) => path([[x, 0.0], [x - 0.15, 0.2], [x - 0.25, 0.42]], 0.07, 'black')).flat(),
      ell(-0.1, -0.2, 1.1, 0.42, 'accent', {}, 28),
      seg([-0.1, -0.6], [-0.1, 0.15], 0.05, 'black'),
      blob([[0.7, -0.45], [1.15, -0.5], [f.nose.x + 0.05, -0.2], [1.1, 0.05], [0.75, 0.0]], 'body', {}, 1),
      ...path([[0.95, -0.45], [1.4, -1.1], [2.0, -1.35], [2.3, -1.1]], 0.16, 'black'),
      ...path([[f.nose.x - 0.05, -0.15], [f.nose.x + 0.7, -0.35], [f.nose.x + 1.25, -0.2]], 0.2, 'black'), ...path([[f.nose.x + 0.9, -0.33], [f.nose.x + 1.05, -0.6]], 0.1, 'black'),
      circ(1.05, -0.3, 0.05, 'red'),
      ell(-0.5, -0.4, 0.25, 0.08, 'gold'),
    ],
  }],
  ['rift-spider', 'Rift Spider', 'Кіберпавук розлому: стріляє павутиною, що зупиняє суперника.', 'tracked', ['#2a2a3a', '#e02a2a'], {
    s: 0.9,
    skin: () => [
      ...[-1.4, -0.9, -0.4, 0.4, 0.9, 1.4].map((x) => path([[x * 0.4, -0.35], [x * 0.75, -0.7], [x, 0.3]], 0.08, 'black')).flat(),
      ell(-0.6, -0.4, 0.75, 0.42, 'body'), ell(0.55, -0.35, 0.5, 0.32, 'body'),
      poly([[-0.6, -0.65], [-0.45, -0.45], [-0.6, -0.25], [-0.75, -0.45]], 'accent'), poly([[-0.6, -0.4], [-0.4, -0.2], [-0.8, -0.2]], 'accent'),
      ...glowEyes(0.7, -0.4, 3, 'red'),
      ...fangs(0.9, 1.05, -0.15, 2, 0.12),
    ],
  }],
  ['mini-dino', 'Mini Dino', 'Малий допоміжний юніт порталу — крихітний динозаврик.', 'creature', ['#6aa04a', '#ffd23f'], {
    s: 0.75, o: o({ neck: 'raptor' }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        tail(f.tail.x, -0.3, 0.7), ...beast(f, { belly: 'cream' }), ...h.polys,
        ...[[-0.4, -0.35, 0.12], [0.2, -0.45, 0.1]].map(([x, y, r]) => circ(x, y, r, 'accent')),
        ...eyeball(h.eye[0], h.eye[1], 0.11),
        ...spikesAlong(-0.8, 0.6, -0.58, 5, 0.12, 'accent'),
      ];
    },
  }],
  ['mini-tentacle', 'Mini Tentacle', 'Малий щупальцевий юніт з одним оком.', 'blob', ['#7a3ae0', '#5ef0ff'], {
    s: 0.8, parts: ['tentacles'], noLights: true, hideParts: true,
    skin: () => [
      ...tentacles(-0.7, -0.4, 3, 0.7, 'body'),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      ...eyeball(0.3, -0.5, 0.28, 'accent'),
      ...[[-0.5, -0.8], [-0.6, -0.2], [0.0, 0.1]].map(([x, y]) => circ(x, y, 0.07, 'accent')),
    ],
  }],
  ['rift-cloud', 'Rift Cloud', 'Грозова хмара з розлому: пливе й іскрить.', 'blob', ['#c0b0e0', '#7a5ae0'], {
    s: 0.85, o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true,
    skin: () => [
      poly([[0.1, 0.1], [0.32, 0.1], [0.18, 0.3], [0.34, 0.3], [0.0, 0.65], [0.1, 0.38], [-0.06, 0.38]], 'yellow'),
      ell(-0.6, -0.4, 0.55, 0.38, 'body'), ell(0.15, -0.55, 0.6, 0.45, 'body'), ell(0.85, -0.3, 0.45, 0.32, 'body'), ell(0, -0.1, 1.25, 0.3, 'accent'),
      ...eyeball(0.55, -0.32, 0.08, 'purple'), ...eyeball(0.85, -0.3, 0.07, 'purple'),
      ...[[-0.8, -0.55], [0.0, -0.85]].map(([x, y]) => poly([[x, y], [x + 0.08, y - 0.12], [x + 0.04, y], [x + 0.12, y - 0.02], [x + 0.0, y + 0.15]], 'yellow', { flat: true })),
    ],
  }],
  ['bat-eyes', 'Bat Eyes', 'Кажан-спостерігач із палаючими очима.', 'blob', ['#2a1a3a', '#ff3a3a'], {
    s: 0.8, parts: ['wings'], noLights: true, hideParts: true,
    skin: () => [
      poly([[-0.6, -0.5], [-1.6, -1.2], [-1.4, -0.75], [-1.75, -0.6], [-1.35, -0.35], [-1.55, 0.0], [-0.6, -0.1]], 'body'),
      poly([[0.6, -0.5], [1.5, -1.25], [1.35, -0.8], [1.7, -0.65], [1.3, -0.4], [1.5, -0.05], [0.6, -0.1]], 'body'),
      ell(0, -0.35, 0.95, 0.72, 'body', {}, 28),
      poly([[-0.45, -0.95], [-0.15, -1.0], [-0.4, -1.4]], 'body'), poly([[0.15, -1.0], [0.45, -0.95], [0.35, -1.4]], 'body'),
      poly([[0.1, -0.68], [0.45, -0.58], [0.4, -0.45], [0.12, -0.52]], 'accent'), poly([[0.55, -0.6], [0.85, -0.68], [0.82, -0.52], [0.58, -0.47]], 'accent'),
      ...fangs(0.35, 0.65, -0.2, 2, 0.12),
    ],
  }],
]);

