import type { Archetype, CarDef, CarMat, CarPoly, CategoryId, FlailDef, ItemKind, Pt, WheelDef } from './types';
import { estimateMass } from './stats';

/*
 * Parametric car builder.
 *
 * A car is a *frame* (one of a few chassis templates: sedan, truck, bike, creature…)
 * plus a list of *parts* bolted onto the frame's anchors (deck cargo, front tools,
 * roof gear, tails…). Physics (mass, torque, suspension) is derived from an
 * archetype preset so every generated car lands inside the balance envelope.
 * Everything is original geometry; the pixel art comes from the sprite rasterizer.
 */

// ---------------------------------------------------------------- geometry helpers

export const P = (pts: Pt[], mat: CarMat = 'body', extra: Partial<CarPoly> = {}): CarPoly => ({ pts, mat, ...extra });
export const R = (x0: number, y0: number, x1: number, y1: number, mat: CarMat = 'body', extra: Partial<CarPoly> = {}): CarPoly =>
  P([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], mat, extra);
/** Ellipse approximated by an n-gon (n <= 8 keeps it a valid Box2D polygon). */
export const O = (cx: number, cy: number, rx: number, ry: number, mat: CarMat = 'body', extra: Partial<CarPoly> = {}, n = 8, rot = Math.PI / 8): CarPoly => {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    pts.push([+(cx + Math.cos(a) * rx).toFixed(3), +(cy + Math.sin(a) * ry).toFixed(3)]);
  }
  return P(pts, mat, extra);
};
export const T = (a: Pt, b: Pt, c: Pt, mat: CarMat = 'body', extra: Partial<CarPoly> = {}) => P([a, b, c], mat, extra);
const deco = { deco: true };

// ---------------------------------------------------------------- frames

export interface Span { x0: number; x1: number; y: number }

export interface Frame {
  arch: Archetype;
  polys: CarPoly[];
  windows: Pt[][];
  wheels: WheelDef[];
  head: { x: number; y: number; r: number };
  /** Free top surface for cargo. */
  deck: Span;
  /** Top of the cabin / highest roof. */
  roof: Span;
  /** Front face: x, and vertical span. */
  nose: { x: number; y0: number; y1: number };
  tail: { x: number; y0: number; y1: number };
  stripe?: { y: number; h: number };
  /** Extra center-of-mass offset. */
  com?: Pt;
  float?: number;
  /** Handling overrides on top of the archetype preset. */
  tune?: { wheelie?: number; air?: number; accel?: number };
}

export type FrameId =
  | 'sedan' | 'coupe' | 'sports' | 'pickup' | 'van' | 'bus' | 'truck' | 'kart' | 'formula' | 'dragster'
  | 'bike' | 'monster' | 'tracked' | 'buggy' | 'cart' | 'creature' | 'boat' | 'sled' | 'blob' | 'rocket'
  | 'saucer' | 'tractor' | 'loco' | 'robot' | 'hover' | 'digger' | 'carriage' | 'trike' | 'box';

export interface FrameOpts {
  /** Overall length multiplier (1 = default for the frame). */
  len?: number;
  /** Body height multiplier. */
  tall?: number;
  /** Wheel radius multiplier. */
  wheel?: number;
  /** Number of wheels for frames that support it. */
  wheels?: number;
  rim?: WheelDef['rim'];
  /** Open cockpit instead of a closed cabin (sedan/coupe/pickup). */
  open?: boolean;
  /** Creature shape. */
  neck?: 'long' | 'short' | 'raptor' | 'none';
  /** Blob shape. */
  shape?: 'round' | 'egg' | 'square' | 'snowman' | 'flat';
  /** Body material for the main hull. */
  mat?: CarMat;
}

const W = (x: number, y: number, r: number, rim?: WheelDef['rim'], extra: Partial<WheelDef> = {}): WheelDef => ({ x, y, r, rim, ...extra });

