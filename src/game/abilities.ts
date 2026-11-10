import type { AbilityDef, AbilityKind, CargoDef, CarDef, ItemKind, ProjectileKind, TraitDef } from '../cars/types';

export interface AbilityInfo {
  name: string;
  icon: string;
  /** Cooldown, seconds. */
  cd: number;
  blurb: string;
}

export const ABILITY_INFO: Record<AbilityKind, AbilityInfo> = {
  jump: { name: 'Стрибок', icon: '⤊', cd: 2.6, blurb: 'Підкидає авто вгору — стрибни суперникові на голову.' },
  stomp: { name: 'Приземлення', icon: '🦶', cd: 4.2, blurb: 'Стрибок, а при приземленні — ударна хвиля.' },
  bounce: { name: 'Гума', icon: '🟢', cd: 6, blurb: 'Три секунди корпус гумовий: відскакує від усього.' },
  rear: { name: 'Дибки', icon: '🐴', cd: 2.4, blurb: 'Задирає передок і б\'є ним згори.' },
  surprise: { name: 'Сюрприз', icon: '🎁', cd: 3.6, blurb: 'Випадкова дія: стрибок, щит, портал, хвиля чи вибуховий подарунок.' },
  ollie: { name: 'Олі', icon: '🛹', cd: 1.1, blurb: 'Низький швидкий стрибок, майже без перезарядки.' },
  pounce: { name: 'Кидок', icon: '🐾', cd: 3.2, blurb: 'Стрибок просто на суперника.' },
  hydraulics: { name: 'Гідравліка', icon: '〰️', cd: 4, blurb: 'Три підскоки поспіль на гідравліці.' },
  backflip: { name: 'Бекфліп', icon: '↺', cd: 3, blurb: 'Стрибок із сальто назад — задні колеса летять суперникові в голову.' },
  moonjump: { name: 'Місячний стрибок', icon: '🌙', cd: 4.5, blurb: 'Стрибок і дві з половиною секунди місячної гравітації.' },
  nitro: { name: 'Нітро', icon: '🔥', cd: 3.2, blurb: 'Реактивний ривок уперед по напрямку корпусу.' },
  drs: { name: 'DRS', icon: '🏎️', cd: 6, blurb: 'Кілька секунд вища максимальна швидкість і тяга.' },
  dash: { name: 'Таран', icon: '➤', cd: 3, blurb: 'Різкий ривок уперед, щоб протаранити суперника.' },
  sting: { name: 'Жало', icon: '🐝', cd: 3.6, blurb: 'Ривок; якщо влучиш у суперника — він заклякне від розряду.' },
  gore: { name: 'Роги', icon: '🦏', cd: 3.6, blurb: 'Ривок; суперника, в якого влучиш, підкидає вгору.' },
  flip: { name: 'Перекидання', icon: '🪲', cd: 4, blurb: 'Ривок; суперника, в якого влучиш, перевертає.' },
  bump: { name: 'Бамс', icon: '🎪', cd: 3, blurb: 'Ривок; суперник відлітає, як від гумового бампера.' },
  bite: { name: 'Хватка', icon: '🦈', cd: 3.8, blurb: 'Ривок; схопленого суперника жбурляє собі за спину.' },
  frenzy: { name: 'Шал', icon: '🐟', cd: 3.8, blurb: 'Три короткі ривки поспіль.' },
  slide: { name: 'Ковзання', icon: '🐧', cd: 5, blurb: 'Поштовх і дві секунди ковзання без тертя.' },
  punch: { name: 'Удар', icon: '👊', cd: 3, blurb: 'Миттєвий удар перед собою: суперника відкидає далеко вбік.' },
  kick: { name: 'Удар ногою', icon: '👟', cd: 2.8, blurb: 'Підбиває суперника й м\'ячі поперед себе вгору.' },
  scoop: { name: 'Ківш', icon: '🏗️', cd: 3.4, blurb: 'Підчіплює суперника попереду й перекидає собі за спину.' },
  tailwhip: { name: 'Хвіст', icon: '🦕', cd: 2.8, blurb: 'Удар хвостом назад: б\'є того, хто позаду.' },
  slam: { name: 'Ударна хвиля', icon: '💥', cd: 4.5, blurb: 'Удар об землю відкидає все навколо. У повітрі — пікірування.' },
  puff: { name: 'Надутися', icon: '🐡', cd: 5, blurb: 'Хвиля навколо і секунда невразливості.' },
  roar: { name: 'Рик', icon: '📣', cd: 4.5, blurb: 'Звукова хвиля відштовхує суперника.' },
  discharge: { name: 'Розряд', icon: '⚡', cd: 4.5, blurb: 'Розряд навколо: суперник поряд на мить глухне.' },
  howl: { name: 'Виття', icon: '🐺', cd: 6, blurb: 'Суперник поблизу дві секунди їде навпаки: ліво стає правом.' },
  stasis: { name: 'Стазис', icon: '🔷', cd: 6, blurb: 'Суперник поблизу завмирає в повітрі на секунду.' },
  beam: { name: 'Промінь', icon: '🛸', cd: 5, blurb: 'Промінь піднімає суперника, що поряд або під тобою.' },
  storm: { name: 'Блискавка', icon: '🌩️', cd: 4.5, blurb: 'Блискавка б\'є туди, де стояв суперник, — устигне втекти?' },
  fly: { name: 'Політ', icon: '🪽', cd: 5, blurb: 'Кілька секунд невагомості й керування в повітрі.' },
  glide: { name: 'Ширяння', icon: '🪁', cd: 4.5, blurb: 'Три секунди повільно планує вниз.' },
  shield: { name: 'Щит', icon: '🛡️', cd: 6, blurb: 'Півтори секунди голову не можна вибити.' },
  shell: { name: 'Панцир', icon: '🐢', cd: 6, blurb: 'Дві секунди не їде, зате важкий і невразливий.' },
  reflect: { name: 'Дзеркало', icon: '💎', cd: 5, blurb: 'Дві секунди снаряди відбиваються назад у стрільця.' },
  heavy: { name: 'Вага', icon: '🏋️', cd: 6, blurb: 'Три секунди авто вчетверо важче — його не зрушити.' },
  phase: { name: 'Привид', icon: '👻', cd: 6, blurb: 'Стає примарою: проходить крізь суперника і снаряди.' },
  invis: { name: 'Невидимість', icon: '🫥', cd: 7, blurb: 'Три з половиною секунди авто майже не видно.' },
  blink: { name: 'Портал', icon: '🌀', cd: 5, blurb: 'Миттєво переноситься на кілька метрів уперед.' },
  swap: { name: 'Обмін', icon: '🔄', cd: 7, blurb: 'Міняється з суперником місцями.' },
  recall: { name: 'Петля часу', icon: '⏪', cd: 6, blurb: 'Повертається туди, де був дві секунди тому.' },
  icewall: { name: 'Крижана стіна', icon: '🧊', cd: 5, blurb: 'Ставить перед собою стіну з льоду.' },
  shoot: { name: 'Постріл', icon: '🎯', cd: 2.4, blurb: 'Снаряд уперед. Влучання в голову — очко!' },
  drop: { name: 'Пастка', icon: '💣', cd: 4, blurb: 'Скидає позаду сюрприз для суперника.' },
  dump: { name: 'Вивантажити', icon: '📦', cd: 5, blurb: 'Висипає вантаж назад — суперникові під колеса.' },
};

