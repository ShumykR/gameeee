import type { CarMat, CarPoly, Pt } from './types';

/*
 * Drawing kit for car skins (car-local meters, nose toward +x, y down).
 * Everything here is render-only: skins may use concave shapes and many vertices.
 * At CAR_PPM = 18 one pixel is ~0.055 m, so lines thinner than 0.06 m vanish.
 */

type X = Partial<CarPoly>;
const r3 = (v: number) => +v.toFixed(3);
export const poly = (pts: Pt[], mat: CarMat = 'body', x: X = {}): CarPoly => ({ pts: pts.map(([a, b]) => [r3(a), r3(b)] as Pt), mat, ...x });
export const rect = (x0: number, y0: number, x1: number, y1: number, mat: CarMat = 'body', x: X = {}): CarPoly =>
  poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mat, x);

/** Ellipse with enough points to look round at sprite size. */
export function ell(cx: number, cy: number, rx: number, ry: number, mat: CarMat = 'body', x: X = {}, n = 20): CarPoly {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return poly(pts, mat, x);
}
export const circ = (cx: number, cy: number, r: number, mat: CarMat = 'body', x: X = {}) => ell(cx, cy, r, r, mat, x);

/** Chaikin corner cutting: rounds a closed outline. */
export function smooth(pts: Pt[], iters = 2, closed = true): Pt[] {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const q: Pt[] = [];
    const n = p.length;
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i], b = p[(i + 1) % n];
      if (!closed && i === 0) q.push(a);
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
      if (!closed && i === n - 2) q.push(b);
    }
    p = q;
  }
  return p;
}
/** A closed outline with rounded corners. */
export const blob = (pts: Pt[], mat: CarMat = 'body', x: X = {}, iters = 2) => poly(smooth(pts, iters), mat, x);

/** Rounded rectangle. */
export function rr(x0: number, y0: number, x1: number, y1: number, r: number, mat: CarMat = 'body', x: X = {}): CarPoly {
  r = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  const pts: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 3; i++) {
      const a = a0 + (i / 3) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x1 - r, y0 + r, -Math.PI / 2);
  corner(x1 - r, y1 - r, 0);
  corner(x0 + r, y1 - r, Math.PI / 2);
  corner(x0 + r, y0 + r, Math.PI);
  return poly(pts, mat, x);
}

/** Thick segment. */
export function seg(a: Pt, b: Pt, t: number, mat: CarMat = 'metal', x: X = {}): CarPoly {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (t / 2), ny = (dx / l) * (t / 2);
  return poly([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], mat, x);
}
/** Thick polyline with round joints (same material, so no seams show). */
export function path(pts: Pt[], t: number, mat: CarMat = 'metal', x: X = {}): CarPoly[] {
  const out: CarPoly[] = [];
  for (let i = 0; i + 1 < pts.length; i++) out.push(seg(pts[i], pts[i + 1], t, mat, x));
  for (let i = 1; i + 1 < pts.length; i++) out.push(ell(pts[i][0], pts[i][1], t / 2, t / 2, mat, x, 10));
  return out;
}
/** Points along a circular arc (angles in radians, y down). */
export function arcPts(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}
/** Band along an arc (fenders, sled curls, rainbows). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number, t: number, mat: CarMat = 'body', x: X = {}): CarPoly {
  const o = arcPts(cx, cy, r + t / 2, a0, a1, 12), i = arcPts(cx, cy, r - t / 2, a0, a1, 12).reverse();
  return poly([...o, ...i], mat, x);
}
/** Mudguard over a wheel. */
export const fender = (wx: number, wy: number, wr: number, t = 0.1, mat: CarMat = 'body') => arc(wx, wy, wr + 0.06 + t / 2, Math.PI * 1.08, Math.PI * 1.92, t, mat);

// ---------------------------------------------------------------- vehicle bits

/** Window pane: x0..x1 at the bottom, leaning in by `lf` at the front (x1) and `lb` at the back. */
export const pane = (x0: number, y0: number, x1: number, y1: number, lf = 0, lb = 0, mat: CarMat = 'glass'): CarPoly =>
  poly([[x0, y1], [x1, y1], [x1 - lf, y0], [x0 + lb, y0]], mat);
