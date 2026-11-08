import { blob, circ, ell, eyeball, fangs, path, poly, rect, rr, seg, spikesAlong, stripe } from '../draw';
import { beast, dinoHead, tail } from '../skins';
import type { CarMat, CarPoly } from '../types';
import { group, o } from './util';

const hidden = (p: CarPoly): CarPoly => ({ ...p, hide: true });
const plate = (x: number, y: number, s: number, mat: CarMat = 'accent'): CarPoly => blob([[x - s * 0.5, y + 0.05], [x - s * 0.3, y - s * 0.7], [x, y - s], [x + s * 0.3, y - s * 0.7], [x + s * 0.5, y + 0.05]], mat, {}, 1);

export const DINO = group('dino', [
  ['woolly-mammoth', 'Mammoth', 'Волохатий мамонт із бивнями — важкий і впертий.', 'creature', ['#7a4a2a', '#f0e0c0'], {
    o: o({ neck: 'none', len: 1.1, tall: 1.3 }), parts: ['trunk'], arch: 'heavy', noLights: true, hideParts: true,
    skin: (f) => [
      ...beast(f, { rx: 1.15, ry: 0.6, cy: -0.25 }),
      blob([[-1.1, -0.5], [-0.6, -0.92], [0.2, -0.95], [0.85, -0.7], [1.2, -0.35], [0.9, -0.55], [0.2, -0.7], [-0.6, -0.65]], 'brown', {}, 1),
      ...[-0.9, -0.5, -0.1, 0.3, 0.7].map((x) => poly([[x, -0.3], [x + 0.15, -0.3], [x + 0.05, 0.25]], 'brown')),
      blob([[0.75, -0.75], [1.25, -0.8], [1.45, -0.45], [1.35, 0.05], [1.2, 0.5], [1.05, 0.48], [1.1, 0.0], [0.9, -0.3]], 'body', {}, 1),
      ...eyeball(1.05, -0.5, 0.07),
      ...path([[1.0, -0.1], [1.3, 0.12], [1.65, -0.15], [1.7, -0.35]], 0.1, 'bone'),
      ell(0.95, -0.5, 0.1, 0.2, 'brown'),
    ],
  }],
  ['prehistoric-car', 'Prehistoric Car', 'Первісне авто: дерев\'яна рама, шкура замість даху, кам\'яні колеса.', 'kart', ['#a07a4a', '#7a6a5a'], {
    s: 1.1, o: o({ mat: 'wood', wheel: 1.3 }), noLights: true,
    skin: (f) => [
      ...[-0.25, -0.05].map((y) => rr(f.tail.x, y - 0.06, f.nose.x, y + 0.06, 0.06, 'wood')),
      ...[-0.7, 0.0, 0.6].map((x) => rect(x, -0.3, x + 0.08, 0.1, 'brown')),
      ...path([[-0.7, -0.05], [-0.6, -0.85]], 0.08, 'wood'), ...path([[0.5, -0.05], [0.4, -0.85]], 0.08, 'wood'),
      blob([[-0.85, -0.85], [-0.1, -0.95], [0.6, -0.85], [0.5, -0.7], [-0.75, -0.72]], 'tan', {}, 1),
      ...[-0.5, -0.1, 0.25].map((x) => ell(x, -0.83, 0.07, 0.04, 'brown')),
      seg([0.35, -0.2], [0.55, -0.4], 0.05, 'wood'),
    ],
  }],
  ['pterodactyl-car', 'Pterodactyl Car', 'Птеродактиль-крилоплан: розправляє крила й ширяє.', 'creature', ['#a0603a', '#f0c080'], {
    o: o({ neck: 'raptor' }), parts: ['wings', 'crest'], float: 0.8, noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        blob([[-0.9, -0.4], [-1.6, -1.25], [-0.9, -1.0], [-0.3, -1.4], [0.1, -0.95], [0.5, -0.4]], 'accent', {}, 1),
        ...[-1.3, -0.8, -0.3].map((x) => seg([x + 0.3, -0.45], [x, -1.1], 0.04, 'body')),
        ...beast(f, { ry: 0.36 }), tail(f.tail.x, -0.3, 0.6),
        ...h.polys, poly([[1.3, -0.62], [2.15, -0.62], [1.75, -0.5], [1.3, -0.5]], 'accent'),
        poly([[1.05, -0.85], [0.55, -1.2], [1.25, -0.9]], 'body'),
        ...eyeball(h.eye[0], h.eye[1], 0.07),
      ];
    },
  }],
  ['sauropod', 'Sauropod', 'Довгошиїй завропод: голова високо, хвіст довгий.', 'creature', ['#6aa04a', '#c0e080'], {
    o: o({ neck: 'long' }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('long');
      return [
        tail(f.tail.x, -0.25, 1.1), ...beast(f, { belly: 'accent' }), ...h.polys,
        ...[[-0.4, -0.45, 0.12], [0.2, -0.5, 0.1], [0.6, -0.35, 0.08]].map(([x, y, r]) => ell(x, y, r, r * 0.8, 'leaf')),
        ...eyeball(h.eye[0], h.eye[1], 0.06), rect(h.jaw[0] + 0.15, h.jaw[2], h.jaw[1] - 0.05, h.jaw[2] + 0.03, 'dark', { flat: true }),
      ];
    },
  }],
  ['stegosaurus', 'Stegosaurus', 'Стегозавр із рядом кістяних пластин на спині.', 'creature', ['#5a8a3a', '#e0602a'], {
    o: o({ neck: 'raptor' }), parts: ['plates', 'tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        ...[-0.75, -0.35, 0.05, 0.45].map((x, i) => plate(x, -0.45 - (i === 1 || i === 2 ? 0.1 : 0), 0.45)),
        tail(f.tail.x, -0.3, 0.75), poly([[-1.6, -0.35], [-1.4, -0.3], [-1.7, -0.6]], 'bone'), poly([[-1.45, -0.32], [-1.25, -0.28], [-1.4, -0.6]], 'bone'),
        ...beast(f, { belly: 'leaf' }), ...h.polys,
        ...eyeball(h.eye[0], h.eye[1], 0.06),
      ];
    },
  }],
  ['triceratops', 'Triceratops', 'Трицератопс із комірцем і трьома рогами. Таранить з розгону.', 'creature', ['#7a8a5a', '#e0d0a0'], {
    parts: ['tail'], noLights: true, hideParts: true,
    art: () => [hidden(poly([[1.45, -0.95], [1.55, -1.05], [2.05, -1.25]], 'bone', { deco: false, density: 0.3 }))],
    skin: (f) => {
      const h = dinoHead('short');
      return [
        tail(f.tail.x, -0.3, 0.6), ...beast(f, { belly: 'tan' }), ...h.polys,
        blob([[0.85, -0.5], [0.95, -1.4], [1.25, -1.45], [1.4, -0.8]], 'accent', {}, 1),
        ...[[0.95, -1.4], [1.15, -1.48], [1.3, -1.3]].map(([x, y]) => circ(x, y, 0.06, 'bone')),
        poly([[1.4, -1.0], [1.52, -1.08], [2.05, -1.28]], 'bone'), poly([[1.48, -0.95], [1.58, -1.02], [2.1, -1.1]], 'bone'), poly([[1.65, -0.95], [1.75, -0.95], [1.88, -1.15]], 'bone'),
        ...eyeball(h.eye[0], h.eye[1], 0.06),
      ];
    },
  }],
  ['t-rex', 'T. Rex', 'Тиранозавр: величезна паща, крихітні лапки і рик, що зносить машини.', 'creature', ['#4a7a3a', '#e0e0c0'], {
    o: o({ neck: 'raptor', len: 1.15, tall: 1.2 }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const L = 1.15;
      return [
        tail(f.tail.x, -0.35, 0.9), ...beast(f, { rx: 1.2, ry: 0.5, belly: 'accent' }),
        ...path([[0.8, -0.45], [1.25, -0.75]], 0.42, 'body'),
        blob([[1.05 * L, -1.05], [1.5 * L, -1.12], [1.95 * L, -0.92], [1.95 * L, -0.7], [1.2 * L, -0.62]], 'body', {}, 1),
        blob([[1.2 * L, -0.6], [1.9 * L, -0.6], [1.85 * L, -0.42], [1.25 * L, -0.4]], 'body', {}, 1),
        rect(1.25 * L, -0.65, 1.92 * L, -0.58, 'black'),
        ...fangs(1.3 * L, 1.92 * L, -0.66, 6, 0.1), ...fangs(1.35 * L, 1.85 * L, -0.56, 5, 0.08, true),
        ...eyeball(1.45 * L, -0.92, 0.08, 'red'), poly([[1.4 * L, -1.05], [1.62 * L, -1.02], [1.5 * L, -0.98]], 'dark'),
        ...path([[0.95, -0.3], [1.2, -0.15], [1.25, -0.05]], 0.08, 'body'),
      ];
    },
  }],
  ['velociraptor', 'Velociraptor', 'Швидкий велоцираптор: стрибає на здобич зі смугастою спиною.', 'creature', ['#8a7a3a', '#e04a2a'], {
    s: 0.85, o: o({ neck: 'raptor' }), parts: ['tail'], speed: 1.15, noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        tail(f.tail.x, -0.35, 0.9, 'body', 0.35), ...beast(f, { ry: 0.36, belly: 'tan' }), ...h.polys,
        ...[-0.8, -0.45, -0.1, 0.25, 0.6].map((x) => poly([[x, -0.55], [x + 0.14, -0.55], [x + 0.05, -0.2], [x - 0.08, -0.22]], 'accent', { flat: true })),
        ...fangs(1.35, 1.78, -0.52, 4, 0.08), ...eyeball(h.eye[0], h.eye[1], 0.07, 'yellow'),
        ...path([[0.85, -0.3], [1.05, -0.1], [1.15, -0.12]], 0.07, 'body'),
        ...[-0.2, 0.0, 0.2].map((x) => poly([[x - 0.05 - 0.6, 0.38], [x + 0.05 - 0.6, 0.38], [x - 0.6 + 0.08, 0.5]], 'white')),
      ];
    },
  }],
  ['fossil', 'Fossil', 'Ожилий скелет: кістки, ребра й порожні очниці.', 'creature', ['#e8dcc0', '#8a7a5a'], {
    o: o({ neck: 'long', mat: 'bone' }), parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => [
      ...path([[f.tail.x - 0.6, -0.65], [-0.8, -0.55], [0.0, -0.62], [0.7, -0.45], [1.05, -0.85], [1.4, -1.35]], 0.12, 'bone'),
      ...[-0.7, -0.4, -0.1, 0.2, 0.5].map((x) => path([[x, -0.58], [x + 0.06, -0.3], [x - 0.02, -0.02]], 0.09, 'bone')).flat(),
      ...f.wheels.map((w) => seg([w.x, -0.55], [w.x, w.y - 0.1], 0.1, 'bone')),
      seg([-0.75, -0.05], [0.55, -0.05], 0.08, 'bone'),
      blob([[1.2, -1.45], [1.5, -1.62], [1.85, -1.5], [1.82, -1.36], [1.3, -1.3]], 'bone', {}, 1),
      circ(1.5, -1.5, 0.07, 'black'), ...[0, 1, 2].map((i) => rect(1.55 + i * 0.08, -1.4, 1.58 + i * 0.08, -1.32, 'black', { flat: true })),
    ],
  }],
  ['egg-mobile', 'Egg Mobile', 'Капсула-яйце динозавра. Відкладає яйця-перешкоди позаду.', 'blob', ['#f0e8d0', '#7ab04a'], {
    o: o({ shape: 'egg' }), noLights: true,
    skin: () => [
      blob([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05], [0.0, -1.3], [0.6, -1.05], [0.95, -0.35], [0.75, 0.2]], 'body', {}, 2),
      ...[[-0.4, -0.7, 0.14], [0.3, -0.95, 0.1], [0.5, -0.3, 0.12], [-0.5, -0.15, 0.09], [0.1, -0.5, 0.07]].map(([x, y, r]) => ell(x, y, r, r * 0.8, 'accent')),
      ...path([[-0.9, -0.55], [-0.6, -0.65], [-0.4, -0.5], [-0.2, -0.62], [-0.05, -0.5], [0.15, -0.6]], 0.05, 'brown'),
      ...eyeball(0.55, -0.6, 0.1),
    ],
  }],
  ['parasaurolophus', 'Parasaurolophus', 'Динозавр із трубчастим гребенем: трубить, як у ріг.', 'creature', ['#4a8ab0', '#ffd23f'], {
    parts: ['tail'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('short');
      return [
        tail(f.tail.x, -0.3, 0.7), ...beast(f, { belly: 'cream' }), ...h.polys,
        ...path([[1.15, -1.05], [0.85, -1.35], [0.5, -1.45]], 0.14, 'accent'),
        ...[-0.7, -0.35, 0.0, 0.35].map((x) => poly([[x, -0.58], [x + 0.13, -0.58], [x + 0.02, -0.25]], 'accent', { flat: true })),
        ...eyeball(h.eye[0], h.eye[1], 0.06),
      ];
    },
  }],
  ['allosaurus', 'Allosaurus', 'Хижий аллозавр із гребенями над очима.', 'creature', ['#a04a2a', '#f0d0a0'], {
    o: o({ neck: 'raptor' }), parts: ['teeth', 'tail'], noLights: true,
    skin: (f) => {
      const h = dinoHead('raptor');
      return [
        tail(f.tail.x, -0.3, 0.85), ...beast(f, { belly: 'accent' }), ...h.polys,
        rect(1.3, -0.6, 1.8, -0.55, 'black'), ...fangs(1.3, 1.78, -0.6, 4, 0.1),
        poly([[1.22, -0.85], [1.48, -0.85], [1.32, -1.02]], 'red'), ...eyeball(h.eye[0], h.eye[1], 0.07, 'red'),
        ...spikesAlong(-0.8, 0.6, -0.58, 6, 0.12, 'accent'),
      ];
    },
  }],
  ['piranha', 'Piranha', 'Всюдихід-піранья із зубатою пащею. Кусає з ривка.', 'blob', ['#c0302a', '#ffd23f'], {
    o: o({ shape: 'flat' }), parts: ['fin'], noLights: true, hideParts: true,
    skin: (f) => [
      poly([[f.tail.x + 0.15, -0.15], [f.tail.x - 0.4, -0.6], [f.tail.x - 0.2, -0.1], [f.tail.x - 0.4, 0.3]], 'accent'),
      poly([[-0.4, -0.5], [0.0, -0.95], [0.3, -0.5]], 'accent'),
      ell(0, -0.15, f.nose.x, 0.45, 'body', {}, 28),
      ell(-0.1, 0.12, 0.85, 0.16, 'accent'),
      poly([[f.nose.x - 0.6, 0.0], [f.nose.x + 0.05, -0.12], [f.nose.x - 0.05, 0.14], [f.nose.x - 0.6, 0.18]], 'black'),
      ...fangs(f.nose.x - 0.58, f.nose.x - 0.05, -0.04, 4, 0.12), ...fangs(f.nose.x - 0.55, f.nose.x - 0.1, 0.17, 4, 0.1, true),
      ...eyeball(f.nose.x - 0.5, -0.32, 0.11, 'red'),
      ...[-0.6, -0.3, 0.0].map((x) => poly([[x, -0.3], [x + 0.15, -0.3], [x + 0.05, -0.05]], 'dark', { flat: true })),
    ],
  }],
  ['mechasaurus', 'Mechasaurus', 'Кібердинозавр із ракетними пускачами на спині.', 'creature', ['#a0a8b8', '#e02a2a'], {
    o: o({ neck: 'raptor', mat: 'metal' }), parts: ['teeth', 'tail', 'antenna'], noLights: true, hideParts: true,
    skin: (f) => {
      const h = dinoHead('raptor', 1, 'metal');
      return [
        tail(f.tail.x, -0.3, 0.8, 'metal'), ...beast(f, { mat: 'metal', belly: 'grey' }), ...h.polys,
        rr(-0.45, -0.95, 0.25, -0.55, 0.06, 'dark'), ...[-0.32, -0.1, 0.12].map((x) => circ(x, -0.78, 0.07, 'red')),
        ...[-0.8, -0.3, 0.2, 0.7].map((x) => circ(x, -0.25, 0.05, 'black')),
        rect(1.3, -0.6, 1.8, -0.56, 'black'), ...fangs(1.32, 1.78, -0.6, 4, 0.09, false),
        circ(h.eye[0], h.eye[1], 0.09, 'red'), circ(h.eye[0] + 0.02, h.eye[1], 0.04, 'light'),
        ...path([[1.2, -0.88], [1.15, -1.25]], 0.04, 'grey'), circ(1.15, -1.28, 0.06, 'red'),
        stripe(-0.9, 0.9, -0.05, 0.06, 'accent'),
      ];
    },
  }],
  ['ankylosaurus', 'Ankylosaurus', 'Панцерний динозавр із булавою на хвості — вона розгойдується й б\'є.', 'creature', ['#7a6a4a', '#c0a060'], {
    o: o({ neck: 'none', tall: 0.9 }), parts: ['plates'], noLights: true, hideParts: true,
    flail: { from: 'tail', len: 0.75, r: 0.26, look: 'mace' },
    art: (f) => [hidden(poly([[f.tail.x + 0.3, f.tail.y0], [f.tail.x + 0.3, f.tail.y1 - 0.1], [f.tail.x - 0.25, (f.tail.y0 + f.tail.y1) / 2 - 0.05]], 'body', { deco: false }))],
    skin: (f) => [
      tail(f.tail.x, -0.25, 0.4),
      ...beast(f, { ry: 0.42 }),
      blob([[-1.1, -0.2], [-0.9, -0.62], [0.0, -0.72], [0.9, -0.55], [1.1, -0.2], [0.0, -0.3]], 'accent', {}, 1),
      ...[-0.7, -0.35, 0.0, 0.35, 0.7].map((x) => poly([[x - 0.1, -0.55], [x + 0.1, -0.58], [x, -0.82]], 'bone')),
      ...[-0.6, -0.2, 0.2, 0.6].map((x) => circ(x, -0.42, 0.07, 'brown')),
      blob([[0.85, -0.45], [1.3, -0.5], [1.4, -0.2], [0.9, -0.1]], 'body', {}, 1), ...eyeball(1.15, -0.38, 0.06),
    ],
  }],
]);