/** What a projectile does to a car it hits (heads always lose unless `harmless`). */
export type ShotEffect = 'none' | 'boom' | 'push' | 'lift' | 'freeze' | 'pull' | 'stun' | 'knock' | 'slip' | 'slow' | 'tether';
/** How a projectile flies. */
export type ShotFlight = 'arc' | 'boomerang' | 'wobble' | 'homing' | 'skid' | 'flat' | 'lob' | 'pierce';

export interface ProjectileInfo {
  r: number;
  speed: number;
  density: number;
  gravity: number;
  life: number;
  bounce: number;
  name: string;
  effect?: ShotEffect;
  flight?: ShotFlight;
  /** Pops on the first contact. */
  pop?: boolean;
  /** Does not knock heads off (water, bubbles). */
  harmless?: boolean;
  /** Several pellets per shot, spread in radians. */
  count?: number;
  spread?: number;
  /** Cooldown multiplier. */
  cd?: number;
  /** Explosion radius for 'boom'. */
  blast?: number;
  /** Ground friction (low = slides). */
  friction?: number;
  /** Recoil multiplier. */
  recoil?: number;
}

export const PROJECTILES: Record<ProjectileKind, ProjectileInfo> = {
  cannon: { r: 0.24, speed: 21, density: 3, gravity: 1, life: 2.6, bounce: 0.3, name: 'ядро' },
  snowball: { r: 0.22, speed: 20, density: 1.2, gravity: 1, life: 2.2, bounce: 0.05, name: 'сніжка', pop: true },
  ball: { r: 0.34, speed: 18, density: 0.6, gravity: 1, life: 3.2, bounce: 0.75, name: 'м\'яч' },
  laser: { r: 0.12, speed: 34, density: 2, gravity: 0, life: 0.7, bounce: 0, name: 'лазер', pop: true },
  firework: { r: 0.18, speed: 15.5, density: 1, gravity: 1, life: 2.2, bounce: 0, name: 'петарда', pop: true, effect: 'boom', blast: 2.6 },
  toast: { r: 0.2, speed: 15, density: 0.8, gravity: 1, life: 2.4, bounce: 0.2, name: 'тости', count: 2, spread: 0.25, flight: 'lob' },
  harpoon: { r: 0.14, speed: 28, density: 2, gravity: 0.3, life: 1.0, bounce: 0, name: 'гарпун', pop: true, effect: 'pull' },
  bubble: { r: 0.4, speed: 9, density: 0.1, gravity: -0.05, life: 2.6, bounce: 0.9, name: 'бульбашка', pop: true, effect: 'lift', harmless: true },
  pumpkin: { r: 0.3, speed: 16, density: 1, gravity: 1, life: 2.2, bounce: 0.1, name: 'гарбуз-бомба', pop: true, effect: 'boom' },
  bone: { r: 0.18, speed: 20, density: 1.4, gravity: 0.15, life: 1.6, bounce: 0.4, name: 'кістка-бумеранг', flight: 'boomerang' },
  missile: { r: 0.18, speed: 22, density: 1, gravity: 0.1, life: 1.6, bounce: 0, name: 'ракета', pop: true, effect: 'boom', cd: 1.25 },
  water: { r: 0.16, speed: 18, density: 0.6, gravity: 0.7, life: 0.8, bounce: 0, name: 'струмінь води', pop: true, effect: 'push', harmless: true, count: 6, spread: 0.08, cd: 0.75, recoil: 0.4 },
  ice: { r: 0.2, speed: 22, density: 1, gravity: 0.6, life: 1.6, bounce: 0, name: 'крижаний заряд', pop: true, effect: 'freeze' },
  fire: { r: 0.2, speed: 12, density: 0.2, gravity: -0.3, life: 0.45, bounce: 0, name: 'полум\'я', pop: true, count: 5, spread: 0.3, cd: 1.3 },
  urn: { r: 0.26, speed: 15, density: 1.2, gravity: 1, life: 2.4, bounce: 0, name: 'урна', pop: true, effect: 'boom', flight: 'lob' },
  zap: { r: 0.16, speed: 30, density: 1, gravity: 0, life: 0.6, bounce: 0, name: 'блискавка', pop: true, effect: 'stun' },
  cork: { r: 0.16, speed: 26, density: 1.5, gravity: 0.8, life: 2.4, bounce: 0.92, name: 'корок-рикошет' },
  burger: { r: 0.24, speed: 16, density: 1, gravity: 1, life: 2.2, bounce: 0.2, name: 'бургер' },
  web: { r: 0.3, speed: 18, density: 0.3, gravity: 0.4, life: 1.2, bounce: 0, name: 'павутина', pop: true, effect: 'freeze', harmless: true },
  golf: { r: 0.1, speed: 30, density: 3, gravity: 0.8, life: 2, bounce: 0.6, name: 'м\'ячик для гольфу' },
  bullet: { r: 0.08, speed: 34, density: 3, gravity: 0.2, life: 0.8, bounce: 0, name: 'кулі', pop: true, count: 3, spread: 0.1 },
  bigsnow: { r: 0.55, speed: 13, density: 1.6, gravity: 1, life: 4, bounce: 0.05, name: 'снігова брила', friction: 0.9, effect: 'push', cd: 1.3, recoil: 2 },
  bat: { r: 0.16, speed: 11, density: 0.4, gravity: 0, life: 1.8, bounce: 0, name: 'кажани', pop: true, count: 3, spread: 0.5, flight: 'wobble' },
  penguin: { r: 0.22, speed: 15, density: 1, gravity: 1, life: 3.2, bounce: 0.1, name: 'пінгвін', friction: 0, flight: 'skid', effect: 'push' },
  mega: { r: 0.42, speed: 15, density: 6, gravity: 1, life: 2.6, bounce: 0.1, name: 'надважке ядро', effect: 'knock', cd: 1.4, recoil: 4 },
  torpedo: { r: 0.16, speed: 15, density: 1, gravity: 0, life: 2.2, bounce: 0, name: 'торпеда', pop: true, effect: 'boom', flight: 'flat', blast: 2.8 },
  volley: { r: 0.12, speed: 20, density: 0.8, gravity: 0.2, life: 1.3, bounce: 0, name: 'залп ракет', pop: true, effect: 'boom', count: 4, spread: 0.4, blast: 1.8, cd: 1.4 },
  tea: { r: 0.15, speed: 14, density: 0.5, gravity: 0.9, life: 0.9, bounce: 0, name: 'окріп', pop: true, effect: 'slip', harmless: true, count: 4, spread: 0.18, recoil: 0.4 },
  plasma: { r: 0.34, speed: 10, density: 0.5, gravity: 0, life: 2.6, bounce: 0, name: 'плазмова куля', pop: true, effect: 'boom', blast: 3.4 },
  seeker: { r: 0.16, speed: 15, density: 0.8, gravity: 0, life: 2.4, bounce: 0, name: 'самонавідна ракета', pop: true, effect: 'boom', flight: 'homing', cd: 1.5 },
  fist: { r: 0.3, speed: 20, density: 2, gravity: 0.1, life: 0.9, bounce: 0, name: 'кулак', pop: true, effect: 'knock' },
  railgun: { r: 0.1, speed: 48, density: 4, gravity: 0, life: 0.6, bounce: 0, name: 'рейковий заряд', effect: 'knock', flight: 'pierce', cd: 1.3 },
  atom: { r: 0.26, speed: 15, density: 1, gravity: 0.5, life: 1.8, bounce: 0, name: 'атомний заряд', pop: true, effect: 'boom', blast: 4.6, cd: 1.6 },
  hook: { r: 0.15, speed: 24, density: 1.5, gravity: 0.4, life: 1.0, bounce: 0, name: 'гак на тросі', pop: true, effect: 'tether', harmless: true },
  quill: { r: 0.07, speed: 24, density: 2, gravity: 0.5, life: 0.8, bounce: 0, name: 'голки', pop: true, count: 5, spread: 0.6 },
  popshell: { r: 0.13, speed: 25, density: 2.2, gravity: 0.6, life: 1.3, bounce: 0, name: 'міні-снаряд', pop: true, effect: 'knock', cd: 0.75 },
  grapeshot: { r: 0.08, speed: 26, density: 2.5, gravity: 0.5, life: 0.7, bounce: 0, name: 'картеч', pop: true, count: 6, spread: 0.35 },
  slush: { r: 0.22, speed: 19, density: 0.8, gravity: 0.8, life: 1.6, bounce: 0, name: 'крижана каша', pop: true, effect: 'slow' },
  twinsnow: { r: 0.2, speed: 21, density: 1.2, gravity: 1, life: 2, bounce: 0.05, name: 'подвійна сніжка', pop: true, count: 2, spread: 0.14 },
  twinball: { r: 0.28, speed: 16, density: 0.6, gravity: 1, life: 3, bounce: 0.75, name: 'два м\'ячі', count: 2, spread: 0.18, flight: 'lob' },
  tracer: { r: 0.07, speed: 36, density: 3, gravity: 0.1, life: 0.7, bounce: 0, name: 'трасер', pop: true, cd: 0.55, recoil: 0.5 },
  dragonshell: { r: 0.2, speed: 20, density: 1, gravity: 0.6, life: 1.6, bounce: 0, name: 'драконячий снаряд', pop: true, effect: 'boom', blast: 2 },
  chainshot: { r: 0.26, speed: 18, density: 3.5, gravity: 1, life: 2.4, bounce: 0.2, name: 'ланцюгове ядро', effect: 'knock', recoil: 1.5 },
  ink: { r: 0.3, speed: 14, density: 0.3, gravity: 0.5, life: 1.3, bounce: 0, name: 'чорнило', pop: true, effect: 'slow', harmless: true },
};

