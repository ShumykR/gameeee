// Validate + measure every car (or the frames demo with FRAMES=1). Prints only problems unless ALL=1.
import { CARS } from '../src/cars/defs';
import { buildCar, type FrameId } from '../src/cars/factory';
import { validateCar, rawStats } from '../src/cars/stats';
import { measure, dropTest } from '../src/physics/probe';
import type { CarDef } from '../src/cars/types';

const frames: FrameId[] = ['sedan', 'coupe', 'sports', 'pickup', 'van', 'bus', 'truck', 'kart', 'formula', 'dragster', 'bike', 'trike', 'monster', 'tracked', 'digger', 'buggy', 'cart', 'carriage', 'creature', 'boat', 'sled', 'blob', 'rocket', 'saucer', 'hover', 'tractor', 'loco', 'robot', 'box'];
const list: CarDef[] = process.env.FRAMES
  ? frames.map((f) => buildCar({ id: `f-${f}`, name: f, cat: 'retro', blurb: '', frame: f, col: ['#e04040', '#ffd040'] }))
  : CARS.filter((c) => !process.env.CAT || c.category === process.env.CAT);
let bad = 0;
for (const def of list) {
  const errs = validateCar(def);
  const h = measure(def);
  const d = dropTest(def);
  const s = rawStats(def);
  const probs = [...errs];
  if (h.top <= 8.5 || h.top >= 21) probs.push(`top ${h.top.toFixed(1)}`);
  if (h.t90 >= 2.6) probs.push(`t90 ${h.t90.toFixed(2)}`);
  if (h.flipped) probs.push('flips on launch');
  if (h.wheelie <= 0.12) probs.push(`wheelie ${h.wheelie.toFixed(2)}`);
  if (h.airFlip >= 1.7) probs.push(`airFlip ${h.airFlip}`);
  if (h.recover >= 5) probs.push(`recover ${h.recover}`);
  if (d.bottomed) probs.push('bottoms out');
  if (Math.abs(d.angle) >= 0.5) probs.push(`drop angle ${d.angle.toFixed(2)}`);
  if (s.accel <= 9 || s.accel >= 30) probs.push(`accel ${s.accel.toFixed(1)}`);
  if (s.speed <= 11 || s.speed >= 21) probs.push(`speed ${s.speed}`);
  if (s.speed > 18 && s.weight >= 5) probs.push('fast+heavy');
  if (probs.length) bad++;
  if (probs.length || process.env.ALL) console.log(`${def.id.padEnd(22)} m=${s.weight.toFixed(1)} top=${h.top.toFixed(1)} ${probs.join(', ')}`);
}
console.log(`${list.length} cars, ${bad} with problems`);
