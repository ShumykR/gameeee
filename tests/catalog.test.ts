import { describe, it, expect } from 'vitest';
import { CARS } from '../src/cars/defs';
import { CATEGORIES, countByCategory, filterCars, categoryOf } from '../src/cars/catalog';

describe('car catalog', () => {
  it('every car belongs to a known collection, and every collection has cars', () => {
    const ids = new Set(CATEGORIES.map((c) => c.id));
    for (const c of CARS) expect(ids.has(categoryOf(c)), c.id).toBe(true);
    const counts = countByCategory(CARS);
    for (const c of CATEGORIES) expect(counts[c.id], c.id).toBeGreaterThan(0);
    expect(CARS.length).toBeGreaterThanOrEqual(250);
  });
  it('filters by collection', () => {
    const dinos = filterCars(CARS, { cat: 'dino' });
    expect(dinos.length).toBe(15);
    expect(dinos.every((c) => c.category === 'dino')).toBe(true);
  });
  it('searches name, description and collection, case-insensitively, all words', () => {
    expect(filterCars(CARS, { query: 'T. REX' }).map((c) => c.id)).toContain('t-rex');
    expect(filterCars(CARS, { query: 'лісовоз' }).map((c) => c.id)).toEqual(['timber-lorry']);
    expect(filterCars(CARS, { query: 'зимові сани' }).length).toBeGreaterThan(2);
    expect(filterCars(CARS, { query: 'zzzz-nothing' })).toEqual([]);
  });
  it('combines collection, type and query', () => {
    const r = filterCars(CARS, { cat: 'winter', arch: 'heavy', query: '' });
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((c) => c.category === 'winter' && c.archetype === 'heavy')).toBe(true);
  });
});
