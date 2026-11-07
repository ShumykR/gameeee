// Evaluate a bot config against the 'normal' bot across several maps, both sides.
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot, BotLevel } from '../src/ai/bot';
const base = (process.env.BASE ?? 'normal') as BotLevel;
const lvl = (process.env.L ?? 'hard') as BotLevel;
const ov = JSON.parse(process.env.OV ?? '{}');
const maps = (process.env.MAPS ?? 'meadow,desert,sky,sawmill,foundry,moon').split(',');
let w = 0, l = 0;
for (const m of maps) for (const swap of [false, true]) {
  const g = new Game({ cars: [CAR_BY_ID.sparrow, CAR_BY_ID.sparrow], maps: [MAP_BY_ID[m]], randomMaps: false, target: 999, roundTime: 40, seed: swap ? 9 : 4 });
  const me = new Bot(lvl, swap ? 21 : 22); Object.assign((me as any).cfg = { ...(me as any).cfg }, ov);
  const other = new Bot(base, swap ? 23 : 24);
  g.controllers[swap ? 1 : 0] = me; g.controllers[swap ? 0 : 1] = other;
  g.on((e) => { if (e.type === 'roundEnd' && e.result !== 'draw') ((e.result === 0) !== swap ? w++ : l++); });
  let n = 0;
  while (g.match.round <= Number(process.env.R ?? 10) && n++ < 60 * 60 * 20) g.step();
}
console.log(`${lvl} ${JSON.stringify(ov)} vs ${base}: ${w}-${l} (${((100 * w) / (w + l)).toFixed(0)}%)`);
