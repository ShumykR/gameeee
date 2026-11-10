import type { RGB } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly, pointInPoly } from '../render/grid';
import type { DecorKind, MapDef, Pt } from './types';
import type { ItemKind, ProjectileKind } from '../cars/types';

/*
 * Background props drawn from code: tombstones, spruces, palms, goals, lanterns…
 * Each grid's origin is its bottom-center so it can be planted on the ground.
 * Some kinds are real objects too (see maps/arena.ts): portals teleport, the loop
 * carries cars round, beams lift, goals score, umbrellas bounce, small props are pushable.
 */

export const DECOR_PAL: (RGB | null)[] = [
  null,
  [16, 14, 22], // 1 outline
  [244, 244, 248], // 2 white
  [190, 194, 206], // 3 light gray
  [130, 134, 150], // 4 gray
  [74, 76, 92], // 5 dark gray
  [30, 28, 36], // 6 black
  [255, 140, 26], // 7 orange
  [200, 90, 16], // 8 orange dark
  [255, 210, 63], // 9 yellow
  [70, 170, 70], // 10 green
  [36, 110, 50], // 11 green dark
  [140, 90, 50], // 12 brown
  [92, 58, 34], // 13 brown dark
  [224, 52, 56], // 14 red
  [150, 28, 36], // 15 red dark
  [60, 130, 230], // 16 blue
  [36, 76, 160], // 17 blue dark
  [140, 80, 220], // 18 purple
  [84, 44, 150], // 19 purple dark
  [94, 240, 255], // 20 cyan glow
  [255, 122, 208], // 21 pink
  [240, 224, 192], // 22 cream
  [242, 207, 122], // 23 sand
  [200, 160, 80], // 24 sand dark
  [240, 190, 50], // 25 gold
  [40, 170, 160], // 26 teal
  [140, 255, 90], // 27 lime glow
  [255, 120, 30], // 28 lava
  [150, 140, 130], // 29 stone
  [100, 92, 86], // 30 stone dark
  [200, 214, 236], // 31 snow shadow
  [120, 210, 100], // 32 leaf light
];

const C = {
  O: 1, W: 2, LG: 3, G: 4, DG: 5, K: 6, OR: 7, ORD: 8, Y: 9, GR: 10, GRD: 11, BR: 12, BRD: 13, R: 14, RD: 15,
  B: 16, BD: 17, PU: 18, PUD: 19, CY: 20, PK: 21, CR: 22, SA: 23, SAD: 24, GO: 25, TE: 26, LI: 27, LV: 28, ST: 29, STD: 30, SN: 31, LL: 32,
} as const;

/** Tiny raster painter with an automatic 1px outline pass. */
class Pen {
  g: PixelGrid;
  constructor(readonly w: number, readonly h: number) {
    // 1px margin all round for the outline; origin = bottom-center.
    this.g = makeGrid(w + 2, h + 2, (w + 2) / 2, h + 1);
  }
  px(x: number, y: number, c: number) {
    gset(this.g, Math.round(x) + 1, Math.round(y) + 1, c);
  }
  rect(x: number, y: number, w: number, h: number, c: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c);
  }
  ell(cx: number, cy: number, rx: number, ry: number, c: number, pick?: (dx: number, dy: number) => number | null) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        const v = pick ? pick(dx, dy) : c;
        if (v !== null) this.px(x, y, v ?? c);
      }
  }
  poly(pts: Pt[], c: number) {
    fillPoly(pts.map(([x, y]) => [x + 1, y + 1] as Pt), this.g.w, this.g.h, (x, y) => gset(this.g, x, y, c));
  }
  line(x0: number, y0: number, x1: number, y1: number, c: number, t = 1) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      this.rect(Math.round(x - (t - 1) / 2), Math.round(y - (t - 1) / 2), t, t, c);
    }
  }
  done(): PixelGrid {
    const g = this.g;
    const src = Uint8Array.from(g.data);
    for (let y = 0; y < g.h; y++)
      for (let x = 0; x < g.w; x++) {
        if (src[y * g.w + x]) continue;
        const near = (dx: number, dy: number) => {
          const xx = x + dx, yy = y + dy;
          return xx >= 0 && yy >= 0 && xx < g.w && yy < g.h && src[yy * g.w + xx] && src[yy * g.w + xx] !== C.O;
        };
        if (near(1, 0) || near(-1, 0) || near(0, 1) || near(0, -1)) gset(g, x, y, C.O);
      }
    return g;
  }
}

const rnd = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
};