/** What a loose item does when the other player's car touches it. */
export type ItemFx = 'explode' | 'fuse' | 'slip' | 'freeze' | 'spring' | 'oil' | 'tar' | 'flat' | 'set' | 'burn';

export interface ItemInfo {
  shape: 'circle' | 'box';
  w: number;
  h: number;
  density: number;
  bounce: number;
  name: string;
  /** Friction against everything (default 0.6). */
  friction?: number;
}

/** Loose items: shape, size and feel. */
export const ITEMS: Record<ItemKind, ItemInfo> = {
  ball: { shape: 'circle', w: 0.3, h: 0.3, density: 0.25, bounce: 0.7, name: 'м\'ячі' },
  log: { shape: 'box', w: 1.3, h: 0.26, density: 0.8, bounce: 0.05, name: 'колоди' },
  barrel: { shape: 'box', w: 0.42, h: 0.52, density: 0.6, bounce: 0.1, name: 'бочки' },
  gift: { shape: 'box', w: 0.42, h: 0.38, density: 0.4, bounce: 0.15, name: 'подарунки' },
  pumpkin: { shape: 'circle', w: 0.3, h: 0.3, density: 0.6, bounce: 0.2, name: 'гарбузи' },
  snowball: { shape: 'circle', w: 0.24, h: 0.24, density: 0.5, bounce: 0.1, name: 'сніжки' },
  trash: { shape: 'box', w: 0.36, h: 0.32, density: 0.4, bounce: 0.1, name: 'сміття' },
  rock: { shape: 'circle', w: 0.26, h: 0.26, density: 1.6, bounce: 0.1, name: 'каміння' },
  egg: { shape: 'circle', w: 0.22, h: 0.22, density: 0.5, bounce: 0.3, name: 'яйця' },
  bone: { shape: 'box', w: 0.6, h: 0.14, density: 0.6, bounce: 0.3, name: 'кістки' },
  crate: { shape: 'box', w: 0.44, h: 0.44, density: 0.5, bounce: 0.1, name: 'ящики' },
  hay: { shape: 'box', w: 0.6, h: 0.4, density: 0.3, bounce: 0.1, name: 'сіно' },
  cow: { shape: 'box', w: 0.8, h: 0.5, density: 0.5, bounce: 0.2, name: 'корова' },
  penguin: { shape: 'box', w: 0.3, h: 0.46, density: 0.5, bounce: 0.2, name: 'пінгвіни' },
  coal: { shape: 'circle', w: 0.16, h: 0.16, density: 1.4, bounce: 0.05, name: 'вугілля' },
  mine: { shape: 'box', w: 0.5, h: 0.16, density: 2, bounce: 0, name: 'міна', friction: 1.2 },
  bomb: { shape: 'circle', w: 0.26, h: 0.26, density: 1.2, bounce: 0.3, name: 'бомба' },
  peel: { shape: 'box', w: 0.5, h: 0.1, density: 0.4, bounce: 0, name: 'бананова шкірка' },
  icecream: { shape: 'box', w: 0.22, h: 0.34, density: 0.4, bounce: 0.1, name: 'ріжки морозива' },
  coffin: { shape: 'box', w: 1.2, h: 0.36, density: 0.7, bounce: 0.1, name: 'труна' },
  concrete: { shape: 'circle', w: 0.36, h: 0.36, density: 2, bounce: 0, name: 'бетон', friction: 1 },
  oil: { shape: 'box', w: 1.2, h: 0.08, density: 3, bounce: 0, name: 'мастило', friction: 1.5 },
  tar: { shape: 'box', w: 1.1, h: 0.1, density: 3, bounce: 0, name: 'гарячий асфальт', friction: 1.5 },
  spikes: { shape: 'box', w: 1.0, h: 0.1, density: 2, bounce: 0, name: 'шипи', friction: 1.5 },
  sandbag: { shape: 'box', w: 0.5, h: 0.26, density: 1.2, bounce: 0, name: 'мішки з піском', friction: 1 },
  melon: { shape: 'circle', w: 0.34, h: 0.34, density: 0.6, bounce: 0.25, name: 'кавуни' },
  tire: { shape: 'circle', w: 0.44, h: 0.44, density: 0.35, bounce: 0.6, name: 'шини' },
  icewall: { shape: 'box', w: 0.36, h: 1.6, density: 2.5, bounce: 0, name: 'крижана стіна', friction: 0.1 },
  flame: { shape: 'box', w: 0.34, h: 0.14, density: 1, bounce: 0, name: 'вогонь', friction: 1.5 },
  cone: { shape: 'box', w: 0.34, h: 0.44, density: 0.2, bounce: 0.2, name: 'конуси' },
  toyblock: { shape: 'box', w: 0.5, h: 0.5, density: 0.3, bounce: 0.2, name: 'кубики' },
};

