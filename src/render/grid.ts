import type { RGB } from './color';

/** A pixel grid of palette indices; index 0 is transparent. */
export interface PixelGrid {
  w: number;
  h: number;
  data: Uint8Array;
  /** Pixel coords of the asset origin (e.g. car center) inside the grid. */
  ox: number;
  oy: number;
}

export function makeGrid(w: number, h: number, ox = 0, oy = 0): PixelGrid {
  return { w, h, data: new Uint8Array(w * h), ox, oy };
}

export function gget(g: PixelGrid, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return 0;
  return g.data[y * g.w + x];
}

export function gset(g: PixelGrid, x: number, y: number, v: number): void {
  if (x < 0 || y < 0 || x >= g.w || y >= g.h) return;
  g.data[y * g.w + x] = v;
}

/** Point in convex-or-concave polygon (even-odd). */
export function pointInPoly(px: number, py: number, pts: readonly (readonly [number, number])[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Scanline-fill a polygon (any shape) given in grid pixel coordinates.
 * Calls `plot` for every pixel whose center lies inside.
 */
export function fillPoly(
  pts: readonly (readonly [number, number])[],
  w: number,
  h: number,
  plot: (x: number, y: number) => void,
): void {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) {
    minY = Math.min(minY, p[1]);
    maxY = Math.max(maxY, p[1]);
  }
  const y0 = Math.max(0, Math.floor(minY));
  const y1 = Math.min(h - 1, Math.ceil(maxY));
  const xs: number[] = [];
  for (let y = y0; y <= y1; y++) {
    const cy = y + 0.5;
    xs.length = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > cy !== yj > cy) xs.push(xi + ((cy - yi) * (xj - xi)) / (yj - yi));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const xa = Math.max(0, Math.ceil(xs[k] - 0.5));
      const xb = Math.min(w - 1, Math.floor(xs[k + 1] - 0.5));
      for (let x = xa; x <= xb; x++) plot(x, y);
    }
  }
}

/** Convert a palette-indexed grid to RGBA bytes. */
export function gridToRGBA(g: PixelGrid, palette: (RGB | null)[]): Uint8ClampedArray {
  const out = new Uint8ClampedArray(g.w * g.h * 4);
  for (let i = 0; i < g.data.length; i++) {
    const c = palette[g.data[i]];
    if (!c) continue;
    out[i * 4] = c[0];
    out[i * 4 + 1] = c[1];
    out[i * 4 + 2] = c[2];
    out[i * 4 + 3] = 255;
  }
  return out;
}
