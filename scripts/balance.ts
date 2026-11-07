// Round-robin bot tournament: every car vs every car, both sides, on symmetric maps.
import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot } from '../src/ai/bot';
const R = Number(process.env.R ?? 3);
const maps = (process.env.MAPS ?? 'meadow,sky,sawmill').split(',').map((m) => MAP_BY_ID[m]);
const n = CARS.length;
const wins = new Array(n).fill(0), games = new Array(n).fill(0);
const vs: number[][] = CARS.map(() => new Array(n).fill(0));
let seed = 1;
for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
  for (const [a, b] of [[i, j], [j, i]]) {
    const g = new Game({ cars: [CARS[a], CARS[b]], maps, randomMaps: true, target: 999, roundTime: 40, seed: seed++ });
    const b1 = new Bot('hard', seed * 3), b2 = new Bot('hard', seed * 7);
    (b1 as any).cfg = { ...(b1 as any).cfg, noise: 0.06 };
    (b2 as any).cfg = { ...(b2 as any).cfg, noise: 0.06 };
    g.controllers[0] = b1; g.controllers[1] = b2;
    g.on((e) => {
      if (e.type !== 'roundEnd' || e.result === 'draw') return;
      const w = e.result === 0 ? a : b, l = e.result === 0 ? b : a;
      wins[w]++; games[w]++; games[l]++; vs[w][l]++;
    });
    let k = 0;
    while (g.match.round <= R && k++ < 60 * 60 * 10) g.step();
  }
}
const rows = CARS.map((c, i) => ({ id: c.id, arch: c.archetype, wr: wins[i] / Math.max(1, games[i]), games: games[i] })).sort((x, y) => y.wr - x.wr);
for (const r of rows) console.log(r.id.padEnd(11), r.arch.padEnd(9), (r.wr * 100).toFixed(0).padStart(3) + '%', r.games);
