// Headless gameplay probe: node --experimental-strip-types is not needed; run via vitest-node (vite-node) style.
import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';

const a = Number(process.env.A ?? 0), b = Number(process.env.B ?? 1), m = Number(process.env.M ?? 0);
const g = new Game({ cars: [CARS[a], CARS[b]], maps: [MAPS[m]], randomMaps: false, target: 5, roundTime: 60, seed: 3 });
g.on((e) => { if (e.type !== 'impact' && e.type !== 'countdown') console.log((g.stepCount / 60).toFixed(2), JSON.stringify(e.type === 'roundStart' ? { type: e.type, round: e.round } : e)); });
const strat = process.env.S ?? 'ram';
for (let i = 0; i < 60 * Number(process.env.T ?? 40); i++) {
  if (strat === 'ram') {
    const t = i / 60;
    g.inputs[0] = (Math.floor(t / 2.5) % 3 === 2 ? -1 : 1);
    g.inputs[1] = (Math.floor(t / 1.7) % 4 === 3 ? 1 : -1);
  }
  g.step();
  if (i % 120 === 0) console.log('  t', (i / 60).toFixed(0), g.phase, g.cars.map((c) => `${c.position.x.toFixed(1)},${c.position.y.toFixed(1)} a${c.angle.toFixed(2)} g${c.wheelsOnGround} v${c.speed.toFixed(1)}`).join(' | '));
}
console.log('scores', g.match.scores, 'round', g.match.round);
