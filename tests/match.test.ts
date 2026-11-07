import { describe, it, expect } from 'vitest';
import { MatchState, DeathResolver } from '../src/game/match';
import { FixedStepper } from '../src/physics/stepper';

describe('MatchState', () => {
  it('awards points and ends at target', () => {
    const m = new MatchState({ target: 3, roundTime: 60 });
    expect(m.record(0)).toBe(false);
    expect(m.record('draw')).toBe(false);
    expect(m.record(1)).toBe(false);
    expect(m.record(0)).toBe(false);
    expect(m.scores).toEqual([2, 1]);
    expect(m.record(0)).toBe(true);
    expect(m.winner).toBe(0);
    expect(m.round).toBe(6);
  });
  it('draw gives nobody a point', () => {
    const m = new MatchState({ target: 1, roundTime: 60 });
    m.record('draw');
    expect(m.scores).toEqual([0, 0]);
    expect(m.over).toBe(false);
  });
});

describe('DeathResolver', () => {
  it('first death gives the point to the other player', () => {
    const r = new DeathResolver(4);
    r.report({ player: 0, step: 10 });
    expect(r.resolve(11)).toBe(null);
    expect(r.resolve(14)).toBe(1);
  });
  it('simultaneous deaths are a draw', () => {
    const r = new DeathResolver(4);
    r.report({ player: 1, step: 10 });
    r.report({ player: 0, step: 12 });
    expect(r.resolve(12)).toBe('draw');
  });
  it('late second death does not cancel', () => {
    const r = new DeathResolver(4);
    r.report({ player: 1, step: 10 });
    r.report({ player: 0, step: 20 });
    expect(r.resolve(20)).toBe(0);
  });
});

describe('FixedStepper', () => {
  it('steps at a fixed rate independent of frame time', () => {
    const s = new FixedStepper(1 / 60, 10);
    let n = 0;
    for (let i = 0; i < 120; i++) s.advance(1 / 120, () => n++);
    expect(n).toBe(60);
    n = 0;
    for (let i = 0; i < 30; i++) s.advance(1 / 30, () => n++);
    expect(n).toBeGreaterThanOrEqual(59);
    expect(n).toBeLessThanOrEqual(61);
  });
  it('time scale slows the simulation', () => {
    const s = new FixedStepper(1 / 60, 10);
    s.timeScale = 0.25;
    let n = 0;
    for (let i = 0; i < 60; i++) s.advance(1 / 60, () => n++);
    expect(n).toBe(15);
  });
  it('clamps long frames', () => {
    const s = new FixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(10, () => n++);
    expect(n).toBe(5);
  });
});

import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';

describe('random cars each round', () => {
  it('picks new cars from the pool every round', () => {
    const g = new Game({ cars: [CARS[0], CARS[1]], maps: [MAPS[0]], randomMaps: false, randomCars: true, carPool: CARS, target: 99, roundTime: 60, seed: 3 });
    const seen = new Set<string>();
    for (let r = 0; r < 8; r++) {
      seen.add(g.cars[0].def.id + '/' + g.cars[1].def.id);
      expect(g.cars[0].def.id).not.toBe(g.cars[1].def.id);
      g.kill(1, 'fall');
      let started = false;
      g.on((e) => { if (e.type === 'roundStart') started = true; });
      while (!started) g.step();
    }
    expect(seen.size).toBeGreaterThan(4);
  });
  it('keeps the chosen cars when off', () => {
    const g = new Game({ cars: [CARS[2], CARS[3]], maps: [MAPS[0]], randomMaps: false, target: 99, roundTime: 60, seed: 3 });
    g.kill(1, 'fall');
    let started = false;
    g.on((e) => { if (e.type === 'roundStart') started = true; });
    while (!started) g.step();
    expect(g.cars.map((c) => c.def.id)).toEqual([CARS[2].id, CARS[3].id]);
  });
  it('sudden-death lava does not carry over to the next round', () => {
    const g = new Game({ cars: [CARS[0], CARS[1]], maps: [MAPS[0]], randomMaps: false, target: 99, roundTime: 1, seed: 3 });
    while (!g.arena.riseBody) g.step();
    g.kill(0, 'fall');
    let started = false;
    g.on((e) => { if (e.type === 'roundStart') started = true; });
    while (!started) g.step();
    expect(g.arena.riseBody).toBe(null);
    expect(g.suddenDeath).toBe(false);
  });
});
