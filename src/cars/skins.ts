import type { Frame } from './factory';
import type { CarMat, CarPoly, Pt, WheelDef } from './types';
import { arc, blob, bumper, circ, door, ell, fender, headlight, pane, path, poly, rect, rr, seat, seg, stack, taillight, tank, windows } from './draw';

/*
 * Skin templates: a good-looking base body per vehicle type, built around the
 * frame's anchors (so length/height options still line up with the physics).
 * Cars add their signature details on top.
 */

const lastW = (f: Frame) => f.wheels.reduce((a, w) => (w.x > a.x ? w : a), f.wheels[0]);
const firstW = (f: Frame) => f.wheels.reduce((a, w) => (w.x < a.x ? w : a), f.wheels[0]);

// ---------------------------------------------------------------- cars

export interface SedanOpts {
  mat?: CarMat;
  /** Greenhouse style. */
  roof?: 'sedan' | 'coupe' | 'hatch' | 'wagon' | 'open' | 'none';
  /** Roof height override (y of the roof line). */
  top?: number;
  /** Roof span override. */
  rx0?: number;
  rx1?: number;
  doors?: number;
  bumper?: CarMat | null;
  glass?: CarMat;
  /** Extra hood rise / tail fin. */
  fins?: boolean;
  /** Belt line override. */
  belt?: number;
}

/** Saloon / coupe / hatch / wagon body with glass, doors, lights and bumpers. */
export function sedan(f: Frame, o: SedanOpts = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x;
  const belt = o.belt ?? f.nose.y0, bot = f.nose.y1;
  const style = o.roof ?? 'sedan';
  const top = o.top ?? f.roof.y;
  let rb = o.rx0 ?? f.roof.x0, rf = o.rx1 ?? f.roof.x1;
  if (style === 'coupe') { rb += 0.15; }
  let wb = rb - 0.2;
  const wf = Math.min(x1 - 0.45, rf + 0.42);
  if (style === 'hatch') { wb = x0 + 0.15; rb = Math.max(rb, x0 + 0.45); }
  if (style === 'wagon') { rb = x0 + 0.12; wb = x0 + 0.06; }
  const out: CarPoly[] = [];
  const lowerOnly = style === 'open' || style === 'none';
  const pts: Pt[] = [[x0 + 0.05, bot], [x0 - 0.02, belt + 0.12], [x0 + 0.04, belt - (o.fins ? 0.1 : 0)], [x0 + 0.3, belt - 0.02]];
  if (!lowerOnly) pts.push([wb, belt - 0.02], [rb, top], [rf, top], [wf, belt - 0.04]);
  pts.push([x1 - 0.3, belt + 0.0], [x1 - 0.02, belt + 0.12], [x1, bot - 0.06], [x1 - 0.06, bot]);
  out.push(blob(pts, m, {}, 1));
  if (!lowerOnly) {
    const g = o.glass ?? 'glass';
    const yb = belt - 0.06, yt = top + 0.07;
    const mid = (rb + rf) / 2 + 0.05;
    out.push(poly([[wb + 0.14, yb], [rb + 0.05, yt], [mid - 0.04, yt], [mid - 0.04, yb]], g));
    out.push(poly([[mid + 0.04, yb], [mid + 0.04, yt], [rf - 0.02, yt], [wf - 0.12, yb]], g));
  } else if (style === 'open') {
    out.push(pane(rf - 0.05, top, rf + 0.25, belt, 0.18, 0, o.glass ?? 'glass'));
  }
  // doors
  const nd = o.doors ?? (style === 'coupe' || lowerOnly ? 1 : 2);
  const dx0 = lowerOnly ? (x0 + x1) / 2 - 0.5 : wb + 0.1, dx1 = lowerOnly ? (x0 + x1) / 2 + 0.4 : wf - 0.1;
  const dw = (dx1 - dx0) / nd;
  for (let i = 0; i < nd; i++) out.push(...door(dx0 + i * dw + 0.02, belt + 0.02, dx0 + (i + 1) * dw - 0.02, bot - 0.08, m));
  out.push(headlight(x1 - 0.1, belt + 0.12, 0.09), taillight(x0 + 0.0, belt + 0.12, 0.08));
  if (o.bumper !== null) {
    const bm = o.bumper ?? 'chrome';
    out.push(bumper(x1 - 0.22, x1 + 0.05, bot - 0.05, 0.11, bm), bumper(x0 - 0.05, x0 + 0.22, bot - 0.05, 0.11, bm));
  }
  return out;
}

