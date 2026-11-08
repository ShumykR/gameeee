import type { AbilityDef, AbilityKind, CarDef, ItemKind, ProjectileKind, TraitDef } from './types';

/*
 * Every car's special action and passive quirks, in one table.
 *
 * Rules (enforced by tests/kit.test.ts):
 *  - no two cars share an action: a kind like 'jump' belongs to one car only;
 *    'shoot' / 'drop' / 'dump' are unique per projectile / item;
 *  - passive quirks are unique too, and so is each loose cargo kind;
 *  - a car not listed here just drives.
 *
 * Action strings are 'kind', 'kind:arg' or 'kind:arg|Name'.
 */

export interface Kit {
  ab?: string;
  traits?: TraitDef[];
  /** Replaces the roster blurb when the old one described another ability. */
  blurb?: string;
}

export const KIT: Record<string, Kit> = {
  // ---------------------------------------------------------------- originals
  mammoth: { ab: 'stomp|Монстр-приземлення' },
  digger: { ab: 'slam|Удар ковшем', blurb: 'Ківш-лопата спереду. Удар ковшем об землю відкидає все навколо, а з повітря — пікірування.' },
  rammer: { ab: 'dash|Таран' },
  porcupine: { ab: 'shoot:quill|Голки', blurb: 'Колючий броневик. Вистрілює віялом голок.' },
  jelly: { ab: 'bounce|Желе', blurb: 'Драглистий кубик. На кілька секунд стає гумовим і відскакує від усього.' },
  hornet: { ab: 'sting|Жало', blurb: 'Оса на колесах: ривок, і жало б\'є суперника струмом.' },

  // ---------------------------------------------------------------- retro
  'monster-truck': { ab: 'jump|Бігфут-стрибок' },
  ambulance: { traits: [{ kind: 'medkit' }], blurb: 'Карета швидкої. Аптечка рятує водія від першого удару в кожному раунді.' },
  'timber-lorry': { ab: 'dump:log|Скинути колоди' },
  'garbage-truck': { ab: 'dump:trash|Вивантажити сміття' },
  'race-car-f1': { ab: 'drs|DRS', blurb: 'Болід Формули-1. DRS відкриває заднє крило: кілька секунд вища швидкість.' },
  'banana-car': { ab: 'drop:peel|Бананова шкірка' },
  'concrete-truck': { ab: 'dump:concrete|Вилити бетон', blurb: 'Бетономішалка. Виливає бетон, що застигає горбом на дорозі.' },
  excavator: { ab: 'scoop|Ківш через себе', blurb: 'Екскаватор. Ковшем підчіплює суперника й перекидає собі за спину.' },
  'hot-rod': { ab: 'nitro|Закис азоту' },
  amphibian: { traits: [{ kind: 'swim' }], blurb: 'Колісний всюдихід-амфібія з гвинтом на кормі. У воді не тоне — пливе.' },
  'landfill-truck': { ab: 'dump:rock|Самоскид' },
  steamroller: { ab: 'heavy|Каток', blurb: 'Дорожній каток. На кілька секунд стає важким, як гора.' },
  'motocross-bike': { ab: 'backflip|Бекфліп', blurb: 'Кросовий мотоцикл. Стрибок із сальто назад.' },
  'bumper-car': { ab: 'bump|Бамс', blurb: 'Автодромна машинка. Ривок — і суперник відлітає, як від гуми.' },
  'ice-cream-van': { traits: [{ kind: 'spill', item: 'icecream', every: 2.2 }], blurb: 'Фургон морозива. На ходу губить ріжки — хто наїде, той примерзає.' },
  'fire-truck': { ab: 'shoot:water|Брандспойт' },
  'police-car': { ab: 'drop:spikes|Шипи на дорогу', blurb: 'Поліцейське авто. Кидає на дорогу стрічку з шипами — у суперника спускають шини.' },
  'golf-cart': { ab: 'shoot:golf|Удар драйвером' },
  'tanker-truck': { ab: 'drop:oil|Масляна пляма', blurb: 'Автоцистерна. Розливає мастило — на плямі колеса втрачають зчеплення.' },
  'toxic-truck': { ab: 'drop:barrel|Токсична бочка' },
  'helmet-car': { ab: 'shield|Шолом' },

  // ---------------------------------------------------------------- halloween
  hearse: { blurb: 'Чорний катафалк. Труна їде на даху вільно й може злетіти на суперника.' },
  'rocking-horse': { ab: 'rear|Дибки', blurb: 'Кінь-гойдалка. Стає дибки й б\'є передніми копитами.' },
  'pumpkin-carriage': { ab: 'shoot:pumpkin|Гарбуз-бомба' },
  'ghost-train': { ab: 'phase|Примарний рейс' },
  'broom-bike': { ab: 'fly|Чари мітли' },
  'invisible-car': { ab: 'invis|Невидимість', blurb: 'Прозорий парящий кузов. На кілька секунд зникає з очей зовсім.' },
  'skeletal-ride': { ab: 'shoot:bone|Кістка-бумеранг', blurb: 'Скелет на колесах. Кидає кістку, що повертається бумерангом.' },
  beast: { ab: 'howl|Виття', blurb: 'Вовкулака за кермом. Від його виття в суперника плутаються ліво й право.' },
  'spiky-car': { traits: [{ kind: 'quills' }], blurb: 'Авто в шипах. Хто в нього врізається — відлітає геть.' },
  'dracula-carriage': { ab: 'shoot:bat|Кажани', blurb: 'Карета графа. Випускає зграйку кажанів, що петляють у повітрі.' },

  // ---------------------------------------------------------------- winter
  snowcat: { traits: [{ kind: 'grip' }], blurb: 'Ратрак на широких гусеницях. Чіпляється за будь-який схил.' },
  snowman: { ab: 'shoot:snowball|Сніжки' },
  'snowball-cannon': { ab: 'shoot:bigsnow|Снігова брила', blurb: 'Гармата, що котить на суперника величезну снігову брилу.' },
  'santa-sleigh': { ab: 'drop:gift|Подарунок-пружина', blurb: 'Сани Санти. Лишає позаду подарунок із пружиною: хто торкнеться — злетить.' },
  'gift-box': { ab: 'surprise|Сюрприз', blurb: 'Коробка з бантом. Що всередині — щоразу сюрприз.' },
  'firework-truck': { ab: 'shoot:firework|Салют' },
  'frosty-car': { ab: 'shoot:ice|Крижаний подих' },
  'snow-truck': { ab: 'dump:snowball|Снігова лавина' },
  'penguin-slider': { ab: 'slide|Ковзання на череві', blurb: 'Пінгвін, що мчить на череві: кілька секунд ковзає без тертя.' },
  'penguin-minions': { ab: 'shoot:penguin|Пінгвін-торпеда', blurb: 'Візок пінгвінів. Запускає пінгвіна, що ковзає по землі на суперника.' },
  'electric-reindeer': { ab: 'discharge|Розряд' },

  // ---------------------------------------------------------------- alien
  'flying-saucer': { ab: 'beam|Промінь викрадення', blurb: 'Класична тарілка. Промінь підхоплює суперника й піднімає в повітря.' },
  'skater-cow': { ab: 'ollie|Олі', blurb: 'Корова на скейті. Швидкі низькі стрибки майже без перезарядки.' },
  'gun-truck': { ab: 'shoot:bullet|Кулемет' },
  'monster-cannon': { ab: 'shoot:mega|Надважке ядро' },
  gunboat: { ab: 'shoot:torpedo|Торпеда', blurb: 'Канонерка на колесах. Пускає торпеду, що мчить низько над землею.' },
  'rocket-launcher': { ab: 'shoot:volley|Залп', blurb: 'РСЗВ: залп із чотирьох малих ракет віялом.' },
  tank: { ab: 'shoot:cannon|Танковий постріл' },
  'alien-drone': { ab: 'shoot:laser|Лазер' },
  'celestial-teapot': { ab: 'shoot:tea|Окріп', blurb: 'Космічний чайник. Хлюпає окропом — суперника закручує.' },
  'moon-rover': { ab: 'moonjump|Місячний стрибок', blurb: 'Місяцехід. Стрибок, після якого гравітація на мить як на Місяці.' },
  'alien-spaceship': { ab: 'shoot:plasma|Плазма' },
  'space-interceptor': { ab: 'shoot:seeker|Самонавідна ракета' },

  // ---------------------------------------------------------------- dome
  'tow-truck': { ab: 'shoot:hook|Трос', blurb: 'Евакуатор. Чіпляє суперника гаком на тросі й тягне за собою.' },

  // ---------------------------------------------------------------- dino
  'pterodactyl-car': { ab: 'glide|Ширяння', blurb: 'Птеродактиль. Розправляє крила й повільно планує.' },
  sauropod: { ab: 'tailwhip|Удар хвостом', blurb: 'Довгошия. Б\'є хвостом того, хто підкрався ззаду.' },
  triceratops: { ab: 'gore|Рогатий таран', blurb: 'Трицератопс. Ривок — і роги підкидають суперника вгору.' },
  't-rex': { ab: 'roar|Рик тиранозавра' },
  velociraptor: { ab: 'pounce|Кидок', blurb: 'Раптор. Стрибає просто на суперника.' },
  'egg-mobile': { ab: 'drop:egg|Знести яйце' },
  piranha: { ab: 'frenzy|Шал', blurb: 'Піранья. Три швидкі ривки-укуси поспіль.' },
  mechasaurus: { ab: 'shoot:missile|Ракети' },

  // ---------------------------------------------------------------- robo
  'rocket-fist': { ab: 'shoot:fist|Ракетний кулак', blurb: 'Робот із кулаком на ракеті. Кулак летить і відкидає суперника.' },
  'laser-tank': { ab: 'shoot:railgun|Рейкотрон', blurb: 'Танк із рейкотроном: надшвидкий заряд прошиває все наскрізь.' },
  tripod: { ab: 'shoot:zap|Тепловий промінь' },

  // ---------------------------------------------------------------- summer
  'harvester': { ab: 'dump:hay|Тюки сіна' },
  'burger-bike': { ab: 'shoot:burger|Бургер' },
  lowrider: { ab: 'hydraulics|Гідравліка', blurb: 'Лоурайдер на гідравліці: підстрибує тричі поспіль.' },
  'asphalt-paver': { ab: 'drop:tar|Гарячий асфальт', blurb: 'Асфальтоукладач. Лишає латку гарячого асфальту — у ній грузнуть колеса.' },
  turtle: { ab: 'shell|Сховатися в панцир', blurb: 'Черепаха. Ховається в панцир: не їде, але її не зрушити й не вибити.' },

  // ---------------------------------------------------------------- soccer
  'soccer-ball': { traits: [{ kind: 'rubber' }], blurb: 'Авто-м\'яч. Гумовий корпус відскакує від усього.' },
  'soccer-delivery': { ab: 'dump:ball|Висипати м\'ячі' },
  'soccer-cannon': { ab: 'shoot:ball|Пушка-пас' },
  'soccer-shoe': { ab: 'kick|Удар бутсою', blurb: 'Бутса на колесах. Підбиває суперника й м\'ячі вгору-вперед.' },

  // ---------------------------------------------------------------- cny
  'chinese-dragon': { ab: 'shoot:fire|Подих дракона' },

  // ---------------------------------------------------------------- rift
  crystallizer: { ab: 'reflect|Кристалічне дзеркало', blurb: 'Кристалічний ящір. Броня-дзеркало відбиває снаряди назад.' },
  freezer: { ab: 'icewall|Крижана стіна', blurb: 'Морозильник. Ставить перед собою крижану стіну.' },
  harpoon: { ab: 'shoot:harpoon|Гарпун' },
  'mine-lander': { ab: 'drop:mine|Міна' },
  'urn-launcher': { ab: 'shoot:urn|Катапульта' },
  'jelly-shock': { traits: [{ kind: 'shock' }], blurb: 'Електрична медуза. Хто її торкнеться — отримує розряд.' },
  'blast-fish': { ab: 'puff|Надутися', blurb: 'Риба-їжак. Надувається: відкидає все навколо й на мить невразлива.' },
  'cosmic-squid': { ab: 'shoot:ink|Чорнило', blurb: 'Космічний кальмар. Хмара чорнила липне до суперника й гальмує його.' },
  'atomic-ray': { ab: 'shoot:atom|Атомний заряд' },
  'doom-bomber': { ab: 'drop:bomb|Бомба' },
  rcu: { ab: 'stasis|Поле стримування', blurb: 'Блок стримування розлому. Замикає суперника в полі стазису.' },
  'void-hopper': { ab: 'blink|Стрибок крізь порожнечу' },
  'rift-monster': { ab: 'swap|Обмін місцями', blurb: 'Тварюка з розлому. Міняється з суперником місцями.' },
  'void-engine': { ab: 'recall|Часова петля', blurb: 'Варп-двигун. Повертає авто туди, де воно було дві секунди тому.' },
  'mantis-shrimp': { ab: 'punch|Удар клешнею', blurb: 'Рак-богомол. Найсильніший удар клешнею на трасі.' },
  'hercules-beetle': { ab: 'flip|Перекинути рогом', blurb: 'Жук-геркулес. Ривок — і ріг перевертає суперника.' },
  'rift-spider': { ab: 'shoot:web|Павутина' },
  'rift-cloud': { ab: 'storm|Блискавка з неба', blurb: 'Грозова хмарка. Кличе блискавку туди, де стоїть суперник.' },

  // ---------------------------------------------------------------- toys
  'bubble-blaster': { ab: 'shoot:bubble|Бульбашка' },
  'chomp-shark': { ab: 'bite|Клац!', blurb: 'Акула. Ривок, хватка — і суперник летить за спину.' },
  'soda-popper': { ab: 'shoot:cork|Корок' },
  'toaster-racer': { ab: 'shoot:toast|Тостомет' },
  'twin-devil': { traits: [{ kind: 'spill', item: 'flame', every: 0.9 }], blurb: 'Дводвигунний дрегстер із рогами. Лишає за собою вогняний слід.' },
};