function frame(id: FrameId, o: FrameOpts): Frame {
  const L = o.len ?? 1, H = o.tall ?? 1, wk = o.wheel ?? 1, rim = o.rim, m = o.mat ?? 'body';
  switch (id) {
    case 'sedan':
    case 'coupe': {
      const hl = (id === 'coupe' ? 1.45 : 1.62) * L;
      const cab = id === 'coupe' ? 0.46 : 0.52;
      const polys = [P([[-hl, -0.16], [hl - 0.4, -0.16], [hl, 0.04], [hl - 0.03, 0.32], [-hl, 0.32], [-hl - 0.04, 0.06]], m)];
      const windows: Pt[][] = [];
      let head = { x: -0.25 * L, y: -0.74 * H, r: 0.28 };
      if (o.open) {
        polys.push(P([[0.32 * L, -0.16], [0.72 * L, -0.16], [0.44 * L, -0.6], [0.3 * L, -0.6]], 'dark'));
        windows.push([[0.36 * L, -0.18], [0.62 * L, -0.18], [0.42 * L, -0.54], [0.34 * L, -0.54]]);
        head = { x: -0.2 * L, y: -0.62, r: 0.28 };
      } else {
        const top = -0.16 - cab * H;
        polys.push(P([[-1.0 * L, -0.16], [0.78 * L, -0.16], [0.36 * L, top], [-0.84 * L, top]], m));
        windows.push([[0.04 * L, -0.2], [0.66 * L, -0.2], [0.32 * L, top + 0.06], [0.04 * L, top + 0.06]]);
        windows.push([[-0.8 * L, -0.2], [-0.06 * L, -0.2], [-0.06 * L, top + 0.06], [-0.72 * L, top + 0.06]]);
        head = { x: -0.22 * L, y: top - 0.1, r: 0.28 };
      }
      const wx = (hl - 0.55) * 1, wr = 0.42 * wk;
      return {
        arch: 'allround', polys, windows,
        wheels: [W(-wx, 0.3 + wr * 0.2 + 0.0, wr, rim), W(wx, 0.3 + wr * 0.2, wr, rim)],
        head, deck: { x0: -hl, x1: -1.0 * L, y: -0.16 }, roof: { x0: -0.84 * L, x1: 0.36 * L, y: o.open ? -0.6 : -0.16 - cab * H },
        nose: { x: hl, y0: -0.16, y1: 0.32 }, tail: { x: -hl, y0: -0.16, y1: 0.32 }, stripe: { y: 0.02, h: 0.08 },
      };
    }
    case 'sports': {
      const hl = 1.68 * L;
      return {
        arch: 'fast',
        polys: [
          P([[-hl, -0.14], [0.9 * L, -0.22], [hl, 0.0], [hl - 0.06, 0.26], [-hl, 0.26]], m),
          P([[0.04 * L, -0.21], [0.62 * L, -0.2], [0.22 * L, -0.52], [0.06 * L, -0.52]], 'dark'),
        ],
        windows: [[[0.08 * L, -0.23], [0.5 * L, -0.21], [0.2 * L, -0.46], [0.09 * L, -0.46]]],
        wheels: [W(-1.1 * L, 0.32, 0.38 * wk, rim ?? 'star'), W(1.1 * L, 0.32, 0.38 * wk, rim ?? 'star')],
        head: { x: -0.34 * L, y: -0.5, r: 0.27 },
        deck: { x0: -hl, x1: -0.7 * L, y: -0.14 }, roof: { x0: -0.6, x1: 0.2, y: -0.52 },
        nose: { x: hl, y0: -0.1, y1: 0.26 }, tail: { x: -hl, y0: -0.14, y1: 0.26 }, stripe: { y: -0.02, h: 0.07 },
      };
    }
    case 'pickup': {
      const hl = 1.65 * L;
      const top = -0.26 - 0.6 * H;
      const polys = [P([[-hl, -0.26], [hl - 0.3, -0.26], [hl, -0.05], [hl, 0.36], [-hl, 0.36]], m)];
      const windows: Pt[][] = [];
      let head;
      if (o.open) {
        polys.push(P([[0.5 * L, -0.26], [0.85 * L, -0.26], [0.6 * L, -0.74], [0.48 * L, -0.74]], 'dark'));
        head = { x: 0.05 * L, y: -0.72, r: 0.29 };
      } else {
        polys.push(P([[-0.3 * L, -0.26], [0.78 * L, -0.26], [0.46 * L, top], [-0.26 * L, top]], m));
        windows.push([[0.08 * L, -0.3], [0.66 * L, -0.3], [0.42 * L, top + 0.07], [0.08 * L, top + 0.07]]);
        head = { x: 0.08 * L, y: top - 0.1, r: 0.29 };
      }
      const wr = 0.46 * wk;
      return {
        arch: 'heavy', polys, windows,
        wheels: [W(-1.1 * L, 0.36 + wr * 0.2, wr, rim ?? 'disc'), W(1.1 * L, 0.36 + wr * 0.2, wr, rim ?? 'disc')],
        head, deck: { x0: -hl, x1: -0.32 * L, y: -0.26 }, roof: { x0: -0.26 * L, x1: 0.46 * L, y: o.open ? -0.74 : top },
        nose: { x: hl, y0: -0.26, y1: 0.36 }, tail: { x: -hl, y0: -0.26, y1: 0.36 }, stripe: { y: 0.04, h: 0.1 },
      };
    }
    case 'van':
    case 'bus': {
      const hl = (id === 'bus' ? 2.15 : 1.6) * L;
      const top = (id === 'bus' ? -0.95 : -0.85) * H;
      const polys = [P([[-hl, top], [hl - 0.45, top], [hl, top + 0.5], [hl, 0.3], [-hl, 0.3]], m)];
      const windows: Pt[][] = [[[hl - 0.42, top + 0.06], [hl - 0.06, top + 0.5], [hl - 0.42, top + 0.5]]];
      const n = Math.max(1, Math.floor((hl * 2 - 0.9) / 0.62));
      for (let i = 0; i < n; i++) {
        const x0 = -hl + 0.2 + i * 0.62;
        if (x0 + 0.46 > hl - 0.5) break;
        windows.push([[x0, top + 0.12], [x0 + 0.46, top + 0.12], [x0 + 0.46, top + 0.48], [x0, top + 0.48]]);
      }
      const wr = 0.42 * wk;
      const wheels = id === 'bus' && (o.wheels ?? 2) > 2
        ? [W(-hl + 0.6, 0.3 + wr * 0.2, wr, rim), W(-hl + 1.5, 0.3 + wr * 0.2, wr, rim), W(hl - 0.7, 0.3 + wr * 0.2, wr, rim)]
        : [W(-hl + 0.6, 0.3 + wr * 0.2, wr, rim), W(hl - 0.65, 0.3 + wr * 0.2, wr, rim)];
      return {
        arch: id === 'bus' ? 'long' : 'tall', polys, windows, wheels,
        head: { x: hl - 0.95, y: top - 0.12, r: 0.28 },
        deck: { x0: -hl + 0.1, x1: hl - 1.3, y: top }, roof: { x0: -hl, x1: hl - 0.45, y: top },
        nose: { x: hl, y0: top + 0.5, y1: 0.3 }, tail: { x: -hl, y0: top, y1: 0.3 }, stripe: { y: 0.02, h: 0.1 },
        com: [0, 0.32 * H],
      };
    }
    case 'truck': {
      const hl = 2.0 * L;
      const top = -0.95 * H;
      const cx0 = hl - 0.85;
      const nw = o.wheels ?? 3;
      const wr = 0.42 * wk;
      const wy = 0.3 + wr * 0.2;
      const wheels = nw >= 3 ? [W(-hl + 0.55, wy, wr, rim), W(-hl + 1.45, wy, wr, rim), W(hl - 0.5, wy, wr, rim)] : [W(-hl + 0.7, wy, wr, rim), W(hl - 0.5, wy, wr, rim)];
      return {
        arch: 'long',
        polys: [
          R(-hl, -0.12, cx0, 0.3, 'dark'),
          P([[cx0, top], [hl - 0.22, top], [hl, top + 0.45], [hl, 0.3], [cx0, 0.3]], m),
        ],
        windows: [[[hl - 0.5, top + 0.08], [hl - 0.24, top + 0.08], [hl - 0.06, top + 0.42], [hl - 0.5, top + 0.42]]],
        wheels,
        head: { x: cx0 + 0.32, y: top - 0.12, r: 0.28 },
        deck: { x0: -hl + 0.05, x1: cx0 - 0.08, y: -0.12 }, roof: { x0: cx0, x1: hl - 0.22, y: top },
        nose: { x: hl, y0: top + 0.45, y1: 0.3 }, tail: { x: -hl, y0: -0.12, y1: 0.3 }, stripe: { y: 0.05, h: 0.09 },
        com: [0, 0.2],
      };
    }
    case 'kart': {
      const hl = 0.95 * L;
      const wr = 0.3 * wk;
      return {
        arch: 'tiny', tune: { wheelie: 0.6 },
        polys: [
          P([[-hl, -0.04], [hl - 0.1, -0.04], [hl + 0.08, 0.1], [hl - 0.1, 0.22], [-hl, 0.22]], m),
          P([[-0.62 * L, -0.04], [-0.34 * L, -0.04], [-0.44 * L, -0.42], [-0.64 * L, -0.42]], 'dark'),
          R(0.25 * L, -0.3, 0.33 * L, -0.04, 'metal'),
        ],
        windows: [],
        wheels: [W(-0.72 * L, 0.24 + wr * 0.15, wr, rim ?? 'disc'), W(0.72 * L, 0.24 + wr * 0.15, wr, rim ?? 'disc')],
        head: { x: -0.12 * L, y: -0.46, r: 0.25 },
        deck: { x0: -hl, x1: -0.66 * L, y: -0.04 }, roof: { x0: -0.6, x1: 0.2, y: -0.42 },
        nose: { x: hl + 0.08, y0: -0.04, y1: 0.22 }, tail: { x: -hl, y0: -0.04, y1: 0.22 },
      };
    }
    case 'formula': {
      const hl = 2.0 * L;
      return {
        arch: 'fast',
        polys: [
          P([[-hl + 0.1, -0.06], [1.5 * L, -0.06], [hl, 0.06], [hl - 0.1, 0.14], [-hl + 0.1, 0.18]], m),
          P([[-0.75 * L, -0.06], [0.45 * L, -0.06], [0.25 * L, -0.26], [-0.62 * L, -0.26]], 'dark'),
          R(-hl, -0.62, -hl + 0.5, -0.48, 'accent'),
          R(-hl + 0.18, -0.48, -hl + 0.28, -0.06, 'dark'),
        ],
        windows: [],
        wheels: [W(-1.25 * L, 0.3, 0.44 * wk, rim ?? 'disc'), W(1.35 * L, 0.32, 0.38 * wk, rim ?? 'disc')],
        head: { x: -0.18 * L, y: -0.44, r: 0.26 },
        deck: { x0: -hl + 0.6, x1: -0.8 * L, y: -0.06 }, roof: { x0: -0.6, x1: 0.2, y: -0.26 },
        nose: { x: hl, y0: 0.0, y1: 0.22 }, tail: { x: -hl, y0: -0.62, y1: 0.24 }, stripe: { y: 0.04, h: 0.06 },
      };
    }
    case 'dragster': {
      const hl = 2.2 * L;
      return {
        arch: 'rocket', tune: { accel: 1.2 },
        polys: [
          P([[-hl + 0.4, -0.18], [-0.2, -0.14], [hl, 0.06], [hl, 0.18], [-hl + 0.4, 0.26]], m),
          P([[-hl + 0.55, -0.16], [-0.6, -0.15], [-0.75, -0.4], [-hl + 0.65, -0.4]], 'dark'),
          R(-hl, -0.86, -hl + 0.6, -0.72, 'accent'),
          R(-hl + 0.22, -0.72, -hl + 0.32, -0.18, 'dark'),
        ],
        windows: [],
        wheels: [W(-hl + 0.75, 0.28, 0.58 * wk, rim ?? 'disc'), W(hl - 0.4, 0.33, 0.26 * wk, rim ?? 'spokes', { drive: false })],
        head: { x: -0.95, y: -0.48, r: 0.26 },
        deck: { x0: -0.4, x1: hl - 0.6, y: -0.1 }, roof: { x0: -1.5, x1: -0.7, y: -0.4 },
        nose: { x: hl, y0: 0.06, y1: 0.18 }, tail: { x: -hl, y0: -0.86, y1: 0.26 },
      };
    }
    case 'bike':
    case 'trike': {
      const wr = 0.4 * wk;
      const polys = [
        P([[-0.75 * L, -0.06], [0.2 * L, -0.2], [0.62 * L, -0.16], [0.7 * L, 0.06], [0.2 * L, 0.24], [-0.55 * L, 0.24]], m),
        R(-0.7 * L, -0.2, -0.1 * L, -0.06, 'dark'),
        P([[0.55 * L, -0.16], [0.68 * L, -0.2], [0.98 * L, 0.3], [0.86 * L, 0.32]], 'metal'),
      ];
      const wheels = id === 'trike'
        ? [W(-0.95 * L, 0.32, wr, rim ?? 'spokes'), W(-0.55 * L, 0.32, wr, rim ?? 'spokes'), W(0.92 * L, 0.32, wr, rim ?? 'spokes', { drive: false })]
        : [W(-0.88 * L, 0.32, wr, rim ?? 'spokes'), W(0.92 * L, 0.32, wr, rim ?? 'spokes')];
      return {
        arch: id === 'trike' ? 'allround' : 'tiny', polys, windows: [], wheels, tune: { wheelie: 0.6 },
        head: { x: -0.15 * L, y: -0.68, r: 0.26 },
        deck: { x0: -0.75 * L, x1: -0.4 * L, y: -0.2 }, roof: { x0: -0.4, x1: 0.2, y: -0.2 },
        nose: { x: 0.7 * L, y0: -0.16, y1: 0.06 }, tail: { x: -0.75 * L, y0: -0.2, y1: 0.24 },
      };
    }
    case 'monster': {
      const hl = 1.5 * L;
      const top = -0.55 - 0.55 * H;
      const wr = 0.66 * wk;
      return {
        arch: 'monster',
        polys: [
          P([[-hl, -0.55], [hl - 0.15, -0.55], [hl + 0.05, -0.3], [hl, 0.08], [-hl, 0.08]], m),
          P([[-0.25 * L, -0.55], [0.6 * L, -0.55], [0.45 * L, top], [-0.2 * L, top]], m),
          R(-hl + 0.1, 0.08, hl - 0.1, 0.24, 'dark'),
        ],
        windows: [[[0.05 * L, -0.58], [0.47 * L, -0.58], [0.36 * L, top + 0.1], [0.05 * L, top + 0.1]]],
        wheels: [W(-1.15 * L, 0.6, wr, rim ?? 'monster', { density: 0.7 }), W(1.15 * L, 0.6, wr, rim ?? 'monster', { density: 0.7 })],
        head: { x: -0.68 * L, y: -0.94, r: 0.31 },
        deck: { x0: -hl, x1: -0.95 * L, y: -0.55 }, roof: { x0: -0.2 * L, x1: 0.45 * L, y: top },
        nose: { x: hl + 0.05, y0: -0.55, y1: 0.08 }, tail: { x: -hl, y0: -0.55, y1: 0.08 }, stripe: { y: -0.3, h: 0.12 },
      };
    }
    case 'tracked':
    case 'digger': {
      const hl = 1.75 * L;
      const nw = o.wheels ?? 4;
      const wr = 0.3 * wk;
      const wheels: WheelDef[] = [];
      for (let i = 0; i < nw; i++) wheels.push(W(-hl + 0.45 + (i * (hl * 2 - 0.9)) / (nw - 1), 0.42, wr, rim ?? 'disc', { drive: true }));
      const polys = [
        P([[-hl, -0.18], [hl - 0.3, -0.18], [hl + 0.05, 0.08], [hl - 0.2, 0.32], [-hl + 0.2, 0.32], [-hl - 0.05, 0.08]], m),
        P([[-hl + 0.1, 0.32], [hl - 0.1, 0.32], [hl - 0.25, 0.4], [-hl + 0.25, 0.4]], 'dark'),
      ];
      let head = { x: -0.3 * L, y: -0.78, r: 0.28 };
      let roof = { x0: -0.75 * L, x1: 0.35 * L, y: -0.56 };
      if (id === 'tracked') polys.push(P([[-0.75 * L, -0.18], [0.5 * L, -0.18], [0.35 * L, -0.56], [-0.6 * L, -0.56]], m));
      else {
        // digger: cab with window at the back of the hull
        polys.push(R(-hl + 0.15, -1.05 * H, -hl + 0.28, -0.18, 'dark'));
        polys.push(R(-hl + 0.1, -1.15 * H, -0.05, -1.03 * H, m));
        head = { x: -hl + 0.75, y: -0.62, r: 0.28 };
        roof = { x0: -hl + 0.1, x1: -0.05, y: -1.15 * H };
      }
      return {
        arch: id === 'digger' ? 'scoop' : 'heavy', polys, windows: id === 'digger' ? [[[-hl + 0.28, -1.03 * H], [-0.08, -1.03 * H], [-0.08, -0.5], [-hl + 0.28, -0.5]]] : [], wheels, tune: id === 'digger' ? { air: 14, accel: 1.2 } : { wheelie: 0.6, air: 14, accel: 1.2 },
        head, deck: { x0: 0.0, x1: hl - 0.35, y: -0.18 }, roof,
        nose: { x: hl + 0.05, y0: -0.18, y1: 0.12 }, tail: { x: -hl - 0.05, y0: -0.18, y1: 0.32 }, stripe: { y: 0.0, h: 0.08 },
      };
    }
    case 'buggy': {
      const hl = 1.45 * L;
      const wr = 0.46 * wk;
      return {
        arch: 'bouncy',
        polys: [
          P([[-hl, -0.08], [hl - 0.25, -0.12], [hl + 0.05, 0.06], [hl - 0.1, 0.26], [-hl + 0.1, 0.26]], m),
          P([[-0.85 * L, -0.08], [-0.7 * L, -0.08], [-0.55 * L, -0.92], [-0.68 * L, -0.92]], 'metal'),
          P([[0.55 * L, -0.1], [0.7 * L, -0.11], [0.32 * L, -0.92], [0.2 * L, -0.92]], 'metal'),
          R(-0.68 * L, -1.0, 0.32 * L, -0.9, 'metal'),
        ],
        windows: [],
        wheels: [W(-1.0 * L, 0.36, wr, rim ?? 'star'), W(1.0 * L, 0.36, wr, rim ?? 'star')],
        head: { x: -0.18 * L, y: -0.5, r: 0.27 },
        deck: { x0: -hl, x1: -0.9 * L, y: -0.08 }, roof: { x0: -0.68 * L, x1: 0.32 * L, y: -1.0 },
        nose: { x: hl + 0.05, y0: -0.12, y1: 0.26 }, tail: { x: -hl, y0: -0.08, y1: 0.26 },
      };
    }
    case 'cart': {
      const hw = 0.85 * L;
      const top = -0.62 * H;
      const wr = 0.26 * wk;
      return {
        arch: 'tiny',
        polys: [
          P([[-hw, top], [hw, top], [hw - 0.18, 0.16], [-hw + 0.18, 0.16]], m),
          R(-hw + 0.12, 0.16, hw - 0.12, 0.24, 'metal'),
        ],
        windows: [],
        wheels: [W(-0.55 * L, 0.38, wr, rim ?? 'disc'), W(0.55 * L, 0.38, wr, rim ?? 'disc')],
        head: { x: -0.05, y: top - 0.3, r: 0.27 },
        deck: { x0: -hw, x1: hw, y: top }, roof: { x0: -hw, x1: hw, y: top },
        nose: { x: hw, y0: top, y1: 0.16 }, tail: { x: -hw, y0: top, y1: 0.16 },
        com: [0, 0.25],
      };
    }
    case 'carriage': {
      const hw = 1.05 * L;
      const top = -1.0 * H;
      const wr = 0.48 * wk;
      return {
        arch: 'tall', tune: { wheelie: 0.6 },
        polys: [
          P([[-hw, top + 0.2], [-hw + 0.25, top], [hw - 0.25, top], [hw, top + 0.2], [hw - 0.1, 0.2], [-hw + 0.1, 0.2]], m),
          R(-hw - 0.45, 0.06, hw + 0.45, 0.2, 'dark'),
        ],
        windows: [[[-0.4 * L, top + 0.18], [0.4 * L, top + 0.18], [0.4 * L, top + 0.6], [-0.4 * L, top + 0.6]]],
        wheels: [W(-1.0 * L, 0.36, wr, rim ?? 'spokes'), W(1.0 * L, 0.36, wr, rim ?? 'spokes')],
        head: { x: 0.0, y: top - 0.14, r: 0.28 },
        deck: { x0: -hw + 0.25, x1: hw - 0.25, y: top }, roof: { x0: -hw + 0.25, x1: hw - 0.25, y: top },
        nose: { x: hw + 0.45, y0: top + 0.2, y1: 0.2 }, tail: { x: -hw - 0.45, y0: top + 0.2, y1: 0.2 },
        com: [0, 0.35],
      };
    }
    case 'creature': {
      const neck = o.neck ?? 'short';
      const bx = 1.05 * L, by = 0.42 * H;
      const polys = [O(0, -0.2, bx, by, m)];
      // legs (render only)
      for (const lx of [-0.62, 0.62]) polys.push(R(lx * L - 0.12, 0.1, lx * L + 0.12, 0.42, m, deco));
      let headEnd: Pt = [bx, -0.4];
      if (neck === 'long') {
        polys.push(P([[0.55 * L, -0.45], [0.9 * L, -0.25], [1.5 * L, -1.35], [1.3 * L, -1.45]], m, { density: 0.3 }));
        polys.push(O(1.5 * L, -1.48, 0.3, 0.18, m, { density: 0.3 }));
        headEnd = [1.78 * L, -1.48];
      } else if (neck === 'short') {
        polys.push(P([[0.6 * L, -0.5], [0.95 * L, -0.25], [1.3 * L, -0.75], [1.05 * L, -0.92]], m, { density: 0.3 }));
        polys.push(O(1.32 * L, -0.92, 0.34, 0.24, m, { density: 0.3 }));
        headEnd = [1.64 * L, -0.92];
      } else if (neck === 'raptor') {
        polys.push(P([[0.7 * L, -0.45], [1.0 * L, -0.15], [1.35 * L, -0.55], [1.15 * L, -0.8]], m, { density: 0.3 }));
        polys.push(P([[1.05 * L, -0.85], [1.75 * L, -0.7], [1.75 * L, -0.5], [1.2 * L, -0.45]], m, { density: 0.3 }));
        headEnd = [1.75 * L, -0.6];
      }
      // eye
      if (neck !== 'none') polys.push(O(headEnd[0] - 0.22, headEnd[1] - 0.06, 0.06, 0.06, 'white', deco, 6));
      const wr = 0.34 * wk;
      return {
        arch: 'allround', polys, windows: [],
        wheels: [W(-0.62 * L, 0.48, wr, rim ?? 'disc'), W(0.62 * L, 0.48, wr, rim ?? 'disc')],
        head: { x: -0.2 * L, y: -0.2 - by - 0.18, r: 0.27 },
        deck: { x0: -0.9 * L, x1: 0.4 * L, y: -0.2 - by * 0.9 }, roof: { x0: -0.6 * L, x1: 0.4 * L, y: -0.2 - by },
        nose: { x: headEnd[0], y0: headEnd[1] - 0.1, y1: headEnd[1] + 0.1 }, tail: { x: -bx, y0: -0.4, y1: 0.0 },
        com: [0, 0.2],
      };
    }
    case 'boat': {
      const hl = 1.75 * L;
      const wr = 0.3 * wk;
      return {
        arch: 'long', tune: { wheelie: 0.6, air: 14 },
        polys: [
          P([[-hl, -0.42], [hl + 0.25, -0.5], [hl - 0.3, 0.12], [-hl + 0.2, 0.12]], m),
          R(-0.2 * L, -0.85, 0.75 * L, -0.42, 'white'),
        ],
        windows: [[[0.4 * L, -0.8], [0.68 * L, -0.8], [0.68 * L, -0.55], [0.4 * L, -0.55]]],
        wheels: [W(-1.05 * L, 0.36, wr, rim ?? 'disc'), W(1.05 * L, 0.36, wr, rim ?? 'disc')],
        head: { x: -0.55 * L, y: -0.72, r: 0.27 },
        deck: { x0: -hl + 0.1, x1: -0.9 * L, y: -0.42 }, roof: { x0: -0.2 * L, x1: 0.75 * L, y: -0.85 },
        nose: { x: hl + 0.25, y0: -0.5, y1: 0.0 }, tail: { x: -hl, y0: -0.42, y1: 0.12 }, stripe: { y: -0.22, h: 0.08 },
      };
    }
    case 'sled': {
      const hl = 1.5 * L;
      const wr = 0.24 * wk;
      return {
        arch: 'fast', tune: { wheelie: 0.6 },
        polys: [
          R(-hl, 0.12, hl - 0.2, 0.22, 'metal'),
          P([[hl - 0.25, 0.12], [hl - 0.05, 0.22], [hl + 0.2, -0.25], [hl + 0.05, -0.32]], 'metal'),
          P([[-hl + 0.1, -0.22], [hl - 0.35, -0.22], [hl - 0.1, 0.12], [-hl + 0.1, 0.12]], m),
        ],
        windows: [],
        wheels: [W(-1.0 * L, 0.36, wr, rim ?? 'disc'), W(1.0 * L, 0.36, wr, rim ?? 'disc')],
        head: { x: -0.4 * L, y: -0.56, r: 0.27 },
        deck: { x0: -hl + 0.1, x1: -0.8 * L, y: -0.22 }, roof: { x0: -0.6, x1: 0.2, y: -0.22 },
        nose: { x: hl + 0.2, y0: -0.25, y1: 0.22 }, tail: { x: -hl, y0: -0.22, y1: 0.22 },
      };
    }
    case 'blob': {
      const shape = o.shape ?? 'round';
      const polys: CarPoly[] = [];
      let topY = -1.15;
      if (shape === 'round') { polys.push(O(0, -0.35 * H, 0.95 * L, 0.72 * H, m)); topY = -0.35 * H - 0.72 * H; }
      else if (shape === 'egg') { polys.push(P([[-0.75, 0.2], [-0.95, -0.35], [-0.6, -1.05 * H], [0.0, -1.3 * H], [0.6, -1.05 * H], [0.95, -0.35], [0.75, 0.2]], m)); topY = -1.3 * H; }
      else if (shape === 'square') { polys.push(R(-0.85 * L, -1.15 * H, 0.85 * L, 0.2, m)); topY = -1.15 * H; }
      else if (shape === 'flat') { polys.push(O(0, -0.15, 1.25 * L, 0.42 * H, m)); topY = -0.15 - 0.42 * H; }
      else { polys.push(O(0, -0.2, 0.85 * L, 0.55, m)); polys.push(O(0.05, -1.05, 0.55, 0.42, m)); topY = -1.47; }
      const wr = 0.34 * wk;
      return {
        arch: 'bouncy', polys, windows: [],
        wheels: [W(-0.6 * L, 0.45, wr, rim ?? 'disc'), W(0.6 * L, 0.45, wr, rim ?? 'disc')],
        head: { x: -0.08, y: topY - 0.14, r: 0.28 },
        deck: { x0: -0.5, x1: 0.5, y: topY }, roof: { x0: -0.4, x1: 0.4, y: topY },
        nose: { x: shape === 'flat' ? 1.25 * L : 0.95 * L, y0: -0.5, y1: 0.0 }, tail: { x: -0.95 * L, y0: -0.5, y1: 0.0 },
        com: [0, 0.3],
      };
    }
    case 'rocket': {
      const hl = 1.65 * L;
      const wr = 0.3 * wk;
      return {
        arch: 'rocket',
        polys: [
          P([[-hl, -0.32], [hl - 0.6, -0.32], [hl + 0.1, 0.0], [hl - 0.6, 0.3], [-hl, 0.3]], m),
          T([-hl, -0.32], [-hl + 0.6, -0.32], [-hl - 0.15, -0.8], 'accent'),
          R(-hl - 0.18, -0.2, -hl, 0.2, 'rocket'),
        ],
        windows: [[[hl - 0.9, -0.24], [hl - 0.5, -0.24], [hl - 0.5, 0.0], [hl - 0.9, 0.0]]],
        wheels: [W(-1.05 * L, 0.5, wr, rim ?? 'disc'), W(1.0 * L, 0.5, wr, rim ?? 'disc')],
        head: { x: -0.1, y: -0.56, r: 0.27 },
        deck: { x0: -hl + 0.7, x1: -0.4, y: -0.32 }, roof: { x0: -0.6, x1: 0.5, y: -0.32 },
        nose: { x: hl + 0.1, y0: -0.1, y1: 0.1 }, tail: { x: -hl - 0.18, y0: -0.2, y1: 0.2 }, stripe: { y: -0.04, h: 0.08 },
      };
    }
    case 'saucer': {
      const hl = 1.6 * L;
      return {
        arch: 'bouncy',
        polys: [
          P([[-hl, 0.0], [-0.95 * L, -0.28], [0.95 * L, -0.28], [hl, 0.0], [0.95 * L, 0.2], [-0.95 * L, 0.2]], m),
          P([[-0.65, -0.28], [0.65, -0.28], [0.4, -0.85], [-0.4, -0.85]], 'glass', deco),
          R(-hl + 0.25, -0.04, hl - 0.25, 0.04, 'light', deco),
        ],
        windows: [],
        wheels: [W(-0.9 * L, 0.4, 0.3 * wk, rim ?? 'disc'), W(0.9 * L, 0.4, 0.3 * wk, rim ?? 'disc')],
        head: { x: 0, y: -0.52, r: 0.27 },
        deck: { x0: -hl + 0.2, x1: -0.7, y: -0.2 }, roof: { x0: -0.4, x1: 0.4, y: -0.85 },
        nose: { x: hl, y0: -0.1, y1: 0.1 }, tail: { x: -hl, y0: -0.1, y1: 0.1 },
        float: 0.72,
      };
    }
    case 'hover': {
      const hl = 1.65 * L;
      return {
        arch: 'fast',
        polys: [
          P([[-hl, -0.3], [0.9 * L, -0.34], [hl + 0.1, -0.02], [hl - 0.1, 0.16], [-hl + 0.1, 0.16]], m),
          P([[-0.7 * L, -0.31], [0.6 * L, -0.34], [0.25 * L, -0.76], [-0.5 * L, -0.76]], 'glass', deco),
          R(-hl + 0.3, 0.16, hl - 0.4, 0.24, 'light', deco),
        ],
        windows: [],
        wheels: [W(-1.05 * L, 0.4, 0.28 * wk, rim ?? 'disc'), W(1.05 * L, 0.4, 0.28 * wk, rim ?? 'disc')],
        head: { x: -0.12 * L, y: -0.5, r: 0.27 },
        deck: { x0: -hl, x1: -0.8 * L, y: -0.3 }, roof: { x0: -0.5, x1: 0.25, y: -0.76 },
        nose: { x: hl + 0.1, y0: -0.2, y1: 0.16 }, tail: { x: -hl, y0: -0.3, y1: 0.16 }, stripe: { y: -0.12, h: 0.07 },
        float: 0.8,
      };
    }
    case 'tractor': {
      const wr0 = 0.62 * wk, wr1 = 0.36 * wk;
      return {
        arch: 'heavy', tune: { accel: 1.25 },
        polys: [
          P([[-0.4, -0.35], [1.5 * L, -0.3], [1.62 * L, 0.0], [1.55 * L, 0.22], [-0.4, 0.22]], m),
          R(-1.3, -0.25, -0.35, 0.18, m),
          R(-1.25, -1.15 * H, -1.12, -0.25, 'dark'),
          R(-0.45, -1.15 * H, -0.32, -0.35, 'dark'),
          R(-1.35, -1.27 * H, -0.25, -1.13 * H, 'accent'),
          R(0.9 * L, -0.75, 1.02 * L, -0.3, 'metal'),
        ],
        windows: [],
        wheels: [W(-0.8, 0.38, wr0, rim ?? 'monster'), W(1.15 * L, 0.48, wr1, rim ?? 'disc', { drive: false })],
        head: { x: -0.78, y: -0.62, r: 0.28 },
        deck: { x0: -0.3, x1: 0.85 * L, y: -0.33 }, roof: { x0: -1.35, x1: -0.25, y: -1.27 * H },
        nose: { x: 1.62 * L, y0: -0.3, y1: 0.22 }, tail: { x: -1.3, y0: -0.25, y1: 0.18 },
      };
    }
    case 'loco': {
      const hl = 1.9 * L;
      return {
        arch: 'heavy', tune: { accel: 1.25 },
        polys: [
          P([[-0.3, -0.62], [hl - 0.25, -0.62], [hl, -0.4], [hl, 0.18], [-0.3, 0.18]], m),
          R(-hl, -0.38, -0.3, 0.3, m),
          R(-hl - 0.08, -1.25 * H, -0.2, -1.12 * H, 'dark'),
          R(-hl, -1.12 * H, -hl + 0.16, -0.38, m),
          P([[0.95 * L, -0.62], [1.2 * L, -0.62], [1.28 * L, -1.05], [0.88 * L, -1.05]], 'dark'),
          P([[hl - 0.05, -0.1], [hl + 0.3, 0.2], [hl - 0.05, 0.2]], 'metal'),
          R(-0.3, 0.18, hl - 0.05, 0.3, 'dark'),
        ],
        windows: [],
        wheels: [W(-hl + 0.6, 0.42, 0.38 * wk, rim ?? 'spokes'), W(0.25, 0.42, 0.38 * wk, rim ?? 'spokes'), W(hl - 0.55, 0.42, 0.38 * wk, rim ?? 'spokes')],
        head: { x: -hl + 0.75, y: -0.66, r: 0.28 },
        deck: { x0: -0.2, x1: 0.85 * L, y: -0.62 }, roof: { x0: -hl, x1: -0.2, y: -1.25 * H },
        nose: { x: hl + 0.3, y0: -0.4, y1: 0.3 }, tail: { x: -hl - 0.08, y0: -0.38, y1: 0.3 }, stripe: { y: -0.3, h: 0.08 },
      };
    }
    case 'robot': {
      const hw = 0.6 * L;
      const top = -1.25 * H;
      return {
        arch: 'tall', tune: { wheelie: 0.6 },
        polys: [
          R(-1.0 * L, 0.0, 1.0 * L, 0.24, 'dark'),
          P([[-hw, top + 0.15], [-hw + 0.15, top], [hw - 0.15, top], [hw, top + 0.15], [hw, 0.0], [-hw, 0.0]], m),
          R(-hw - 0.35, top + 0.25, -hw, top + 0.85, 'metal'),
          R(hw, top + 0.25, hw + 0.35, top + 0.85, 'metal'),
        ],
        windows: [[[-hw + 0.15, top + 0.25], [hw - 0.15, top + 0.25], [hw - 0.15, top + 0.5], [-hw + 0.15, top + 0.5]]],
        wheels: [W(-0.85 * L, 0.42, 0.34 * wk, rim ?? 'disc'), W(0.85 * L, 0.42, 0.34 * wk, rim ?? 'disc')],
        head: { x: 0, y: top - 0.2, r: 0.3 },
        deck: { x0: -hw, x1: hw, y: top }, roof: { x0: -hw, x1: hw, y: top },
        nose: { x: hw + 0.35, y0: top + 0.25, y1: -0.1 }, tail: { x: -hw - 0.35, y0: top + 0.25, y1: 0.24 },
        com: [0, 0.55],
      };
    }
    case 'box': {
      const hl = 1.5 * L;
      const top = -0.9 * H;
      return {
        arch: 'heavy',
        polys: [R(-hl, top, hl, 0.3, m)],
        windows: [[[hl - 0.7, top + 0.12], [hl - 0.12, top + 0.12], [hl - 0.12, top + 0.48], [hl - 0.7, top + 0.48]]],
        wheels: [W(-hl + 0.55, 0.38, 0.42 * wk, rim ?? 'disc'), W(hl - 0.55, 0.38, 0.42 * wk, rim ?? 'disc')],
        head: { x: hl - 1.05, y: top - 0.12, r: 0.28 },
        deck: { x0: -hl, x1: hl - 1.5, y: top }, roof: { x0: -hl, x1: hl, y: top },
        nose: { x: hl, y0: top, y1: 0.3 }, tail: { x: -hl, y0: top, y1: 0.3 }, stripe: { y: 0.0, h: 0.09 },
        com: [0, 0.3],
      };
    }
  }
}

