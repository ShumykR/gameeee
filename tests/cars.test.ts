import { HEAD_R } from '../src/physics/constants';
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
    if (def.lights !== false && def.body.some((p) => (p.mat ?? 'body') === 'body' && !p.deco && !p.hide)) expect(counts.get(P.HEAD_LIGHT) ?? 0).toBeGreaterThan(0);
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

import { Game } from '../src/game/game';
import { MAP_BY_ID } from '../src/maps/defs';

describe('moving pieces', () => {
  const linked = CARS.filter((c) => c.links?.length);
  it('some cars have them', () => {
    expect(linked.length).toBeGreaterThan(5);
  });
  it.each(linked.map((c) => [c.id, c] as const))('%s drives with its pieces attached', (_id, def) => {
    const g = new Game({ cars: [def, CARS[0]], maps: [MAP_BY_ID.bunker], randomMaps: false, target: 99, roundTime: 60, seed: 5 });
    const c = g.cars[0];
    let top = 0;
    for (let i = 0; i < 60 * 6; i++) {
      g.inputs[0] = i < 330 ? 1 : -1;
      g.step();
      if (i === 170) {
        // settled through the countdown: upright, pieces near their rest pose
        expect(c.alive).toBe(true);
        expect(Math.abs(c.angle)).toBeLessThan(0.35);
      }
      top = Math.max(top, Math.abs(c.chassis.getLinearVelocity().x));
      for (const b of c.allBodies) expect(Number.isFinite(b.getPosition().x)).toBe(true);
      // pieces stay hinged to the car
      for (const j of c.linkJoints) {
        const a = j.getAnchorA(), b = j.getAnchorB();
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(0.85);
      }
    }
    expect(top).toBeGreaterThan(def.motor.speed * 0.6);
  });
});

describe('driver head', () => {
  it('is the same size in every car', () => {
    for (const c of CARS) expect(c.head.r, c.id).toBe(HEAD_R);
  });
});
