// Flat-ground reach of every shooter: at the barrel's own angle and the best the aim assist can do.
//   npx tsx scripts/shotrange.ts
import { CARS } from '../src/cars/defs';
import { PROJECTILES } from '../src/game/abilities';
const G = 22, A = 0.26;
const rows: Record<string, unknown>[] = [];
for (const d of CARS) {
  const a = d.ability; if (!a || a.kind !== 'shoot' || !a.projectile) continue;
  const pr = PROJECTILES[a.projectile];
  const lift = a.aim ?? (pr.flight === 'flat' || pr.flight === 'skid' ? 0 : pr.flight === 'lob' ? 0.6 : 0.12);
  const ground = Math.max(...d.wheels.map((w) => w.y + w.r));
  const h = ground - (a.muzzle?.length ? a.muzzle[0][1] : Math.min(-0.2, d.head.y * 0.6));
  const reach = (ang: number) => {
    const g = G * pr.gravity, vx = pr.speed * Math.cos(ang), vy = pr.speed * Math.sin(ang);
    let t = pr.life;
    if (g > 0) t = Math.min(t, (vy + Math.sqrt(vy * vy + 2 * g * h)) / g);
    return vx * t;
  };
  let best = 0;
  for (let i = 0; i <= 20; i++) best = Math.max(best, reach(Math.min(lift - A, 0.03) + (i / 20) * (lift + A - Math.min(lift - A, 0.03))));
  rows.push({ id: d.id, proj: a.projectile, aim: Math.round((lift * 180) / Math.PI), v: pr.speed, grav: pr.gravity, barrel: +reach(lift).toFixed(1), assisted: +best.toFixed(1) });
}
rows.sort((x, y) => (x.assisted as number) - (y.assisted as number));
console.table(rows);