// ---------------------------------------------------------------- parts

export type PartId =
  | 'ladder' | 'logs' | 'drum' | 'tank' | 'cargo' | 'barrels' | 'crane' | 'tree' | 'gifts' | 'balls' | 'ball' | 'cage'
  | 'cannon' | 'twincannon' | 'launcher' | 'dish' | 'cone' | 'siren' | 'sign' | 'ram' | 'spikes' | 'scoop' | 'blade'
  | 'forks' | 'saw' | 'jaw' | 'horns' | 'drill' | 'claw' | 'plow' | 'wing' | 'fin' | 'exhaust' | 'booster' | 'tail'
  | 'plates' | 'roofspikes' | 'wings' | 'sail' | 'antenna' | 'eyes' | 'skull' | 'coffin' | 'pumpkin' | 'dome'
  | 'crystals' | 'tentacles' | 'net' | 'lantern' | 'mace' | 'crest' | 'trunk' | 'boom' | 'chimney' | 'bucketarm'
  | 'roller' | 'gun' | 'bones' | 'ribs' | 'fangs' | 'teeth' | 'toast' | 'bubble' | 'flag' | 'umbrella' | 'rails'
  | 'lid' | 'bigwheel' | 'mohawk' | 'ears' | 'snout' | 'trailer' | 'hump' | 'stack' | 'propeller' | 'jets' | 'seat';

