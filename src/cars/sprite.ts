import { ART_PPM } from '../physics/constants';
import { RGB, hex, shade, mix } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly } from '../render/grid';
import type { CarDef, CarMat, CarPalette, WheelDef } from './types';

/** Palette slots used by generated car grids. */
export const P = {
  NONE: 0, OUTLINE: 1,
  BODY_D: 2, BODY: 3, BODY_L: 4,
  ACC_D: 5, ACC: 6,
  GLASS: 7, GLASS_L: 8,
  METAL_D: 9, METAL: 10, METAL_L: 11,
  HEAD_LIGHT: 12, TAIL_LIGHT: 13,
  DARK: 14, DARK_L: 15,
  WOOD_D: 16, WOOD: 17,
  SCOOP_D: 18, SCOOP: 19,
  ROCKET_D: 20, ROCKET: 21,
  SPIKE_D: 22, SPIKE: 23, SPIKE_L: 24,
  HAZARD: 25,
} as const;

export function carPalette(p: CarPalette): (RGB | null)[] {
  const body = hex(p.body), acc = hex(p.accent), dark = hex(p.dark), glass = hex(p.glass), light = hex(p.light);
  const pal: (RGB | null)[] = [];
  pal[P.NONE] = null;
  pal[P.OUTLINE] = mix(shade(dark, 0.35), [12, 10, 20], 0.5);
  pal[P.BODY_D] = shade(body, 0.68);
  pal[P.BODY] = body;
  pal[P.BODY_L] = shade(body, 1.3);
  pal[P.ACC_D] = shade(acc, 0.7);
  pal[P.ACC] = acc;
  pal[P.GLASS] = glass;
  pal[P.GLASS_L] = shade(glass, 1.55);
  pal[P.METAL_D] = [88, 94, 108];
  pal[P.METAL] = [142, 150, 164];
  pal[P.METAL_L] = [204, 212, 222];
  pal[P.HEAD_LIGHT] = light;
  pal[P.TAIL_LIGHT] = [228, 52, 64];
  pal[P.DARK] = dark;
  pal[P.DARK_L] = shade(dark, 1.25);
  pal[P.WOOD_D] = [112, 66, 38];
  pal[P.WOOD] = [166, 104, 58];
  pal[P.SCOOP_D] = [176, 120, 18];
  pal[P.SCOOP] = [240, 182, 40];
  pal[P.ROCKET_D] = [120, 36, 48];
  pal[P.ROCKET] = [214, 70, 70];
  pal[P.SPIKE_D] = [110, 116, 128];
  pal[P.SPIKE] = [176, 184, 196];
  pal[P.SPIKE_L] = [236, 240, 246];
  pal[P.HAZARD] = [30, 28, 34];
  return pal;
}

const MAT_ID: Record<CarMat, number> = {
  body: 1, accent: 2, dark: 3, metal: 4, spike: 5, scoop: 6, rocket: 7, wood: 8, glass: 9,
};

/** [dark, base, light] palette slots per material. */
const MAT_SHADES: Record<number, [number, number, number]> = {
  1: [P.BODY_D, P.BODY, P.BODY_L],
  2: [P.ACC_D, P.ACC, P.ACC],
  3: [P.DARK, P.DARK, P.DARK_L],
  4: [P.METAL_D, P.METAL, P.METAL_L],
  5: [P.SPIKE_D, P.SPIKE, P.SPIKE_L],
  6: [P.SCOOP_D, P.SCOOP, P.SCOOP],
  7: [P.ROCKET_D, P.ROCKET, P.ROCKET],
  8: [P.WOOD_D, P.WOOD, P.WOOD],
  9: [P.GLASS, P.GLASS, P.GLASS_L],
};

/** Bounding box (meters) of all chassis polygons and windows. */
export function carBounds(def: CarDef) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number) => {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  };
  for (const p of def.body) for (const [x, y] of p.pts) add(x, y);
  for (const w of def.windows ?? []) for (const [x, y] of w) add(x, y);
  return { x0, y0, x1, y1 };
}

/**
 * Rasterize the car chassis into a palette-indexed pixel grid.
 * Pure function: no DOM, deterministic.
 */
