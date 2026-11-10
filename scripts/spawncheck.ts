import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAPS } from '../src/maps/defs';
import { pointInPoly } from '../src/render/grid';
import type { Pt } from '../src/maps/types';

// Usage: MAPS=donut,bone npx tsx scripts/spawncheck.ts — spawn every car on every arena and report sunk wheels, slopes and countdown trouble.
const only = process.env.MAPS?.split(',');
const segDist = (px: number, py: number, a: Pt, b: Pt) => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
};
for (const map of MAPS) {
  if (only && !only.includes(map.id)) continue;
  const issues: Record<string, string[]> = {};
  const add = (k: string, id: string) => (issues[k] ??= []).push(id);
  for (const car of CARS) {
    const g = new Game({ cars: [car, car], maps: [map], randomMaps: false, target: 3, roundTime: 60, seed: 5 });
    for (const c of g.cars) {
      for (const w of c.wheels) {
        const p = w.getPosition(), r = (w.getFixtureList()!.getShape() as any).m_radius as number;
        for (const s of map.solids) {
          const inside = pointInPoly(p.x, p.y, s.pts);
          let d = Infinity;
          for (let i = 0; i < s.pts.length; i++) d = Math.min(d, segDist(p.x, p.y, s.pts[i], s.pts[(i + 1) % s.pts.length]));
          if (inside || d < r - 0.08) add(`sunk wheel p${c.player}`, `${car.id}(${(inside ? -d : r - d).toFixed(2)})`);
        }
      }
    }
    let maxTilt = [0, 0];
    for (let i = 0; i < 170; i++) {
      g.step();
      if (i > 100) g.cars.forEach((c, k) => (maxTilt[k] = Math.max(maxTilt[k], Math.abs(c.angle))));
    }
    const x0 = g.cars.map((c) => c.position.x);
    for (const c of g.cars) {
      if (!c.alive) add(`dead p${c.player}`, car.id);
      if (maxTilt[c.player] > 0.3) add(`tilted p${c.player}`, `${car.id}(${maxTilt[c.player].toFixed(2)})`);
    }
    for (let i = 0; i < 60; i++) g.step();
    g.cars.forEach((c, k) => { if (Math.abs(c.position.x - x0[k]) > 0.6) add(`rolls away p${k}`, `${car.id}(${(c.position.x - x0[k]).toFixed(1)})`); });
  }
  const keys = Object.keys(issues);
  console.log(`== ${map.id}: ${keys.length ? '' : 'ok'}`);
  for (const k of keys) console.log(`  ${k} [${issues[k].length}]: ${issues[k].slice(0, 12).join(' ')}${issues[k].length > 12 ? ' …' : ''}`);
}