export interface BoxOpts {
  mat?: CarMat;
  x0?: number;
  x1?: number;
  top?: number;
  bot?: number;
  /** How far the windscreen slopes back. */
  slope?: number;
  /** Height of the sloped part. */
  slopeH?: number;
  /** Side windows: count (0 = none). */
  win?: number;
  winY?: [number, number];
  /** Windows span. */
  winX?: [number, number];
  /** Front window (windscreen). */
  screen?: boolean;
  doors?: number[];
  bumper?: CarMat | null;
  lights?: boolean;
  round?: number;
}

/** Van / bus / box body. */
export function boxy(f: Frame, o: BoxOpts = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = o.x0 ?? f.tail.x, x1 = o.x1 ?? f.nose.x;
  const top = o.top ?? f.roof.y, bot = o.bot ?? f.nose.y1;
  const sl = o.slope ?? 0.4, sh = o.slopeH ?? 0.5;
  const rd = o.round ?? 0.1;
  const out: CarPoly[] = [];
  out.push(blob([[x0, bot], [x0, top + rd], [x0 + rd, top], [x1 - sl, top], [x1 - rd * 0.3, top + sh], [x1, top + sh + rd], [x1, bot]], m, {}, 1));
  if (o.screen !== false) out.push(poly([[x1 - sl + 0.06, top + 0.07], [x1 - 0.05, top + sh], [x1 - 0.06, top + sh + 0.02], [x1 - sl - 0.02, top + sh + 0.02], [x1 - sl - 0.02, top + 0.07]], 'glass'));
  const n = o.win ?? 0;
  if (n) {
    const [wy0, wy1] = o.winY ?? [top + 0.1, top + Math.min(0.5, sh)];
    const [wx0, wx1] = o.winX ?? [x0 + 0.15, x1 - sl - 0.12];
    out.push(...windows(wx0, wx1, wy0, wy1, n, 0.08));
  }
  for (const dx of o.doors ?? []) out.push(rect(dx, top + 0.08, dx + 0.42, bot - 0.08, m, { ring: true }), rect(dx + 0.06, (top + bot) / 2, dx + 0.16, (top + bot) / 2 + 0.05, 'chrome', { flat: true }));
  if (o.lights !== false) out.push(headlight(x1 - 0.06, bot - 0.2, 0.09), taillight(x0, bot - 0.22, 0.09));
  if (o.bumper !== null) {
    const bm = o.bumper ?? 'chrome';
    out.push(bumper(x1 - 0.2, x1 + 0.06, bot - 0.04, 0.12, bm), bumper(x0 - 0.06, x0 + 0.2, bot - 0.04, 0.12, bm));
  }
  return out;
}

