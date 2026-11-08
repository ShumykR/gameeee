import { describe, it, expect } from 'vitest';
import { CARS } from '../src/cars/defs';
import { validateCar, rawStats, normalizedStats } from '../src/cars/stats';
import { generateCarGrid, generateWheelGrid, P } from '../src/cars/sprite';

describe('car definitions', () => {
  it('have unique ids', () => {
    expect(new Set(CARS.map((c) => c.id)).size).toBe(CARS.length);
  });
  it.each(CARS.map((c) => [c.id, c] as const))('%s is valid', (_id, def) => {
    expect(validateCar(def)).toEqual([]);
  });
  it('cover many archetypes', () => {
    expect(new Set(CARS.map((c) => c.archetype)).size).toBeGreaterThanOrEqual(Math.min(10, CARS.length));
  });
  it('stay within balance envelopes', () => {
    for (const c of CARS) {
      const s = rawStats(c);
      // power-to-weight and speed bands keep every archetype viable
      expect(s.accel, c.id).toBeGreaterThan(9);
      expect(s.accel, c.id).toBeLessThan(30);
      expect(s.speed, c.id).toBeGreaterThan(11);
      expect(s.speed, c.id).toBeLessThan(21);
      // trade-off: fast cars are not also the heaviest
      if (s.speed > 18) expect(s.weight, c.id).toBeLessThan(5);
    }
  });
  it('normalizes stats to 1..5', () => {
    for (const c of CARS) {
      const n = normalizedStats(c, CARS);
      for (const v of Object.values(n)) {
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(5);
      }
    }
  });
});

describe('sprite generator', () => {
  it.each(CARS.map((c) => [c.id, c] as const))('%s produces an outlined pixel grid', (_id, def) => {
    const g = generateCarGrid(def);
    expect(g.w).toBeGreaterThan(15);
    expect(g.h).toBeGreaterThan(5);
    const counts = new Map<number, number>();
    for (const v of g.data) counts.set(v, (counts.get(v) ?? 0) + 1);
    expect(counts.get(P.OUTLINE) ?? 0).toBeGreaterThan(20);
    // Hulls may be painted, wooden, bone, glass… any filled interior counts.
    let filled = 0;
    for (const [v, n] of counts) if (v !== P.NONE && v !== P.OUTLINE) filled += n;
    expect(filled).toBeGreaterThan(30);
    // Painted hulls get head lights.
    if (def.body.some((p) => (p.mat ?? 'body') === 'body' && !p.deco)) expect(counts.get(P.HEAD_LIGHT) ?? 0).toBeGreaterThan(0);
    // origin lies inside the grid
    expect(g.ox).toBeGreaterThan(0);
    expect(g.ox).toBeLessThan(g.w);
  });
  it('is deterministic', () => {
    const a = generateCarGrid(CARS[0]), b = generateCarGrid(CARS[0]);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
  });
  it('wheel grid is round and symmetric in size', () => {
    const g = generateWheelGrid({ x: 0, y: 0, r: 0.5 });
    expect(g.w).toBe(g.h);
    expect(g.data[0]).toBe(0);
    expect(g.data[g.ox + g.oy * g.w]).not.toBe(0);
  });
});
