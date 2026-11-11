// Wall riding: each car drives forward into the nearest wall on the cave arenas; how high up the wall does it get?
//   npx tsx scripts/wallride.ts [id,id,…]      prints the top height reached (m above its start) and total rotation
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
const ids = (process.argv[2] ?? 'sparrow,bulldog,zipper,longhorn,tank,monster-truck,american-car,motorbike,tanker-truck,pebble').split(',');
const maps = (process.env.MAPS ?? 'donut,bone,eight').split(',');
const rows: Record<string, unknown>[] = [];
for (const id of ids === undefined ? CARS.map((c) => c.id) : ids) {
  const row: Record<string, unknown> = { id };
  for (const m of maps) {
    const g: any = new Game({ cars: [CAR_BY_ID[id], CAR_BY_ID['sparrow']], maps: [{ ...MAP_BY_ID[m], spawns: [MAP_BY_ID[m].spawns[1], MAP_BY_ID[m].spawns[0]] }], randomMaps: false, target: 999, roundTime: 60, seed: 1 });
    for (let k = 0; k < 400 && g.phase !== 'play'; k++) g.step();
    const car = g.cars[0];
    const y0 = car.position.y;
    let top = 0, rot = 0, prev = car.angle, alive = true;
    g.controllers[0] = { decide: () => 1 };   // spawns are swapped: P1 starts on the right, facing the right wall
    for (let k = 0; k < 60 * 8; k++) {
      g.step();
      if (!car.alive) { alive = false; break; }
      top = Math.max(top, y0 - car.position.y);
      let da = car.angle - prev; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
      rot += da; prev = car.angle;
    }
    row[m] = `${top.toFixed(1)}m ${(rot * 180 / Math.PI).toFixed(0)}°${alive ? '' : ' †'}`;
  }
  rows.push(row);
}
console.table(rows);