export function decorGrid(kind: DecorKind, seed = 0): PixelGrid {
  const r = rnd(seed + 7);
  switch (kind) {
    case 'tombstone': {
      const p = new Pen(12, 18);
      p.rect(0, 5, 12, 13, C.ST);
      p.ell(6, 5.5, 6, 5.5, C.ST);
      p.rect(0, 14, 12, 4, C.STD);
      p.rect(5, 5, 2, 7, C.STD);
      p.rect(3, 7, 6, 2, C.STD);
      p.rect(1, 2 + Math.floor(r() * 3), 2, 2, C.GR);
      return p.done();
    }
    case 'cross': {
      const p = new Pen(10, 18);
      p.rect(4, 0, 3, 18, C.BRD);
      p.rect(0, 4, 11, 3, C.BRD);
      p.rect(4, 0, 1, 18, C.BR);
      return p.done();
    }
    case 'pumpkin': {
      const p = new Pen(18, 14);
      p.ell(9, 8, 8.6, 6, C.OR, (dx) => (Math.abs(dx) > 0.35 && Math.abs(dx) < 0.48 ? C.ORD : C.OR));
      p.rect(8, 0, 2, 3, C.GRD);
      p.poly([[4, 6], [7, 6], [5.5, 4]], C.Y);
      p.poly([[11, 6], [14, 6], [12.5, 4]], C.Y);
      p.poly([[4, 9], [14, 9], [12, 12], [6, 12]], C.Y);
      p.rect(7, 9, 1, 1, C.OR);
      p.rect(10, 11, 1, 1, C.OR);
      return p.done();
    }
    case 'deadtree': {
      const p = new Pen(30, 40);
      p.poly([[12, 40], [18, 40], [16.5, 14], [14, 14]], C.BRD);
      p.line(15, 22, 5, 10, C.BRD, 2);
      p.line(5, 10, 2, 11, C.BRD, 1);
      p.line(5, 10, 6, 3, C.BRD, 1);
      p.line(15, 16, 25, 6, C.BRD, 2);
      p.line(25, 6, 28, 7, C.BRD, 1);
      p.line(21, 10, 21, 2, C.BRD, 1);
      p.line(15, 14, 14, 2, C.BRD, 2);
      return p.done();
    }
    case 'spruce': {
      const p = new Pen(26, 42);
      p.rect(11, 34, 4, 8, C.BRD);
      for (let i = 0; i < 4; i++) {
        const y = 4 + i * 8, hw = 5 + i * 2.6;
        p.poly([[13 - hw, y + 11], [13 + hw, y + 11], [13, y]], C.GRD);
        p.poly([[13 - hw + 1, y + 10], [13, y + 10], [13, y + 1]], C.GR);
        p.poly([[13 - hw * 0.6, y + 5], [13 + hw * 0.55, y + 5], [13, y + 1]], C.W);
        p.rect(13 - Math.round(hw), y + 10, Math.round(hw * 2), 1, C.SN);
      }
      p.poly([[13, 0], [14.5, 3], [11.5, 3]], C.Y);
      return p.done();
    }
    case 'snowman': {
      const p = new Pen(18, 30);
      p.ell(9, 23, 8, 7, C.W, (dx, dy) => (dx + dy > 0.7 ? C.SN : C.W));
      p.ell(9, 13, 6, 5, C.W, (dx, dy) => (dx + dy > 0.7 ? C.SN : C.W));
      p.rect(4, 2, 10, 2, C.K);
      p.rect(6, -1, 6, 4, C.K);
      p.rect(6, 2, 6, 1, C.R);
      p.rect(6, 12, 2, 2, C.K);
      p.rect(11, 12, 2, 2, C.K);
      p.poly([[9, 14], [9, 16], [16, 15]], C.OR);
      p.rect(8, 20, 2, 2, C.K);
      p.rect(8, 24, 2, 2, C.K);
      p.line(2, 14, -2, 9, C.BRD);
      p.line(15, 14, 19, 9, C.BRD);
      return p.done();
    }
    case 'gift': {
      const p = new Pen(14, 14);
      const col = [C.R, C.B, C.PU, C.GR][Math.floor(r() * 4)];
      p.rect(0, 4, 14, 10, col);
      p.rect(0, 4, 14, 2, C.LG);
      p.rect(6, 4, 2, 10, C.Y);
      p.ell(4.5, 2.5, 3, 2.2, C.Y);
      p.ell(9.5, 2.5, 3, 2.2, C.Y);
      return p.done();
    }
    case 'ufo': {
      const p = new Pen(44, 20);
      p.ell(22, 7, 9, 7, C.CY, (dx, dy) => (dx < -0.3 && dy < -0.2 ? C.W : C.CY));
      p.ell(22, 12, 21, 5, C.LG, (_dx, dy) => (dy > 0.25 ? C.G : C.LG));
      for (let i = 0; i < 7; i++) p.rect(6 + i * 5, 12, 2, 2, i % 2 ? C.Y : C.LI);
      p.poly([[16, 16], [28, 16], [26, 19], [18, 19]], C.DG);
      return p.done();
    }
    case 'beam': {
      // tractor beam column (drawn dithered so it reads as light)
      const p = new Pen(26, 60);
      for (let y = 0; y < 60; y++) {
        const hw = 4 + (y / 60) * 9;
        for (let x = Math.round(13 - hw); x < 13 + hw; x++) if ((x + y) % 2 === 0) p.px(x, y, (y % 6 < 3) ? C.LI : C.CY);
      }
      return p.g;
    }
    case 'cow': {
      const p = new Pen(28, 20);
      p.rect(2, 13, 3, 7, C.W);
      p.rect(8, 13, 3, 7, C.W);
      p.rect(15, 13, 3, 7, C.W);
      p.rect(20, 13, 3, 7, C.W);
      p.ell(12, 9, 11, 6, C.W);
      p.ell(8, 8, 3, 2.5, C.K);
      p.ell(15, 11, 2.5, 2, C.K);
      p.ell(24, 5, 4.5, 4, C.W);
      p.rect(25, 7, 4, 3, C.PK);
      p.rect(23, 3, 1, 1, C.K);
      p.rect(20, 0, 2, 2, C.CR);
      p.rect(26, 0, 2, 2, C.CR);
      p.line(1, 7, -1, 12, C.W);
      return p.done();
    }
    case 'haybale': {
      const p = new Pen(18, 15);
      p.ell(9, 7.5, 9, 7.5, C.Y, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        return Math.abs(Math.sin(d * 9)) < 0.3 ? C.SAD : C.Y;
      });
      return p.done();
    }
    case 'fence': {
      const p = new Pen(26, 12);
      for (const x of [1, 12, 23]) p.rect(x, 0, 3, 12, C.BR);
      p.rect(0, 3, 26, 2, C.BR);
      p.rect(0, 8, 26, 2, C.BR);
      p.rect(0, 3, 26, 1, C.CR);
      return p.done();
    }
    case 'barn': {
      const p = new Pen(50, 42);
      p.rect(3, 16, 44, 26, C.R);
      p.poly([[0, 18], [25, 0], [50, 18]], C.RD);
      p.poly([[3, 18], [25, 3], [47, 18]], C.W);
      p.poly([[6, 18], [25, 5], [44, 18]], C.R);
      p.rect(17, 24, 16, 18, C.W);
      p.rect(19, 26, 12, 16, C.RD);
      p.line(19, 26, 30, 41, C.W, 2);
      p.line(30, 26, 19, 41, C.W, 2);
      p.rect(22, 12, 6, 6, C.W);
      p.rect(23, 13, 4, 4, C.Y);
      return p.done();
    }
    case 'silo': {
      const p = new Pen(16, 48);
      p.rect(0, 8, 16, 40, C.LG);
      p.ell(8, 8, 8, 7, C.G);
      for (let y = 12; y < 48; y += 6) p.rect(0, y, 16, 1, C.G);
      return p.done();
    }
    case 'cone': {
      const p = new Pen(10, 14);
      p.poly([[1, 12], [9, 12], [5.5, 0], [4.5, 0]], C.OR);
      p.rect(3, 4, 4, 2, C.W);
      p.rect(2, 8, 6, 2, C.W);
      p.rect(0, 12, 10, 2, C.ORD);
      return p.done();
    }
    case 'tires': {
      const p = new Pen(18, 18);
      for (let i = 0; i < 3; i++) {
        p.rect(0, 12 - i * 6, 18, 6, C.K);
        p.rect(1, 13 - i * 6, 16, 1, C.DG);
        p.rect(0, 12 - i * 6 + 2, 18, 1, i === 1 ? C.R : C.W);
      }
      return p.done();
    }
    case 'checkflag': {
      const p = new Pen(18, 32);
      p.rect(0, 0, 2, 32, C.LG);
      for (let y = 0; y < 10; y++) for (let x = 0; x < 15; x++) p.px(2 + x, 1 + y + Math.round(Math.sin(x * 0.5)), (Math.floor(x / 3) + Math.floor(y / 3)) % 2 ? C.K : C.W);
      return p.done();
    }
    case 'palm': {
      const p = new Pen(40, 54);
      for (let i = 0; i < 12; i++) {
        const t = i / 12;
        const x = 20 + Math.sin(t * 1.6) * 7 - 4;
        p.rect(Math.round(x) - 2, 52 - i * 4 - 4, 5, 5, i % 2 ? C.BR : C.BRD);
      }
      const tx = 22, ty = 8;
      const frond = (dx: number, dy: number) => {
        for (let k = 0; k <= 12; k++) {
          const t = k / 12;
          const x = tx + dx * t * 16, y = ty + dy * t * 10 + t * t * 8;
          p.rect(Math.round(x), Math.round(y), 2, 2, k % 3 ? C.GR : C.LL);
          p.rect(Math.round(x), Math.round(y) + 2, 2, 1, C.GRD);
        }
      };
      frond(-1, -0.4); frond(1, -0.4); frond(-0.8, 0.5); frond(0.9, 0.5); frond(0.1, -0.9);
      p.ell(tx, ty + 2, 2.5, 2.5, C.BRD);
      p.ell(tx + 3, ty + 3, 2, 2, C.BRD);
      return p.done();
    }
    case 'umbrella': {
      const p = new Pen(28, 32);
      p.rect(13, 6, 2, 26, C.LG);
      p.ell(14, 8, 14, 8, C.R, (dx, dy) => (dy > 0 ? null : Math.floor((dx + 1) * 3.5) % 2 ? C.W : C.R));
      return p.done();
    }
    case 'sandcastle': {
      const p = new Pen(26, 20);
      p.rect(2, 8, 22, 12, C.SA);
      p.rect(0, 4, 7, 16, C.SA);
      p.rect(19, 4, 7, 16, C.SA);
      for (const x of [0, 4, 19, 23]) p.rect(x, 2, 3, 2, C.SA);
      p.rect(10, 12, 6, 8, C.SAD);
      p.rect(12, -3, 1, 8, C.BRD);
      p.poly([[13, -3], [18, -1], [13, 1]], C.R);
      return p.done();
    }
    case 'goal': {
      const p = new Pen(58, 36);
      for (let y = 4; y < 36; y += 4) p.line(4, y, 54, y, C.LG);
      for (let x = 6; x < 56; x += 4) p.line(x, 4, x - 2, 35, C.LG);
      p.rect(0, 0, 58, 4, C.W);
      p.rect(0, 0, 4, 36, C.W);
      p.rect(54, 0, 4, 36, C.W);
      return p.g;
    }
    case 'cornerflag': {
      const p = new Pen(10, 22);
      p.rect(0, 0, 2, 22, C.W);
      p.poly([[2, 1], [10, 4], [2, 7]], C.Y);
      return p.done();
    }
    case 'floodlight': {
      const p = new Pen(18, 64);
      p.rect(8, 10, 3, 54, C.G);
      p.rect(0, 0, 18, 10, C.DG);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) p.rect(1 + i * 6, 1 + j * 5, 4, 3, C.Y);
      return p.done();
    }
    case 'lantern': {
      const p = new Pen(16, 34);
      p.rect(7, 12, 2, 22, C.BRD);
      p.rect(2, 0, 12, 2, C.RD);
      p.ell(8, 7, 6, 5, C.R, (dx) => (Math.abs(dx) > 0.55 ? C.RD : Math.abs(dx) < 0.15 ? C.OR : C.R));
      p.rect(4, 2, 8, 1, C.GO);
      p.rect(4, 11, 8, 1, C.GO);
      p.rect(7, 12, 2, 4, C.Y);
      return p.done();
    }
    case 'gate': {
      const p = new Pen(62, 52);
      p.rect(8, 14, 6, 38, C.R);
      p.rect(48, 14, 6, 38, C.R);
      p.rect(8, 14, 2, 38, C.RD);
      p.rect(48, 14, 2, 38, C.RD);
      p.poly([[0, 8], [62, 8], [56, 14], [6, 14]], C.GRD);
      p.poly([[-2, 6], [4, 3], [58, 3], [64, 6], [58, 8], [4, 8]], C.K);
      p.rect(6, 18, 50, 4, C.R);
      p.rect(24, 9, 14, 9, C.GO);
      p.rect(26, 11, 10, 5, C.R);
      p.poly([[22, 3], [31, -2], [40, 3]], C.K);
      return p.done();
    }
    case 'bamboo': {
      const p = new Pen(16, 52);
      for (const [x, h] of [[1, 52], [7, 44], [12, 48]] as const) {
        p.rect(x, 52 - h, 3, h, C.GR);
        for (let y = 52 - h + 6; y < 52; y += 8) p.rect(x, y, 3, 1, C.GRD);
        p.poly([[x + 3, 52 - h + 8], [x + 9, 52 - h + 4], [x + 3, 52 - h + 10]], C.LL);
      }
      return p.done();
    }
    case 'crystal': {
      const p = new Pen(20, 30);
      const col = r() > 0.5 ? [C.PU, C.PUD, C.PK] : [C.CY, C.TE, C.W];
      p.poly([[6, 30], [12, 30], [10, 2], [8, 2]], col[0]);
      p.poly([[8, 30], [9, 30], [9, 3], [8.5, 3]], col[2]);
      p.poly([[0, 30], [6, 30], [2, 12]], col[1]);
      p.poly([[12, 30], [20, 30], [17, 14]], col[0]);
      p.poly([[13, 30], [15, 30], [17, 16]], col[2]);
      return p.done();
    }
    case 'portal': {
      const p = new Pen(36, 46);
      p.ell(18, 23, 18, 23, C.PUD, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d > 0.82) return C.PU;
        const a = Math.atan2(dy, dx) + d * 7;
        return Math.sin(a * 3) > 0.2 ? C.PK : d < 0.25 ? C.W : C.PUD;
      });
      return p.done();
    }
    case 'skull': {
      const p = new Pen(12, 11);
      p.ell(6, 5, 6, 5, C.CR);
      p.rect(3, 8, 6, 3, C.CR);
      p.rect(2, 4, 3, 3, C.K);
      p.rect(7, 4, 3, 3, C.K);
      p.rect(5, 7, 2, 1, C.K);
      p.rect(4, 10, 1, 1, C.K);
      p.rect(7, 10, 1, 1, C.K);
      return p.done();
    }
    case 'bones': {
      const p = new Pen(22, 8);
      p.line(2, 6, 20, 2, C.CR, 2);
      p.ell(2, 6, 2, 2, C.CR);
      p.ell(20, 2, 2, 2, C.CR);
      p.line(3, 1, 19, 7, C.CR, 2);
      return p.done();
    }
    case 'fern': {
      const p = new Pen(24, 18);
      for (const [dx, dy] of [[-1, -0.6], [1, -0.6], [-0.5, -1], [0.5, -1], [0, -1.1]] as const) {
        for (let k = 0; k <= 10; k++) {
          const t = k / 10;
          const x = 12 + dx * t * 11, y = 18 + dy * t * 16 + t * t * 5;
          p.rect(Math.round(x), Math.round(y), 2, 2, k % 2 ? C.GR : C.GRD);
        }
      }
      return p.done();
    }
    case 'rocks': {
      const p = new Pen(22, 12);
      p.ell(6, 8, 6, 4, C.STD);
      p.ell(15, 7, 7, 5, C.ST, (dx, dy) => (dx + dy > 0.6 ? C.STD : C.ST));
      p.ell(10, 10, 4, 2.5, C.ST);
      return p.done();
    }
    case 'block': {
      const p = new Pen(14, 14);
      const col = [C.R, C.B, C.Y, C.GR, C.PU][Math.floor(r() * 5)];
      p.rect(0, 0, 14, 14, col);
      p.rect(0, 0, 14, 2, C.W);
      p.rect(3, 4, 8, 7, C.W);
      const glyph = Math.floor(r() * 3);
      if (glyph === 0) { p.poly([[4, 10], [7, 4], [10, 10]], col); }
      else if (glyph === 1) { p.rect(5, 5, 2, 5, col); p.rect(5, 5, 4, 2, col); p.rect(5, 8, 4, 2, col); }
      else p.ell(7, 7.5, 2.5, 2.5, col);
      return p.done();
    }
    case 'loop': {
      // Real loop-the-loop: inner track radius LOOP_R (4 m), drawn sitting on the ground.
      const R = 62, inner = 56;
      const p = new Pen(R * 2, R * 2);
      p.ell(R, R, R, R, C.OR, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        if (d < inner / R) return null;
        return d > 0.97 ? C.ORD : Math.abs(Math.atan2(dy, dx) * 8) % 1 < 0.12 ? C.Y : C.OR;
      });
      return p.done();
    }
    case 'ghost': {
      const p = new Pen(18, 20);
      p.ell(9, 8, 8, 8, C.W, (dx, dy) => (dx > 0.4 && dy > -0.2 ? C.SN : C.W));
      p.rect(1, 8, 16, 8, C.W);
      for (let i = 0; i < 4; i++) p.poly([[1 + i * 4, 15], [5 + i * 4, 15], [3 + i * 4, 19]], C.W);
      p.ell(6, 7, 1.6, 2.2, C.K);
      p.ell(12, 7, 1.6, 2.2, C.K);
      p.ell(9, 12, 2, 1.6, C.K);
      return p.done();
    }
    case 'bomb': {
      const p = new Pen(14, 16);
      p.ell(7, 10, 6, 6, C.K, (dx, dy) => (dx < -0.3 && dy < -0.3 ? C.DG : C.K));
      p.rect(5, 3, 4, 2, C.DG);
      p.line(7, 3, 10, 0, C.BR);
      p.rect(10, 0, 2, 1, C.Y);
      return p.done();
    }
    case 'cactus': {
      const p = new Pen(16, 26);
      p.rect(6, 0, 5, 26, C.GR);
      p.rect(0, 8, 3, 8, C.GR);
      p.rect(0, 14, 6, 3, C.GR);
      p.rect(13, 5, 3, 8, C.GR);
      p.rect(10, 11, 5, 3, C.GR);
      p.rect(8, 0, 1, 26, C.GRD);
      return p.done();
    }
  }
}

