import type { CarMat, CarPoly, Pt } from './types';
import { O, P, R, T } from './factory';

/*
 * Small drawing kit for car details (car-local meters, nose toward +x, y down).
 * Everything here is render-only unless a caller passes { deco: false }.
 */

export { O, P, R, T };

/** Cartoon eye: white ball with a pupil looking forward. */
export const eye = (x: number, y: number, r = 0.12, iris: CarMat = 'black'): CarPoly[] => [
  O(x, y, r, r, 'white'),
  O(x + r * 0.35, y + r * 0.05, r * 0.5, r * 0.55, iris, {}, 6),
];

/** Angry slanted eye. */
export const angryEye = (x: number, y: number, r = 0.12, iris: CarMat = 'rocket'): CarPoly[] => [
  P([[x - r, y - r * 0.5], [x + r, y], [x + r * 0.8, y + r * 0.8], [x - r * 0.8, y + r * 0.8]], 'white'),
  O(x + r * 0.25, y + r * 0.35, r * 0.38, r * 0.38, iris, {}, 6),
];

/** Row of triangle teeth pointing down (top jaw) or up. */
export function teeth(x0: number, x1: number, y: number, n: number, h: number, up = false, mat: CarMat = 'white'): CarPoly[] {
  const out: CarPoly[] = [];
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w;
    out.push(T([a, y], [a + w, y], [a + w / 2, up ? y - h : y + h], mat));
  }
  return out;
}

/** Red-cross / plus sign. */
export const cross = (x: number, y: number, s: number, mat: CarMat = 'rocket'): CarPoly[] => [
  R(x - s * 0.18, y - s / 2, x + s * 0.18, y + s / 2, mat),
  R(x - s / 2, y - s * 0.18, x + s / 2, y + s * 0.18, mat),
];

/** Five-point star from triangles. */
export function star(x: number, y: number, r: number, mat: CarMat = 'gold'): CarPoly[] {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  const out: CarPoly[] = [O(x, y, r * 0.45, r * 0.45, mat, {}, 5, -Math.PI / 2)];
  for (let i = 0; i < 10; i += 2) out.push(T(pts[(i + 9) % 10], pts[i], pts[i + 1], mat));
  return out;
}

/** Flame decal licking back from x0 (front) toward x1 (back). */
export function flames(x0: number, x1: number, y: number, h: number): CarPoly[] {
  const out: CarPoly[] = [];
  const n = 4;
  const w = (x0 - x1) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 - i * w;
    out.push(P([[a, y - h * 0.4], [a, y + h * 0.4], [a - w * 1.6, y + h * (i % 2 ? 0.1 : -0.15)]], i % 2 ? 'scoop' : 'rocket'));
  }
  out.push(R(x0 - 0.02, y - h * 0.4, x0 + 0.12, y + h * 0.4, 'scoop'));
  return out;
}

/** Checkered strip. */
export function checker(x0: number, y0: number, x1: number, y1: number, n: number, a: CarMat = 'white', b: CarMat = 'black'): CarPoly[] {
  const out: CarPoly[] = [];
  const w = (x1 - x0) / n, h = (y1 - y0) / 2;
  for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) out.push(R(x0 + i * w, y0 + j * h, x0 + (i + 1) * w, y0 + (j + 1) * h, (i + j) % 2 ? a : b));
  return out;
}

/** Simple skull face. */
export const skullFace = (x: number, y: number, r: number): CarPoly[] => [
  O(x, y, r, r * 0.9, 'bone'),
  R(x - r * 0.55, y + r * 0.5, x + r * 0.55, y + r * 1.15, 'bone'),
  O(x - r * 0.4, y, r * 0.26, r * 0.3, 'black', {}, 6),
  O(x + r * 0.4, y, r * 0.26, r * 0.3, 'black', {}, 6),
  T([x - r * 0.1, y + r * 0.5], [x + r * 0.1, y + r * 0.5], [x, y + r * 0.25], 'black'),
  R(x - r * 0.3, y + r * 0.85, x - r * 0.18, y + r * 1.15, 'black'),
  R(x + r * 0.18, y + r * 0.85, x + r * 0.3, y + r * 1.15, 'black'),
];

/** Solid tailgate at the back of a bed so cargo does not slide out at once. */
export const tailgate = (x: number, y: number, h = 0.24, mat: CarMat = 'dark'): CarPoly => R(x, y - h, x + 0.08, y, mat, { deco: false });

/** Short horizontal pipe / bar. */
export const bar = (x0: number, y: number, x1: number, t = 0.06, mat: CarMat = 'metal'): CarPoly => R(Math.min(x0, x1), y - t / 2, Math.max(x0, x1), y + t / 2, mat);

/** Thick line segment as a quad. */
export function line(a: Pt, b: Pt, t: number, mat: CarMat = 'metal'): CarPoly {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (t / 2), ny = (dx / l) * (t / 2);
  return P([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], mat);
}

/** Wavy stripes (e.g. tiger / zebra) as a few slanted bars. */
export function slashes(x0: number, x1: number, y0: number, y1: number, n: number, mat: CarMat = 'black', lean = 0.15): CarPoly[] {
  const out: CarPoly[] = [];
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    const a = x0 + (i + 0.3) * w;
    out.push(P([[a, y0], [a + w * 0.3, y0], [a + w * 0.3 - lean, y1], [a - lean, y1]], mat));
  }
  return out;
}

/** Ellipse spots (cow, dalmatian, mushroom). */
export const spots = (pts: [number, number, number][], mat: CarMat = 'black'): CarPoly[] => pts.map(([x, y, r]) => O(x, y, r, r * 0.8, mat, {}, 7));
