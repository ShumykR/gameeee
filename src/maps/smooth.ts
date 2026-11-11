import type { MapDef, Pt } from './types';

/*
 * Rounds the ground. Small sharp humps, lips and steps stop a car dead or flip it; here every
 * terrain outline is eased so the wheels can roll over it:
 *  - dense outlines (sampled hills, tracks) are low-pass filtered along their length;
 *  - outlines of a few long edges (slabs with ramps, steps) get their corners filleted.
 * Plain rectangles (girders, slabs) and anything outside the playfield are left alone.
 */

const SIGMA0 = 0.75;   // m, blur of dense outlines
const FILLET = 2.0;   // m, corner radius of sparse outlines
const DENSE = 14;     // outlines with at least this many corners in the playfield are "dense"

const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);

/** Gaussian blur of a closed outline along its own length; only points for which `free` holds move. */
function blur(src: Pt[], free: (p: Pt) => boolean, k: number): Pt[] {
  // long edges get extra points first, or their corners would only shift instead of rounding
  const pts: Pt[] = [];
  src.forEach((p, i) => {
    pts.push(p);
    const q = src[(i + 1) % src.length];
    const m = free(p) && free(q) ? Math.floor(dist(p, q) / 0.5) : 0;
    for (let j = 1; j <= m; j++) pts.push([p[0] + ((q[0] - p[0]) * j) / (m + 1), p[1] + ((q[1] - p[1]) * j) / (m + 1)]);
  });
  const n = pts.length;
  const SIGMA = SIGMA0 * k;
  const W = SIGMA * 2.5, step = 0.15;
  return pts.map((p, i) => {
    // a point next to a pinned one stays too: that is a seam with the neighbouring solid
    if (!free(p) || !free(pts[(i + 1) % n]) || !free(pts[(i + n - 1) % n])) return p;
    let sx = p[0], sy = p[1], sw = 1;
    for (const dir of [1, -1]) {
      let j = i, at = pts[i], walked = 0, next = step;
      while (walked < W) {
        const k = (j + dir + n) % n;
        const seg = dist(at, pts[k]);
        if (walked + seg < next) {
          walked += seg; at = pts[k]; j = k;
          // a pinned point ends the stretch: don't blur across the edge of the playfield
          if (!free(at)) { const w = Math.exp(-(walked * walked) / (2 * SIGMA * SIGMA)) * ((W - walked) / step); sx += at[0] * w; sy += at[1] * w; sw += w; break; }
          continue;
        }
        const t = (next - walked) / seg;
        at = [at[0] + (pts[k][0] - at[0]) * t, at[1] + (pts[k][1] - at[1]) * t];
        walked = next; next += step;
        const w = Math.exp(-(walked * walked) / (2 * SIGMA * SIGMA));
        sx += at[0] * w; sy += at[1] * w; sw += w;
      }
    }
    return [+(sx / sw).toFixed(3), +(sy / sw).toFixed(3)] as Pt;
  });
}

/** Replace each sharp corner with a short curve tangent to both edges. */
function fillet(pts: Pt[], free: (p: Pt) => boolean, k: number): Pt[] {
  const n = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    let turn = Math.atan2(c[1] - b[1], c[0] - b[0]) - Math.atan2(b[1] - a[1], b[0] - a[0]);
    while (turn > Math.PI) turn -= 2 * Math.PI;
    while (turn < -Math.PI) turn += 2 * Math.PI;
    const la = dist(a, b), lc = dist(b, c);
    if (!free(b) || !free(a) || !free(c) || Math.abs(turn) < 0.14 || Math.abs(turn) > 2.9) { out.push(b); continue; }
    const d = Math.min(FILLET * k * Math.tan(Math.abs(turn) / 2), la * 0.45, lc * 0.45);
    const p1: Pt = [b[0] + ((a[0] - b[0]) / la) * d, b[1] + ((a[1] - b[1]) / la) * d];
    const p2: Pt = [b[0] + ((c[0] - b[0]) / lc) * d, b[1] + ((c[1] - b[1]) / lc) * d];
    const m = Math.max(2, Math.ceil(Math.abs(turn) / 0.2));
    for (let k = 0; k <= m; k++) {
      const t = k / m, u = 1 - t;
      out.push([+(u * u * p1[0] + 2 * u * t * b[0] + t * t * p2[0]).toFixed(3), +(u * u * p1[1] + 2 * u * t * b[1] + t * t * p2[1]).toFixed(3)]);
    }
  }
  return out;
}

/** Beams, ovals and other floating convex shapes are already as round as they are meant to be. */
function convex(pts: Pt[]): boolean {
  let sign = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], c = pts[(i + 2) % pts.length];
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (Math.abs(z) < 1e-6) continue;
    if (sign && Math.sign(z) !== sign) return false;
    sign = Math.sign(z);
  }
  return true;
}

export function smoothMap(m: MapDef): MapDef {
  const b = m.bounds;
  const k = m.smooth ?? 1;
  if (k <= 0) return m;
  const free = (p: Pt) => p[0] > b.x0 - 0.5 && p[0] < b.x1 + 0.5 && p[1] > b.y0 - 0.5 && p[1] < b.y1 + 0.5;
  return {
    ...m,
    solids: m.solids.map((s) => {
      if (s.pts.length <= 4) return s;
      const inside = s.pts.filter(free).length;
      if (inside < 2 || convex(s.pts)) return s;
      return { ...s, pts: inside >= DENSE ? blur(s.pts, free, k) : fillet(s.pts, free, k) };
    }),
  };
}