type Part = PartId | [PartId, number?];

function part(f: Frame, id: PartId, k = 1): { polys: CarPoly[]; windows?: Pt[][]; boost?: boolean; arch?: Archetype } {
  const d = f.deck, n = f.nose, t = f.tail;
  // Roof gear goes on whichever end of the roof is farther from the driver's head.
  const hx = f.head.x;
  const rw = Math.min(0.6, f.roof.x1 - f.roof.x0);
  const leftFar = Math.abs(f.roof.x0 + rw / 2 - hx) > Math.abs(f.roof.x1 - rw / 2 - hx);
  const r = leftFar ? { x0: f.roof.x0, x1: f.roof.x0 + rw, y: f.roof.y } : { x0: f.roof.x1 - rw, x1: f.roof.x1, y: f.roof.y };
  const dl = d.x1 - d.x0, dm = (d.x0 + d.x1) / 2;
  const ny = (n.y0 + n.y1) / 2;
  switch (id) {
    case 'ladder':
      return { polys: [R(d.x0 - 0.1, d.y - 0.42, d.x1 + 0.7, d.y - 0.3, 'metal'), R(dm - 0.06, d.y - 0.3, dm + 0.06, d.y, 'dark')] };
    case 'logs': {
      const rr = Math.min(0.2, dl / 6);
      const polys: CarPoly[] = [];
      for (let i = 0; i < 3; i++) polys.push(R(d.x0 - 0.15, d.y - rr * 2 * (i + 1) + 0.01, d.x1 + 0.15, d.y - rr * 2 * i - 0.01, 'wood'));
      polys.push(R(d.x0 + 0.05, d.y - rr * 6 - 0.05, d.x0 + 0.13, d.y, 'dark'));
      return { polys };
    }
    case 'drum':
      return { polys: [P([[d.x0 + 0.05, d.y - 0.15], [d.x0 + 0.3, d.y - 0.75], [d.x1 - 0.05, d.y - 0.85], [d.x1 + 0.05, d.y - 0.45], [d.x1 - 0.2, d.y - 0.05]], 'accent', { density: 0.6 })] };
    case 'tank':
      return { polys: [O(dm, d.y - 0.38, dl / 2, 0.38, 'metal', { density: 0.6 })] };
    case 'cargo':
      return { polys: [R(d.x0, d.y - 0.8 * k, d.x1, d.y, 'accent', { density: 0.5 })] };
    case 'barrels': {
      const polys: CarPoly[] = [];
      const nB = Math.max(1, Math.floor(dl / 0.42));
      for (let i = 0; i < nB; i++) polys.push(R(d.x0 + 0.04 + i * 0.42, d.y - 0.5, d.x0 + 0.38 + i * 0.42, d.y, 'scoop', { density: 0.6 }));
      return { polys };
    }
    case 'crane':
      return { polys: [P([[d.x0 + 0.1, d.y], [d.x0 + 0.35, d.y], [d.x1 + 0.9, d.y - 1.25], [d.x1 + 0.75, d.y - 1.35]], 'scoop', { density: 0.4 }), R(d.x1 + 0.72, d.y - 1.35, d.x1 + 0.8, d.y - 0.75, 'dark', deco)] };
    case 'boom':
      return { polys: [P([[d.x0 + 0.2, d.y], [d.x0 + 0.45, d.y], [d.x0 + 0.55, d.y - 1.4], [d.x0 + 0.38, d.y - 1.45]], 'scoop', { density: 0.4 }), R(d.x0 + 0.25, d.y - 1.6, d.x0 + 0.8, d.y - 1.4, 'accent', { density: 0.4 })] };
    case 'tree':
      return {
        polys: [
          T([dm - 0.6, d.y - 0.1], [dm + 0.6, d.y - 0.1], [dm, d.y - 0.75], 'leaf', { density: 0.3 }),
          T([dm - 0.45, d.y - 0.55], [dm + 0.45, d.y - 0.55], [dm, d.y - 1.15], 'leaf', { density: 0.3 }),
          T([dm - 0.3, d.y - 0.95], [dm + 0.3, d.y - 0.95], [dm, d.y - 1.45], 'leaf', { density: 0.3 }),
          O(dm, d.y - 1.5, 0.1, 0.1, 'gold', deco, 5, -Math.PI / 2),
          R(dm - 0.08, d.y - 0.12, dm + 0.08, d.y, 'wood'),
        ],
      };
    case 'gifts':
      return { polys: [R(d.x0 + 0.05, d.y - 0.45, dm - 0.02, d.y, 'accent', { density: 0.5 }), R(dm + 0.02, d.y - 0.35, d.x1 - 0.05, d.y, 'rocket', { density: 0.5 }), R(d.x0 + 0.25, d.y - 0.45, d.x0 + 0.33, d.y, 'gold', deco)] };
    case 'balls': {
      const polys: CarPoly[] = [];
      const nb = Math.max(1, Math.floor(dl / 0.42));
      for (let i = 0; i < nb; i++) polys.push(O(d.x0 + 0.21 + i * 0.42, d.y - 0.21, 0.2, 0.2, 'white', { density: 0.3 }));
      return { polys };
    }
    case 'ball':
      return { polys: [O(dm, d.y - 0.45 * k, 0.45 * k, 0.45 * k, 'white', { density: 0.3 })] };
    case 'cage':
      return { polys: [R(d.x0, d.y - 0.75, d.x0 + 0.08, d.y, 'metal'), R(d.x1 - 0.08, d.y - 0.75, d.x1, d.y, 'metal'), R(d.x0, d.y - 0.83, d.x1, d.y - 0.75, 'metal'), R(dm - 0.04, d.y - 0.75, dm + 0.04, d.y, 'metal', deco)] };
    case 'cannon':
      return { polys: [O(dm, d.y - 0.18, 0.32, 0.22, 'dark'), P([[dm, d.y - 0.32], [dm + 0.12, d.y - 0.14], [dm + 1.1 * k, d.y - 0.62], [dm + 1.02 * k, d.y - 0.8]], 'metal', { density: 0.5 })] };
    case 'twincannon':
      return { polys: [O(dm, d.y - 0.18, 0.32, 0.22, 'dark'), P([[dm, d.y - 0.3], [dm + 0.1, d.y - 0.16], [dm + 1.0, d.y - 0.5], [dm + 0.95, d.y - 0.64]], 'metal', { density: 0.4 }), P([[dm - 0.1, d.y - 0.36], [dm, d.y - 0.26], [dm + 0.9, d.y - 0.8], [dm + 0.82, d.y - 0.92]], 'metal', { density: 0.4 })] };
    case 'launcher':
      return { polys: [P([[d.x0, d.y], [d.x1, d.y], [d.x1 - 0.1, d.y - 0.5], [d.x0 + 0.2, d.y - 0.85]], 'dark', { density: 0.5 }), R(d.x0 + 0.3, d.y - 0.7, d.x0 + 0.42, d.y - 0.58, 'rocket', deco), R(d.x0 + 0.55, d.y - 0.62, d.x0 + 0.67, d.y - 0.5, 'rocket', deco)] };
    case 'dish':
      return { polys: [R(dm - 0.05, d.y - 0.5, dm + 0.05, d.y, 'metal'), P([[dm - 0.45, d.y - 0.85], [dm + 0.15, d.y - 0.45], [dm + 0.05, d.y - 0.42], [dm - 0.5, d.y - 0.7]], 'white')] };
    case 'cone':
      return { polys: [T([r.x0 + 0.15, r.y - 0.35], [r.x0 + 0.45, r.y - 0.35], [r.x0 + 0.3, r.y], 'scoop'), O(r.x0 + 0.3, r.y - 0.45, 0.2, 0.16, 'white')] };
    case 'siren':
      return { polys: [R(r.x0 + (r.x1 - r.x0) * 0.25, r.y - 0.12, r.x0 + (r.x1 - r.x0) * 0.5, r.y, 'rocket'), R(r.x0 + (r.x1 - r.x0) * 0.5, r.y - 0.12, r.x0 + (r.x1 - r.x0) * 0.75, r.y, 'glass')] };
    case 'sign':
      return { polys: [P([[r.x0 + (r.x1 - r.x0) * 0.3, r.y], [r.x0 + (r.x1 - r.x0) * 0.7, r.y], [r.x0 + (r.x1 - r.x0) * 0.62, r.y - 0.18], [r.x0 + (r.x1 - r.x0) * 0.38, r.y - 0.18]], 'accent')] };
    case 'ram':
      return { polys: [P([[n.x - 0.15, n.y0 - 0.02], [n.x + 0.18, n.y0 + 0.06], [n.x + 0.25, n.y1 - 0.06], [n.x - 0.15, n.y1 + 0.02]], 'metal', { density: 2.5 })], arch: 'ram' };
    case 'spikes':
      return {
        polys: [
          T([n.x - 0.05, n.y0], [n.x - 0.05, ny], [n.x + 0.5 * k, (n.y0 + ny) / 2], 'spike'),
          T([n.x - 0.05, ny], [n.x - 0.05, n.y1], [n.x + 0.5 * k, (ny + n.y1) / 2], 'spike'),
        ],
        arch: 'spike',
      };
    case 'roofspikes': {
      const polys: CarPoly[] = [];
      const w = r.x1 - r.x0;
      for (let i = 0; i < 3; i++) {
        const x = r.x0 + w * (0.15 + i * 0.32);
        if (Math.abs(x - f.head.x) < f.head.r + 0.12) continue;
        polys.push(T([x - 0.12, r.y], [x + 0.12, r.y], [x, r.y - 0.35], 'spike', deco));
      }
      polys.push(T([t.x + 0.05, t.y0 + 0.02], [t.x + 0.05, t.y0 + 0.25], [t.x - 0.35, t.y0 + 0.05], 'spike'));
      return { polys, arch: 'spike' };
    }
    case 'scoop':
      return { polys: [R(n.x - 0.2, n.y0 + 0.05, n.x + 0.3, n.y0 + 0.15, 'dark'), P([[n.x + 0.25, n.y0 - 0.25], [n.x + 0.38, n.y0 - 0.25], [n.x + 0.85 * k, n.y1 - 0.05], [n.x + 0.35, n.y1 - 0.02]], 'scoop', { density: 1.2 })], arch: 'scoop' };
    case 'blade':
      return { polys: [R(n.x - 0.1, ny - 0.06, n.x + 0.3, ny + 0.06, 'dark'), P([[n.x + 0.3, n.y0 - 0.55], [n.x + 0.48, n.y0 - 0.45], [n.x + 0.5, n.y1 - 0.06], [n.x + 0.3, n.y1 - 0.06]], 'scoop', { density: 0.6 })], arch: 'ram' };
    case 'plow':
      return { polys: [P([[n.x - 0.05, n.y0], [n.x + 0.15, n.y0 - 0.05], [n.x + 0.7, n.y1 - 0.08], [n.x - 0.05, n.y1 - 0.06]], 'scoop', { density: 0.5 })], arch: 'scoop' };
    case 'forks':
      return { polys: [R(n.x, n.y0 - 0.9, n.x + 0.12, n.y1, 'dark'), R(n.x + 0.12, n.y1 - 0.12, n.x + 1.0, n.y1 - 0.02, 'metal')], arch: 'scoop' };
    case 'saw':
      return { polys: [R(n.x - 0.1, ny - 0.05, n.x + 0.3, ny + 0.05, 'dark'), O(n.x + 0.5 * k, ny - 0.05, 0.38 * k, 0.38 * k, 'spike', { density: 0.4 })], arch: 'spike' };
    case 'jaw':
    case 'teeth':
    case 'fangs': {
      const polys: CarPoly[] = [];
      const cnt = id === 'fangs' ? 2 : 3;
      for (let i = 0; i < cnt; i++) {
        const y = n.y0 + ((n.y1 - n.y0) * (i + 0.5)) / cnt;
        polys.push(T([n.x - 0.05, y - 0.1], [n.x - 0.05, y + 0.1], [n.x + 0.3, y + (id === 'fangs' ? 0.15 : 0)], 'bone', { density: 0.3 }));
      }
      return { polys, arch: 'spike' };
    }
    case 'horns':
      return { polys: [T([r.x1 - 0.25, r.y], [r.x1 - 0.05, r.y + 0.05], [r.x1 + 0.4, r.y - 0.45], 'bone'), T([r.x0 + 0.05, r.y + 0.05], [r.x0 + 0.25, r.y], [r.x0 - 0.3, r.y - 0.4], 'bone', deco)] };
    case 'drill':
      return { polys: [P([[n.x - 0.05, n.y0], [n.x + 0.15, n.y0], [n.x + 0.85 * k, ny], [n.x + 0.15, n.y1], [n.x - 0.05, n.y1]], 'metal', { density: 1.2 })], arch: 'spike' };
    case 'claw':
      return { polys: [P([[n.x - 0.05, n.y0], [n.x + 0.6, n.y0 - 0.35], [n.x + 0.75, n.y0 - 0.2], [n.x + 0.1, ny]], 'body', { density: 0.4 }), P([[n.x - 0.05, ny], [n.x + 0.1, ny], [n.x + 0.75, n.y1 - 0.05], [n.x + 0.6, n.y1 + 0.0]], 'accent', { density: 0.4 })], arch: 'ram' };
    case 'bucketarm':
      return { polys: [P([[n.x - 0.6, n.y0 - 0.1], [n.x - 0.4, n.y0 - 0.2], [n.x + 0.7, n.y0 - 1.1], [n.x + 0.55, n.y0 - 1.25]], 'scoop', { density: 0.5 }), P([[n.x + 0.55, n.y0 - 1.15], [n.x + 0.75, n.y0 - 1.2], [n.x + 1.0, n.y1 - 0.2], [n.x + 0.75, n.y1 - 0.15]], 'scoop', { density: 0.4 }), P([[n.x + 0.75, n.y1 - 0.4], [n.x + 1.0, n.y1 - 0.2], [n.x + 0.7, n.y1 - 0.08], [n.x + 0.5, n.y1 - 0.2]], 'dark', { density: 0.4 })], arch: 'scoop' };
    case 'roller':
      return { polys: [R(n.x - 0.2, n.y0, n.x + 0.25, n.y0 + 0.12, 'dark'), O(n.x + 0.42, n.y1 - 0.2, 0.36, 0.36, 'metal', { density: 0.6 })], arch: 'ram' };
    case 'wing':
      return { polys: [R(t.x - 0.05, t.y0 - 0.45, t.x + 0.55, t.y0 - 0.33, 'dark', { density: 0.2 }), R(t.x + 0.2, t.y0 - 0.33, t.x + 0.3, t.y0, 'dark', { density: 0.2 })] };
    case 'fin':
      return { polys: [T([t.x + 0.05, t.y0], [t.x + 0.65, t.y0], [t.x - 0.05, t.y0 - 0.55 * k], 'accent')] };
    case 'exhaust':
      return { polys: [R(r.x0 - 0.28, r.y - 0.25 * k - 0.1, r.x0 - 0.16, d.y, 'metal'), R(r.x0 - 0.12, r.y - 0.25 * k, r.x0 - 0.0, d.y, 'metal')] };
    case 'stack':
      return { polys: [R(r.x1 - 0.2, r.y - 0.5 * k, r.x1 - 0.06, r.y, 'metal')] };
    case 'chimney':
      return { polys: [P([[n.x - 0.7, n.y0], [n.x - 0.45, n.y0], [n.x - 0.38, n.y0 - 0.45], [n.x - 0.77, n.y0 - 0.45]], 'dark')] };
    case 'booster':
      return { polys: [R(t.x - 0.32, t.y0 + 0.02, t.x + 0.05, t.y1 - 0.06, 'rocket'), R(t.x - 0.4, t.y0 + 0.08, t.x - 0.3, t.y1 - 0.12, 'dark')], boost: true, arch: 'rocket' };
    case 'jets':
      return { polys: [R(t.x - 0.3, t.y0 + 0.05, t.x + 0.1, t.y0 + 0.2, 'rocket'), R(t.x - 0.3, t.y1 - 0.25, t.x + 0.1, t.y1 - 0.1, 'rocket')], boost: true };
    case 'tail':
      return { polys: [P([[t.x + 0.25, t.y0], [t.x + 0.25, t.y1 - 0.1], [t.x - 0.95 * k, (t.y0 + t.y1) / 2 - 0.1]], 'body')] };
    case 'mace':
      return { polys: [P([[t.x + 0.25, t.y0], [t.x + 0.25, t.y1 - 0.1], [t.x - 0.75, (t.y0 + t.y1) / 2 - 0.1]], 'body'), O(t.x - 0.85, (t.y0 + t.y1) / 2 - 0.1, 0.22, 0.2, 'bone', { density: 1.2 })] };
    case 'plates': {
      const polys: CarPoly[] = [];
      for (let i = 0; i < 4; i++) {
        const x = d.x0 + 0.1 + i * ((dl + 0.4) / 4);
        if (Math.abs(x - f.head.x) < f.head.r + 0.1) continue;
        polys.push(T([x - 0.16, d.y + 0.05], [x + 0.16, d.y + 0.05], [x, d.y - 0.4], 'accent', deco));
      }
      return { polys };
    }
    case 'crest':
      return { polys: [T([n.x - 0.35, n.y0], [n.x - 0.15, n.y0], [n.x - 0.95, n.y0 - 0.55], 'accent', deco)] };
    case 'mohawk':
      return { polys: [T([n.x - 0.5, n.y0 + 0.02], [n.x - 0.15, n.y0 + 0.02], [n.x - 0.4, n.y0 - 0.32], 'accent', deco)] };
    case 'ears':
      return { polys: [T([n.x - 0.45, n.y0 + 0.02], [n.x - 0.25, n.y0 + 0.02], [n.x - 0.42, n.y0 - 0.3], 'body', deco)] };
    case 'snout':
      return { polys: [R(n.x - 0.1, n.y0 + 0.05, n.x + 0.25, n.y1 + 0.05, 'accent')] };
    case 'trunk':
      return { polys: [P([[n.x - 0.15, n.y0], [n.x + 0.1, n.y0 + 0.1], [n.x + 0.2, n.y1 + 0.55], [n.x + 0.02, n.y1 + 0.55]], 'body'), T([n.x - 0.1, n.y1], [n.x + 0.05, n.y1 + 0.05], [n.x + 0.5, n.y1 - 0.25], 'bone', deco)] };
    case 'wings':
      return { polys: [T([d.x0, d.y + 0.05], [d.x1, d.y + 0.05], [d.x0 - 0.5, d.y - 0.95 * k], 'accent', deco), T([d.x0 + 0.2, d.y + 0.05], [d.x1 + 0.1, d.y + 0.05], [d.x1 - 0.3, d.y - 0.75 * k], 'accent', deco)] };
    case 'sail':
      return { polys: [R(dm - 0.04, d.y - 1.6, dm + 0.04, d.y, 'wood', deco), T([dm + 0.05, d.y - 1.55], [dm + 0.05, d.y - 0.2], [dm + 0.9, d.y - 0.25], 'white', deco)] };
    case 'antenna':
      return { polys: [R(r.x0 + 0.08, r.y - 0.55, r.x0 + 0.13, r.y, 'metal', deco), O(r.x0 + 0.105, r.y - 0.6, 0.08, 0.08, 'light', deco, 6)] };
    case 'eyes':
      return { polys: [O(n.x - 0.35, n.y0 + 0.12, 0.12, 0.12, 'white', deco, 6), O(n.x - 0.31, n.y0 + 0.12, 0.065, 0.065, 'dark', deco, 6)] };
    case 'skull':
      return { polys: [O(n.x - 0.32, n.y0 - 0.12, 0.3, 0.26, 'bone'), O(n.x - 0.24, n.y0 - 0.16, 0.06, 0.07, 'dark', deco, 6), R(n.x - 0.42, n.y0 + 0.02, n.x - 0.2, n.y0 + 0.12, 'bone', deco)] };
    case 'coffin':
      return { polys: [P([[d.x0 + 0.05, d.y - 0.12], [d.x0 + 0.25, d.y - 0.4], [d.x1 - 0.15, d.y - 0.4], [d.x1, d.y - 0.12], [d.x1 - 0.15, d.y], [d.x0 + 0.25, d.y]], 'wood', { density: 0.6 }), R(dm - 0.03, d.y - 0.36, dm + 0.03, d.y - 0.06, 'gold', deco)] };
    case 'pumpkin':
      return { polys: [O(dm, d.y - 0.32 * k, 0.4 * k, 0.32 * k, 'scoop', { density: 0.4 }), R(dm - 0.04, d.y - 0.72 * k, dm + 0.06, d.y - 0.6 * k, 'leaf', deco)] };
    case 'dome':
      return { polys: [O(f.head.x, f.head.y + 0.05, f.head.r + 0.16, f.head.r + 0.14, 'glass', deco)] };
    case 'bubble':
      return { polys: [O(d.x0 + 0.3, d.y - 0.32, 0.25, 0.25, 'glass', deco), O(d.x0 + 0.65, d.y - 0.62, 0.18, 0.18, 'glass', deco), O(d.x0 + 0.2, d.y - 0.85, 0.14, 0.14, 'glass', deco)] };
    case 'crystals':
      return { polys: [T([d.x0 + 0.05, d.y], [d.x0 + 0.4, d.y], [d.x0 + 0.15, d.y - 0.7], 'glass'), T([d.x0 + 0.35, d.y], [d.x0 + 0.75, d.y], [d.x0 + 0.6, d.y - 0.5], 'light')] };
    case 'tentacles': {
      const polys: CarPoly[] = [];
      for (let i = 0; i < 3; i++) polys.push(P([[t.x + 0.25, t.y0 + i * 0.12], [t.x + 0.25, t.y0 + i * 0.12 + 0.12], [t.x - 0.7, t.y0 + 0.2 + i * 0.25]], 'accent', deco));
      return { polys };
    }
    case 'net':
      return { polys: [R(d.x0, d.y - 0.8, d.x0 + 0.08, d.y, 'white'), R(d.x0, d.y - 0.85, d.x1, d.y - 0.77, 'white'), R(d.x0 + 0.08, d.y - 0.77, d.x1, d.y, 'metal', deco)] };
    case 'lantern':
      return { polys: [R(r.x0 + 0.1, r.y - 0.7, r.x0 + 0.15, r.y, 'wood', deco), O(r.x0 + 0.125, r.y - 0.75, 0.16, 0.2, 'rocket', deco), R(r.x0 + 0.04, r.y - 0.99, r.x0 + 0.21, r.y - 0.93, 'gold', deco)] };
    case 'gun':
      return { polys: [R(r.x0 + 0.1, r.y - 0.25, r.x0 + 0.3, r.y, 'dark'), R(r.x0 + 0.3, r.y - 0.2, r.x0 + 0.95, r.y - 0.12, 'metal')] };
    case 'bones':
    case 'ribs': {
      const polys: CarPoly[] = [];
      for (let i = 0; i < 4; i++) {
        const x = d.x0 + 0.1 + i * (dl / 4);
        polys.push(R(x, d.y - 0.45, x + 0.08, d.y, 'bone', deco));
      }
      polys.push(R(d.x0, d.y - 0.5, d.x1, d.y - 0.42, 'bone'));
      return { polys };
    }
    case 'toast':
      return { polys: [R(r.x0 + 0.15, r.y - 0.35, r.x0 + 0.5, r.y + 0.05, 'wood'), R(r.x0 + 0.6, r.y - 0.28, r.x0 + 0.95, r.y + 0.05, 'wood')] };
    case 'flag':
      return { polys: [R(t.x + 0.1, t.y0 - 0.9, t.x + 0.15, t.y0, 'metal', deco), T([t.x + 0.15, t.y0 - 0.9], [t.x + 0.15, t.y0 - 0.6], [t.x + 0.6, t.y0 - 0.75], 'accent', deco)] };
    case 'umbrella':
      return { polys: [R(d.x0 + 0.2, d.y - 1.0, d.x0 + 0.25, d.y, 'metal', deco), P([[d.x0 - 0.35, d.y - 0.9], [d.x0 + 0.225, d.y - 1.25], [d.x0 + 0.8, d.y - 0.9]], 'accent', deco)] };
    case 'rails':
      return { polys: [R(d.x0, d.y - 0.3, d.x1, d.y - 0.24, 'metal', deco), R(d.x0, d.y - 0.3, d.x0 + 0.06, d.y, 'metal', deco), R(d.x1 - 0.06, d.y - 0.3, d.x1, d.y, 'metal', deco)] };
    case 'lid':
      return { polys: [P([[r.x0, r.y], [r.x1, r.y], [r.x1 - 0.1, r.y - 0.15], [r.x0 + 0.1, r.y - 0.15]], 'white', deco)] };
    case 'bigwheel':
      return { polys: [O(d.x0 + 0.1, d.y - 0.35, 0.36, 0.36, 'dark', deco)] };
    case 'trailer':
      return { polys: [R(t.x - 1.3, t.y0 - 0.4, t.x - 0.25, t.y1 - 0.16, 'white', { density: 0.2 }), R(t.x - 0.28, t.y1 - 0.24, t.x + 0.05, t.y1 - 0.16, 'dark', deco)] };
    case 'hump':
      return { polys: [O(dm, d.y + 0.02, dl / 2, 0.32, 'body')] };
    case 'propeller':
      return { polys: [R(t.x - 0.1, t.y0 - 0.65, t.x - 0.02, t.y0, 'metal', deco), R(t.x - 0.08, t.y0 - 1.05, t.x - 0.0, t.y0 - 0.25, 'dark', deco)] };
    case 'seat':
      return { polys: [R(d.x0 + 0.05, d.y - 0.35, d.x0 + 0.18, d.y, 'dark')] };
  }
}

