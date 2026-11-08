import type { AbilityDef, AbilityKind, CargoDef, CarDef, ItemKind, ProjectileKind } from '../cars/types';

export interface AbilityInfo {
  name: string;
  icon: string;
  /** Cooldown, seconds. */
  cd: number;
  blurb: string;
}

export const ABILITY_INFO: Record<AbilityKind, AbilityInfo> = {
  jump: { name: 'Стрибок', icon: '⤊', cd: 2.6, blurb: 'Підкидає авто вгору — стрибни суперникові на голову.' },
  nitro: { name: 'Нітро', icon: '🔥', cd: 3.2, blurb: 'Реактивний ривок уперед по напрямку корпусу.' },
  dash: { name: 'Таран', icon: '➤', cd: 3, blurb: 'Різкий ривок уперед, щоб протаранити суперника.' },
  slam: { name: 'Ударна хвиля', icon: '💥', cd: 4.5, blurb: 'Удар об землю відкидає все навколо. У повітрі — пікірування.' },
  shoot: { name: 'Постріл', icon: '🎯', cd: 2.4, blurb: 'Снаряд уперед. Влучання в голову — очко!' },
  fly: { name: 'Політ', icon: '🪽', cd: 5, blurb: 'Кілька секунд невагомості й керування в повітрі.' },
  shield: { name: 'Щит', icon: '🛡️', cd: 6, blurb: 'Півтори секунди голову не можна вибити.' },
  roar: { name: 'Рик', icon: '📣', cd: 4.5, blurb: 'Звукова хвиля відштовхує суперника.' },
  drop: { name: 'Пастка', icon: '💣', cd: 4, blurb: 'Скидає позаду сюрприз для суперника.' },
  phase: { name: 'Привид', icon: '👻', cd: 6, blurb: 'Стає примарою: проходить крізь суперника і снаряди.' },
  blink: { name: 'Портал', icon: '🌀', cd: 5, blurb: 'Миттєво переноситься на кілька метрів уперед.' },
  dump: { name: 'Вивантажити', icon: '📦', cd: 5, blurb: 'Висипає вантаж назад — суперникові під колеса.' },
};

/** What a projectile does to a car it hits (heads always lose unless `harmless`). */
export type ShotEffect = 'none' | 'boom' | 'push' | 'lift' | 'freeze' | 'pull' | 'stun';

export interface ProjectileInfo {
  r: number;
  speed: number;
  density: number;
  gravity: number;
  life: number;
  bounce: number;
  name: string;
  effect?: ShotEffect;
  /** Pops on the first contact. */
  pop?: boolean;
  /** Does not knock heads off (water, bubbles). */
  harmless?: boolean;
  /** Several pellets per shot, spread in radians. */
  count?: number;
  spread?: number;
  /** Cooldown multiplier. */
  cd?: number;
}

export const PROJECTILES: Record<ProjectileKind, ProjectileInfo> = {
  cannon: { r: 0.24, speed: 21, density: 3, gravity: 1, life: 2.6, bounce: 0.3, name: 'ядро' },
  snowball: { r: 0.22, speed: 20, density: 1.2, gravity: 1, life: 2.2, bounce: 0.05, name: 'сніжка', pop: true },
  ball: { r: 0.34, speed: 18, density: 0.6, gravity: 1, life: 3.2, bounce: 0.75, name: 'м\'яч' },
  laser: { r: 0.12, speed: 34, density: 2, gravity: 0, life: 0.7, bounce: 0, name: 'лазер', pop: true },
  firework: { r: 0.18, speed: 19, density: 1, gravity: 0.35, life: 1.4, bounce: 0, name: 'петарда', pop: true, effect: 'boom' },
  toast: { r: 0.2, speed: 17, density: 0.8, gravity: 1, life: 2.4, bounce: 0.2, name: 'тост', count: 2, spread: 0.18 },
  harpoon: { r: 0.14, speed: 28, density: 2, gravity: 0.3, life: 1.0, bounce: 0, name: 'гарпун', pop: true, effect: 'pull' },
  bubble: { r: 0.4, speed: 9, density: 0.1, gravity: -0.05, life: 2.6, bounce: 0.9, name: 'бульбашка', pop: true, effect: 'lift', harmless: true },
  pumpkin: { r: 0.3, speed: 16, density: 1, gravity: 1, life: 2.2, bounce: 0.1, name: 'гарбуз-бомба', pop: true, effect: 'boom' },
  bone: { r: 0.18, speed: 20, density: 1.4, gravity: 1, life: 2.2, bounce: 0.4, name: 'кістка' },
  missile: { r: 0.18, speed: 22, density: 1, gravity: 0.1, life: 1.6, bounce: 0, name: 'ракета', pop: true, effect: 'boom', cd: 1.25 },
  water: { r: 0.16, speed: 18, density: 0.6, gravity: 0.7, life: 0.8, bounce: 0, name: 'струмінь води', pop: true, effect: 'push', harmless: true, count: 6, spread: 0.08, cd: 0.75 },
  ice: { r: 0.2, speed: 22, density: 1, gravity: 0.6, life: 1.6, bounce: 0, name: 'крижаний заряд', pop: true, effect: 'freeze' },
  egg: { r: 0.2, speed: 15, density: 0.8, gravity: 1, life: 2.2, bounce: 0, name: 'яйце', pop: true },
  fire: { r: 0.2, speed: 12, density: 0.2, gravity: -0.3, life: 0.45, bounce: 0, name: 'полум\'я', pop: true, count: 5, spread: 0.3, cd: 1.3 },
  urn: { r: 0.26, speed: 15, density: 1.2, gravity: 1, life: 2.4, bounce: 0, name: 'урна', pop: true, effect: 'boom' },
  zap: { r: 0.16, speed: 30, density: 1, gravity: 0, life: 0.6, bounce: 0, name: 'блискавка', pop: true, effect: 'stun' },
  cork: { r: 0.16, speed: 26, density: 1.5, gravity: 0.8, life: 1.8, bounce: 0.5, name: 'корок' },
  gift: { r: 0.26, speed: 15, density: 1, gravity: 1, life: 2.6, bounce: 0.4, name: 'подарунок', effect: 'boom', pop: true },
  burger: { r: 0.24, speed: 16, density: 1, gravity: 1, life: 2.2, bounce: 0.2, name: 'бургер' },
  icecream: { r: 0.22, speed: 18, density: 0.8, gravity: 0.9, life: 1.8, bounce: 0, name: 'морозиво', pop: true, effect: 'freeze', harmless: true },
  golf: { r: 0.1, speed: 30, density: 3, gravity: 0.8, life: 2, bounce: 0.6, name: 'м\'ячик для гольфу' },
  bullet: { r: 0.08, speed: 34, density: 3, gravity: 0.2, life: 0.8, bounce: 0, name: 'кулі', pop: true, count: 3, spread: 0.1 },
  web: { r: 0.3, speed: 18, density: 0.3, gravity: 0.4, life: 1.2, bounce: 0, name: 'павутина', pop: true, effect: 'freeze', harmless: true },
};

