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

import { CATEGORIES } from '../src/cars/catalog';
import { MAP_BY_ID } from '../src/maps/defs';
import { decorGrid, decorFilled, placedDecor } from '../src/maps/decor';

describe('themed arenas & decor', () => {
  it('every collection with an arena points at a real map', () => {
    for (const c of CATEGORIES) if (c.map) expect(MAP_BY_ID[c.map], c.id).toBeDefined();
  });
  it('every decor prop rasterizes and is planted on or above the ground', () => {
    for (const m of MAPS) {
      for (const d of placedDecor(m)) {
        expect(decorFilled(decorGrid(d.kind, d.seed)), `${m.id}:${d.kind}`).toBeGreaterThan(20);
        expect(d.y, `${m.id}:${d.kind}`).toBeLessThan(m.killY);
      }
    }
  });
  it('a ball knocked out of the stadium comes back', () => {
    const g = new Game({ cars: [CARS[0], CARS[1]], maps: [MAP_BY_ID.stadium], randomMaps: false, target: 3, roundTime: 60, seed: 5 });
    const ball = g.arena.balls[0];
    expect(ball).toBeDefined();
    ball.body.setPosition({ x: 26, y: 100 } as never);
    g.step();
    expect(ball.body.getPosition().y).toBeLessThan(MAP_BY_ID.stadium.killY);
  });
});
