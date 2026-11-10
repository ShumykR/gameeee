import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot, BotLevel } from '../src/ai/bot';

// A passive "human" (p0) against a bot (p1) on one map: how do the bot's deaths happen?
// Usage: MAP=bunker L=hard HUMAN=wait|creep npx tsx scripts/laserbot.ts
const map = MAP_BY_ID[process.env.MAP ?? 'bunker'];
const human = process.env.HUMAN ?? 'wait';
for (const lv of (process.env.L ?? 'easy,normal,hard').split(',') as BotLevel[]) {
  const car = CAR_BY_ID[process.env.C ?? 'sparrow'];
  const g = new Game({ cars: [car, car], maps: [map], randomMaps: false, target: 999, roundTime: 30, seed: 7 });
  g.controllers[1] = new Bot(lv, 3);
  const deaths: Record<string, number> = {};
  g.on((e) => { if (e.type === 'death') deaths[`p${e.player}:${e.cause}`] = (deaths[`p${e.player}:${e.cause}`] ?? 0) + 1; });
  let steps = 0;
  while (g.match.round <= 20 && steps < 60 * 60 * 40) {
    g.inputs[0] = human === 'creep' ? (Math.floor(steps / 90) % 2 ? 1 : -1) : 0;
    g.step(); steps++;
  }
  console.log(map.id, lv, human, deaths, 'score', g.match.score ?? '', 'rounds', g.match.round - 1);
}
