import { describe, it, expect } from 'vitest';
import { MAPS } from '../src/maps/defs';
import { CARS } from '../src/cars/defs';
import { pointInPoly } from '../src/render/grid';
import { Game } from '../src/game/game';
import { generateTerrain } from '../src/maps/art';

describe.each(MAPS.map((m) => [m.id, m] as const))('map %s', (_id, map) => {
  it('has clean solid outlines', () => {
    for (const s of map.solids) {
      expect(s.pts.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < s.pts.length; i++) {
        const a = s.pts[i], b = s.pts[(i + 1) % s.pts.length];
        expect(Math.hypot(a[0] - b[0], a[1] - b[1]), `${map.id} vertex ${i}`).toBeGreaterThan(0.004);
      }
    }
  });
  it('spawns are in open air, inside the bounds', () => {
    for (const [x, y] of map.spawns) {
      for (const s of map.solids) expect(pointInPoly(x, y, s.pts)).toBe(false);
      expect(x).toBeGreaterThan(map.bounds.x0);
      expect(x).toBeLessThan(map.bounds.x1);
      expect(y).toBeLessThan(map.killY);
    }
  });
  it('cars land safely and survive the countdown', () => {
    const g = new Game({ cars: [CARS[0], CARS[1]], maps: [map], randomMaps: false, target: 3, roundTime: 60, seed: 5 });
    for (let i = 0; i < 170; i++) g.step();
    for (const c of g.cars) {
      expect(c.alive, `${map.id} p${c.player}`).toBe(true);
      expect(c.wheelsOnGround, `${map.id} p${c.player}`).toBeGreaterThan(0);
      expect(Math.abs(c.angle)).toBeLessThan(0.9);
    }
  });
  it('simulates a long brawl without NaNs', () => {
    const g = new Game({ cars: [CARS[2], CARS[3]], maps: [map], randomMaps: false, target: 99, roundTime: 20, seed: 9 });
    for (let i = 0; i < 60 * 40; i++) {
      g.inputs[0] = Math.floor(i / 97) % 3 === 0 ? -1 : 1;
      g.inputs[1] = Math.floor(i / 71) % 3 === 0 ? 1 : -1;
      g.step();
    }
    for (const c of g.cars) expect(Number.isFinite(c.position.x) && Number.isFinite(c.position.y)).toBe(true);
    expect(g.match.round).toBeGreaterThan(1);
  });
  it('generates terrain art', () => {
    const art = generateTerrain(map);
    let filled = 0;
    for (const v of art.grid.data) if (v) filled++;
    expect(filled).toBeGreaterThan(1000);
  });
});

it('has 6-8+ arenas with distinct themes', () => {
  expect(MAPS.length).toBeGreaterThanOrEqual(6);
  expect(new Set(MAPS.map((m) => m.theme)).size).toBe(MAPS.length);
});
