import { describe, it, expect } from 'vitest';
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot, BotLevel } from '../src/ai/bot';

function duel(l1: BotLevel, l2: BotLevel, rounds: number) {
  const res = { a: 0, b: 0 };
  for (const [m, swap] of [['sky', false], ['sky', true], ['desert', false], ['desert', true], ['foundry', false], ['foundry', true]] as const) {
    const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.sparrow], maps: [MAP_BY_ID[m]], randomMaps: false, target: 999, roundTime: 40, seed: swap ? 2 : 1 });
    g.controllers[0] = new Bot(swap ? l2 : l1, 3);
    g.controllers[1] = new Bot(swap ? l1 : l2, 4);
    g.on((e) => {
      if (e.type !== 'roundEnd' || e.result === 'draw') return;
      if ((e.result === 0) !== swap) res.a++;
      else res.b++;
    });
    let n = 0;
    while (g.match.round <= rounds && n++ < 60 * 60 * 30) g.step();
  }
  return res;
}

describe('bot', () => {
  it('hard beats easy most of the time', () => {
    const r = duel('hard', 'easy', 8);
    expect(r.a).toBeGreaterThan(r.b);
  }, 30000);
  it('a bot always returns a valid input', () => {
    const g = new Game({ cars: [CAR_BY_ID.comet, CAR_BY_ID.digger], maps: [MAP_BY_ID.foundry], randomMaps: false, target: 3, roundTime: 30, seed: 1 });
    const b = new Bot('normal', 1);
    for (let i = 0; i < 600; i++) {
      const d = b.decide(g, 0, 1 / 60);
      expect([-1, 0, 1]).toContain(d);
      g.step();
    }
  });
});

describe('bot and lasers', () => {
  it('does not drive into the bunker laser against a player who just waits', () => {
    for (const lv of ['easy', 'normal', 'hard'] as const) {
      const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.sparrow], maps: [MAP_BY_ID.bunker], randomMaps: false, target: 999, roundTime: 30, seed: 7 });
      g.controllers[1] = new Bot(lv, 3);
      let lasered = 0;
      g.on((e) => { if (e.type === 'death' && e.player === 1 && e.cause === 'hazard') lasered++; });
      let n = 0;
      while (g.match.round <= 6 && n++ < 60 * 60 * 10) g.step();
      expect(lasered, lv).toBeLessThanOrEqual(1);
    }
  }, 60000);
});