/** Lorry cab at the front of a truck frame + chassis rails under the bed. */
export function truckCab(f: Frame, o: { mat?: CarMat; x0?: number; top?: number; grille?: boolean; rails?: CarMat | null; stack?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x1 = f.nose.x, bot = f.nose.y1, top = o.top ?? f.roof.y;
  const cx0 = o.x0 ?? f.roof.x0;
  const out: CarPoly[] = [];
  if (o.rails !== null) out.push(rr(f.tail.x, bot - 0.26, cx0 + 0.1, bot - 0.06, 0.04, o.rails ?? 'dark'));
  out.push(blob([[cx0, bot], [cx0, top + 0.06], [cx0 + 0.08, top], [x1 - 0.3, top], [x1 - 0.12, top + 0.38], [x1, top + 0.5], [x1, bot]], m, {}, 1));
  out.push(poly([[cx0 + 0.3, top + 0.08], [x1 - 0.32, top + 0.08], [x1 - 0.17, top + 0.4], [cx0 + 0.3, top + 0.4]], 'glass'));
  out.push(rect(cx0 + 0.1, top + 0.08, cx0 + 0.26, top + 0.4, 'dark', { flat: true }));
  out.push(rect(cx0 + 0.08, top + 0.5, x1 - 0.32, bot - 0.1, m, { ring: true }));
  if (o.grille !== false) {
    out.push(rect(x1 - 0.1, top + 0.55, x1 + 0.02, bot - 0.12, 'chrome'));
    for (let y = top + 0.6; y < bot - 0.16; y += 0.1) out.push(rect(x1 - 0.08, y, x1, y + 0.04, 'black', { flat: true }));
  }
  out.push(headlight(x1 - 0.04, bot - 0.2, 0.08), bumper(x1 - 0.25, x1 + 0.07, bot - 0.03, 0.12, 'chrome'));
  if (o.stack) out.push(...stack(cx0 - 0.04, top + 0.5, 0.75, 0.09));
  return out;
}

/** Pickup: cab + open bed. */
export function pickup(f: Frame, o: { mat?: CarMat; open?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x, belt = f.nose.y0, bot = f.nose.y1, top = f.roof.y;
  const out: CarPoly[] = [];
  const rb = f.roof.x0, rf = f.roof.x1;
  const pts: Pt[] = [[x0, bot], [x0, belt - 0.02], [rb - 0.08, belt - 0.02]];
  if (!o.open) pts.push([rb - 0.06, top + 0.04], [rb + 0.04, top], [rf, top], [rf + 0.32, belt - 0.04]);
  pts.push([x1 - 0.25, belt], [x1, belt + 0.12], [x1, bot]);
  out.push(blob(pts, m, {}, 1));
  if (!o.open) out.push(poly([[rb + 0.06, belt - 0.06], [rb + 0.06, top + 0.07], [rf - 0.02, top + 0.07], [rf + 0.2, belt - 0.06]], 'glass'));
  out.push(rect(x0 + 0.05, belt - 0.02, rb - 0.14, belt + 0.06, 'dark', { flat: true }));
  out.push(...door(rb - 0.02, belt + 0.02, rf + 0.3, bot - 0.1, m));
  out.push(headlight(x1 - 0.08, belt + 0.14, 0.09), taillight(x0, belt + 0.14, 0.08));
  out.push(bumper(x1 - 0.22, x1 + 0.06, bot - 0.04, 0.13), bumper(x0 - 0.06, x0 + 0.2, bot - 0.04, 0.13));
  return out;
}

// ---------------------------------------------------------------- off-road & heavy

/** Raised monster-truck chassis: frame rails, shocks to the axles. */
export function monsterChassis(f: Frame, mat: CarMat = 'black'): CarPoly[] {
  const out: CarPoly[] = [];
  const y = f.nose.y1;
  out.push(rr(firstW(f).x - 0.2, y - 0.06, lastW(f).x + 0.2, y + 0.12, 0.04, mat));
  for (const w of f.wheels) {
    out.push(seg([w.x, w.y], [w.x - 0.15, y - 0.2], 0.13, 'chrome'), seg([w.x, w.y], [w.x - 0.15, y - 0.2], 0.06, 'red'));
    out.push(seg([w.x, w.y], [w.x + 0.15, y - 0.2], 0.13, 'chrome'));
    out.push(rect(w.x - 0.06, w.y - 0.06, w.x + 0.06, w.y + 0.06, 'dark'));
  }
  out.push(seg([firstW(f).x, firstW(f).y], [lastW(f).x, lastW(f).y], 0.08, 'grey'));
  return out;
}

/** Tank / bulldozer track loop around all wheels (drawn behind the road wheels). */
export function tracks(f: Frame, mat: CarMat = 'rubber', grow = 0.08): CarPoly[] {
  const a = firstW(f), b = lastW(f);
  const r = a.r + grow;
  const out: CarPoly[] = [rr(a.x - r, a.y - r, b.x + r, a.y + r, r, mat)];
  // tread lugs on the top run
  for (let x = a.x; x < b.x; x += 0.24) out.push(rect(x - 0.04, a.y - r - 0.04, x + 0.04, a.y - r + 0.03, mat));
  out.push(rr(a.x - r + 0.08, a.y - r + 0.06, b.x + r - 0.08, a.y + r - 0.06, r - 0.08, 'dark'));
  return out;
}

/** Bulldozer / tank hull sitting on tracks. */
export function hull(f: Frame, o: { mat?: CarMat; top?: number; nose?: number } = {}): CarPoly[] {
  const a = firstW(f), b = lastW(f);
  const y = a.y - a.r - 0.1;
  const top = o.top ?? y - 0.4;
  return [blob([[a.x - a.r - 0.2, y + 0.05], [a.x - a.r - 0.1, top], [b.x + a.r - 0.3, top], [b.x + a.r + (o.nose ?? 0.25), y - 0.05], [b.x + a.r, y + 0.08]], o.mat ?? 'body', {}, 1)];
}

// ---------------------------------------------------------------- open wheelers

/** Formula racer: needle nose, sidepod, cockpit, front & rear wings. */
export function formula(f: Frame, o: { mat?: CarMat; wing?: CarMat; num?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body', wg = o.wing ?? 'accent';
  const x0 = f.tail.x, x1 = f.nose.x;
  const hx = f.head.x;
  const out: CarPoly[] = [];
  // rear wing on struts
  out.push(seg([x0 + 0.3, -0.05], [x0 + 0.25, -0.55], 0.08, 'dark'));
  out.push(rr(x0 - 0.05, -0.68, x0 + 0.55, -0.5, 0.04, wg));
  // body: engine cover rising behind the head, long nose
  out.push(blob([[x0 + 0.1, 0.18], [x0 + 0.1, -0.06], [hx - 0.55, -0.12], [hx - 0.3, -0.38], [hx - 0.05, -0.2], [hx + 0.55, -0.16], [x1 - 0.2, -0.02], [x1, 0.06], [x1 - 0.05, 0.12], [hx + 0.4, 0.2]], m, {}, 1));
  out.push(blob([[hx - 0.6, 0.18], [hx - 0.55, -0.02], [hx + 0.45, -0.04], [hx + 0.55, 0.18]], m, {}, 1));
  out.push(rect(hx - 0.5, -0.05, hx + 0.4, 0.0, 'dark', { flat: true }));
  // intake above the helmet's back and cockpit rim
  out.push(rr(hx - 0.42, -0.42, hx - 0.18, -0.26, 0.05, 'dark'));
  out.push(pane(hx + 0.15, -0.36, hx + 0.38, -0.14, 0.12, 0));
  // front wing
  out.push(rr(x1 - 0.5, 0.12, x1 + 0.08, 0.2, 0.03, wg));
  out.push(rect(x1 - 0.06, 0.04, x1 + 0.06, 0.2, wg));
  if (o.num) out.push(circ(hx + 0.85, 0.02, 0.1, 'white'));
  return out;
}

/** Go-kart: low tray, bumper, steering column, seat. */
export function kart(f: Frame, o: { mat?: CarMat } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x;
  const hx = f.head.x;
  return [
    rr(x0 - 0.05, 0.08, x1, 0.18, 0.04, 'chrome'),
    blob([[x0 + 0.1, 0.1], [x0 + 0.15, -0.08], [x1 - 0.35, -0.02], [x1, 0.02], [x1 + 0.05, 0.12], [x0 + 0.1, 0.16]], m, {}, 1),
    rr(x1 - 0.2, -0.12, x1 + 0.1, 0.18, 0.06, 'accent'),
    ...seat(hx - 0.1, -0.06, 0.46),
    seg([hx + 0.55, -0.06], [hx + 0.32, -0.36], 0.06, 'black'),
    seg([hx + 0.22, -0.42], [hx + 0.4, -0.3], 0.07, 'black'),
    ...stack(x0 + 0.15, -0.06, 0.25, 0.08),
  ];
}

/** Motorbike: tank, seat, engine, forks, fenders, exhaust. */
export function bike(f: Frame, o: { mat?: CarMat; style?: 'road' | 'chopper' | 'dirt' | 'sport' | 'scooter'; fairing?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const st = o.style ?? 'road';
  const rw = firstW(f), fw = lastW(f);
  const out: CarPoly[] = [];
  const hx = f.head.x;
  // swing arm and frame
  out.push(seg([rw.x, rw.y], [hx + 0.15, 0.1], 0.09, 'dark'));
  out.push(seg([hx - 0.2, -0.14], [hx + 0.45, 0.18], 0.08, 'dark'));
  // engine
  out.push(rr(hx + 0.05, -0.02, hx + 0.55, 0.3, 0.06, 'grey'), rect(hx + 0.12, 0.04, hx + 0.48, 0.08, 'dark', { flat: true }), rect(hx + 0.12, 0.14, hx + 0.48, 0.18, 'dark', { flat: true }));
  // exhaust
  out.push(...path([[hx + 0.2, 0.28], [hx - 0.1, 0.32], [rw.x + 0.05, 0.2]], 0.09, 'chrome'));
  // fork
  const forkTop: Pt = st === 'chopper' ? [fw.x - 0.55, -0.42] : [fw.x - 0.28, -0.3];
  out.push(seg([fw.x, fw.y], forkTop, 0.09, 'chrome'));
  // tank and seat
  if (st === 'scooter') {
    out.push(blob([[rw.x - 0.25, 0.15], [rw.x - 0.2, -0.15], [hx + 0.2, -0.18], [hx + 0.4, 0.2]], m, {}, 1));
    out.push(blob([[hx + 0.4, 0.22], [forkTop[0] - 0.05, -0.3], [forkTop[0] + 0.12, -0.25], [hx + 0.65, 0.22]], m, {}, 1));
  } else {
    out.push(blob([[hx + 0.05, -0.1], [hx + 0.15, -0.3], [forkTop[0] - 0.02, -0.28], [forkTop[0] + 0.05, -0.12], [hx + 0.5, -0.02]], m, {}, 1));
    out.push(rr(hx - 0.55, -0.24, hx + 0.12, -0.12, 0.05, 'black'));
    out.push(blob([[rw.x - 0.3, -0.08], [hx - 0.55, -0.24], [hx - 0.35, -0.12], [rw.x, 0.0]], m, {}, 1));
  }
  // fenders
  out.push(fender(rw.x, rw.y, rw.r, 0.08, m), fender(fw.x, fw.y, fw.r, 0.08, st === 'dirt' ? 'white' : m));
  out.push(seg(forkTop, [forkTop[0] - 0.1, forkTop[1] - 0.18], 0.07, 'chrome'), seg([forkTop[0] - 0.1, forkTop[1] - 0.18], [forkTop[0] - 0.3, forkTop[1] - 0.2], 0.07, 'black'));
  out.push(headlight(forkTop[0] + 0.1, forkTop[1] + 0.06, 0.08));
  if (o.fairing || st === 'sport') out.push(blob([[forkTop[0] - 0.15, forkTop[1] - 0.1], [forkTop[0] + 0.05, forkTop[1] - 0.25], [forkTop[0] + 0.25, forkTop[1] + 0.1], [hx + 0.55, 0.15], [hx + 0.35, -0.05]], m, {}, 1));
  out.push(taillight(rw.x - 0.3, -0.06, 0.06));
  return out;
}

/** Wooden spoked carriage body for horse-cart style frames. */
export function carriage(f: Frame, o: { mat?: CarMat; top?: number; trim?: CarMat } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x + 0.45, x1 = f.nose.x - 0.45;
  const top = o.top ?? f.roof.y;
  const out: CarPoly[] = [];
  out.push(rr(f.tail.x + 0.05, 0.06, f.nose.x - 0.05, 0.18, 0.04, 'dark'));
  out.push(blob([[x0 + 0.1, 0.18], [x0 - 0.05, top + 0.25], [x0 + 0.25, top], [x1 - 0.25, top], [x1 + 0.05, top + 0.25], [x1 - 0.1, 0.18]], m, {}, 1));
  out.push(rr(x0 - 0.12, top - 0.08, x1 + 0.12, top + 0.04, 0.03, o.trim ?? 'gold'));
  return out;
}

/** Wheel-hugging fenders for every wheel. */
export const fenders = (f: Frame, mat: CarMat = 'body', t = 0.09): CarPoly[] => f.wheels.map((w: WheelDef) => fender(w.x, w.y, w.r, t, mat));

/** Rocket fuselage with fins and a nozzle. */
export function rocket(f: Frame, o: { mat?: CarMat; nose?: CarMat; fin?: CarMat; glass?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x;
  return [
    poly([[x0 + 0.3, -0.3], [x0 - 0.15, -0.85], [x0 + 0.15, -0.85], [x0 + 0.8, -0.3]], o.fin ?? 'accent'),
    poly([[x0 + 0.3, 0.3], [x0 - 0.15, 0.6], [x0 + 0.15, 0.6], [x0 + 0.8, 0.3]], o.fin ?? 'accent'),
    rr(x0 - 0.05, -0.24, x0 + 0.2, 0.24, 0.05, 'grey'),
    blob([[x0 + 0.1, -0.32], [x1 - 0.7, -0.34], [x1 - 0.2, -0.18], [x1 + 0.02, 0.0], [x1 - 0.2, 0.18], [x1 - 0.7, 0.32], [x0 + 0.1, 0.32]], m, {}, 1),
    poly([[x1 - 0.55, -0.3], [x1 - 0.2, -0.18], [x1 + 0.02, 0.0], [x1 - 0.2, 0.18], [x1 - 0.55, 0.3]], o.nose ?? 'red'),
    ...(o.glass === false ? [] : [ell(x1 - 0.85, -0.06, 0.14, 0.12, 'glass'), ell(x1 - 0.85, -0.06, 0.08, 0.07, 'sky')]),
  ];
}

/** Flying saucer. */
export function saucer(f: Frame, o: { mat?: CarMat; dome?: CarMat; lights?: CarMat } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x;
  const out: CarPoly[] = [
    ...path(Array.from({ length: 13 }, (_, i): [number, number] => [-Math.cos(i * Math.PI / 12) * 0.6, -0.26 - Math.sin(i * Math.PI / 12) * 0.68]), 0.06, o.dome ?? 'white'),
    ell((x0 + x1) / 2, 0.0, (x1 - x0) / 2 + 0.05, 0.26, m, {}, 28),
    ell((x0 + x1) / 2, -0.12, (x1 - x0) / 2 - 0.35, 0.14, 'chrome', {}, 24),
    ell((x0 + x1) / 2, 0.2, 0.55, 0.12, 'dark'),
  ];
  for (let i = -3; i <= 3; i++) out.push(circ(i * 0.38, 0.03, 0.06, o.lights ?? 'light'));
  return out;
}

/** Hover car: wedge hull with a glow strip underneath. */
export function hover(f: Frame, o: { mat?: CarMat; glow?: CarMat; canopy?: CarMat } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x;
  return [
    rr(x0 + 0.3, 0.12, x1 - 0.4, 0.26, 0.06, o.glow ?? 'light'),
    blob([[x0, 0.14], [x0 - 0.05, -0.28], [x0 + 0.5, -0.34], [x1 - 0.7, -0.36], [x1 + 0.05, -0.04], [x1 - 0.1, 0.16]], m, {}, 1),
    blob([[-0.75, -0.32], [-0.45, -0.72], [0.2, -0.74], [0.65, -0.34]], o.canopy ?? 'glass', {}, 1),
    rect(x0 + 0.1, -0.05, x1 - 0.3, 0.0, 'accent', { flat: true }),
    rr(x0 - 0.12, -0.24, x0 + 0.08, 0.06, 0.04, 'grey'),
  ];
}

/** Steam locomotive: boiler, cab, chimney, cowcatcher. */
export function loco(f: Frame, o: { mat?: CarMat; boiler?: CarMat; trim?: CarMat } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const x0 = f.tail.x, x1 = f.nose.x - 0.3;
  const out: CarPoly[] = [];
  out.push(rr(x0, 0.12, x1, 0.3, 0.04, 'dark'));
  // cab
  out.push(rr(x0 + 0.05, -1.3, x0 + 1.25, 0.15, 0.04, m));
  out.push(rr(x0 - 0.05, -1.4, x0 + 1.4, -1.2, 0.06, o.trim ?? 'black'));
  out.push(rr(x0 + 0.65, -1.05, x0 + 1.1, -0.65, 0.05, 'glass'));
  // boiler
  out.push(tank(x0 + 1.2, x1 + 0.05, -0.32, 0.34, o.boiler ?? 'black'));
  for (const x of [x0 + 1.6, x0 + 2.4, x1 - 0.3]) out.push(rect(x, -0.66, x + 0.08, 0.02, o.trim ?? 'gold', { flat: true }));
  // chimney and dome
  out.push(poly([[x1 - 0.55, -0.62], [x1 - 0.3, -0.62], [x1 - 0.22, -1.15], [x1 - 0.63, -1.15]], 'black'));
  out.push(rr(x1 - 0.68, -1.25, x1 - 0.17, -1.12, 0.04, o.trim ?? 'gold'));
  out.push(ell(x0 + 2.0, -0.68, 0.18, 0.12, o.trim ?? 'gold'));
  // smokebox front and lamp
  out.push(circ(x1 + 0.02, -0.32, 0.3, 'grey'), headlight(x1 + 0.1, -0.75, 0.1));
  // cowcatcher
  out.push(poly([[x1 - 0.05, 0.02], [x1 + 0.35, 0.3], [x1 - 0.05, 0.3]], 'red'));
  for (let i = 0; i < 3; i++) out.push(seg([x1 + i * 0.1, 0.05 + i * 0.07], [x1 + i * 0.1, 0.3], 0.04, 'black', { flat: true }));
  // drive rod
  const ws = [...f.wheels].sort((a, b) => a.x - b.x);
  out.push(seg([ws[0].x, ws[0].y - 0.1], [ws[ws.length - 1].x, ws[ws.length - 1].y - 0.1], 0.07, 'chrome'));
  return out;
}

/** Tractor: big rear wheel, engine hood, cab frame. */
export function tractor(f: Frame, o: { mat?: CarMat; cab?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const rw = firstW(f), fw = lastW(f);
  const out: CarPoly[] = [];
  out.push(blob([[-0.4, 0.2], [-0.42, -0.36], [fw.x + 0.3, -0.3], [f.nose.x, -0.1], [f.nose.x, 0.2]], m, {}, 1));
  out.push(grilleBars(f.nose.x - 0.12, -0.2, 0.15));
  out.push(fender(rw.x, rw.y, rw.r, 0.12, m));
  out.push(rr(-1.25, -0.3, -0.35, 0.05, 0.05, m));
  out.push(...seat(-0.78, -0.3, 0.4));
  out.push(...stack(fw.x - 0.2, -0.3, 0.6, 0.09, 'black'));
  out.push(seg([-0.2, -0.32], [-0.38, -0.62], 0.06, 'black'));
  if (o.cab !== false) {
    out.push(rect(-1.25, -1.2, -1.12, -0.3, 'dark'), rect(-0.45, -1.2, -0.32, -0.36, 'dark'), rr(-1.38, -1.3, -0.22, -1.12, 0.05, 'accent'));
  }
  out.push(headlight(f.nose.x - 0.05, -0.12, 0.08));
  return out;
}
const grilleBars = (x: number, y: number, h: number): CarPoly => rect(x, y - h, x + 0.1, y + h, 'chrome');

/** Rounded animal body with legs reaching to each wheel. */
export function beast(f: Frame, o: { mat?: CarMat; belly?: CarMat; cx?: number; cy?: number; rx?: number; ry?: number; legs?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const cx = o.cx ?? 0, cy = o.cy ?? -0.2, rx = o.rx ?? 1.05, ry = o.ry ?? 0.42;
  const out: CarPoly[] = [];
  if (o.legs !== false) for (const w of f.wheels) out.push(blob([[w.x - 0.17, cy], [w.x + 0.17, cy], [w.x + 0.13, w.y - 0.1], [w.x - 0.13, w.y - 0.1]], m, {}, 1));
  out.push(ell(cx, cy, rx, ry, m, {}, 24));
  if (o.belly) out.push(ell(cx + 0.05, cy + ry * 0.45, rx * 0.75, ry * 0.4, o.belly, {}, 20));
  return out;
}

export { arc, circ, ell, path, seat, rect, rr, poly, blob, seg };

// ---------------------------------------------------------------- creatures & robots

/** Neck + head matching the creature frame's neck option. Returns the head centre too. */
export function dinoHead(neck: 'long' | 'short' | 'raptor', L = 1, mat: CarMat = 'body'): { polys: CarPoly[]; eye: Pt; jaw: [number, number, number] } {
  if (neck === 'long') {
    return {
      polys: [...path([[0.6 * L, -0.35], [1.0 * L, -0.8], [1.35 * L, -1.3]], 0.34, mat), blob([[1.2 * L, -1.45], [1.5 * L, -1.62], [1.85 * L, -1.5], [1.82 * L, -1.36], [1.3 * L, -1.3]], mat, {}, 1)],
      eye: [1.52 * L, -1.52], jaw: [1.45 * L, 1.82 * L, -1.38],
    };
  }
  if (neck === 'short') {
    return {
      polys: [...path([[0.7 * L, -0.4], [1.15 * L, -0.8]], 0.36, mat), blob([[1.0 * L, -1.0], [1.35 * L, -1.15], [1.7 * L, -1.0], [1.66 * L, -0.78], [1.1 * L, -0.75]], mat, {}, 1)],
      eye: [1.35 * L, -0.98], jaw: [1.3 * L, 1.66 * L, -0.82],
    };
  }
  return {
    polys: [...path([[0.75 * L, -0.4], [1.15 * L, -0.65]], 0.36, mat), blob([[1.0 * L, -0.85], [1.4 * L, -0.92], [1.8 * L, -0.75], [1.8 * L, -0.48], [1.25 * L, -0.42], [1.05 * L, -0.5]], mat, {}, 1)],
    eye: [1.38 * L, -0.74], jaw: [1.35 * L, 1.8 * L, -0.58],
  };
}

/** Tapering tail off the back. */
export function tail(x: number, y: number, len: number, mat: CarMat = 'body', up = 0.2): CarPoly {
  return blob([[x + 0.25, y - 0.22], [x - len * 0.5, y - up - 0.05], [x - len, y - up * 1.6], [x - len * 0.5, y - up + 0.08], [x + 0.25, y + 0.18]], mat, {}, 1);
}

/** Boxy robot torso standing on a wheel base, with shoulder arms and a face plate. */
export function robot(f: Frame, o: { mat?: CarMat; face?: CarMat; arms?: boolean } = {}): CarPoly[] {
  const m = o.mat ?? 'body';
  const top = f.roof.y, hw = f.roof.x1;
  const out: CarPoly[] = [
    rr(f.wheels[0].x - 0.15, -0.05, f.wheels[f.wheels.length - 1].x + 0.15, 0.24, 0.08, 'dark'),
    rr(-hw * 0.5, -0.2, hw * 0.5, 0.05, 0.04, 'grey'),
    rr(-hw, top, hw, -0.1, 0.14, m),
    rr(-hw + 0.12, top + 0.18, hw - 0.12, top + 0.55, 0.08, o.face ?? 'black'),
    rect(-hw + 0.1, top + 0.7, hw - 0.1, top + 0.76, 'dark', { flat: true }),
  ];
  if (o.arms !== false) {
    out.push(circ(-hw - 0.05, top + 0.3, 0.18, 'grey'), circ(hw + 0.05, top + 0.3, 0.18, 'grey'));
    out.push(rr(-hw - 0.35, top + 0.25, -hw - 0.05, top + 0.85, 0.1, 'chrome'), rr(hw + 0.05, top + 0.25, hw + 0.35, top + 0.85, 0.1, 'chrome'));
  }
  return out;
}
