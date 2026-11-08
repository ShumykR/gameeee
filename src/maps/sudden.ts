import type { MapDef, SuddenDeathKind, ThemeId } from './types';

export const SUDDEN_INFO: Record<SuddenDeathKind, { name: string; sub: string }> = {
  lava: { name: 'Лава', sub: 'лава піднімається!' },
  flood: { name: 'Приплив', sub: 'море затоплює острів!' },
  meteors: { name: 'Метеорити', sub: 'метеоритний дощ!' },
  walls: { name: 'Стіни', sub: 'стіни сходяться!' },
  blizzard: { name: 'Хуртовина', sub: 'лід, вітер і сніжки!' },
  bombs: { name: 'Бомбардування', sub: 'вибухи всюди!' },
  ghosts: { name: 'Привиди', sub: 'не дай привиду торкнутися голови!' },
  balls: { name: 'Дощ із м\'ячів', sub: 'м\'ячі падають з неба!' },
  blocks: { name: 'Злива кубиків', sub: 'іграшкові кубики падають!' },
  lowgrav: { name: 'Невагомість', sub: 'гравітація зникає!' },
};

const BY_THEME: Record<ThemeId, SuddenDeathKind> = {
  meadow: 'lava', foundry: 'lava', sawmill: 'walls', sky: 'lowgrav', ice: 'blizzard', neon: 'walls', desert: 'meteors', moon: 'meteors',
  halloween: 'ghosts', winter: 'blizzard', alien: 'bombs', dome: 'walls', volcano: 'lava', beach: 'flood', stadium: 'balls',
  cny: 'bombs', rift: 'lowgrav', toys: 'blocks',
  cavern: 'lava', catacomb: 'ghosts', grotto: 'flood', mine: 'walls', chasm: 'meteors', bunker: 'walls', crypt: 'ghosts', amber: 'lowgrav',
};

export const suddenKindFor = (map: MapDef): SuddenDeathKind => map.suddenDeath ?? BY_THEME[map.theme];

/** Seconds a non-rising variant runs before lava starts rising anyway. */
export const SUDDEN_FALLBACK = 25;
