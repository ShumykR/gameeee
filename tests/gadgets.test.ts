import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import type { Car } from '../src/cars/car';

const start = (map: string, a = 'sparrow', b = 'bulldog') => {
  const g = new Game({ cars: [CAR_BY_ID[a], CAR_BY_ID[b]], maps: [MAP_BY_ID[map]], randomMaps: false, target: 9, roundTime: 60, seed: 3 });
  while (g.phase !== 'play') g.step();
  return g;
};
const put = (c: Car, x: number, y: number, vx = 0) => {
  const ox = x - c.position.x, oy = y - c.position.y;
  for (const b of c.allBodies) {
    const p = b.getPosition();
    b.setPosition(new Vec2(p.x + ox, p.y + oy));
    b.setLinearVelocity(new Vec2(vx, 0));
    b.setAngularVelocity(0);
  }
};

describe('arena gadgets are real', () => {
  it('rift portals teleport a car to the other side, keeping its speed', () => {
    const g = start('rift');
    const [pa, pb] = g.arena.portals;
    expect(pa && pb).toBeTruthy();
    const ev: string[] = [];
    g.on((e) => { if (e.type === 'portal') ev.push('portal'); });
    put(g.cars[0], pa.x + 2.5, pa.y + 0.8, -8);
    g.inputs[0] = -1;
    for (let i = 0; i < 60 && !ev.length; i++) g.step();
    expect(ev).toContain('portal');
    expect(Math.abs(g.cars[0].position.x - pb.x)).toBeLessThan(3);
    expect(g.cars[0].chassis.getLinearVelocity().x).toBeLessThan(-2);
  });
  it('a fast car goes all the way round the loop', () => {
    const g = start('toytrack');
    const L = g.arena.loop!;
    expect(L).toBeTruthy();
    const c = g.cars[0];
    put(c, L.x - 6, L.y + 3.2, 12);
    put(g.cars[1], 46, 12);
    let minY = Infinity, rode = false;
    g.inputs[0] = 1;
    for (let i = 0; i < 240; i++) {
      g.step();
      rode ||= g.arena.loopRiding(0);
      if (Math.abs(c.position.x - L.x) < 2) minY = Math.min(minY, c.position.y);
      // once out of the loop, lift off: at full throttle the car would ride on up the arena wall
      if (rode && c.position.x > L.x + 3.5) g.inputs[0] = 0;
    }
    expect(rode).toBe(true);
    expect(minY).toBeLessThan(L.y - 2); // went over the top
    expect(c.position.x).toBeGreaterThan(L.x + 3); // and came out the other side
    expect(c.alive).toBe(true);
  });
  it('a slow car just drives through the painted ring', () => {
    const g = start('toytrack');
    const L = g.arena.loop!;
    const c = g.cars[0];
    put(c, L.x - 6, L.y + 3.2, 2);
    put(g.cars[1], 46, 12);
    g.inputs[0] = 1;
    for (let i = 0; i < 300; i++) g.step();
    expect(c.position.x).toBeGreaterThan(L.x + 3);
  });
  it('the UFO beam lifts cars while it is on', () => {
    const g = start('ufo-farm');
    const bm = g.arena.beams[0];
    expect(bm).toBeTruthy();
    while (!g.arena.beamOn) g.step();
    while (g.arena.beamOn) g.step(); // wait for a fresh "on" cycle
    while (!g.arena.beamOn) g.step();
    put(g.cars[0], bm.x, bm.bottom - 1);
    const y0 = g.cars[0].position.y;
    for (let i = 0; i < 90; i++) g.step();
    expect(g.cars[0].position.y).toBeLessThan(y0 - 1.5);
  });
  it('props in the arena are pushable items', () => {
    expect(start('ufo-farm').items.some((i) => i.kind === 'cow' && i.owner === -1)).toBe(true);
    expect(start('motordrome').items.some((i) => i.kind === 'cone')).toBe(true);
    expect(start('toytrack').items.some((i) => i.kind === 'toyblock')).toBe(true);
  });
  it('a ball in the net is a goal that recharges the attacker', () => {
    const g = start('stadium');
    const goal = g.arena.goals.find((x) => x.side === 0)!;
    const ball = g.arena.balls[0];
    const goals: number[] = [];
    g.on((e) => { if (e.type === 'goal') goals.push(e.side); });
    g.cars[1].abilityCd = 3;
    ball.body.setPosition(new Vec2((goal.x0 + goal.x1) / 2, goal.bottom - 0.8));
    ball.body.setLinearVelocity(new Vec2(0, 0));
    for (let i = 0; i < 5; i++) g.step();
    expect(goals).toEqual([0]);
    expect(g.cars[1].abilityCd).toBe(0);
    for (let i = 0; i < 120; i++) g.step();
    expect(Math.abs(ball.body.getPosition().x - 26)).toBeLessThan(2); // back on the spot
  });
  it('beach umbrellas bounce cars up', () => {
    const g = start('beach');
    const pads: string[] = [];
    g.on((e) => { if (e.type === 'pad') pads.push('pad'); });
    put(g.cars[0], 16.4, 9);
    for (let i = 0; i < 80 && !pads.length; i++) g.step();
    expect(pads.length).toBeGreaterThan(0);
  });
});