/** Effect an item has when a car drops it on purpose (cargo and arena props have none). */
export const DROP_FX: Partial<Record<ItemKind, ItemFx>> = {
  mine: 'explode', barrel: 'explode', bomb: 'fuse', peel: 'slip', icecream: 'freeze', gift: 'spring',
  oil: 'oil', tar: 'tar', spikes: 'flat', concrete: 'set', flame: 'burn',
};

export interface TraitInfo { name: string; icon: string; blurb: string }

export const TRAIT_INFO: Record<TraitDef['kind'], TraitInfo> = {
  swim: { name: 'Плавець', icon: '🛟', blurb: 'У воді не тоне, а тримається на плаву й гребе.' },
  spill: { name: 'Слід', icon: '🍦', blurb: 'На ходу губить щось позаду.' },
  medkit: { name: 'Аптечка', icon: '⛑️', blurb: 'Перший удар у голову за раунд не рахується.' },
  grip: { name: 'Гусениці', icon: '🧲', blurb: 'Мертва хватка: тримається на крутих схилах.' },
  quills: { name: 'Шипи', icon: '🌵', blurb: 'Хто в нього врізається — відлітає.' },
  rubber: { name: 'Гума', icon: '⚽', blurb: 'Корпус пружний: відскакує від усього.' },
  shock: { name: 'Струм', icon: '⚡', blurb: 'Дотик до корпусу б\'є суперника струмом.' },
};