// ---------------------------------------------------------------- physics presets

interface Preset { speed: number; accel: number; hz: number; damping: number; travel: number; mass: number; grip: number; air: number; wheelie: number }

const PRESETS: Record<Archetype, Preset> = {
  allround: { speed: 15, accel: 15, hz: 4.2, damping: 0.6, travel: 0.22, mass: 4.6, grip: 1.25, air: 14, wheelie: 0.45 },
  heavy: { speed: 12.8, accel: 11.5, hz: 3.6, damping: 0.7, travel: 0.2, mass: 7.0, grip: 1.3, air: 9.5, wheelie: 0.4 },
  fast: { speed: 18.6, accel: 16, hz: 5.0, damping: 0.55, travel: 0.16, mass: 4.0, grip: 1.2, air: 15, wheelie: 0.35 },
  monster: { speed: 12.8, accel: 13, hz: 2.8, damping: 0.5, travel: 0.36, mass: 5.0, grip: 1.2, air: 10, wheelie: 0.4 },
  tiny: { speed: 15.5, accel: 15, hz: 5.4, damping: 0.6, travel: 0.14, mass: 2.6, grip: 1.3, air: 18, wheelie: 0.3 },
  long: { speed: 14, accel: 12.5, hz: 3.9, damping: 0.65, travel: 0.2, mass: 6.2, grip: 1.25, air: 10, wheelie: 0.35 },
  scoop: { speed: 12.6, accel: 12.5, hz: 4.0, damping: 0.65, travel: 0.2, mass: 6.0, grip: 1.3, air: 11, wheelie: 0.4 },
  ram: { speed: 13.6, accel: 13, hz: 4.0, damping: 0.65, travel: 0.2, mass: 6.0, grip: 1.3, air: 11, wheelie: 0.4 },
  spike: { speed: 14, accel: 13.5, hz: 4.0, damping: 0.6, travel: 0.2, mass: 5.0, grip: 1.25, air: 12, wheelie: 0.4 },
  rocket: { speed: 15.5, accel: 14, hz: 4.6, damping: 0.6, travel: 0.18, mass: 4.4, grip: 1.2, air: 13, wheelie: 0.3 },
  tall: { speed: 13.5, accel: 13, hz: 3.8, damping: 0.65, travel: 0.2, mass: 5.0, grip: 1.3, air: 12, wheelie: 0.3 },
  bouncy: { speed: 15, accel: 15, hz: 3.2, damping: 0.35, travel: 0.26, mass: 4.0, grip: 1.25, air: 15, wheelie: 0.45 },
};

