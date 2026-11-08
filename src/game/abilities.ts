import type { AbilityDef, AbilityKind, Archetype, CarDef, ProjectileKind } from '../cars/types';

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
};

export const PROJECTILES: Record<ProjectileKind, { r: number; speed: number; density: number; gravity: number; life: number; bounce: number; name: string }> = {
  cannon: { r: 0.24, speed: 21, density: 3, gravity: 1, life: 2.6, bounce: 0.3, name: 'ядро' },
  snowball: { r: 0.22, speed: 20, density: 1.2, gravity: 1, life: 2.2, bounce: 0.05, name: 'сніжка' },
  ball: { r: 0.34, speed: 18, density: 0.6, gravity: 1, life: 3.2, bounce: 0.75, name: 'м\'яч' },
  laser: { r: 0.12, speed: 34, density: 2, gravity: 0, life: 0.7, bounce: 0, name: 'лазер' },
  firework: { r: 0.18, speed: 19, density: 1, gravity: 0.35, life: 1.4, bounce: 0, name: 'петарда' },
};

const BY_ARCH: Record<Archetype, AbilityKind> = {
  allround: 'jump', heavy: 'slam', fast: 'nitro', monster: 'jump', tiny: 'jump', long: 'nitro',
  scoop: 'slam', ram: 'dash', spike: 'dash', rocket: 'nitro', tall: 'shield', bouncy: 'jump',
};

export function abilityOf(def: CarDef): AbilityDef {
  return def.ability ?? { kind: BY_ARCH[def.archetype] };
}

export function abilityLabel(def: CarDef): string {
  const a = abilityOf(def);
  const info = ABILITY_INFO[a.kind];
  return a.kind === 'shoot' && a.projectile ? `${info.icon} ${info.name}: ${PROJECTILES[a.projectile].name}` : `${info.icon} ${info.name}`;
}