/** Football sprite (origin at the center). */
export function ballGrid(r: number, ppm: number): PixelGrid {
  const R = Math.max(4, Math.round(r * ppm));
  const p = new Pen(R * 2, R * 2);
  p.ell(R, R, R, R, C.W, (dx, dy) => {
    const spots: Pt[] = [[0, 0], [0.62, -0.45], [-0.62, -0.45], [0.55, 0.6], [-0.55, 0.6], [0, -0.95]];
    for (const [sx, sy] of spots) if (Math.hypot(dx - sx, dy - sy) < 0.24) return C.K;
    return dx + dy > 0.9 ? C.LG : C.W;
  });
  const g = p.done();
  g.ox = g.w / 2;
  g.oy = g.h / 2;
  return g;
}

const centered = (p: Pen) => {
  const g = p.done();
  g.ox = g.w / 2;
  g.oy = g.h / 2;
  return g;
};

/** Projectile sprites (origin at the center; long shots point along +x). */
export function shotGrid(kind: ProjectileKind, r: number, ppm: number): PixelGrid {
  if (kind === 'ball' || kind === 'twinball') return ballGrid(r, ppm);
  const R = Math.max(2, Math.round(r * ppm));
  const D = R * 2;
  let p: Pen;
  switch (kind) {
    case 'laser':
    case 'railgun':
    case 'zap': {
      p = new Pen(R * 8, D);
      p.rect(0, 0, R * 8, D, kind === 'zap' ? C.Y : kind === 'railgun' ? C.PU : C.CY);
      if (kind === 'zap') for (let i = 0; i < 4; i++) p.rect(i * R * 2, (i % 2) * R, R * 2, R, C.W);
      else p.rect(1, Math.floor(R / 2), R * 8 - 2, Math.max(1, R), C.W);
      break;
    }
    case 'firework':
    case 'missile':
    case 'volley':
    case 'seeker':
    case 'torpedo': {
      const body = kind === 'firework' ? C.R : kind === 'torpedo' ? C.DG : kind === 'seeker' ? C.W : C.LG;
      p = new Pen(R * 5, D);
      p.rect(0, 0, R * 4, D, body);
      p.poly([[R * 4, 0], [R * 5, R], [R * 4, D]], kind === 'firework' ? C.Y : kind === 'seeker' ? C.LI : C.R);
      p.rect(R, 0, 1, D, kind === 'torpedo' ? C.G : C.Y);
      if (kind !== 'firework') p.poly([[0, -1], [R, 0], [0, 1]], C.DG);
      break;
    }
    case 'harpoon':
    case 'hook':
    case 'quill': {
      p = new Pen(R * 9, D);
      p.rect(0, R - 1, R * 7, 2, kind === 'quill' ? C.CR : kind === 'hook' ? C.G : C.BR);
      if (kind === 'hook') { p.rect(R * 7, 0, 2, D, C.LG); p.rect(R * 7, D - 2, R * 2, 2, C.LG); }
      else p.poly([[R * 7, 0], [R * 9, R], [R * 7, D]], kind === 'quill' ? C.K : C.LG);
      break;
    }
    case 'toast': {
      p = new Pen(D + 2, D + 2);
      p.rect(1, 2, D, D, C.SAD);
      p.ell(R + 1, 3, R, 2.5, C.SAD);
      p.rect(3, 4, D - 4, D - 4, C.SA);
      break;
    }
    case 'bubble': {
      p = new Pen(D, D);
      p.ell(R, R, R, R, C.CY, (dx, dy) => (dx * dx + dy * dy > 0.7 ? C.CY : dx < -0.2 && dy < -0.2 && dx > -0.6 ? C.W : null));
      break;
    }
    case 'pumpkin': {
      p = new Pen(D, D + 3);
      p.ell(R, R + 3, R, R * 0.85, C.OR, (dx) => (Math.abs(dx) > 0.25 && Math.abs(dx) < 0.4 ? C.ORD : C.OR));
      p.rect(R - 1, 0, 2, 4, C.GRD);
      p.poly([[R - 3, R + 1], [R - 1, R + 1], [R - 2, R - 1]], C.Y);
      p.poly([[R + 1, R + 1], [R + 3, R + 1], [R + 2, R - 1]], C.Y);
      break;
    }
    case 'bone': {
      p = new Pen(R * 5, D);
      p.rect(R, R - 1, R * 3, 3, C.CR);
      for (const x of [R * 0.7, R * 4.3]) for (const y of [R * 0.5, R * 1.5]) p.ell(x, y, R * 0.6, R * 0.6, C.CR);
      break;
    }
    case 'water':
    case 'tea': {
      const c = kind === 'tea' ? C.BR : C.B;
      p = new Pen(D + 2, D);
      p.ell(R + 1, R, R + 1, R, c, (dx, dy) => (dx + dy < -0.5 ? C.W : c));
      break;
    }
    case 'ice': {
      p = new Pen(D, D);
      p.poly([[R, 0], [D, R], [R, D], [0, R]], C.CY);
      p.poly([[R, 2], [R + 2, R], [R, R]], C.W);
      break;
    }
    case 'atom':
    case 'plasma': {
      p = new Pen(D, D);
      const glow = kind === 'atom' ? C.LI : C.PK;
      p.ell(R, R, R, R, glow, (dx, dy) => {
        const d = dx * dx + dy * dy;
        if (kind === 'atom' && (Math.abs(dy - dx * 0.3) < 0.12 || Math.abs(dy + dx * 0.8) < 0.12)) return C.W;
        return d < 0.2 ? C.W : d < 0.55 ? glow : kind === 'atom' ? C.GR : C.PU;
      });
      break;
    }
    case 'bat': {
      p = new Pen(D * 2, D);
      p.poly([[0, 1], [R, R], [D, R - 1], [D * 2, 1], [D + R, D - 1], [D, D], [R, D - 1]], C.K);
      p.px(D - 1, R, C.R);
      p.px(D + 1, R, C.R);
      break;
    }
    case 'penguin': {
      p = new Pen(D + 2, D);
      p.ell(R + 1, R, R + 1, R, C.K);
      p.ell(R + 1, R + 1, R * 0.8, R * 0.6, C.W);
      p.rect(D, R - 1, 2, 2, C.OR);
      break;
    }
    case 'fire': {
      p = new Pen(D, D);
      p.ell(R, R, R, R, C.OR, (dx, dy) => (dx * dx + dy * dy < 0.25 ? C.Y : dx * dx + dy * dy < 0.6 ? C.OR : C.R));
      break;
    }
    case 'urn': {
      p = new Pen(D, D + 2);
      p.ell(R, R + 2, R, R * 0.9, C.BR, (_dx, dy) => (Math.abs(dy) < 0.15 ? C.GO : C.BR));
      p.rect(R - R / 2, 0, R, 3, C.BRD);
      break;
    }
    case 'cork': {
      p = new Pen(D + 2, D);
      p.rect(0, 1, D + 2, D - 2, C.SAD);
      p.rect(1, 2, D, 1, C.SA);
      break;
    }
    case 'fist': {
      p = new Pen(D + R, D);
      p.rect(0, R - 2, R, 4, C.LG);
      p.ell(R + R * 0.9, R, R, R, C.R, (dx, dy) => (dx > 0.3 && Math.abs(dy) < 0.6 && Math.abs(dy % 0.4) < 0.08 ? C.RD : dx + dy < -0.6 ? C.W : C.R));
      break;
    }
    case 'burger': {
      p = new Pen(D + 2, D);
      p.ell(R + 1, R * 0.7, R + 1, R * 0.7, C.SAD);
      p.rect(0, R - 1, D + 2, 2, C.GR);
      p.rect(0, R + 1, D + 2, 2, C.BRD);
      p.rect(1, R + 3, D, Math.max(1, R - 3), C.SAD);
      break;
    }
    case 'ink': {
      p = new Pen(D, D);
      p.ell(R, R, R, R, C.K, (dx, dy) => (dx + dy < -0.7 ? C.PUD : Math.hypot(dx, dy) > 0.85 && (Math.atan2(dy, dx) * 4) % 1 < 0.4 ? null : C.K));
      break;
    }
    case 'golf': {
      p = new Pen(D, D);
      p.ell(R, R, R, R, C.W, (dx, dy) => (dx + dy > 0.6 ? C.LG : C.W));
      break;
    }
    case 'tracer':
    case 'bullet': {
      p = new Pen(R * 4, D);
      p.rect(0, 0, R * 3, D, kind === 'tracer' ? C.Y : C.GO);
      p.ell(R * 3, R, R, R, kind === 'tracer' ? C.W : C.GO);
      break;
    }
    case 'web': {
      p = new Pen(D, D);
      p.ell(R, R, R, R, C.W, (dx, dy) => {
        const a = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
        return Math.abs(Math.sin(a * 3)) < 0.18 || Math.abs(d - 0.45) < 0.1 || Math.abs(d - 0.85) < 0.1 ? C.W : null;
      });
      break;
    }
    default: {
      p = new Pen(D, D);
      if (kind === 'slush') p.ell(R, R, R, R, C.CY, (dx, dy) => (dx + dy < -0.5 ? C.W : (dx * 3 + dy * 5) % 1 > 0.6 ? C.W : C.CY));
      else if (kind === 'dragonshell') p.ell(R, R, R, R, C.Y, (dx, dy) => (dx + dy < -0.6 ? C.W : dx + dy > 0.5 ? C.R : C.Y));
      else if (kind === 'snowball' || kind === 'bigsnow' || kind === 'twinsnow') p.ell(R, R, R, R, C.W, (dx, dy) => (dx + dy > 0.5 ? C.SN : C.W));
      else p.ell(R, R, R, R, C.DG, (dx, dy) => (dx + dy < -0.6 ? C.G : C.DG));
    }
  }
  return centered(p);
}

