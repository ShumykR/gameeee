// Sample tournament: cars in IDS play every car in IDS + FOES, both sides. Prints win and draw rates.
import { Game } from '../src/game/game';
import { CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { Bot } from '../src/ai/bot';
const R = Number(process.env.R ?? 4);
const maps = (process.env.MAPS ?? 'meadow,desert,sky').split(',').map((m) => MAP_BY_ID[m]);
const ids = (process.env.IDS ?? '').split(',').filter(Boolean);
const foes = (process.env.FOES ?? '').split(',').filter(Boolean);
const all = [...ids, ...foes];
const st: Record<string, { w: number; l: number; d: number }> = {};
for (const id of all) st[id] = { w: 0, l: 0, d: 0 };
let seed = 1;
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < all.length; j++) {
  for (const [a, b] of [[all[i], all[j]], [all[j], all[i]]]) {
    const g = new Game({ cars: [CAR_BY_ID[a], CAR_BY_ID[b]], maps, randomMaps: true, target: 999, roundTime: 40, seed: seed++ });
    const b1 = new Bot('hard', seed * 3), b2 = new Bot('hard', seed * 7);
    (b1 as any).cfg = { ...(b1 as any).cfg, noise: 0.06 };
    (b2 as any).cfg = { ...(b2 as any).cfg, noise: 0.06 };
    g.controllers[0] = b1; g.controllers[1] = b2;
    g.on((e) => {
      if (e.type !== 'roundEnd') return;
      if (e.result === 'draw') { st[a].d++; st[b].d++; return; }
      st[e.result === 0 ? a : b].w++; st[e.result === 0 ? b : a].l++;
    });
    let k = 0;
    while (g.match.round <= R && k++ < 60 * 60 * 10) g.step();
  }
}
let cw = 0, cl = 0, cd = 0;
for (const id of all) {
  const s = st[id], n = s.w + s.l + s.d;
  if (ids.includes(id)) { cw += s.w; cl += s.l; cd += s.d; }
  console.log(id.padEnd(18), ids.includes(id) ? 'cab' : '   ', ((100 * s.w) / Math.max(1, s.w + s.l)).toFixed(0).padStart(3) + '%', 'draw', ((100 * s.d) / Math.max(1, n)).toFixed(0).padStart(3) + '%', n);
}
console.log('cabs overall', ((100 * cw) / (cw + cl)).toFixed(0) + '%', 'draws', ((100 * cd) / (cw + cl + cd)).toFixed(0) + '%');
