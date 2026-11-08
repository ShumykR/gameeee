import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { CAVE_MAPS, cavern, sample } from '../src/maps/caves';
import { groundY } from '../src/maps/decor';
import { pointInPoly } from '../src/render/grid';
import type { Car } from '../src/cars/car';

const start = (map: string) => {
  const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.bulldog], maps: [MAP_BY_ID[map]], randomMaps: false, target: 9, roundTime: 60, seed: 3 });
  while (g.phase !== 'play') g.step();
  return g;
};
const put = (c: Car, x: number, y: number) => {
  const ox = x - c.position.x, oy = y - c.position.y;
  for (const b of c.allBodies) {
    const p = b.getPosition();
    b.setPosition(new Vec2(p.x + ox, p.y + oy));
    b.setLinearVelocity(new Vec2(0, 0));
    b.setAngularVelocity(0);
  }
};

describe('caverns', () => {
  it('ceiling and floor leave the cavity open and close the rock around it', () => {
    const [ceil, floor] = cavern({ x0: 0, y0: 0, x1: 20, y1: 20 }, sample(2, 18, () => 6), sample(2, 18, () => 14), 'cave');
    const inRock = (x: number, y: number) => pointInPoly(x, y, ceil.pts) || pointInPoly(x, y, floor.pts);
    expect(inRock(10, 10)).toBe(false);
    expect(inRock(10, 3)).toBe(true);
    expect(inRock(10, 17)).toBe(true);
    expect(inRock(1, 10)).toBe(true);
    expect(inRock(19, 10)).toBe(true);
  });
  it('decor in a cave stands on the floor, not on the ceiling', () => {
    const m = MAP_BY_ID.eight;
    const y = groundY(m, 22)!;
    expect(y).toBeGreaterThan(15);
    expect(y).toBeLessThan(m.killY);
  });
  it('every cave arena has room for two cars to drive', () => {
    for (const m of CAVE_MAPS) expect(m.spawns[1][0] - m.spawns[0][0], m.id).toBeGreaterThan(20);
  });
});

describe('energy fields and pendulums', () => {
  it('a lift field carries a car upward', () => {
    const g = start('donut');
    const f = g.arena.fields.find((x) => x.def.kind === 'lift')!;
    put(g.cars[0], f.def.x + f.def.w / 2, f.def.y + f.def.h - 2.3);
    const y0 = g.cars[0].position.y;
    for (let i = 0; i < 60; i++) g.step();
    expect(g.cars[0].position.y).toBeLessThan(y0 - 1.5);
  });
  it('the bunker laser switches on and off and only kills when on', () => {
    const g = start('bunker');
    const f = g.arena.fields.find((x) => x.def.kind === 'laser')!;
    const states = new Set<boolean>();
    for (let i = 0; i < 60 * 6; i++) { g.arena.step(1 / 60); states.add(f.on); }
    expect(states.has(true) && states.has(false)).toBe(true);
    // wait for it to be on, then drop a head into it
    while (!f.on) g.step();
    const deaths: number[] = [];
    g.on((e) => { if (e.type === 'death') deaths.push(e.player); });
    const c = g.cars[0];
    put(c, f.def.x + 0.1 - (c.def.head.x), 12);
    for (let i = 0; i < 20 && !deaths.length; i++) g.step();
    expect(deaths).toContain(0);
  });
  it('a pendulum saw swings on its chain', () => {
    const g = start('crypt');
    const s = g.arena.saws.find((x) => x.def.swing)!;
    const xs: number[] = [];
    for (let i = 0; i < 240; i++) {
      g.arena.step(1 / 60);
      g.world.step(1 / 60);
      const p = s.body.getPosition();
      xs.push(p.x);
      expect(Math.hypot(p.x - s.def.x, p.y - s.def.y)).toBeCloseTo(s.def.swing!.len, 0);
    }
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(8);
  });
});