/** Loose items: shape, size and feel. */
export const ITEMS: Record<ItemKind, { shape: 'circle' | 'box'; w: number; h: number; density: number; bounce: number; name: string }> = {
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
  ice: { shape: 'box', w: 0.36, h: 0.36, density: 0.6, bounce: 0.05, name: 'лід' },
  coal: { shape: 'circle', w: 0.16, h: 0.16, density: 1.4, bounce: 0.05, name: 'вугілля' },
  mine: { shape: 'box', w: 0.5, h: 0.16, density: 2, bounce: 0, name: 'міна' },
  bomb: { shape: 'circle', w: 0.26, h: 0.26, density: 1.2, bounce: 0.3, name: 'бомба' },
  peel: { shape: 'box', w: 0.5, h: 0.1, density: 0.4, bounce: 0, name: 'бананова шкірка' },
};

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
  if (!a) return '— без здібності';
  return `${ABILITY_INFO[a.kind].icon} ${abilityName(a)}`;
}

/** One-line description of the action (garage card). */
export function abilityBlurb(def: CarDef): string {
  const a = abilityOf(def);
  if (!a) return 'Без спецдії: лише кермо, газ і фізика.';
  if (a.kind === 'shoot' && a.projectile) {
    const p = PROJECTILES[a.projectile];
    const fx: Record<ShotEffect, string> = {
      none: 'Влучання в голову — очко!',
      boom: 'Вибухає й відкидає суперника. Влучання в голову — очко!',
      push: 'Не вибиває водія, зате збиває суперника з місця.',
      lift: 'Не вибиває водія, але піднімає суперника в повітря.',
      freeze: 'Заморожує суперника: колеса не крутяться.',
      pull: 'Притягує суперника до тебе. Влучання в голову — очко!',
      stun: 'Б\'є струмом: суперник на мить глухне.',
    };
    return `Стріляє: ${p.name}. ${fx[p.effect ?? 'none']}`;
  }
  if (a.kind === 'roar' && a.stun) return 'Розряд навколо: суперник поряд на мить глухне.';
  if (a.kind === 'drop' && a.item === 'mine') return 'Ставить міну позаду: вибухає, щойно суперник наїде.';
  if (a.kind === 'drop' && a.item === 'bomb') return 'Скидає бомбу з ґнотом: вибух за півтори секунди.';
  if (a.kind === 'drop' && a.item === 'peel') return 'Кидає бананову шкірку: хто наїде — закрутиться.';
  if (a.kind === 'drop' && a.item === 'barrel') return 'Скидає токсичну бочку: вибухає від дотику суперника.';
  if (a.kind === 'drop' && a.item) return `Скидає позаду: ${ITEMS[a.item].name}. Перешкода для суперника.`;
  if (a.kind === 'dump' && a.item) return `Висипає назад: ${ITEMS[a.item].name}.`;
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