export function generateCarGrid(def: CarDef, ppm = ART_PPM): PixelGrid {
  const b = carBounds(def);
  const pad = 2;
  const ox = Math.ceil(-b.x0 * ppm) + pad;
  const oy = Math.ceil(-b.y0 * ppm) + pad;
  const w = ox + Math.ceil(b.x1 * ppm) + pad;
  const h = oy + Math.ceil(b.y1 * ppm) + pad;
  const mats = makeGrid(w, h, ox, oy);
  const toPx = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y]) => [x * ppm + ox, y * ppm + oy] as [number, number]);

  for (const poly of def.body) {
    const id = MAT_ID[poly.mat ?? 'body'];
    fillPoly(toPx(poly.pts), w, h, (x, y) => gset(mats, x, y, id));
  }
  const glass = makeGrid(w, h);
  for (const win of def.windows ?? []) fillPoly(toPx(win), w, h, (x, y) => gset(glass, x, y, 1));

  const out = makeGrid(w, h, ox, oy);
  const stripeY0 = def.stripe ? Math.round(def.stripe.y * ppm + oy) : -999;
  const stripeY1 = def.stripe ? stripeY0 + Math.max(1, Math.round(def.stripe.h * ppm)) : -999;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = gget(mats, x, y);
      if (!m) continue;
      const edge = !gget(mats, x - 1, y) || !gget(mats, x + 1, y) || !gget(mats, x, y - 1) || !gget(mats, x, y + 1);
      if (edge) { gset(out, x, y, P.OUTLINE); continue; }
      let mm = m;
      if (gget(glass, x, y)) mm = 9;
      else if (m === 1 && y >= stripeY0 && y < stripeY1) mm = 2;
      const [d, base, l] = MAT_SHADES[mm];
      // Lighting: pixels just under an empty/outline pixel get the light shade,
      // the bottom rows of a part get the dark shade.
      const topDist = !gget(mats, x, y - 2) ? 1 : 0;
      const botDist = !gget(mats, x, y + 2) ? 1 : !gget(mats, x, y + 3) ? 2 : 0;
      let c = base;
      if (topDist) c = l;
      else if (botDist) c = d;
      // Material details
      if (mm === 4 && (x + y * 3) % 6 === 0 && !topDist && !botDist) c = P.METAL_L; // rivets
      if (mm === 8 && y % 3 === 0) c = P.WOOD_D; // planks
      if (mm === 6 && (x + y) % 6 < 2 && !topDist) c = P.HAZARD; // hazard stripes
      if (mm === 5) c = (x + y) % 3 === 0 ? P.SPIKE_L : y % 2 ? P.SPIKE_D : P.SPIKE;
      if (mm === 9) c = (x - y + 64) % 7 === 0 || (x - y + 64) % 7 === 1 ? P.GLASS_L : P.GLASS;
      if (mm === 3 && (x * 7 + y * 3) % 11 === 0) c = P.DARK_L;
      gset(out, x, y, c);
    }
  }

  // Head & tail lights: scan front/back columns for the first interior body pixel.
  const bodyRows: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (gget(mats, x, y) === 1) { bodyRows.push(y); break; }
  if (bodyRows.length) {
    const midY = bodyRows[Math.floor(bodyRows.length * 0.35)];
    for (let x = w - 1; x >= 0; x--) {
      if (gget(mats, x, midY) === 1) {
        gset(out, x - 1, midY, P.HEAD_LIGHT);
        gset(out, x - 2, midY, P.HEAD_LIGHT);
        gset(out, x - 1, midY + 1, P.HEAD_LIGHT);
        break;
      }
    }
    for (let x = 0; x < w; x++) {
      if (gget(mats, x, midY) === 1) {
        gset(out, x + 1, midY, P.TAIL_LIGHT);
        gset(out, x + 1, midY + 1, P.TAIL_LIGHT);
        break;
      }
    }
  }
  return out;
}

/** Wheel palette slots */
export const WP = { NONE: 0, OUTLINE: 1, TIRE: 2, TIRE_L: 3, RIM_D: 4, RIM: 5, RIM_L: 6, HUB: 7 } as const;