/** Weight on a chain (origin at the center). */
export function flailGrid(look: 'wrecking' | 'mace' | 'anchor', r: number, ppm: number): PixelGrid {
  const R = Math.max(3, Math.round(r * ppm));
  const p = new Pen(R * 2 + 4, R * 2 + 4);
  const c = R + 2;
  if (look === 'mace') {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      p.poly([[c + Math.cos(a - 0.3) * R * 0.8, c + Math.sin(a - 0.3) * R * 0.8], [c + Math.cos(a) * (R + 2), c + Math.sin(a) * (R + 2)], [c + Math.cos(a + 0.3) * R * 0.8, c + Math.sin(a + 0.3) * R * 0.8]], C.LG);
    }
    p.ell(c, c, R * 0.85, R * 0.85, C.CR, (dx, dy) => (dx + dy > 0.5 ? C.SAD : C.CR));
  } else if (look === 'anchor') {
    p.rect(c - 1, 1, 2, R * 2, C.G);
    p.rect(c - R * 0.6, 2, R * 1.2, 2, C.G);
    p.poly([[1, c], [c, R * 2 + 2], [R * 2 + 3, c], [R * 2, c + 2], [c, R * 2 - 1], [3, c + 2]], C.G);
  } else p.ell(c, c, R, R, C.DG, (dx, dy) => (dx + dy < -0.7 ? C.G : dx + dy > 0.8 ? C.K : C.DG));
  return centered(p);
}

