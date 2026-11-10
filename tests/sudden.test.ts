import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAPS, MAP_BY_ID } from '../src/maps/defs';
import { SUDDEN_INFO, suddenKindFor } from '../src/maps/sudden';
import type { SuddenDeathKind } from '../src/maps/types';

const KINDS = Object.keys(SUDDEN_INFO) as SuddenDeathKind[];

function run(kind: SuddenDeathKind, seconds: number) {
  const map = { ...MAP_BY_ID.meadow, suddenDeath: kind };
  const g = new Game({ cars: [CARS[0], CARS[1]], maps: [map], randomMaps: false, target: 9, roundTime: 1, seed: 11 });
  const seen = { blocks: 0, balls: 0, ghosts: 0, bombs: 0, blasts: 0, minWallGap: Infinity, gravity: 0, ended: false, lateLava: false };
  g.on((e) => {
    if (e.type === 'blast' && e.kind === 'bomb') seen.blasts++;
    if (e.type === 'roundEnd') seen.ended = true;
    if (e.type === 'suddenDeath' && e.late) seen.lateLava = true;
  });
  for (let i = 0; i < 60 * seconds && !seen.ended; i++) {
    g.step();
    const a = g.arena;
    seen.blocks = Math.max(seen.blocks, a.blocks.length);
    seen.balls = Math.max(seen.balls, a.balls.filter((b) => !b.home).length);
    seen.ghosts = Math.max(seen.ghosts, a.ghosts.length);
    seen.bombs = Math.max(seen.bombs, a.bombs.length);
    if (a.walls.length === 2) seen.minWallGap = Math.min(seen.minWallGap, a.walls[1].getPosition().x - a.walls[0].getPosition().x);
    seen.gravity = g.world.getGravity().y;
    for (const c of g.cars) expect(Number.isFinite(c.position.x)).toBe(true);
  }
  return { g, seen };
}

describe('sudden death variants', () => {
  it('every map resolves to a known variant, and there is real variety', () => {
    for (const m of MAPS) expect(SUDDEN_INFO[suddenKindFor(m)], m.id).toBeDefined();
    expect(new Set(MAPS.map(suddenKindFor)).size).toBeGreaterThanOrEqual(8);
  });
  it.each(KINDS)('%s does its thing', (kind) => {
    const { seen } = run(kind, 12);
    switch (kind) {
      case 'meteors': case 'blocks': expect(seen.blocks).toBeGreaterThan(3); break;
      case 'balls': case 'blizzard': expect(seen.balls).toBeGreaterThan(3); break;
      case 'ghosts': expect(seen.ghosts).toBeGreaterThan(0); break;
      case 'bombs': expect(seen.blasts).toBeGreaterThan(2); break;
      case 'walls': expect(seen.minWallGap).toBeLessThan(35); break;
      case 'lowgrav': expect(seen.gravity).toBeLessThan(10); break;
      default: break;
    }
  });
  it.each(KINDS)('%s always ends the round (lava backs it up)', (kind) => {
    const { seen } = run(kind, 75);
    expect(seen.ended).toBe(true);
  });
});

describe('rising sudden death', () => {
  it('is lava or water at random, and either ends the round', () => {
    const kinds = new Set<string>();
    for (let seed = 1; seed <= 8; seed++) {
      const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.sparrow], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 99, roundTime: 1, seed });
      let ended = false;
      g.on((e) => {
        if (e.type === 'suddenDeath') kinds.add(e.kind);
        if (e.type === 'roundEnd') ended = true;
      });
      for (let i = 0; i < 60 * 60 && !ended; i++) g.step();
      expect(ended).toBe(true);
    }
    expect(kinds).toEqual(new Set(['lava', 'flood']));
  }, 30000);
});
