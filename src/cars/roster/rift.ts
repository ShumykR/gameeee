import { O, P, R, T, angryEye, eye, line, slashes, spots, teeth } from '../art';
import { group, o } from './util';

export const RIFT = group('rift', [
  ['crystallizer', 'CrystalLizer', 'Гусеничний кристалізатор: обростає кристалічною бронею.', 'tracked', ['#5ad0f0', '#ffffff'], {
    parts: ['crystals'],
    art: () => [T([-1.2, -0.56], [-0.9, -0.56], [-1.1, -0.95], 'glass'), T([-0.2, -0.56], [0.1, -0.56], [-0.05, -0.85], 'light'), R(-1.6, 0.0, 1.6, 0.06, 'white')],
  }],
  ['freezer', 'Freezer', 'Кріогенна машина з балоном рідкого азоту. Заморожує суперника.', 'box', ['#a8e0ff', '#ffffff'], {
    parts: ['tank'],
    art: (f) => [...[-1.2, -0.7, -0.2].map((x) => T([x - 0.1, 0.3], [x + 0.1, 0.3], [x, 0.48], 'white')), R(f.tail.x, -0.1, f.nose.x, -0.02, 'glass'), O(f.deck.x0 + 0.5, f.deck.y - 0.38, 0.12, 0.12, 'glass')],
  }],
  ['harpoon', 'Harpoon', 'Платформа з гарпунною гарматою: б\'є і притягує суперника.', 'pickup', ['#5a6a7a', '#ffd23f'], {
    parts: [['cannon', 1.2]],
    art: (f) => [O(f.deck.x0 + 0.3, f.deck.y - 0.2, 0.2, 0.2, 'wood'), O(f.deck.x0 + 0.3, f.deck.y - 0.2, 0.08, 0.08, 'dark'), R(f.tail.x, 0.0, f.nose.x, 0.06, 'accent')],
  }],
  ['mine-lander', 'Mine Lander', 'Гусеничний мінний загороджувач: ставить міни позаду.', 'tracked', ['#3a3a4a', '#ff3a3a'], {
    parts: ['barrels'],
    art: () => [...slashes(-1.6, 1.6, -0.12, 0.1, 8, 'scoop', 0.1)],
  }],
  ['kraken-bait', 'Kraken\'s Bait', 'Бочка-приманка, з якої вже лізуть щупальця.', 'blob', ['#8a5a2a', '#3a3a3a'], {
    o: o({ mat: 'wood' }), parts: ['tentacles'], noLights: true,
    art: () => [R(-0.95, -0.8, 0.95, -0.7, 'dark'), R(-0.95, 0.0, 0.95, 0.1, 'dark'), ...eye(0.6, -0.4, 0.1, 'rocket'), P([[0.6, -1.0], [0.75, -1.4], [0.95, -1.35], [0.8, -0.95]], 'pink')],
  }],
  ['bat-holder', 'Bat Holder', 'Візок-сідало, повний кажанів.', 'cart', ['#3a2a4a', '#a050e0'], {
    parts: ['wings'], noLights: true,
    art: (f) => [R(f.tail.x, f.deck.y - 0.08, f.nose.x, f.deck.y, 'wood'), ...[-0.4, 0.0, 0.4].map((x) => P([[x - 0.15, f.deck.y + 0.05], [x + 0.15, f.deck.y + 0.05], [x + 0.08, f.deck.y + 0.25], [x, f.deck.y + 0.15], [x - 0.08, f.deck.y + 0.25]], 'black'))],
  }],
  ['ghost-ship', 'Ghost Ship', 'Летючий корабель-привид із подертими вітрилами.', 'boat', ['#4a5a6a', '#a0f0d0'], {
    parts: ['sail'], float: 0.85, noLights: true,
    art: () => [...[-1.0, -0.5, 0.0, 0.5].map((x) => O(x, -0.2, 0.08, 0.08, 'accent')), T([-1.75, -0.42], [-1.35, -0.42], [-1.7, -0.85], 'wood')],
  }],
  ['urn-launcher', 'Urn Launcher', 'Мобільна катапульта: метає урни, що розбиваються з вибухом.', 'tracked', ['#7a5a3a', '#e0c080'], {
    art: (f) => [line([f.deck.x0 + 0.2, f.deck.y], [f.deck.x0 + 0.5, f.deck.y - 0.6], 0.1, 'wood'), line([f.deck.x0 + 0.5, f.deck.y - 0.6], [f.deck.x1 + 0.2, f.deck.y - 1.1], 0.08, 'wood'), O(f.deck.x1 + 0.25, f.deck.y - 1.2, 0.2, 0.14, 'wood'), O(f.deck.x1 + 0.25, f.deck.y - 1.32, 0.13, 0.15, 'scoop')],
  }],
  ['ghost-dragon-summoner', 'Ghost Dragon Summoner', 'Платформа заклинача: кристали кличуть примарного дракона, що дихає вогнем.', 'carriage', ['#2a2a4a', '#7aff9a'], {
    parts: ['crystals'],
    art: (f) => [P([[f.roof.x1, f.roof.y], [f.roof.x1 + 0.6, f.roof.y - 0.6], [f.roof.x1 + 1.0, f.roof.y - 0.5], [f.roof.x1 + 0.3, f.roof.y + 0.15]], 'accent'), O(f.roof.x1 + 0.85, f.roof.y - 0.55, 0.06, 0.06, 'white'), R(-0.9, -0.1, 0.9, -0.04, 'accent')],
  }],
  ['jelly-shock', 'Jelly Shock', 'Електрична медуза: б\'є струмом блискавкою.', 'blob', ['#ff7ad0', '#5ef0ff'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], bounce: 0.5, noLights: true,
    art: () => [O(0, -0.7, 0.55, 0.35, 'pink'), ...eye(0.45, -0.55, 0.09), ...[-0.5, -0.1, 0.3].map((x) => line([x, 0.0], [x + 0.1, 0.3], 0.06, 'accent'))],
  }],
  ['abyss-eel', 'Abyss Eel', 'Глибоководний вугор зі світними плямами.', 'creature', ['#2a4a6a', '#5ef0ff'], {
    o: o({ neck: 'raptor', len: 1.3, tall: 0.7 }), parts: ['tail'], noLights: true,
    art: () => [...spots([[-0.9, -0.35, 0.06], [-0.4, -0.4, 0.06], [0.1, -0.4, 0.06], [0.6, -0.35, 0.06]], 'accent'), ...eye(1.95, -0.72, 0.07, 'accent'), ...teeth(1.85, 2.25, -0.55, 3, 0.07)],
  }],
  ['blast-fish', 'Blast Fish', 'Механічна риба-їжак. Скидає вибухову ікру.', 'blob', ['#e0a020', '#e02a2a'], {
    parts: ['fin', 'spikes'], noLights: true,
    art: () => [...eye(0.5, -0.55, 0.13), ...[[-0.6, -0.95], [0.0, -1.1], [-0.9, -0.4], [0.5, -1.0]].map(([x, y]) => T([x - 0.08, y + 0.15], [x + 0.08, y + 0.15], [x, y - 0.05], 'spike')), O(0.85, -0.25, 0.08, 0.06, 'black')],
  }],
  ['cosmic-squid', 'Cosmic Squid', 'Космічний кальмар: пливе крізь повітря на щупальцях.', 'blob', ['#7a3ae0', '#ff7ad0'], {
    o: o({ shape: 'egg' }), parts: ['tentacles'], float: 0.8, noLights: true,
    art: () => [...eye(0.4, -0.45, 0.13), ...spots([[-0.3, -0.9, 0.1], [0.2, -1.05, 0.07], [-0.5, -0.4, 0.08]], 'accent')],
  }],
  ['space-scallop', 'Space Scallop', 'Броньований гребінець зі стулками-панцирем.', 'blob', ['#f0a0c0', '#ffffff'], {
    o: o({ shape: 'flat' }), parts: ['plates'], noLights: true,
    art: () => [...[-0.9, -0.45, 0.0, 0.45, 0.9].map((x) => line([0, 0.1], [x, -0.5], 0.05, 'accent')), O(0, 0.15, 0.25, 0.1, 'accent')],
  }],
  ['atomic-ray', 'Atomic Ray', 'Гусеничний випромінювач атомних променів.', 'tracked', ['#3a3a4a', '#7aff3a'], {
    parts: ['dish'],
    art: () => [O(0, -0.35, 0.18, 0.18, 'scoop'), ...[0, 1, 2].map((i) => T([0, -0.35], [Math.cos(i * 2.1) * 0.17, -0.35 + Math.sin(i * 2.1) * 0.17], [Math.cos(i * 2.1 + 0.8) * 0.17, -0.35 + Math.sin(i * 2.1 + 0.8) * 0.17], 'black'))],
  }],
  ['doom-bomber', 'Doom Bomber', 'Важкий бомбардувальник розломів: скидає бомби з ґнотом.', 'hover', ['#3a3a4a', '#e02a2a'], {
    o: o({ len: 1.15 }), parts: ['wing', 'jets'],
    art: () => [...angryEye(1.2, -0.12, 0.1), ...[-0.8, -0.4, 0.0].map((x) => O(x, 0.22, 0.1, 0.08, 'black'))],
  }],
  ['specimen-x', 'Specimen X', 'Колба з мутантом на гусеницях. Мутант дивиться на тебе.', 'tracked', ['#5a6a7a', '#7aff3a'], {
    parts: ['tank'],
    art: (f) => [O((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.38, 0.6, 0.3, 'accent'), ...eye((f.deck.x0 + f.deck.x1) / 2, f.deck.y - 0.4, 0.14, 'rocket'), R(f.deck.x0, f.deck.y - 0.8, f.deck.x1, f.deck.y - 0.74, 'metal')],
  }],
  ['rcu', 'Rift Containment Unit', 'Контейнер стримування: поле глушить усе поруч.', 'box', ['#e0e0e0', '#ff3a3a'], {
    parts: ['siren'],
    art: (f) => [...slashes(f.tail.x, f.nose.x - 0.8, f.roof.y + 0.1, f.roof.y + 0.4, 5, 'accent', 0.12), O(-0.4, -0.1, 0.18, 0.18, 'black'), O(-0.4, -0.1, 0.08, 0.08, 'accent')],
  }],
  ['void-hopper', 'Void Hopper', 'Ровер порожнечі: стрибає крізь портали на кілька метрів.', 'buggy', ['#2a1a3a', '#c07aff'], {
    bounce: 0.5,
    art: () => [O(0, 0.05, 0.3, 0.12, 'accent'), O(0, 0.05, 0.15, 0.06, 'black')],
  }],
  ['rift-monster', 'Rift Monster', 'Істота з порталу: зникає й з\'являється ближче до тебе.', 'monster', ['#3a1a4a', '#ff3aa0'], {
    parts: ['fangs'],
    art: (f) => [...eye(f.nose.x - 0.6, -0.4, 0.12, 'accent'), ...eye(f.nose.x - 0.25, -0.4, 0.1, 'accent'), ...eye(f.nose.x - 0.42, -0.2, 0.07, 'accent'), ...slashes(-1.4, 0.6, -0.5, -0.1, 4, 'accent', 0.05)],
  }],
  ['void-engine', 'Void Engine', 'Монолітний двигун порожнечі: телепортується вперед.', 'box', ['#1a1a24', '#c07aff'], {
    o: o({ tall: 1.2 }), parts: ['stack'],
    art: () => [O(-0.3, -0.45, 0.3, 0.3, 'accent'), O(-0.3, -0.45, 0.18, 0.18, 'black'), O(-0.3, -0.45, 0.07, 0.07, 'white'), R(-1.5, -0.05, 1.5, 0.0, 'accent')],
  }],
  ['mantis-shrimp', 'Mantis Shrimp', 'Рак-богомол: найсильніший удар клешнею у світі.', 'creature', ['#e04a3a', '#5ad0f0'], {
    o: o({ neck: 'raptor' }), parts: ['claw'], noLights: true,
    art: () => [...slashes(-1.0, 0.8, -0.55, 0.1, 6, 'accent', 0.05), O(1.6, -0.85, 0.08, 0.08, 'scoop'), line([1.4, -0.85], [1.7, -1.2], 0.03, 'accent')],
  }],
  ['hercules-beetle', 'Hercules Beetle', 'Всюдихід-жук із рогом. Таранить з розгону.', 'blob', ['#3a2a1a', '#c0a040'], {
    o: o({ shape: 'flat' }), parts: ['drill'], noLights: true,
    art: () => [O(-0.15, -0.25, 1.0, 0.32, 'accent'), R(-0.18, -0.55, -0.12, 0.05, 'black'), P([[0.7, -0.5], [0.95, -0.45], [1.4, -0.95], [1.3, -1.0]], 'black'), ...[-0.7, -0.2, 0.3].map((x) => line([x, 0.1], [x - 0.2, 0.45], 0.05, 'black'))],
  }],
  ['rift-spider', 'Rift Spider', 'Кіберпавук розлому: стріляє павутиною, що зупиняє суперника.', 'tracked', ['#2a2a3a', '#e02a2a'], {
    s: 0.9,
    art: () => [...[-1.4, -0.9, -0.4, 0.4, 0.9, 1.4].map((x) => line([x * 0.5, -0.3], [x, 0.2], 0.07, 'black')), ...[0.7, 0.9, 1.1].map((x) => O(x, -0.35, 0.06, 0.06, 'rocket')), P([[-0.3, -0.6], [-0.1, -0.5], [-0.3, -0.4], [-0.5, -0.5]], 'accent')],
  }],
  ['mini-dino', 'Mini Dino', 'Малий допоміжний юніт порталу — крихітний динозаврик.', 'creature', ['#6aa04a', '#ffd23f'], {
    s: 0.75, o: o({ neck: 'raptor' }), parts: ['tail'], noLights: true,
    art: () => [...eye(1.4, -0.72, 0.09), ...spots([[-0.4, -0.35, 0.12], [0.2, -0.45, 0.1]], 'accent')],
  }],
  ['mini-tentacle', 'Mini Tentacle', 'Малий щупальцевий юніт з одним оком.', 'blob', ['#7a3ae0', '#5ef0ff'], {
    s: 0.8, parts: ['tentacles'], noLights: true,
    art: () => [...eye(0.3, -0.5, 0.18, 'accent')],
  }],
  ['rift-cloud', 'Rift Cloud', 'Грозова хмара з розлому: пливе й іскрить.', 'blob', ['#c0b0e0', '#7a5ae0'], {
    s: 0.85, o: o({ shape: 'flat', mat: 'white' }), float: 0.75, noLights: true,
    art: () => [O(-0.5, -0.45, 0.45, 0.3, 'body'), O(0.2, -0.55, 0.5, 0.35, 'body'), P([[0.1, 0.1], [0.3, 0.1], [0.15, 0.3], [0.3, 0.3], [0.0, 0.6], [0.1, 0.35], [-0.05, 0.35]], 'scoop')],
  }],
  ['bat-eyes', 'Bat Eyes', 'Кажан-спостерігач із палаючими очима.', 'blob', ['#2a1a3a', '#ff3a3a'], {
    s: 0.8, parts: ['wings'], noLights: true,
    art: () => [...angryEye(0.25, -0.6, 0.15), ...angryEye(0.65, -0.55, 0.12), T([-0.4, -1.05], [-0.15, -1.05], [-0.35, -1.4], 'body'), T([0.15, -1.05], [0.4, -1.05], [0.3, -1.4], 'body')],
  }],
]);