/** Row of square windows. */
export function windows(x0: number, x1: number, y0: number, y1: number, n: number, gap = 0.08, mat: CarMat = 'glass', round = 0.04): CarPoly[] {
  const w = (x1 - x0 - gap * (n - 1)) / n;
  const out: CarPoly[] = [];
  for (let i = 0; i < n; i++) out.push(rr(x0 + i * (w + gap), y0, x0 + i * (w + gap) + w, y1, round, mat));
  return out;
}
export const headlight = (x: number, y: number, s = 0.1): CarPoly => ell(x, y, s * 0.7, s, 'light', {}, 10);
export const taillight = (x: number, y: number, s = 0.1): CarPoly => rect(x, y - s, x + s * 0.8, y + s, 'red');
/** Chrome bumper bar. */
export const bumper = (x0: number, x1: number, y: number, h = 0.1, mat: CarMat = 'chrome') => rr(x0, y - h / 2, x1, y + h / 2, h / 2, mat);
/** Radiator grille at the nose. */
export function grille(x0: number, y0: number, x1: number, y1: number, n = 3): CarPoly[] {
  const out: CarPoly[] = [rect(x0, y0, x1, y1, 'chrome')];
  const step = (y1 - y0) / (n * 2 + 1);
  for (let i = 0; i < n; i++) out.push(rect(x0 + 0.03, y0 + step * (i * 2 + 1), x1 - 0.03, y0 + step * (i * 2 + 2), 'black', { flat: true }));
  return out;
}
/** Door panel with a handle. */
export const door = (x0: number, y0: number, x1: number, y1: number, mat: CarMat = 'body'): CarPoly[] => [
  rect(x0, y0, x1, y1, mat, { ring: true }),
  rect(x1 - 0.2, y0 + 0.08, x1 - 0.08, y0 + 0.13, 'chrome', { flat: true }),
];
/** Emergency light on the roof. */
export const beacon = (x: number, y: number, mat: CarMat = 'blue', w = 0.18): CarPoly[] => [
  rect(x - w * 0.7, y - 0.05, x + w * 0.7, y, 'dark'),
  blob([[x - w / 2, y - 0.04], [x - w / 2, y - 0.16], [x, y - 0.22], [x + w / 2, y - 0.16], [x + w / 2, y - 0.04]], mat, {}, 1),
];
/** Light bar with two colours. */
export const lightbar = (x0: number, x1: number, y: number, a: CarMat = 'red', b: CarMat = 'blue'): CarPoly[] => {
  const m = (x0 + x1) / 2;
  return [rect(x0, y - 0.06, x1, y, 'dark'), rr(x0 + 0.02, y - 0.17, m, y - 0.05, 0.04, a), rr(m, y - 0.17, x1 - 0.02, y - 0.05, 0.04, b)];
};
/** Ladder from a to b. */
export function ladder(a: Pt, b: Pt, w = 0.16, mat: CarMat = 'chrome', rungs = 0): CarPoly[] {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  const out: CarPoly[] = [];
  const n = rungs || Math.max(2, Math.round(l / 0.22));
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const px = a[0] + dx * k, py = a[1] + dy * k;
    out.push(seg([px + nx, py + ny], [px - nx, py - ny], 0.06, mat));
  }
  out.push(seg([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], 0.06, mat), seg([a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], 0.06, mat));
  return out;
}
/** Lattice girder (cranes, booms). */
export function truss(a: Pt, b: Pt, w = 0.2, mat: CarMat = 'yellow', n = 0): CarPoly[] {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  const nx = (-dy / l) * (w / 2), ny = (dx / l) * (w / 2);
  const cnt = n || Math.max(2, Math.round(l / 0.3));
  const out: CarPoly[] = [seg([a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], 0.07, mat), seg([a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], 0.07, mat)];
  for (let i = 0; i < cnt; i++) {
    const k0 = i / cnt, k1 = (i + 1) / cnt;
    const s = i % 2 ? 1 : -1;
    out.push(seg([a[0] + dx * k0 + nx * s, a[1] + dy * k0 + ny * s], [a[0] + dx * k1 - nx * s, a[1] + dy * k1 - ny * s], 0.06, mat));
  }
  return out;
}
/** Seat back behind the driver. */
export const seat = (x: number, y: number, h = 0.42, mat: CarMat = 'black'): CarPoly[] => [
  rr(x - 0.24, y - h, x - 0.08, y, 0.06, mat),
  rr(x - 0.24, y - 0.1, x + 0.2, y, 0.04, mat),
];
/** Steering wheel in front of the driver. */
export const wheel = (x: number, y: number): CarPoly[] => [seg([x, y], [x + 0.16, y - 0.24], 0.06, 'black'), seg([x + 0.08, y - 0.34], [x + 0.24, y - 0.14], 0.07, 'black')];
/** Handlebar for bikes. */
export const handlebar = (x: number, y: number, h = 0.4): CarPoly[] => [seg([x, y], [x - 0.08, y - h], 0.07, 'chrome'), seg([x - 0.08, y - h], [x - 0.26, y - h - 0.02], 0.07, 'black')];
/** Upright exhaust stack. */
export const stack = (x: number, y: number, h: number, w = 0.1, mat: CarMat = 'chrome'): CarPoly[] => [rect(x - w / 2, y - h, x + w / 2, y, mat), rect(x - w * 0.7, y - h, x + w * 0.7, y - h + 0.06, mat)];
/** Horizontal cylinder (tankers, boilers). */
export const tank = (x0: number, x1: number, cy: number, r: number, mat: CarMat = 'chrome'): CarPoly => rr(x0, cy - r, x1, cy + r, r, mat);
/** Simple stripes / decals. */
export const stripe = (x0: number, x1: number, y: number, h: number, mat: CarMat = 'accent', lean = 0): CarPoly => poly([[x0 + lean, y - h / 2], [x1 + lean, y - h / 2], [x1, y + h / 2], [x0, y + h / 2]], mat, { flat: true });
/** Cartoon eye looking forward. */
export const eyeball = (x: number, y: number, r = 0.12, iris: CarMat = 'black'): CarPoly[] => [ell(x, y, r, r * 1.1, 'white', {}, 12), ell(x + r * 0.35, y + r * 0.1, r * 0.48, r * 0.55, iris, {}, 10)];
/** Pointy spikes along a line, pointing along the normal (dir = 1 up, -1 down). */
export function spikesAlong(x0: number, x1: number, y: number, n: number, h: number, mat: CarMat = 'spike', dir = 1): CarPoly[] {
  const w = (x1 - x0) / n;
  const out: CarPoly[] = [];
  for (let i = 0; i < n; i++) out.push(poly([[x0 + i * w, y], [x0 + (i + 1) * w, y], [x0 + (i + 0.5) * w, y - h * dir]], mat));
  return out;
}
/** Teeth row. */
export const fangs = (x0: number, x1: number, y: number, n: number, h: number, up = false) => spikesAlong(x0, x1, y, n, h, 'white', up ? 1 : -1);
/** Five-point star. */
export function starShape(x: number, y: number, r: number, mat: CarMat = 'gold', x2: X = {}): CarPoly {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr2 = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr2, y + Math.sin(a) * rr2]);
  }
  return poly(pts, mat, x2);
}
/** Plus sign (ambulance, first aid). */
export const plus = (x: number, y: number, s: number, mat: CarMat = 'red'): CarPoly =>
  poly([[x - s * 0.17, y - s / 2], [x + s * 0.17, y - s / 2], [x + s * 0.17, y - s * 0.17], [x + s / 2, y - s * 0.17], [x + s / 2, y + s * 0.17], [x + s * 0.17, y + s * 0.17], [x + s * 0.17, y + s / 2], [x - s * 0.17, y + s / 2], [x - s * 0.17, y + s * 0.17], [x - s / 2, y + s * 0.17], [x - s / 2, y - s * 0.17], [x - s * 0.17, y - s * 0.17]], mat, { flat: true });