/** Loose cargo / dropped items (origin at the center). */
export function itemGrid(kind: ItemKind, w: number, h: number, ppm: number): PixelGrid {
  const W = Math.max(3, Math.round(w * ppm)), H = Math.max(3, Math.round(h * ppm));
  const R = Math.round(W / 2);
  const p = new Pen(W, H);
  switch (kind) {
    case 'ball': return ballGrid(w / 2, ppm);
    case 'snowball': return shotGrid('snowball', w / 2, ppm);
    case 'pumpkin':
      p.ell(R, R, R, R, C.OR, (dx) => (Math.abs(dx) > 0.25 && Math.abs(dx) < 0.42 ? C.ORD : C.OR));
      p.rect(R - 1, 0, 2, 2, C.GRD);
      break;
    case 'rock':
      p.poly([[1, H * 0.4], [W * 0.35, 0], [W, H * 0.3], [W - 1, H], [W * 0.2, H]], C.ST);
      p.poly([[W * 0.4, H * 0.5], [W - 2, H * 0.4], [W - 2, H - 1], [W * 0.5, H - 1]], C.STD);
      break;
    case 'coal':
      p.ell(R, R, R, R, C.K, (dx, dy) => (dx + dy < -0.5 ? C.DG : C.K));
      break;
    case 'egg':
      p.ell(R, R, R * 0.85, R, C.CR, (dx, dy) => (Math.abs(dx - 0.2) < 0.12 && Math.abs(dy) < 0.4 ? C.GR : dx + dy > 0.6 ? C.SA : C.CR));
      break;
    case 'bomb':
      p.ell(R, R, R, R, C.K, (dx, dy) => (dx + dy < -0.6 ? C.DG : C.K));
      p.rect(R - 1, -2, 2, 3, C.BR);
      p.px(R + 1, -3, C.Y);
      break;
    case 'log':
      p.rect(0, 0, W, H, C.BR);
      for (let x = 2; x < W - 3; x += 4) p.rect(x, 1 + (x % 3), 3, 1, C.BRD);
      p.ell(W - 3, H / 2, 3, H / 2, C.SAD, (dx, dy) => (dx * dx + dy * dy < 0.3 ? C.BR : C.SAD));
      break;
    case 'barrel':
      p.rect(0, 0, W, H, C.GR);
      p.rect(0, 1, W, 1, C.DG);
      p.rect(0, H - 2, W, 1, C.DG);
      p.poly([[R - 2, H * 0.62], [R + 2, H * 0.62], [R, H * 0.3]], C.Y);
      break;
    case 'gift':
      p.rect(0, 0, W, H, C.R);
      p.rect(R - 1, 0, 2, H, C.Y);
      p.rect(0, Math.round(H / 2) - 1, W, 2, C.Y);
      break;
    case 'trash':
      p.poly([[1, H], [W - 1, H], [W, H * 0.4], [R + 1, 0], [R - 1, 0], [0, H * 0.4]], C.DG);
      p.rect(R - 1, 0, 2, 2, C.Y);
      p.px(R - 3, H * 0.6, C.G);
      break;
    case 'bone':
      p.rect(2, Math.floor(H / 2) - 1, W - 4, 3, C.CR);
      for (const x of [2, W - 2]) for (const y of [1, H - 2]) p.ell(x, y, 2, 2, C.CR);
      break;
    case 'crate':
      p.rect(0, 0, W, H, C.SAD);
      p.rect(1, 1, W - 2, H - 2, C.SA);
      p.line(1, 1, W - 2, H - 2, C.SAD);
      p.line(W - 2, 1, 1, H - 2, C.SAD);
      break;
    case 'hay':
      p.rect(0, 0, W, H, C.Y);
      for (let y = 1; y < H; y += 2) for (let x = (y % 4) - 1; x < W; x += 4) p.rect(x, y, 2, 1, C.SAD);
      p.rect(Math.round(W * 0.3), 0, 1, H, C.BR);
      p.rect(Math.round(W * 0.7), 0, 1, H, C.BR);
      break;
    case 'cow':
      p.rect(1, 1, W - 4, H - 4, C.W);
      p.ell(W * 0.3, H * 0.4, 2, 2, C.K);
      p.ell(W * 0.6, H * 0.55, 2.5, 2, C.K);
      p.rect(W - 4, 0, 4, 4, C.W);
      p.rect(W - 1, 1, 1, 1, C.K);
      p.rect(W - 3, 3, 3, 1, C.PK);
      p.rect(2, H - 3, 1, 3, C.W);
      p.rect(W - 6, H - 3, 1, 3, C.W);
      break;
    case 'penguin':
      p.ell(R, H * 0.55, R, H * 0.45, C.K);
      p.ell(R + 1, H * 0.6, R * 0.6, H * 0.32, C.W);
      p.ell(R, H * 0.22, R * 0.8, H * 0.2, C.K);
      p.px(R + 1, H * 0.2, C.W);
      p.rect(W - 2, H * 0.24, 2, 1, C.OR);
      break;
    case 'icewall':
      p.rect(0, 0, W, H, C.CY);
      p.rect(1, 1, W - 3, 2, C.W);
      p.rect(1, 1, 1, H - 3, C.W);
      for (let y = 6; y < H - 2; y += 7) p.line(2, y, W - 2, y + 2, C.W);
      break;
    case 'icecream':
      p.poly([[1, H * 0.42], [W - 1, H * 0.42], [R, H]], C.SAD);
      p.ell(R, H * 0.3, R, H * 0.3, C.PK, (dx, dy) => (dx + dy < -0.5 ? C.W : C.PK));
      break;
    case 'coffin':
      p.poly([[0, H * 0.5], [W * 0.18, 0], [W - 2, 0], [W, H * 0.5], [W - 2, H], [W * 0.18, H]], C.BRD);
      p.rect(W * 0.18, 1, W * 0.8, 1, C.BR);
      p.rect(W * 0.5, H * 0.2, 1, H * 0.6, C.GO);
      p.rect(W * 0.45, H * 0.4, W * 0.11, 1, C.GO);
      break;
    case 'concrete':
      p.ell(R, H / 2, R, H / 2, C.LG, (dx, dy) => (dx + dy < -0.5 ? C.W : dx + dy > 0.6 ? C.G : C.LG));
      break;
    case 'oil':
      p.ell(R, H / 2, R, H / 2, C.K, (dx) => (dx < -0.3 && dx > -0.5 ? C.PU : C.K));
      break;
    case 'tar':
      p.rect(0, 0, W, H, C.DG);
      for (let x = 1; x < W - 1; x += 3) p.px(x, 0, C.G);
      break;
    case 'spikes':
      p.rect(0, H - 1, W, 1, C.K);
      for (let x = 0; x < W - 1; x += 2) p.poly([[x, H - 1], [x + 1, -1], [x + 2, H - 1]], C.LG);
      break;
    case 'sandbag':
      p.ell(R, H / 2, R, H / 2, C.SAD, (dx, dy) => (dx + dy < -0.4 ? C.SA : C.SAD));
      p.rect(R - 1, 0, 2, H, C.BR);
      break;
    case 'melon':
      p.ell(R, R, R, R, C.GR, (dx) => (Math.abs(dx) % 0.4 < 0.12 ? C.GRD : C.GR));
      break;
    case 'tire':
      p.ell(R, R, R, R, C.K, (dx, dy) => {
        const d = Math.hypot(dx, dy);
        return d < 0.4 ? C.LG : d < 0.55 ? C.DG : C.K;
      });
      break;
    case 'flame':
      for (let x = 0; x < W; x += 3) p.poly([[x, H], [x + 1.5, -2 - (x % 2) * 2], [x + 3, H]], x % 2 ? C.Y : C.OR);
      break;
    case 'cone':
      p.poly([[R - 1, 0], [R + 1, 0], [W - 1, H - 2], [1, H - 2]], C.OR);
      p.rect(R - 2, H * 0.4, 4, 2, C.W);
      p.rect(0, H - 2, W, 2, C.ORD);
      break;
    case 'toyblock': {
      const col = [C.R, C.B, C.Y, C.GR][Math.abs(Math.round(w * 100 + h * 10)) % 4];
      p.rect(0, 0, W, H, col);
      p.rect(1, 1, W - 3, 1, C.W);
      p.ell(R, H / 2, W * 0.22, H * 0.22, C.W);
      break;
    }
    case 'peel':
      p.poly([[0, H], [W * 0.2, 0], [W * 0.4, H * 0.6], [W * 0.5, 0], [W * 0.6, H * 0.6], [W * 0.8, 0], [W, H]], C.Y);
      p.rect(W * 0.45, H - 1, 2, 1, C.BR);
      break;
    case 'mine':
      p.ell(R, H, R, H, C.DG, (dx, dy) => (dy < -0.5 && Math.abs(dx) < 0.25 ? C.R : C.DG));
      p.rect(1, H - 2, W - 2, 2, C.K);
      break;
  }
  return centered(p);
}

