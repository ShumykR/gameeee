import { O, P, R, T, eye, line, slashes, spots, teeth } from '../art';
import { group, o } from './util';

export const DINO = group('dino', [
  ['woolly-mammoth', 'Mammoth', 'Волохатий мамонт із бивнями — важкий і впертий.', 'creature', ['#7a4a2a', '#f0e0c0'], {
    o: o({ neck: 'none', len: 1.1, tall: 1.3 }), parts: ['trunk'], arch: 'heavy', noLights: true,
    art: () => [...slashes(-1.0, 0.9, -0.6, 0.15, 7, 'dark', 0.1), ...eye(0.85, -0.42, 0.08), P([[0.9, -0.1], [1.15, 0.05], [1.5, -0.25], [1.4, -0.3], [1.1, -0.05]], 'bone')],
  }],
  ['prehistoric-car', 'Prehistoric Car', 'Первісне авто: дерев\'яна рама, шкура замість даху, кам\'яні колеса.', 'kart', ['#a07a4a', '#7a6a5a'], {
    s: 1.1, o: o({ mat: 'wood', wheel: 1.3 }), noLights: true,
    art: () => [line([-0.7, -0.05], [-0.6, -0.85], 0.07, 'wood'), line([0.5, -0.05], [0.4, -0.85], 0.07, 'wood'), P([[-0.85, -0.85], [0.6, -0.85], [0.5, -0.7], [-0.75, -0.72]], 'scoop'), ...spots([[-0.4, -0.8, 0.06], [0.1, -0.79, 0.05]], 'dark')],
  }],
  ['pterodactyl-car', 'Pterodactyl Car', 'Птеродактиль-крилоплан: розправляє крила й ширяє.', 'creature', ['#a0603a', '#f0c080'], {
    o: o({ neck: 'raptor' }), parts: ['wings', 'crest'], float: 0.8, noLights: true,
    art: () => [P([[1.15, -0.62], [1.95, -0.62], [1.75, -0.5], [1.2, -0.5]], 'accent'), ...eye(1.3, -0.72, 0.06)],
  }],
  ['sauropod', 'Sauropod', 'Довгошиїй завропод: голова високо, хвіст довгий.', 'creature', ['#6aa04a', '#c0e080'], {
    o: o({ neck: 'long' }), parts: ['tail'], noLights: true,
    art: () => [O(0, 0.0, 0.85, 0.18, 'accent'), ...spots([[-0.4, -0.45, 0.12], [0.2, -0.5, 0.1], [0.6, -0.35, 0.08]], 'leaf')],
  }],
  ['stegosaurus', 'Stegosaurus', 'Стегозавр із рядом кістяних пластин на спині.', 'creature', ['#5a8a3a', '#e0602a'], {
    o: o({ neck: 'raptor' }), parts: ['plates', 'tail'], noLights: true,
    art: () => [O(0, 0.0, 0.85, 0.16, 'leaf'), T([-1.6, -0.3], [-1.3, -0.25], [-1.65, -0.55], 'bone'), T([-1.4, -0.28], [-1.15, -0.22], [-1.35, -0.55], 'bone')],
  }],
  ['triceratops', 'Triceratops', 'Трицератопс із комірцем і трьома рогами. Таранить з розгону.', 'creature', ['#7a8a5a', '#e0d0a0'], {
    parts: ['tail'], noLights: true,
    art: () => [P([[0.9, -0.45], [1.05, -1.35], [1.3, -1.3], [1.35, -0.75]], 'accent'), T([1.45, -0.95], [1.55, -1.05], [2.05, -1.25], 'bone', { deco: false, density: 0.3 }), T([1.6, -0.8], [1.68, -0.92], [2.15, -0.88], 'bone'), T([1.75, -0.92], [1.85, -0.92], [1.95, -1.08], 'bone')],
  }],
  ['t-rex', 'T. Rex', 'Тиранозавр: величезна паща, крихітні лапки і рик, що зносить машини.', 'creature', ['#4a7a3a', '#e0e0c0'], {
    o: o({ neck: 'raptor', len: 1.15, tall: 1.2 }), parts: ['tail'], noLights: true,
    art: () => [...teeth(1.35, 1.95, -0.72, 5, 0.12), ...teeth(1.4, 1.95, -0.55, 4, 0.1, true), R(1.3, -0.62, 2.0, -0.6, 'dark'), ...eye(1.45, -0.98, 0.08, 'rocket'), line([0.95, -0.45], [1.15, -0.2], 0.08, 'body'), O(0, 0.0, 0.9, 0.18, 'accent')],
  }],
  ['velociraptor', 'Velociraptor', 'Швидкий велоцираптор: стрибає на здобич зі смугастою спиною.', 'creature', ['#8a7a3a', '#e04a2a'], {
    s: 0.85, o: o({ neck: 'raptor' }), parts: ['tail'], speed: 1.15, noLights: true,
    art: () => [...slashes(-0.9, 0.7, -0.6, -0.3, 5, 'accent', 0.1), ...teeth(1.3, 1.75, -0.5, 4, 0.08), ...eye(1.4, -0.72, 0.07, 'scoop')],
  }],
  ['fossil', 'Fossil', 'Ожилий скелет: кістки, ребра й порожні очниці.', 'creature', ['#e8dcc0', '#8a7a5a'], {
    o: o({ neck: 'long', mat: 'bone' }), parts: ['tail'], noLights: true,
    art: () => [...[-0.7, -0.4, -0.1, 0.2, 0.5].map((x) => R(x, -0.55, x + 0.12, 0.1, 'dark')), O(1.6, -1.5, 0.07, 0.07, 'black')],
  }],
  ['egg-mobile', 'Egg Mobile', 'Капсула-яйце динозавра. Відкладає яйця-перешкоди позаду.', 'blob', ['#f0e8d0', '#7ab04a'], {
    o: o({ shape: 'egg' }), noLights: true,
    art: () => [...spots([[-0.4, -0.7, 0.14], [0.3, -0.95, 0.1], [0.5, -0.3, 0.12], [-0.5, -0.15, 0.09]], 'accent'), P([[-0.9, -0.55], [-0.6, -0.65], [-0.4, -0.5], [-0.2, -0.62], [-0.05, -0.5]], 'dark')],
  }],
  ['parasaurolophus', 'Parasaurolophus', 'Динозавр із трубчастим гребенем: трубить, як у ріг.', 'creature', ['#4a8ab0', '#ffd23f'], {
    parts: ['tail'], noLights: true,
    art: () => [P([[1.1, -1.05], [1.2, -1.15], [0.55, -1.45], [0.5, -1.35]], 'accent'), ...eye(1.35, -0.98, 0.06), ...slashes(-0.8, 0.6, -0.6, -0.2, 4, 'accent', 0.05)],
  }],
  ['allosaurus', 'Allosaurus', 'Хижий аллозавр із гребенями над очима.', 'creature', ['#a04a2a', '#f0d0a0'], {
    o: o({ neck: 'raptor' }), parts: ['teeth', 'tail'], noLights: true,
    art: () => [...teeth(1.3, 1.75, -0.5, 4, 0.1), T([1.25, -0.82], [1.45, -0.82], [1.32, -0.98], 'accent'), ...eye(1.4, -0.72, 0.07, 'rocket'), O(0, 0.0, 0.85, 0.16, 'accent')],
  }],
  ['piranha', 'Piranha', 'Всюдихід-піранья із зубатою пащею. Кусає з ривка.', 'blob', ['#c0302a', '#ffd23f'], {
    o: o({ shape: 'flat' }), parts: ['fin'], noLights: true,
    art: (f) => [P([[f.nose.x - 0.6, 0.05], [f.nose.x, -0.1], [f.nose.x - 0.05, 0.12], [f.nose.x - 0.6, 0.2]], 'black'), ...teeth(f.nose.x - 0.55, f.nose.x - 0.05, -0.02, 4, 0.1), ...teeth(f.nose.x - 0.55, f.nose.x - 0.1, 0.18, 4, 0.1, true), ...eye(f.nose.x - 0.45, -0.3, 0.1, 'rocket'), T([f.tail.x + 0.1, -0.15], [f.tail.x - 0.35, -0.5], [f.tail.x - 0.3, 0.2], 'accent'), O(-0.2, 0.15, 0.6, 0.12, 'accent')],
  }],
  ['mechasaurus', 'Mechasaurus', 'Кібердинозавр із ракетними пускачами на спині.', 'creature', ['#a0a8b8', '#e02a2a'], {
    o: o({ neck: 'raptor', mat: 'metal' }), parts: ['teeth', 'tail', 'antenna'], noLights: true,
    art: () => [O(1.4, -0.72, 0.08, 0.08, 'rocket'), R(-0.4, -0.85, 0.2, -0.58, 'dark'), ...[-0.3, -0.1, 0.1].map((x) => O(x, -0.78, 0.06, 0.06, 'rocket')), ...[-0.8, -0.3, 0.2, 0.7].map((x) => O(x, -0.25, 0.05, 0.05, 'black'))],
  }],
  ['ankylosaurus', 'Ankylosaurus', 'Панцерний динозавр із булавою на хвості — вона розгойдується й б\'є.', 'creature', ['#7a6a4a', '#c0a060'], {
    o: o({ neck: 'none', tall: 0.9 }), parts: ['plates'], noLights: true,
    flail: { from: 'tail', len: 0.75, r: 0.26, look: 'mace' },
    art: (f) => [P([[f.tail.x + 0.3, f.tail.y0], [f.tail.x + 0.3, f.tail.y1 - 0.1], [f.tail.x - 0.25, (f.tail.y0 + f.tail.y1) / 2 - 0.05]], 'body', { deco: false }), ...spots([[-0.6, -0.35, 0.1], [-0.2, -0.5, 0.1], [0.2, -0.45, 0.1], [0.6, -0.3, 0.1]], 'accent'), ...eye(0.95, -0.35, 0.06)],
  }],
]);