/** Checkered band. */
export function checkers(x0: number, y0: number, x1: number, y1: number, n: number, rows = 2, a: CarMat = 'white', b: CarMat = 'black'): CarPoly[] {
  const out: CarPoly[] = [];
  const w = (x1 - x0) / n, h = (y1 - y0) / rows;
  for (let i = 0; i < n; i++) for (let j = 0; j < rows; j++) out.push(rect(x0 + i * w, y0 + j * h, x0 + (i + 1) * w, y0 + (j + 1) * h, (i + j) % 2 ? a : b, { flat: true }));
  return out;
}
/** Flame decal licking back from x0 toward x1 (x1 < x0). */
export function flameDecal(x0: number, x1: number, y: number, h: number): CarPoly[] {
  const n = 4, w = (x0 - x1) / n;
  const out: CarPoly[] = [];
  for (let i = 0; i < n; i++) {
    const a = x0 - i * w * 0.7;
    out.push(poly([[a, y - h * 0.45], [a, y + h * 0.45], [a - w * 1.8, y + h * (i % 2 ? 0.15 : -0.2)]], i % 2 ? 'yellow' : 'orange', { flat: true }));
  }
  return out;
}
/** Spoked rim drawn as a disc (for carriage wheels drawn on the body, spare tyres). */
export const spare = (x: number, y: number, r: number): CarPoly[] => [circ(x, y, r, 'rubber'), circ(x, y, r * 0.55, 'chrome'), circ(x, y, r * 0.18, 'dark')];
/** Mirror an outline across the vertical axis x = cx. */
export const mirrorX = (pts: Pt[], cx = 0): Pt[] => pts.map(([x, y]) => [2 * cx - x, y] as Pt).reverse();