export function traitName(t: TraitDef): string {
  if (t.kind === 'spill') return `${TRAIT_INFO.spill.name}: ${ITEMS[t.item].name}`;
  return TRAIT_INFO[t.kind].name;
}

export function traitBlurb(t: TraitDef): string {
  if (t.kind === 'spill') {
    const fx = DROP_FX[t.item];
    const what = fx === 'freeze' ? 'хто наїде — примерзає' : fx === 'burn' ? 'хто наїде — обпікається й підскакує' : 'перешкода для суперника';
    return `На ходу губить позаду: ${ITEMS[t.item].name} — ${what}.`;
  }
  return TRAIT_INFO[t.kind].blurb;
}

/** "🛟 Плавець · 🍦 Слід: морозиво" or '' when the car has no quirks. */
export function traitLabel(def: CarDef): string {
  return (def.traits ?? []).map((t) => `${TRAIT_INFO[t.kind].icon} ${traitName(t)}`).join(' · ');
}

/** The car's special action, or null for cars that just drive. */
export function abilityOf(def: CarDef): AbilityDef | null {
  return def.ability ?? null;
}

export function abilityCd(a: AbilityDef): number {
  const base = ABILITY_INFO[a.kind].cd;
  return a.kind === 'shoot' && a.projectile ? base * (PROJECTILES[a.projectile].cd ?? 1) : base;
}

