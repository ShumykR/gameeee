import type { Archetype, CarDef, CategoryId } from './types';

export interface CategoryInfo {
  id: CategoryId;
  name: string;
  icon: string;
  /** Themed arena for this collection, if it has one. */
  map?: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'originals', name: 'Оригінальні', icon: '⭐' },
  { id: 'retro', name: 'Класичні', icon: '🚗', map: 'meadow' },
  { id: 'halloween', name: 'Геловін', icon: '🎃', map: 'graveyard' },
  { id: 'winter', name: 'Зимові', icon: '❄️', map: 'winter' },
  { id: 'alien', name: 'Прибульці', icon: '👽', map: 'ufo-farm' },
  { id: 'dome', name: 'Мотодром', icon: '🏟️', map: 'motordrome' },
  { id: 'dino', name: 'Динозаври', icon: '🦖', map: 'volcano' },
  { id: 'robo', name: 'Роботи', icon: '🤖', map: 'foundry' },
  { id: 'summer', name: 'Літо', icon: '🏝️', map: 'beach' },
  { id: 'soccer', name: 'Футбол', icon: '⚽', map: 'stadium' },
  { id: 'cny', name: 'Китайський Новий рік', icon: '🏮', map: 'lantern' },
  { id: 'rift', name: 'Портали', icon: '🌀', map: 'rift' },
  { id: 'toys', name: 'Іграшкові хот-роди', icon: '🏁', map: 'toytrack' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, CategoryInfo>;

export const ARCH_NAMES: Record<Archetype, string> = {
  allround: 'універсал', heavy: 'важке', fast: 'швидке', monster: 'монстр-трак', tiny: 'крихітне', long: 'довга база',
  scoop: 'ківш', ram: 'таран', spike: 'шипи', rocket: 'ракета', tall: 'високе', bouncy: 'стрибуче',
};

export const categoryOf = (def: CarDef): CategoryId => def.category ?? 'originals';

export interface CarFilter {
  cat?: CategoryId | 'all';
  arch?: Archetype | 'all';
  query?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[’'`]/g, '').replace(/\s+/g, ' ').trim();

/** Text a car can be found by: name, id, description, collection and type names. */
export function searchText(def: CarDef): string {
  const cat = CATEGORY_BY_ID[categoryOf(def)];
  return norm(`${def.name} ${def.id.replace(/-/g, ' ')} ${def.blurb} ${cat?.name ?? ''} ${ARCH_NAMES[def.archetype]}`);
}

/** Filter by collection, type and a free-text query (every word must match). */
export function filterCars(cars: CarDef[], f: CarFilter): CarDef[] {
  const words = norm(f.query ?? '').split(' ').filter(Boolean);
  return cars.filter((c) => {
    if (f.cat && f.cat !== 'all' && categoryOf(c) !== f.cat) return false;
    if (f.arch && f.arch !== 'all' && c.archetype !== f.arch) return false;
    if (!words.length) return true;
    const t = searchText(c);
    return words.every((w) => t.includes(w));
  });
}

export function countByCategory(cars: CarDef[]): Record<string, number> {
  const out: Record<string, number> = { all: cars.length };
  for (const c of cars) out[categoryOf(c)] = (out[categoryOf(c)] ?? 0) + 1;
  return out;
}