/** Highest solid surface at x (world y, y grows down), or null. */
export function groundY(map: MapDef, x: number): number | null {
  // Topmost surface with rock below it, inside the arena (skips cave ceilings above the bounds).
  const hits: number[] = [];
  for (const s of map.solids) {
    const pts = s.pts;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xa, ya] = pts[j], [xb, yb] = pts[i];
      if ((xa <= x && xb > x) || (xb <= x && xa > x)) hits.push(ya + ((x - xa) * (yb - ya)) / (xb - xa));
    }
  }
  hits.sort((a, b) => a - b);
  const solidAt = (y: number) => map.solids.some((s) => pointInPoly(x, y, s.pts));
  let first: number | null = null;
  for (const y of hits) {
    if (solidAt(y - 0.02) || !solidAt(y + 0.02)) continue;
    if (first === null) first = y;
    if (y > map.bounds.y0) return y;
  }
  return first;
}

/** Collect decor placements with resolved y (bottom-center, world meters). */
export function placedDecor(map: MapDef) {
  return (map.decor ?? []).map((d, i) => {
    const y = d.y ?? groundY(map, d.x) ?? map.bounds.y1;
    return { ...d, y, seed: d.seed ?? i };
  });
}

/** Transparent check used by tests. */
export function decorFilled(g: PixelGrid): number {
  let n = 0;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (gget(g, x, y)) n++;
  return n;
}
