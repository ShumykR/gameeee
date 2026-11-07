import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';

function mkGame(mapIdx = 0, a = 0, b = 1) {
  return new Game({ cars: [CARS[a], CARS[b % CARS.length]], maps: [MAPS[mapIdx]], randomMaps: false, target: 5, roundTime: 60, seed: 1 });
}

describe('physics sandbox', () => {
  it('cars settle on the ground during countdown', () => {
    const g = mkGame();
    for (let i = 0; i < 180; i++) g.step();
    for (const c of g.cars) {
      expect(c.alive).toBe(true);
      expect(c.wheelsOnGround).toBeGreaterThan(0);
      expect(Math.abs(c.angle)).toBeLessThan(0.6);
      expect(c.speed).toBeLessThan(1.5);
    }
  });
  it('driving moves the car', () => {
    const g = mkGame();
    for (let i = 0; i < 180; i++) g.step();
    const x0 = g.cars[0].position.x;
    g.inputs[0] = 1;
    for (let i = 0; i < 45; i++) g.step();
    expect(g.cars[0].position.x - x0).toBeGreaterThan(2);
  });
});
