import { CARS } from '../src/cars/defs';
import { measure } from '../src/physics/probe';
const only = process.env.CAR;
console.log('car            mass   top   t90  wheelie flip  airFlip recover');
for (const def of CARS) {
  if (only && def.id !== only) continue;
  const h = measure(def);
  console.log(
    def.id.padEnd(14),
    h.mass.toFixed(1).padStart(5),
    h.top.toFixed(1).padStart(5),
    h.t90.toFixed(2).padStart(5),
    ((h.wheelie * 180) / Math.PI).toFixed(0).padStart(6) + '°',
    String(h.flipped).padStart(5),
    h.airFlip.toFixed(2).padStart(7),
    h.recover.toFixed(2).padStart(7),
  );
}
import { dropTest } from '../src/physics/probe';
console.log('\ndrop test (4.5m): minT maxT bottomed bounces');
for (const def of CARS) {
  if (only && def.id !== only) continue;
  const d = dropTest(def);
  console.log(def.id.padEnd(14), d.minT.toFixed(2), d.maxT.toFixed(2), d.bottomed, d.bounces, d.angle.toFixed(2));
}