export function abilityName(a: AbilityDef): string {
  if (a.name) return a.name;
  const info = ABILITY_INFO[a.kind];
  if (a.kind === 'shoot' && a.projectile) return `${info.name}: ${PROJECTILES[a.projectile].name}`;
  if ((a.kind === 'drop' || a.kind === 'dump') && a.item) return `${info.name}: ${ITEMS[a.item].name}`;
  return info.name;
}

export function abilityLabel(def: CarDef): string {
  const a = abilityOf(def);
  const tl = traitLabel(def);
  if (!a) return tl || '— без здібності';
  return `${ABILITY_INFO[a.kind].icon} ${abilityName(a)}${tl ? ` · ${tl}` : ''}`;
}

/** One-line description of the action (garage card). */
export function abilityBlurb(def: CarDef): string {
  const a = abilityOf(def);
  const passive = (def.traits ?? []).map(traitBlurb).join(' ');
  if (!a) return passive || (def.cargo || def.flail ? 'Без спецдії: зброя — вантаж і фізика.' : 'Без спецдії: лише кермо, газ і фізика.');
  return `${actionBlurb(a)}${passive ? ` ${passive}` : ''}`;
}

function actionBlurb(a: AbilityDef): string {
  if (a.kind === 'shoot' && a.projectile) {
    const p = PROJECTILES[a.projectile];
    const fx: Record<ShotEffect, string> = {
      none: 'Влучання в голову — очко!',
      boom: 'Вибухає й відкидає суперника. Влучання в голову — очко!',
      push: p.harmless ? 'Не вибиває водія, зате збиває суперника з місця.' : 'Штовхає суперника. Влучання в голову — очко!',
      lift: 'Не вибиває водія, але піднімає суперника в повітря.',
      freeze: 'Заморожує суперника: колеса не крутяться.',
      pull: 'Притягує суперника до тебе. Влучання в голову — очко!',
      stun: 'Б\'є струмом: суперник на мить глухне.',
      knock: 'Відкидає суперника далеко. Влучання в голову — очко!',
      slip: 'Не вибиває водія, але закручує суперника дзиґою.',
      slow: 'Не вибиває водія, але липне й гальмує суперника.',
      tether: 'Чіпляє суперника тросом на кілька секунд.',
    };
    const fl: Partial<Record<ShotFlight, string>> = {
      boomerang: ' Повертається, як бумеранг.', wobble: ' Летять, петляючи.', homing: ' Сама наводиться на ціль.',
      skid: ' Ковзає по землі.', flat: ' Мчить низько й рівно.', lob: ' Летить навісом.', pierce: ' Прошиває наскрізь.',
    };
    return `Стріляє: ${p.name}. ${fx[p.effect ?? 'none']}${fl[p.flight ?? 'arc'] ?? ''}`;
  }
  if (a.kind === 'drop' && a.item) {
    const fx: Partial<Record<ItemFx, string>> = {
      explode: 'вибухає, щойно суперник наїде', fuse: 'вибух за півтори секунди', slip: 'хто наїде — закрутиться',
      spring: 'хто торкнеться — злетить на пружині', oil: 'колеса на ній ковзають', tar: 'колеса в ньому грузнуть',
      flat: 'хто наїде — спускає шини', set: 'застигає горбом',
    };
    const f = DROP_FX[a.item];
    return `Скидає позаду: ${ITEMS[a.item].name}${f && fx[f] ? ` — ${fx[f]}` : ''}.`;
  }
  if (a.kind === 'dump' && a.item) {
    return a.item === 'concrete' ? 'Виливає назад бетон, що за мить застигає перешкодою.' : `Висипає назад: ${ITEMS[a.item].name}.`;
  }
  return ABILITY_INFO[a.kind].blurb;
}

/** Car-local centers of cargo items stacked in the bed. */
export function cargoSlots(cg: CargoDef): [number, number][] {
  const it = ITEMS[cg.kind];
  const [x0, x1, top] = cg.at;
  const perRow = Math.max(1, Math.floor((x1 - x0) / (it.w + 0.02)));
  const out: [number, number][] = [];
  for (let i = 0; i < cg.n; i++) {
    const row = Math.floor(i / perRow), col = i % perRow;
    const inRow = Math.min(perRow, cg.n - row * perRow);
    const span = inRow * (it.w + 0.02);
    out.push([(x0 + x1) / 2 - span / 2 + (col + 0.5) * (it.w + 0.02) + (row % 2 ? 0.05 : 0), top - it.h / 2 - 0.03 - row * (it.h + 0.02)]);
  }
  return out;
}
