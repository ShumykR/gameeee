import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAPS, MAP_BY_ID } from '../src/maps/defs';
import { Bot, BotLevel } from '../src/ai/bot';

// Usage: L1=hard L2=easy ROUNDS=20 MAP=meadow npx tsx scripts/botmatch.ts
const l1 = (process.env.L1 ?? 'hard') as BotLevel, l2 = (process.env.L2 ?? 'easy') as BotLevel;
const rounds = Number(process.env.ROUNDS ?? 20);
const maps = process.env.MAP ? [MAP_BY_ID[process.env.MAP]] : MAPS;
const c1 = CAR_BY_ID[process.env.C1 ?? 'sparrow'], c2 = CAR_BY_ID[process.env.C2 ?? 'sparrow'];
const g = new Game({ cars: [c1, c2], maps, randomMaps: maps.length > 1, target: 999, roundTime: 45, seed: 42 });
g.controllers[0] = new Bot(l1, 1);
g.controllers[1] = new Bot(l2, 2);
if (process.env.OV1) Object.assign((g.controllers[0] as any).cfg, JSON.parse(process.env.OV1));
const res = { p1: 0, p2: 0, draw: 0 };
let steps = 0;
g.on((e) => { if (e.type === 'roundEnd') e.result === 'draw' ? res.draw++ : e.result === 0 ? res.p1++ : res.p2++; });
while (g.match.round <= rounds && steps < 60 * 60 * 60) { g.step(); steps++; }
console.log(`${l1}(${c1.id}) vs ${l2}(${c2.id}):`, res, 'avg round s', (steps / 60 / rounds).toFixed(1));
void CARS;
