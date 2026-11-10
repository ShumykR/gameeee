import { Game } from '../src/game/game';
import { CARS } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';

// Drive every car that has moving pieces (or the ids given) and report how the pieces behave.
// Usage: npx tsx scripts/linkcheck.ts [id,id…]
const ids = process.argv[2]?.split(',');
for (const car of CARS) {
  if (ids ? !ids.includes(car.id) : !car.links?.length) continue;
  const g = new Game({ cars: [car, CARS[0]], maps: [MAP_BY_ID[process.env.MAP ?? 'meadow']], randomMaps: false, target: 99, roundTime: 60, seed: 5 });
  const c = g.cars[0];
  const lo = c.linkJoints.map(() => 0), hi = c.linkJoints.map(() => 0);
  let x0 = 0, bad = '', top = 0, settled = 0;
  for (let i = 0; i < 60 * 9; i++) {
    g.inputs[0] = i < 180 ? 0 : i < 400 ? 1 : i < 470 ? -1 : 1;
    g.inputs[1] = 0;
    g.step();
    if (i === 175) { x0 = c.position.x; settled = Math.abs(c.angle); }
    c.linkJoints.forEach((j, k) => { const a = j.getJointAngle(); lo[k] = Math.min(lo[k], a); hi[k] = Math.max(hi[k], a); });
    top = Math.max(top, Math.abs(c.chassis.getLinearVelocity().x));
    for (const b of c.allBodies) if (!Number.isFinite(b.getPosition().x)) bad = 'NaN';
    if (!c.alive && !bad) bad = `died@${i}`;
  }
  console.log(car.id.padEnd(22), 'tilt', settled.toFixed(2), 'top', top.toFixed(1), '/', car.motor.speed, 'swing', lo.map((a, k) => `${(a * 57.3).toFixed(0)}..${(hi[k] * 57.3).toFixed(0)}`).join(' '), bad);
}
