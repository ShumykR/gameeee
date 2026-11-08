import type { CarDef, Pt } from './types';

export function polyArea(pts: Pt[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return Math.abs(a) / 2;
}

export function isConvex(pts: Pt[]): boolean {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length], [cx, cy] = pts[(i + 2) % pts.length];
    const cr = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
    if (Math.abs(cr) < 1e-9) continue;
    const s = Math.sign(cr);
    if (sign && s !== sign) return false;
    sign = s;
  }
  return true;
}

/** Approximate total mass (kg) from the definition, matching Planck's density model. */
export function estimateMass(def: CarDef): number {
  let m = 0;
  for (const p of def.body) if (!p.deco) m += polyArea(p.pts) * (p.density ?? def.density);
  for (const w of def.wheels) m += Math.PI * w.r * w.r * (w.density ?? 1.2);
  return m;
}

export interface CarStats {
  speed: number;
  accel: number;
  weight: number;
  grip: number;
  air: number;
}

export function rawStats(def: CarDef): CarStats {
  const mass = estimateMass(def);
  const driven = def.wheels.filter((w) => w.drive ?? true);
  const force = driven.reduce((s, w) => s + def.motor.torque / w.r, 0);
  return {
    speed: def.motor.speed + (def.boost ? def.boost.accel * 0.25 : 0),
    accel: Math.min(force / mass, def.tireFriction * 22),
    weight: mass,
    grip: def.tireFriction,
    air: def.air,
  };
}

/** Stats normalized to 1..5 against a list of cars (for menu bars). */
export function normalizedStats(def: CarDef, all: CarDef[]): CarStats {
  const raws = all.map(rawStats);
  const r = rawStats(def);
  const out = {} as CarStats;
  for (const k of Object.keys(r) as (keyof CarStats)[]) {
    const vals = raws.map((x) => x[k]);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    out[k] = hi - lo < 1e-9 ? 3 : 1 + ((r[k] - lo) / (hi - lo)) * 4;
  }
  return out;
}

/** Validate a definition; returns a list of problems (empty = ok). */
export function validateCar(def: CarDef): string[] {
  const errs: string[] = [];
  def.body.forEach((p, i) => {
    // Render-only details can be tiny or concave; physics polygons must be valid Box2D shapes.
    if (p.pts.length < 3 || p.pts.length > (p.deco ? 16 : 8)) errs.push(`poly ${i}: ${p.pts.length} vertices`);
    if (!p.deco && !isConvex(p.pts)) errs.push(`poly ${i}: not convex`);
    if (polyArea(p.pts) < (p.deco ? 1e-4 : 0.005)) errs.push(`poly ${i}: degenerate`);
  });
  if (def.wheels.length < 2) errs.push('needs at least 2 wheels');
  if (!def.wheels.some((w) => w.drive ?? true)) errs.push('no driven wheel');
  for (const w of def.wheels) if (w.r < 0.2 || w.r > 1) errs.push(`wheel radius ${w.r} out of range`);
  const { x, y, r } = def.head;
  if (r < 0.2 || r > 0.4) errs.push('head radius out of range');
  // Head center must not be buried inside the chassis.
  const inside = (pts: Pt[]) => {
    let ins = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
    }
    return ins;
  };
  if (def.body.some((p) => !p.deco && inside(p.pts))) errs.push('head center is inside the chassis');
  for (const w of def.wheels) if (Math.hypot(w.x - x, w.y - y) < w.r + r) errs.push('head overlaps a wheel');
  // Head must be reachable: something above it must be open (top of head above body top at that x, or exposed sideways)
  const minY = Math.min(...def.body.filter((p) => !p.deco).flatMap((p) => p.pts.map((q) => q[1])));
  if (y - r > minY + 0.9) errs.push('head is too deeply buried');
  if (!/^[a-z0-9-]+$/.test(def.id)) errs.push('bad id');
  return errs;
}