// ---------------------------------------------------------------- builder

export interface CarSpec {
  id: string;
  name: string;
  cat: CategoryId;
  blurb: string;
  frame: FrameId;
  /** [body, accent] colours; dark/glass/light are derived unless given. */
  col: [string, string, string?];
  o?: FrameOpts;
  parts?: Part[];
  arch?: Archetype;
  /** Uniform scale of the whole car. */
  s?: number;
  /** Loose cargo in the bed at round start. */
  cargo?: [ItemKind, number];
  /** Weight on a chain, hung from a frame anchor. */
  flail?: { from: 'deck' | 'roof' | 'tail' | 'nose' | Pt; len: number; r: number; look: FlailDef['look'] };
  /** Extra drawing on top of the frame (render-only unless a poly sets deco: false). */
  art?: (f: Frame) => CarPoly[];
  /** No head/tail light pixels (creatures, blobs…). */
  noLights?: boolean;
  /** Air-control multiplier. */
  air?: number;
  /** Extra downward center-of-mass offset (m). */
  ballast?: number;
  /** Wheelie target override (rad). */
  wheelie?: number;
  /** Multipliers on the preset. */
  speed?: number;
  accel?: number;
  mass?: number;
  float?: number;
  bounce?: number;
}

const darken = (h: string, k: number) => {
  const n = parseInt(h.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

const scalePt = (p: Pt, s: number): Pt => [+(p[0] * s).toFixed(3), +(p[1] * s).toFixed(3)];

export function buildCar(spec: CarSpec): CarDef {
  const f = frame(spec.frame, spec.o ?? {});
  const polys = [...f.polys];
  const windows = [...f.windows];
  let boost = false;
  let arch: Archetype = f.arch;
  for (const pp of spec.parts ?? []) {
    const [id, k] = Array.isArray(pp) ? pp : [pp, undefined];
    const r = part(f, id, k ?? 1);
    // A part that would swallow the driver's head becomes render-only.
    for (const p of r.polys) if (!p.deco && (inPoly(p.pts, f.head.x, f.head.y) || inPoly(p.pts, f.head.x, f.head.y - f.head.r * 0.7))) p.deco = true;
    polys.push(...r.polys);
    if (r.windows) windows.push(...r.windows);
    if (r.boost) boost = true;
    if (r.arch) arch = r.arch;
  }
  if (spec.arch) arch = spec.arch;
  if (spec.art) {
    for (const p of spec.art(f)) {
      const q = { ...p, deco: p.deco ?? true };
      if (!q.deco && (inPoly(q.pts, f.head.x, f.head.y) || inPoly(q.pts, f.head.x, f.head.y - f.head.r * 0.7))) q.deco = true;
      polys.push(q);
    }
  }
  const s = spec.s ?? 1;
  const pre = PRESETS[arch];
  const body = polys.map((p) => ({ ...p, pts: p.pts.map((q) => scalePt(q, s)) }));
  const wheels = f.wheels.map((w) => ({ ...w, x: +(w.x * s).toFixed(3), y: +(w.y * s).toFixed(3), r: +Math.min(0.95, Math.max(0.2, w.r * s)).toFixed(3) }));
  const head = { x: +(f.head.x * s).toFixed(3), y: +(f.head.y * s).toFixed(3), r: +Math.min(0.36, Math.max(0.22, f.head.r * Math.sqrt(s))).toFixed(3) };
  // Keep the head clear of the hull it pokes out of when the car is shrunk.
  if (s < 1) head.y = +(head.y - head.r * (1 - s) * 0.6).toFixed(3);
  const [b, a, dk] = spec.col;
  const def: CarDef = {
    id: spec.id,
    name: spec.name,
    category: spec.cat,
    archetype: arch,
    blurb: spec.blurb,
    palette: { body: b, accent: a, dark: dk ?? darken(b, 0.32), glass: '#8fe0ff', light: '#fff2a8' },
    body,
    windows: windows.map((w) => w.map((q) => scalePt(q, s))),
    stripe: f.stripe ? { y: +(f.stripe.y * s).toFixed(3), h: f.stripe.h * s } : undefined,
    wheels,
    suspension: { hz: pre.hz, damping: pre.damping, travel: +(pre.travel * Math.min(1.2, s)).toFixed(3) },
    motor: { torque: 0, speed: +(pre.speed * (spec.speed ?? 1)).toFixed(2) },
    density: 1,
    tireFriction: pre.grip,
    head,
    air: (f.tune?.air ?? pre.air) * (spec.air ?? 1),
    wheelie: spec.wheelie ?? f.tune?.wheelie ?? pre.wheelie,
    com: f.com ? scalePt(f.com, s) : [0, 0.08],
  };
  if (boost) def.boost = { accel: 9, fuel: 1.3, regen: 0.35 };
  if (spec.noLights) def.lights = false;
  if (spec.cargo) {
    const [kind, n] = spec.cargo;
    def.cargo = { kind, n, at: [+(f.deck.x0 * s).toFixed(3), +(f.deck.x1 * s).toFixed(3), +(f.deck.y * s).toFixed(3)] };
  }
  if (spec.flail) {
    const fl = spec.flail;
    const at: Pt = Array.isArray(fl.from) ? fl.from
      : fl.from === 'deck' ? [f.deck.x0 + 0.15, f.deck.y]
      : fl.from === 'roof' ? [f.roof.x1 - 0.1, f.roof.y]
      : fl.from === 'tail' ? [f.tail.x, (f.tail.y0 + f.tail.y1) / 2]
      : [f.nose.x, f.nose.y0];
    def.flail = { at: scalePt(at, s), len: fl.len * s, r: fl.r * s, look: fl.look };
  }
  if (spec.float ?? f.float) def.float = spec.float ?? f.float;
  if (spec.bounce) def.restitution = spec.bounce;
  // Normalize chassis density so the car hits its target mass, then torque for target accel.
  const targetMass = pre.mass * (spec.mass ?? 1) * Math.max(0.8, Math.min(1.25, s));
  const wheelMass = wheels.reduce((m, w) => m + Math.PI * w.r * w.r * (w.density ?? 1.2), 0);
  let fixedMass = 0, freeArea = 0;
  for (const p of body) {
    if (p.deco) continue;
    const ar = polyAreaOf(p.pts);
    if (p.density !== undefined) fixedMass += ar * p.density;
    else freeArea += ar;
  }
  def.density = +Math.max(0.35, Math.min(4, (targetMass - wheelMass - fixedMass) / Math.max(0.1, freeArea))).toFixed(3);
  // Parts bolted to the nose or tail shift the center of mass; shift it back to where
  // the bare frame had it so the car does not dive on landings.
  const comX = (ps: CarPoly[]) => {
    let mx = 0, mm = 0;
    for (const p of ps) {
      if (p.deco) continue;
      const [cx, ar] = centroidX(p.pts);
      const dm = ar * (p.density ?? def.density);
      mx += cx * dm;
      mm += dm;
    }
    return mm > 0 ? mx / mm : 0;
  };
  const nFrame = f.polys.length;
  const shift = comX(body) - comX(body.slice(0, nFrame));
  def.com = [+(-shift).toFixed(3), def.com?.[1] ?? 0];
  // Tall builds (snowmen, cannons on monster trucks…) get some ballast down low.
  const topOf = (ps: CarPoly[]) => Math.min(...ps.filter((p) => !p.deco).flatMap((p) => p.pts.map((q) => q[1])));
  const raised = Math.max(0, topOf(f.polys) - topOf(polys)) * s;
  const ballast = raised * 0.3 + (spec.ballast ?? 0);
  if (ballast > 0 && def.com) def.com = [def.com[0], +(def.com[1] + ballast).toFixed(3)];
  const mass = estimateMass(def);
  const inv = wheels.filter((w) => w.drive ?? true).reduce((acc, w) => acc + 1 / w.r, 0);
  const accel = Math.min(27, Math.max(10, pre.accel * (spec.accel ?? 1) * (f.tune?.accel ?? 1)));
  def.motor.torque = +((accel * mass) / inv).toFixed(2);
  if (def.motor.speed > 18 && mass >= 5) def.motor.speed = 17.5;
  return def;
}

function centroidX(pts: Pt[]): [number, number] {
  let a = 0, cx = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const cr = pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
    a += cr;
    cx += (pts[j][0] + pts[i][0]) * cr;
  }
  if (Math.abs(a) < 1e-9) return [pts[0][0], 0];
  return [cx / (3 * a), Math.abs(a) / 2];
}

function inPoly(pts: Pt[], x: number, y: number) {
  let ins = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

function polyAreaOf(pts: Pt[]) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return Math.abs(a) / 2;
}