const KINDS = new Set<AbilityKind>([
  'jump', 'stomp', 'bounce', 'rear', 'surprise', 'ollie', 'pounce', 'hydraulics', 'backflip', 'moonjump',
  'nitro', 'drs', 'dash', 'sting', 'gore', 'flip', 'bump', 'bite', 'frenzy', 'slide', 'punch', 'kick', 'scoop', 'tailwhip',
  'slam', 'puff', 'roar', 'discharge', 'howl', 'stasis', 'beam', 'storm',
  'fly', 'glide', 'shield', 'shell', 'reflect', 'heavy', 'phase', 'invis', 'blink', 'swap', 'recall', 'icewall',
  'shoot', 'drop', 'dump',
]);

/** 'shoot:toast|Тостомет' → { kind: 'shoot', projectile: 'toast', name: 'Тостомет' } */
export function parseAbility(src: string): AbilityDef {
  const [main, name] = src.split('|');
  const [kind, arg] = main.split(':');
  if (!KINDS.has(kind as AbilityKind)) throw new Error(`unknown ability ${src}`);
  const a: AbilityDef = { kind: kind as AbilityKind };
  if (kind === 'shoot') a.projectile = (arg ?? 'cannon') as ProjectileKind;
  else if ((kind === 'drop' || kind === 'dump') && arg) a.item = arg as ItemKind;
  if (name) a.name = name;
  return a;
}

/** Give a built car its action and quirks from the table. */
export function applyKit(def: CarDef): CarDef {
  const k = KIT[def.id];
  const out: CarDef = { ...def };
  delete out.ability;
  delete out.traits;
  if (!k) return out;
  if (k.ab) out.ability = parseAbility(k.ab);
  if (k.traits) out.traits = k.traits;
  if (k.blurb) out.blurb = k.blurb;
  return out;
}

/** Identity of an action for the uniqueness rule. */
export function abilityKey(a: AbilityDef): string {
  if (a.kind === 'shoot') return `shoot:${a.projectile}`;
  if (a.kind === 'drop' || a.kind === 'dump') return `${a.kind}:${a.item}`;
  return a.kind;
}

export function traitKey(t: TraitDef): string {
  return t.kind === 'spill' ? `spill:${t.item}` : t.kind;
}