export function wheelPalette(p: CarPalette): (RGB | null)[] {
  const acc = hex(p.accent);
  return [null, [14, 12, 18], [40, 38, 46], [70, 68, 78], shade(acc, 0.6), mix(acc, [200, 205, 215], 0.45), [230, 234, 240], [28, 26, 32]];
}

export function generateWheelGrid(wd: WheelDef, ppm = ART_PPM): PixelGrid {
  const r = Math.max(3, Math.round(wd.r * ppm));
  const size = r * 2 + 1;
  const g = makeGrid(size, size, r, r);
  const style = wd.rim ?? 'spokes';
  const tireIn = style === 'monster' ? r * 0.55 : r * 0.66;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - r, dy = y - r;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > r + 0.3) continue;
      const a = Math.atan2(dy, dx);
      let c: number;
      if (d > r - 0.7) c = WP.OUTLINE;
      else if (d > tireIn) {
        const tread = Math.floor(((a + Math.PI) / (Math.PI * 2)) * (style === 'monster' ? 10 : 14)) % 2;
        c = d > r - 1.7 && tread ? WP.OUTLINE : tread ? WP.TIRE_L : WP.TIRE;
      } else if (d > tireIn - 1) c = WP.RIM_D;
      else if (d < Math.max(1.2, r * 0.18)) c = WP.HUB;
      else {
        const sectors = style === 'star' ? 5 : style === 'disc' ? 0 : style === 'monster' ? 6 : 4;
        const s = sectors ? Math.abs(Math.sin((a * sectors) / 2)) : 1;
        if (style === 'disc') c = d < tireIn * 0.55 ? WP.RIM_L : WP.RIM;
        else c = s < 0.3 ? WP.RIM_L : s < 0.55 ? WP.RIM : WP.RIM_D;
      }
      gset(g, x, y, c);
    }
  }
  return g;
}

/** Driver helmet palette: player colour based. */
export const DP = { NONE: 0, OUTLINE: 1, HELM_D: 2, HELM: 3, HELM_L: 4, VISOR: 5, VISOR_L: 6, SKIN: 7, SUIT: 8, SUIT_D: 9 } as const;

export function driverPalette(playerColor: string): (RGB | null)[] {
  const c = hex(playerColor);
  return [null, [16, 14, 24], shade(c, 0.65), c, shade(c, 1.4), [30, 34, 52], [130, 200, 240], [236, 184, 140], shade(c, 0.85), shade(c, 0.5)];
}

/** Helmet facing +x. Origin is the head center. */
export function generateHeadGrid(r: number, ppm = ART_PPM): PixelGrid {
  const R = Math.max(3, Math.round(r * ppm));
  const size = R * 2 + 1;
  const g = makeGrid(size, size, R, R);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - R, dy = y - R;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > R + 0.3) continue;
      let c: number = d > R - 0.8 ? DP.OUTLINE : DP.HELM;
      if (c === DP.HELM) {
        if (dy < -R * 0.4 && dx < R * 0.2) c = DP.HELM_L;
        if (dy > R * 0.45) c = DP.HELM_D;
        // visor on the front half
        if (dx > -R * 0.05 && dy > -R * 0.35 && dy < R * 0.3) c = dy < -R * 0.15 && dx < R * 0.6 ? DP.VISOR_L : DP.VISOR;
        // stripe over the top
        if (Math.abs(dx + R * 0.15) < R * 0.18 && dy < -R * 0.2) c = DP.HELM_D;
      }
      gset(g, x, y, c);
    }
  }
  return g;
}

/** Torso + arm sitting under the head (render only). Origin at neck. */
export function generateTorsoGrid(r: number, ppm = ART_PPM): PixelGrid {
  const R = Math.max(3, Math.round(r * ppm));
  const w = Math.round(R * 1.7), h = Math.round(R * 1.6);
  const g = makeGrid(w, h, Math.floor(w / 2), 0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let c: number = edge ? DP.OUTLINE : DP.SUIT;
      if (!edge && x > w * 0.6) c = DP.SUIT_D;
      if (!edge && y === 1) c = DP.SKIN;
      gset(g, x, y, c);
    }
  }
  return g;
}
