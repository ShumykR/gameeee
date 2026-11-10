import { ART_PPM } from '../physics/constants';
import { RGB, hex, shade, mix, hash2, bayer } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly } from '../render/grid';
import type { MapDef, Pt, TerrainMat, ThemeId } from './types';

/* ------------------------------------------------------------------ */
/* Terrain                                                             */
/* ------------------------------------------------------------------ */

const MATS: (TerrainMat | 'back')[] = ['grass', 'rock', 'sand', 'metal', 'ice', 'wood', 'snow', 'moon', 'neon', 'brick', 'grave', 'basalt', 'turf', 'track', 'void', 'asphalt', 'tile', 'cave', 'steel', 'amber', 'girder', 'back'];
/** Materials shaded by distance to open air in every direction (caves have ceilings). */
const RIMMED = new Set<TerrainMat | 'back'>(['cave', 'steel', 'amber']);
/** slots per material: 0 outline,1 top,2 surface,3 surface dark,4 base,5 base dark,6 base light,7 detail */
const SLOTS = 8;

const MAT_COLORS: Record<TerrainMat | 'back', string[]> = {
  grass: ['#1d2a14', '#b6f05a', '#5cc23a', '#2f8a34', '#8a5a34', '#5e3a22', '#a8734a', '#3d2616'],
  rock: ['#1b1b24', '#c9c6c0', '#8e8a86', '#6a6670', '#6e6a74', '#4a4752', '#8d8994', '#34323c'],
  sand: ['#3a2a18', '#fff0b8', '#f2cf7a', '#d9ad55', '#d9a24e', '#b47e36', '#ecc06a', '#9a6a2c'],
  metal: ['#14161c', '#d6dde6', '#8e98a8', '#5e6878', '#4c5564', '#353c48', '#6c7686', '#a8b4c4'],
  ice: ['#16263a', '#ffffff', '#c8f0ff', '#8ad6f4', '#6cb6e0', '#4a8ec2', '#a8e2ff', '#e8faff'],
  wood: ['#24140a', '#e6b06a', '#b97a3c', '#8c5426', '#8c5426', '#5e3416', '#a86a32', '#4a2810'],
  snow: ['#1c2232', '#ffffff', '#eef4ff', '#c4d2ea', '#6c7890', '#4c566c', '#8a96ae', '#dfe8f8'],
  moon: ['#15151c', '#e6e4ee', '#b4b2c0', '#8c8a9a', '#77758a', '#56546a', '#9896aa', '#46445a'],
  neon: ['#06040e', '#ff4fd8', '#5ef0ff', '#2a2050', '#1c1636', '#120e26', '#2c2454', '#7a3cff'],
  brick: ['#1e0e0c', '#e8a07a', '#c2563c', '#8e3426', '#a8442e', '#6e2a1e', '#c86048', '#e8d6c0'],
  grave: ['#0e0a12', '#b88ae8', '#5a3e86', '#3e2c62', '#3a2c30', '#261c22', '#4a3a3c', '#7a5aa8'],
  basalt: ['#0c0808', '#ffb050', '#5a4440', '#423230', '#2e2424', '#1e1818', '#3e3030', '#ff6a1a'],
  turf: ['#0c1e0e', '#ffffff', '#52c452', '#3aa23e', '#6a4428', '#48301c', '#7c5434', '#ffffff'],
  track: ['#3a1806', '#ffd8a8', '#ff8c1a', '#e0700e', '#f07a12', '#c45a08', '#ff9e3a', '#ffffff'],
  void: ['#08040e', '#ff8ae8', '#8a4ae0', '#6430b8', '#2a1648', '#1a0e30', '#3a2060', '#d08aff'],
  asphalt: ['#0a0a0e', '#ececf0', '#55555e', '#44444c', '#34343c', '#25252b', '#44444c', '#ffd23f'],
  tile: ['#1a0606', '#ffd84a', '#d02e2e', '#a8201e', '#7e1616', '#5a0e10', '#9a1a1c', '#ffcf3a'],
  // rim-lit materials: outline, rim, glow, glow fade, base, base dark, base light, mortar
  cave: ['#120a1a', '#fbe8d6', '#c6a2b2', '#86688e', '#5a4670', '#3c2e52', '#6c5682', '#271c36'],
  steel: ['#0c1018', '#f2f8ff', '#c2d0e4', '#8ea2be', '#6a7e9c', '#4c5e7c', '#7e92b0', '#34425a'],
  amber: ['#2a1004', '#fff2a8', '#ffcc48', '#f6a228', '#e08418', '#b0600c', '#ee962a', '#7e3c06'],
  girder: ['#0a0c12', '#eef4fc', '#c0c8d4', '#8e96a4', '#6c7482', '#4a505c', '#a0a8b6', '#2c3038'],
  back: ['#07050c', '#1d1729', '#1a1425', '#171221', '#141020', '#0e0b16', '#1b1527', '#110d1a'],
};

export function terrainPalette(): (RGB | null)[] {
  const pal: (RGB | null)[] = [null];
  for (const m of MATS) for (const c of MAT_COLORS[m]) pal.push(hex(c));
  return pal;
}

export interface TerrainArt {
  grid: PixelGrid;
  /** Dark cave back wall (behind background props), when the map has one. */
  back: PixelGrid | null;
  palette: (RGB | null)[];
  /** World coords of grid pixel (0,0). */
  x0: number;
  y0: number;
  ppm: number;
}

/** Rasterize map solids into a shaded pixel-art grid. Pure, deterministic. */
export function generateTerrain(map: MapDef, ppm = ART_PPM): TerrainArt {
  const pad = 6;
  const x0 = map.bounds.x0 - pad, y0 = map.bounds.y0 - pad;
  const w = Math.ceil((map.bounds.x1 - map.bounds.x0 + pad * 2) * ppm);
  const h = Math.ceil((map.bounds.y1 - map.bounds.y0 + pad * 2) * ppm);
  const matGrid = makeGrid(w, h);
  const toPx = (pts: Pt[]) => pts.map(([x, y]) => [(x - x0) * ppm, (y - y0) * ppm] as [number, number]);
  map.solids.forEach((s) => {
    const id = MATS.indexOf(s.mat) + 1;
    fillPoly(toPx(s.pts), w, h, (x, y) => gset(matGrid, x, y, id));
  });
  const out = makeGrid(w, h);
  // Distance to open air in all four directions (rim light for cave-like materials).
  let dist: Int16Array | null = null;
  if (map.solids.some((s) => RIMMED.has(s.mat) || s.mat === 'girder') || map.backdrop) {
    dist = new Int16Array(w * h).fill(99);
    const q: number[] = [];
    for (let i = 0; i < w * h; i++) if (!matGrid.data[i]) { dist[i] = 0; q.push(i); }
    for (let k = 0; k < q.length; k++) {
      const i = q[k], d = dist[i];
      if (d >= 16) continue;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && dist[j] > d + 1) { dist[j] = d + 1; q.push(j); }
      }
    }
  }
  // Dark back wall behind caves (render only): cobbles that fade into shadow next to the rock.
  // Kept on its own layer so background props stand in front of it but behind the rock.
  const backOut = map.backdrop ? makeGrid(w, h) : null;
  if (map.backdrop && backOut) {
    const back = makeGrid(w, h);
    for (const b of map.backdrop) fillPoly(toPx(b), w, h, (x, y) => gset(back, x, y, 1));
    const bb = (MATS.indexOf('back')) * SLOTS + 1;
    // distance from rock into the air, for a soft shadow
    const air = new Int16Array(w * h).fill(99);
    const q: number[] = [];
    for (let i = 0; i < w * h; i++) if (matGrid.data[i]) { air[i] = 0; q.push(i); }
    for (let k = 0; k < q.length; k++) {
      const i = q[k], d = air[i];
      if (d >= 10) continue;
      const x = i % w, y = (i / w) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && air[j] > d + 1) { air[j] = d + 1; q.push(j); }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!gget(back, x, y) || gget(matGrid, x, y)) continue;
        const a = air[y * w + x];
        const cell = cobble(x, y, 13);
        let sl = cell.edge ? 7 : cell.v > 0.66 ? 1 : cell.v > 0.33 ? 2 : 3;
        if (a < 4 || (a < 7 && bayer(x, y) * 7 > a - 2)) sl = cell.edge ? 0 : 5;
        gset(backOut, x, y, bb + sl);
      }
    }
  }
  const depth = new Int16Array(w * h);
  for (let x = 0; x < w; x++) {
    let d = 0;
    for (let y = 0; y < h; y++) {
      d = gget(matGrid, x, y) ? d + 1 : 0;
      depth[y * w + x] = d;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const m = gget(matGrid, x, y);
      if (!m) continue;
      const base = (m - 1) * SLOTS + 1;
      const mat = MATS[m - 1];
      const d = depth[y * w + x];
      const edge = !gget(matGrid, x - 1, y) || !gget(matGrid, x + 1, y) || !gget(matGrid, x, y + 1);
      const n = hash2(x >> 1, y >> 1, m);
      const dith = bayer(x, y);
      let s: number;
      if (dist && (RIMMED.has(mat) || mat === 'girder')) {
        s = rimShade(mat, dist[y * w + x], x, y, gget(matGrid, x, y - 1) === m ? 1 : 0, depth[y * w + x], matGrid, w, h, m);
        if (s < 0) continue;
        gset(out, x, y, base + s);
        continue;
      }
      if (d === 1 || edge) s = 0;
      else if (d === 2) s = 1;
      else if (d < 6) s = d === 5 && dith > 0.5 ? 3 : 2;
      else if (d < 8) s = dith < (d - 5) / 3 ? 4 : 3;
      else {
        s = 4;
        if (n > 0.82) s = 5;
        else if (n < 0.1) s = 6;
      }
      // Material specific detail
      switch (mat) {
        case 'grass':
          if (d === 1 && hash2(x, 3, 7) > 0.55) s = 1; // blades
          if (d > 9 && hash2(x >> 2, y >> 2, 3) > 0.9) s = 7; // pebbles
          break;
        case 'rock':
          if (d > 3 && (x * 3 + y * 5) % 23 === 0) s = 7;
          break;
        case 'metal':
          if (d > 2 && (x % 16 === 0 || y % 12 === 0)) s = 5;
          if (d > 2 && x % 16 === 3 && y % 12 === 3) s = 7;
          break;
        case 'ice':
          if (d > 3 && (x + y) % 19 < 2) s = 7;
          break;
        case 'wood':
          if (d > 2 && y % 5 === 0) s = 5;
          if (d > 2 && (x + (Math.floor(y / 5) % 2) * 9) % 18 === 0) s = 5;
          break;
        case 'snow':
          if (d > 2 && d < 7) s = d < 5 ? 2 : 3;
          break;
        case 'moon': {
          const cx = Math.floor(x / 18), cy = Math.floor(y / 18);
          const rx = cx * 18 + 9 + Math.floor(hash2(cx, cy, 5) * 6 - 3), ry = cy * 18 + 9;
          const rr = 2 + hash2(cx, cy, 9) * 5;
          const dd = Math.hypot(x - rx, y - ry);
          if (d > 4 && hash2(cx, cy, 2) > 0.45 && dd < rr) s = dd > rr - 1.2 ? 6 : 5;
          break;
        }
        case 'neon':
          if (d > 3) s = x % 12 === 0 || y % 12 === 0 ? 7 : 4;
          if (d === 3) s = 2;
          break;
        case 'brick': {
          const row = Math.floor(y / 4);
          const bx = (x + (row % 2) * 4) % 8;
          if (d > 2) s = y % 4 === 0 || bx === 0 ? 7 : n > 0.75 ? 5 : 4;
          break;
        }
        case 'sand':
          if (d > 6 && (y + Math.floor(Math.sin(x * 0.2) * 2)) % 7 === 0) s = 5;
          break;
        case 'grave':
          if (d === 1 && hash2(x, 5, 3) > 0.6) s = 1;
          if (d > 6 && hash2(x >> 2, y >> 2, 8) > 0.92) s = 7; // bones / stones
          break;
        case 'basalt': {
          // glowing cracks
          const cx = Math.floor(x / 11), cy = Math.floor(y / 9);
          if (d > 4 && Math.abs(((x + cy * 5) % 11) - 5 - Math.round(Math.sin(y * 0.7 + cx) * 2)) === 0 && hash2(cx, cy, 4) > 0.55) s = 7;
          break;
        }
        case 'turf':
          if (d > 2 && d < 7) s = Math.floor(x / 10) % 2 ? 2 : 3; // mowed stripes
          if (d === 2) s = 1;
          break;
        case 'track':
          if (d > 2 && d < 6) s = 2;
          if (d === 3 && Math.floor(x / 8) % 2 === 0) s = 7; // dashed line
          if (d > 6 && (x % 20 === 0)) s = 5;
          break;
        case 'void': {
          const fx = (x + y) % 14, fy = (x - y + 1400) % 14;
          if (d > 3) s = fx === 0 || fy === 0 ? 7 : n > 0.8 ? 6 : 4;
          break;
        }
        case 'asphalt':
          if (d === 4 && Math.floor(x / 10) % 2 === 0) s = 7;
          if (d > 6 && hash2(x, y, 2) > 0.93) s = 6;
          break;
        case 'tile': {
          if (d > 2 && d < 5) s = 7; // gold trim
          if (d >= 5) s = (Math.floor(x / 8) + Math.floor(y / 6)) % 2 ? 4 : 5;
          if (d >= 5 && (x % 8 === 0 || y % 6 === 0)) s = 6;
          break;
        }
      }
      gset(out, x, y, base + s);
    }
  }
  return { grid: out, back: backOut, palette: terrainPalette(), x0, y0, ppm };
}

/** Voronoi-ish cobblestones: which stone a pixel belongs to and whether it is on a joint. */
function cobble(x: number, y: number, size: number): { v: number; edge: boolean } {
  const cx = Math.floor(x / size), cy = Math.floor(y / size);
  let d1 = 1e9, d2 = 1e9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = cx + i, gy = cy + j;
    const px = gx * size + hash2(gx, gy, 31) * size, py = gy * size + hash2(gx, gy, 37) * size;
    const d = (x - px) * (x - px) + (y - py) * (y - py) * 1.3;
    if (d < d1) { d2 = d1; d1 = d; id = gx * 7919 + gy; } else if (d < d2) d2 = d;
  }
  return { v: hash2(id, 3, 5), edge: Math.sqrt(d2) - Math.sqrt(d1) < 1.1 };
}

/**
 * Rim-lit shading (slot index, -1 = leave transparent): a dark outline, a bright rim,
 * a glow that fades into a textured body. Girders become a see-through lattice.
 */
function rimShade(mat: TerrainMat | 'back', d: number, x: number, y: number, _up: number, depthTop: number, grid: PixelGrid, _w: number, h: number, id: number): number {
  if (mat === 'girder') {
    // vertical extent of the girder through this column
    let up = depthTop - 1, dn = 0;
    while (dn < 40 && y + dn + 1 < h && gget(grid, x, y + dn + 1) === id) dn++;
    const H = up + dn + 1;
    if (up <= 1 || dn <= 1) return up === 0 || dn === 0 ? 0 : up === 1 ? 1 : 5;
    const cell = Math.max(6, H - 2);
    const lx = ((x % (cell * 2)) + cell * 2) % (cell * 2);
    const t = (up - 1) / Math.max(1, H - 3);
    const diag = Math.abs(lx / cell - (lx < cell ? t : 2 - t)) * cell;
    if (lx < 2) return lx === 0 ? 0 : 3;
    if (diag < 1.2) return diag < 0.6 ? 2 : 4;
    return -1;
  }
  if (d <= 1) return 0;
  if (d === 2) return 1;
  if (d === 3) return 2;
  const glow = d < 7 ? (bayer(x, y) * 4 < 7 - d ? 2 : 3) : 3;
  if (d < 9 && glow === 2) return 2;
  if (mat === 'cave') {
    const c = cobble(x, y, 8);
    if (c.edge) return 7;
    if (d < 9) return 3;
    return c.v > 0.7 ? 6 : c.v < 0.25 ? 5 : 4;
  }
  if (mat === 'steel') {
    const px = ((x % 20) + 20) % 20, py = ((y % 14) + 14) % 14;
    if (px === 0 || py === 0) return 7;
    if (px === 1 || py === 1) return 6;
    if ((px === 3 || px === 17) && (py === 3 || py === 11)) return 2;
    return d < 9 ? 3 : (x + y * 2) % 23 === 0 ? 6 : 4;
  }
  // amber: grainy glow with darker veins
  const n = hash2(x >> 1, y >> 1, 77);
  if (d >= 9 && Math.abs(((x + Math.round(Math.sin(y * 0.35) * 3)) % 17) - 8) === 0 && n > 0.4) return 7;
  if (d < 9) return 3;
  return n > 0.85 ? 6 : n < 0.12 ? 5 : 4;
}

/* ------------------------------------------------------------------ */
/* Parallax backgrounds                                                */
/* ------------------------------------------------------------------ */

export interface BgLayer {
  /** RGBA pixels */
  w: number;
  h: number;
  rgba: Uint8ClampedArray;
  /** Horizontal parallax factor (0 = fixed, 1 = moves with world). */
  factor: number;
  /** Fraction of screen height where the layer's bottom sits. */
  bottom: number;
}

export interface Theme {
  sky: [string, string, string];
  /** `hang` layers hang from the top of the screen (stalactites) and fill upward. */
  layers: { kind: LayerKind; color: string; color2?: string; factor: number; bottom: number; height: number; seed: number; hang?: boolean }[];
  celestial?: { kind: 'sun' | 'moon' | 'planet'; color: string; x: number; y: number; r: number };
  stars?: boolean;
  clouds?: string;
}

type LayerKind =
  | 'mountains' | 'hills' | 'trees' | 'city' | 'factory' | 'pines' | 'dunes' | 'islands' | 'crystals' | 'craters' | 'ruins'
  | 'graves' | 'volcanoes' | 'stands' | 'palms' | 'sea' | 'pagodas' | 'farm' | 'domewall' | 'blocks' | 'snowpines'
  | 'stalactites' | 'cavewall' | 'girders' | 'pipes';

export const THEMES: Record<ThemeId, Theme> = {
  meadow: {
    sky: ['#4aa8ff', '#9ad8ff', '#e8f8ff'],
    celestial: { kind: 'sun', color: '#fff2a0', x: 0.78, y: 0.18, r: 11 },
    clouds: '#ffffff',
    layers: [
      { kind: 'mountains', color: '#7aa6d8', color2: '#e8f0ff', factor: 0.08, bottom: 0.78, height: 70, seed: 1 },
      { kind: 'hills', color: '#58b45a', color2: '#3f8f46', factor: 0.2, bottom: 0.86, height: 50, seed: 2 },
      { kind: 'trees', color: '#2c7a3c', color2: '#1d5a2c', factor: 0.35, bottom: 0.95, height: 40, seed: 3 },
    ],
  },
  foundry: {
    sky: ['#1a0c14', '#5a1e1e', '#d0582a'],
    stars: false,
    layers: [
      { kind: 'factory', color: '#2a1a1e', color2: '#ff8a3a', factor: 0.1, bottom: 0.8, height: 90, seed: 4 },
      { kind: 'factory', color: '#3a2226', color2: '#ffb050', factor: 0.25, bottom: 0.92, height: 70, seed: 5 },
    ],
  },
  sawmill: {
    sky: ['#ff9a5a', '#ffc88a', '#ffe8c0'],
    celestial: { kind: 'sun', color: '#fff0c0', x: 0.25, y: 0.3, r: 14 },
    clouds: '#ffe0c8',
    layers: [
      { kind: 'mountains', color: '#b07a7a', color2: '#e8c0b0', factor: 0.08, bottom: 0.75, height: 60, seed: 6 },
      { kind: 'pines', color: '#4a5a3a', color2: '#33402a', factor: 0.2, bottom: 0.88, height: 60, seed: 7 },
      { kind: 'pines', color: '#2a3624', color2: '#1c2618', factor: 0.38, bottom: 0.98, height: 60, seed: 8 },
    ],
  },
  sky: {
    sky: ['#2c5cd8', '#6aa0ff', '#d0e4ff'],
    celestial: { kind: 'sun', color: '#ffffff', x: 0.6, y: 0.15, r: 9 },
    clouds: '#ffffff',
    layers: [
      { kind: 'islands', color: '#7a92c8', color2: '#a8c0e8', factor: 0.06, bottom: 0.7, height: 60, seed: 9 },
      { kind: 'islands', color: '#5a78b8', color2: '#88b0e0', factor: 0.15, bottom: 0.95, height: 60, seed: 10 },
    ],
  },
  ice: {
    sky: ['#0c1430', '#24406e', '#5a8ac0'],
    stars: true,
    celestial: { kind: 'moon', color: '#e8f4ff', x: 0.2, y: 0.2, r: 10 },
    layers: [
      { kind: 'crystals', color: '#3a6aa0', color2: '#8ad0ff', factor: 0.1, bottom: 0.8, height: 80, seed: 11 },
      { kind: 'mountains', color: '#5a86b8', color2: '#f0f8ff', factor: 0.22, bottom: 0.92, height: 60, seed: 12 },
    ],
  },
  neon: {
    sky: ['#0a0418', '#2a0c48', '#7a1a6a'],
    stars: true,
    celestial: { kind: 'planet', color: '#ff5ab4', x: 0.7, y: 0.25, r: 16 },
    layers: [
      { kind: 'city', color: '#1c0e34', color2: '#5ef0ff', factor: 0.08, bottom: 0.85, height: 100, seed: 13 },
      { kind: 'city', color: '#120824', color2: '#ff4fd8', factor: 0.2, bottom: 0.97, height: 80, seed: 14 },
    ],
  },
  desert: {
    sky: ['#3a8ae0', '#8cc4f0', '#ffe2b0'],
    celestial: { kind: 'sun', color: '#fff8d0', x: 0.85, y: 0.12, r: 12 },
    layers: [
      { kind: 'dunes', color: '#e8b070', color2: '#c48a4e', factor: 0.08, bottom: 0.8, height: 40, seed: 15 },
      { kind: 'ruins', color: '#b47a4a', color2: '#8a5a34', factor: 0.2, bottom: 0.9, height: 60, seed: 16 },
      { kind: 'dunes', color: '#d49a5a', color2: '#b07a40', factor: 0.35, bottom: 1.0, height: 30, seed: 17 },
    ],
  },
  halloween: {
    sky: ['#0a0614', '#2a1440', '#6a2a5a'],
    stars: true,
    celestial: { kind: 'moon', color: '#ffe8a0', x: 0.75, y: 0.22, r: 16 },
    layers: [
      { kind: 'hills', color: '#2a1a3a', color2: '#1e1230', factor: 0.08, bottom: 0.8, height: 60, seed: 21 },
      { kind: 'graves', color: '#1a1026', color2: '#ff9a2a', factor: 0.22, bottom: 0.95, height: 60, seed: 22 },
    ],
  },
  winter: {
    sky: ['#5a8ad8', '#a8c8f0', '#eef6ff'],
    celestial: { kind: 'sun', color: '#fffbe8', x: 0.2, y: 0.2, r: 10 },
    clouds: '#ffffff',
    layers: [
      { kind: 'mountains', color: '#8aa6d0', color2: '#ffffff', factor: 0.07, bottom: 0.75, height: 70, seed: 23 },
      { kind: 'snowpines', color: '#3a6a5a', color2: '#ffffff', factor: 0.2, bottom: 0.9, height: 60, seed: 24 },
      { kind: 'hills', color: '#e8f0ff', color2: '#c8d6ee', factor: 0.35, bottom: 1.0, height: 30, seed: 25 },
    ],
  },
  alien: {
    sky: ['#06120c', '#163a2a', '#3a7a4a'],
    stars: true,
    celestial: { kind: 'moon', color: '#d8ffd0', x: 0.15, y: 0.2, r: 9 },
    layers: [
      { kind: 'hills', color: '#1a3a24', color2: '#14301c', factor: 0.08, bottom: 0.82, height: 50, seed: 26 },
      { kind: 'farm', color: '#2a1a1a', color2: '#ffd86a', factor: 0.2, bottom: 0.94, height: 60, seed: 27 },
    ],
  },
  dome: {
    sky: ['#10101a', '#24243a', '#3a3a56'],
    layers: [
      { kind: 'domewall', color: '#2a2a3e', color2: '#ffd23f', factor: 0.06, bottom: 0.85, height: 120, seed: 28 },
      { kind: 'stands', color: '#3a3a52', color2: '#ff5a6e', factor: 0.18, bottom: 0.96, height: 50, seed: 29 },
    ],
  },
  volcano: {
    sky: ['#1a0a0a', '#5a1a14', '#e0602a'],
    layers: [
      { kind: 'volcanoes', color: '#2a1a18', color2: '#ff7a1a', factor: 0.07, bottom: 0.8, height: 90, seed: 30 },
      { kind: 'trees', color: '#1e3a1a', color2: '#142a12', factor: 0.22, bottom: 0.95, height: 44, seed: 31 },
    ],
  },
  beach: {
    sky: ['#2a9ae8', '#7accf8', '#fff0c8'],
    celestial: { kind: 'sun', color: '#fff6c0', x: 0.82, y: 0.16, r: 13 },
    clouds: '#ffffff',
    layers: [
      { kind: 'islands', color: '#5a9a6a', color2: '#7ac48a', factor: 0.05, bottom: 0.82, height: 50, seed: 32 },
      { kind: 'sea', color: '#1a7ac8', color2: '#8ae0ff', factor: 0.1, bottom: 1.0, height: 70, seed: 33 },
      { kind: 'palms', color: '#1e6a3a', color2: '#6a4a2a', factor: 0.25, bottom: 0.92, height: 60, seed: 34 },
    ],
  },
  stadium: {
    sky: ['#0a1430', '#1a3060', '#3a5a9a'],
    stars: true,
    layers: [
      { kind: 'stands', color: '#2a3050', color2: '#ffd23f', factor: 0.08, bottom: 0.85, height: 80, seed: 35 },
      { kind: 'stands', color: '#1e2440', color2: '#ffffff', factor: 0.18, bottom: 0.95, height: 50, seed: 36 },
    ],
  },
  cny: {
    sky: ['#1a0610', '#4a0e20', '#a02a2a'],
    stars: true,
    celestial: { kind: 'moon', color: '#ffe080', x: 0.5, y: 0.2, r: 14 },
    layers: [
      { kind: 'mountains', color: '#3a1422', color2: '#5a2032', factor: 0.06, bottom: 0.78, height: 60, seed: 37 },
      { kind: 'pagodas', color: '#2a0a14', color2: '#ffb030', factor: 0.2, bottom: 0.95, height: 80, seed: 38 },
    ],
  },
  rift: {
    sky: ['#04020c', '#1a0a34', '#4a1a6a'],
    stars: true,
    celestial: { kind: 'planet', color: '#c07aff', x: 0.72, y: 0.3, r: 20 },
    layers: [
      { kind: 'crystals', color: '#2a1448', color2: '#ff8ae8', factor: 0.08, bottom: 0.82, height: 90, seed: 39 },
      { kind: 'islands', color: '#1e1036', color2: '#5ef0ff', factor: 0.18, bottom: 0.95, height: 60, seed: 40 },
    ],
  },
  toys: {
    sky: ['#6ab8ff', '#b0e0ff', '#ffffff'],
    clouds: '#ffffff',
    celestial: { kind: 'sun', color: '#fff2a0', x: 0.15, y: 0.18, r: 11 },
    layers: [
      { kind: 'blocks', color: '#ff6a5a', color2: '#5a9aff', factor: 0.08, bottom: 0.85, height: 70, seed: 41 },
      { kind: 'blocks', color: '#ffd23f', color2: '#4ac46a', factor: 0.2, bottom: 0.97, height: 44, seed: 42 },
    ],
  },
  cavern: {
    sky: ['#0a0612', '#1e1430', '#3a2850'],
    layers: [
      { kind: 'stalactites', color: '#1a1228', color2: '#3a2c50', factor: 0.06, bottom: 0.3, height: 60, seed: 51, hang: true },
      { kind: 'cavewall', color: '#241a36', color2: '#3a2c50', factor: 0.1, bottom: 0.9, height: 80, seed: 52 },
    ],
  },
  catacomb: {
    sky: ['#08060c', '#1a141e', '#30263a'],
    layers: [
      { kind: 'stalactites', color: '#140e18', color2: '#2e2234', factor: 0.06, bottom: 0.26, height: 50, seed: 53, hang: true },
      { kind: 'graves', color: '#1c1422', color2: '#e8dcc0', factor: 0.14, bottom: 0.92, height: 60, seed: 54 },
    ],
  },
  grotto: {
    sky: ['#04101a', '#0c2a3a', '#1a4a5c'],
    layers: [
      { kind: 'stalactites', color: '#081a26', color2: '#2a6a7a', factor: 0.06, bottom: 0.3, height: 60, seed: 55, hang: true },
      { kind: 'crystals', color: '#0e2a3a', color2: '#5ef0ff', factor: 0.12, bottom: 0.92, height: 80, seed: 56 },
    ],
  },
  mine: {
    sky: ['#0e0a08', '#2a1c14', '#4a3020'],
    layers: [
      { kind: 'stalactites', color: '#1a120c', color2: '#3a2818', factor: 0.06, bottom: 0.28, height: 50, seed: 57, hang: true },
      { kind: 'girders', color: '#3a2a1c', color2: '#ffb050', factor: 0.12, bottom: 0.95, height: 110, seed: 58 },
    ],
  },
  chasm: {
    sky: ['#1a2a5a', '#5a6aa8', '#f0a87a'],
    celestial: { kind: 'sun', color: '#fff0c0', x: 0.7, y: 0.55, r: 16 },
    clouds: '#f8d8c8',
    layers: [
      { kind: 'mountains', color: '#4a4a7a', color2: '#d8c8e8', factor: 0.06, bottom: 0.8, height: 80, seed: 59 },
      { kind: 'girders', color: '#2a2a4a', color2: '#8a8ab0', factor: 0.16, bottom: 1.0, height: 120, seed: 60 },
    ],
  },
  bunker: {
    sky: ['#0a0e16', '#1a2434', '#2c3a52'],
    layers: [
      { kind: 'pipes', color: '#1a2230', color2: '#ff4a3a', factor: 0.06, bottom: 0.9, height: 160, seed: 61 },
      { kind: 'girders', color: '#222c3c', color2: '#5a6a86', factor: 0.14, bottom: 1.0, height: 90, seed: 62 },
    ],
  },
  crypt: {
    sky: ['#06040a', '#140e1c', '#261a30'],
    layers: [
      { kind: 'stalactites', color: '#120c18', color2: '#2a1e34', factor: 0.06, bottom: 0.32, height: 60, seed: 63, hang: true },
      { kind: 'cavewall', color: '#1a1222', color2: '#ffb050', factor: 0.1, bottom: 0.92, height: 90, seed: 64 },
    ],
  },
  amber: {
    sky: ['#2a0e04', '#6a2a0a', '#d07a20'],
    celestial: { kind: 'sun', color: '#ffe8a0', x: 0.3, y: 0.3, r: 18 },
    layers: [
      { kind: 'dunes', color: '#a0500c', color2: '#7a3a08', factor: 0.08, bottom: 0.82, height: 40, seed: 65 },
      { kind: 'ruins', color: '#6a3006', color2: '#4a2004', factor: 0.18, bottom: 0.94, height: 60, seed: 66 },
    ],
  },
  moon: {
    sky: ['#020208', '#0a0a1c', '#1a1a34'],
    stars: true,
    celestial: { kind: 'planet', color: '#4a9aff', x: 0.3, y: 0.28, r: 22 },
    layers: [
      { kind: 'craters', color: '#4a4a5e', color2: '#6a6a80', factor: 0.08, bottom: 0.85, height: 50, seed: 18 },
      { kind: 'craters', color: '#34344a', color2: '#50506a', factor: 0.2, bottom: 0.97, height: 40, seed: 19 },
    ],
  },
};

/** Periodic noise in [-1,1], tileable over width W. */
function pnoise(x: number, W: number, seed: number, octaves = 4): number {
  let v = 0, amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const k = (o + 1) * (o + 1) + Math.floor(hash2(o, seed) * 3);
    const ph = hash2(seed, o) * Math.PI * 2;
    v += Math.sin((x / W) * Math.PI * 2 * k + ph) * amp;
    tot += amp;
    amp *= 0.5;
  }
  return v / tot;
}

const BG_W = 320;

/** Background cobble joints (tileable over BG_W). */
function cobbleBg(x: number, y: number): boolean {
  const row = Math.floor(y / 9);
  const bx = (x + (row % 2) * 8) % 16;
  return y % 9 === 0 || bx === 0;
}

function putPx(buf: Uint8ClampedArray, w: number, x: number, y: number, c: RGB, a = 255) {
  const i = (y * w + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a;
}

export function generateLayer(spec: Theme['layers'][number]): BgLayer {
  const w = BG_W, h = spec.height;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const c1 = hex(spec.color), c2 = hex(spec.color2 ?? spec.color);
  const s = spec.seed;
  const col = (x: number, top: number, fill: (y: number) => RGB | null) => {
    for (let y = Math.max(0, Math.floor(top)); y < h; y++) {
      const c = fill(y);
      if (c) putPx(rgba, w, x, y, c);
    }
  };
  for (let x = 0; x < w; x++) {
    const n = pnoise(x, w, s);
    switch (spec.kind) {
      case 'mountains': {
        const ridge = (1 - Math.abs(pnoise(x, w, s, 3))) ;
        const top = h - (0.25 + 0.7 * ridge) * h;
        col(x, top, (y) => (y - top < 4 + 3 * ridge && ridge > 0.6 ? c2 : y - top < 1 ? shade(c1, 1.1) : (x + y) % 2 === 0 && y - top < 8 ? mix(c1, c2, 0.15) : c1));
        break;
      }
      case 'hills': {
        const top = h * 0.35 + n * h * 0.25;
        col(x, top, (y) => (y - top < 2 ? shade(c1, 1.2) : bayer(x, y) < (y - top) / h ? c2 : c1));
        break;
      }
      case 'trees': {
        // Round-crowned trees: take the highest crown covering this column.
        const ground = h * 0.78 + n * 3;
        let top = ground, trunk = false, shadeEdge = false;
        for (let k = -2; k <= 2; k++) {
          const cell = Math.floor(x / 16) + k;
          const cx = cell * 16 + 8 + (hash2(cell, s, 1) - 0.5) * 8;
          const r = 6 + hash2(cell, s, 2) * 6;
          const cy = ground - 6 - r - hash2(cell, s, 3) * 8;
          const dx = x - cx;
          if (Math.abs(dx) < r) {
            const t = cy - Math.sqrt(r * r - dx * dx) * (0.85 + 0.15 * Math.abs(Math.sin(dx * 1.3)));
            if (t < top) { top = t; shadeEdge = dx > r * 0.35; }
          }
          if (Math.abs(dx) < 1.2) trunk = true;
        }
        col(x, top, (y) => {
          if (y >= ground) return c2;
          if (y - top < 1.5 && !shadeEdge) return shade(c1, 1.3);
          if (shadeEdge || (bayer(x, y) < 0.25 && y - top > 6)) return c2;
          return trunk && y > ground - 7 ? shade(c2, 0.7) : c1;
        });
        break;
      }
      case 'pines': {
        const cell = Math.floor(x / 7);
        const cx = cell * 7 + 3;
        const th = 22 + hash2(cell, s) * 30;
        const dx = Math.abs(x - cx);
        const top = h - th + dx * 2.6 + ((h - th + dx * 2.6) % 6 < 2 ? 0 : 0);
        const ground = h - 6 + n * 2;
        col(x, Math.min(top, ground), (y) => (y > top && (y - top) % 7 === 0 ? c2 : c1));
        break;
      }
      case 'city':
      case 'factory': {
        const cell = Math.floor(x / 14);
        const bh = (0.3 + hash2(cell, s) * 0.65) * h;
        const top = h - bh;
        const lx = x % 14;
        const gap = lx === 13;
        const chimney = spec.kind === 'factory' && hash2(cell, s + 1) > 0.6 && lx >= 5 && lx <= 7;
        const ctop = chimney ? top - 18 : top;
        if (gap && !chimney) col(x, h - bh * 0.4, () => shade(c1, 0.8));
        else
          col(x, ctop, (y) => {
            if (chimney && y < top) return y < ctop + 2 ? c2 : c1;
            const win = lx > 1 && lx < 12 && lx % 3 !== 0 && (y - Math.floor(top)) % 5 > 1 && y > top + 3;
            return win && hash2(x >> 1, y, s) > 0.45 ? c2 : y - top < 1 ? shade(c1, 1.5) : c1;
          });
        break;
      }
      case 'dunes': {
        const top = h * 0.4 + pnoise(x, w, s, 2) * h * 0.35;
        col(x, top, (y) => (y - top < 2 ? shade(c1, 1.15) : bayer(x, y) < (y - top) / (h * 0.8) ? c2 : c1));
        break;
      }
      case 'ruins': {
        const cell = Math.floor(x / 24);
        const lx = x % 24;
        const kind = hash2(cell, s);
        let top = h - 4;
        if (kind > 0.55 && (lx < 4 || (lx > 14 && lx < 18))) top = h - (24 + kind * 30); // columns
        if (kind > 0.55 && lx < 18 && top > h - 30) top = Math.min(top, h - (26 + kind * 30));
        if (kind < 0.35) top = h - 10 - Math.abs(12 - lx) * -0.5 - (12 - Math.abs(12 - lx)) * 2; // pyramid
        col(x, top, (y) => ((y + lx) % 6 === 0 ? c2 : c1));
        break;
      }
      case 'islands': {
        const cell = Math.floor(x / 64);
        const cx = cell * 64 + 32 + (hash2(cell, s) - 0.5) * 20;
        const r = 12 + hash2(cell, s + 3) * 14;
        const dx = Math.abs(x - cx);
        if (dx < r) {
          const midY = h * 0.42 + hash2(cell, s + 5) * 8;
          const top = midY - Math.sqrt(r * r - dx * dx) * 0.12 - 1;
          const k = 1 - dx / r;
          const bot = midY + Math.pow(k, 0.7) * r * 1.2 * (0.8 + 0.2 * Math.abs(Math.sin(x * 0.9)));
          for (let y = Math.floor(top); y < Math.min(h, bot); y++) putPx(rgba, w, x, y, y < top + 2.5 ? c2 : (x + y) % 5 === 0 ? shade(c1, 0.9) : c1);
        }
        break;
      }
      case 'crystals': {
        const cell = Math.floor(x / 11);
        const cx = cell * 11 + 5;
        const th = 20 + hash2(cell, s) * 50;
        const dx = Math.abs(x - cx);
        const top = h - th + dx * (th / 6);
        col(x, Math.min(top, h - 8), (y) => (x < cx && y < h - 8 ? c2 : c1));
        break;
      }
      case 'graves': {
        const ground = h * 0.8 + n * 3;
        const cell = Math.floor(x / 12), lx = x % 12;
        const kind = hash2(cell, s);
        let top = ground;
        if (kind > 0.7 && lx > 3 && lx < 9) top = ground - 10 + (lx - 6) * (lx - 6) * 0.4; // tombstone
        if (kind > 0.5 && kind <= 0.7 && Math.abs(lx - 6) < 3) top = ground - 9; // cross arms
        if (kind > 0.5 && kind <= 0.7 && lx === 6) top = ground - 14; // cross post
        if (kind < 0.12) top = ground - 26 + Math.abs(lx - 6) * 3; // dead tree
        const glow = kind > 0.85 && lx === 6 && hash2(cell, 3) > 0.5;
        col(x, top, (y) => (glow && y > top + 3 && y < top + 6 ? c2 : y < ground ? shade(c1, 0.85) : c1));
        break;
      }
      case 'volcanoes': {
        const cell = Math.floor(x / 160);
        const cx = cell * 160 + 80 + (hash2(cell, s) - 0.5) * 40;
        const dx = Math.abs(x - cx);
        const top = Math.max(h * 0.15 + Math.max(0, dx - 10) * 0.9, h * 0.5 + n * 8);
        const crater = dx < 10;
        col(x, top, (y) => {
          if (crater && y < top + 3) return c2;
          if (dx < 22 && y - top < 30 && Math.abs(x - cx + Math.sin(y * 0.4) * 3) < 1.5) return shade(c2, 0.8); // lava stream
          return y - top < 2 ? shade(c1, 1.3) : c1;
        });
        break;
      }
      case 'stands': {
        const top = h * 0.25;
        col(x, top, (y) => {
          const row = Math.floor((y - top) / 5);
          if ((y - top) % 5 === 0) return shade(c1, 1.25);
          if ((y - top) % 5 === 2 && hash2(x, row, s) > 0.45) return hash2(x, row, s + 1) > 0.8 ? c2 : mix(c1, [255, 255, 255], 0.35 + hash2(x >> 1, row) * 0.3);
          return c1;
        });
        if (x % 80 === 10) for (let y = 0; y < top; y++) putPx(rgba, w, x, y, shade(c1, 0.8));
        if (x % 80 >= 6 && x % 80 <= 14) for (let y = 0; y < 5; y++) putPx(rgba, w, x, y, y > 0 && y < 4 ? [255, 250, 210] : shade(c1, 0.6));
        break;
      }
      case 'palms': {
        const cell = Math.floor(x / 50);
        const cx = cell * 50 + 25 + (hash2(cell, s) - 0.5) * 16;
        const th = 30 + hash2(cell, s + 2) * 20;
        const dx = x - cx;
        const ground = h - 2;
        const trunkX = cx + Math.sin((ground - (h - th)) * 0.02) * 3;
        let top = ground;
        if (Math.abs(x - trunkX) < 1.5) top = h - th;
        const fr = Math.abs(dx);
        if (fr < 14) top = Math.min(top, h - th - 2 + fr * fr * 0.05 - (fr < 3 ? 2 : 0));
        if (fr < 14 && fr > 1.5) {
          const yf = h - th - 2 + fr * fr * 0.05;
          for (let y = Math.floor(yf); y < yf + 3 && y < h; y++) putPx(rgba, w, x, y, c1);
        } else col(x, top, (y) => (y < h - th + 2 ? c1 : c2));
        break;
      }
      case 'sea': {
        const top = h * 0.3 + Math.sin(x * 0.15) * 1.2;
        col(x, top, (y) => ((y - Math.floor(top)) % 9 === 0 && (x + y * 3) % 12 < 5 ? c2 : y - top < 2 ? c2 : c1));
        break;
      }
      case 'pagodas': {
        const cell = Math.floor(x / 40);
        const lx = x % 40;
        const kind = hash2(cell, s);
        let top = h - 6 + n * 2;
        if (kind > 0.35) {
          const tiers = 2 + Math.floor(kind * 3);
          const base = h - 6;
          for (let t = 0; t < tiers; t++) {
            const ty = base - 12 - t * 12;
            const half = 16 - t * 3;
            const d = Math.abs(lx - 20);
            if (d < half) top = Math.min(top, ty + (d > half - 4 ? -(d - half + 4) : 0) + 3);
            if (d < half - 4) top = Math.min(top, ty + 3);
          }
          if (Math.abs(lx - 20) < 1) top = base - 12 - tiers * 12 - 4;
        }
        col(x, top, (y) => ((y - Math.floor(top)) % 12 === 4 && kind > 0.35 && hash2(x >> 2, y, s) > 0.5 ? c2 : c1));
        break;
      }
      case 'farm': {
        const cell = Math.floor(x / 70);
        const lx = x % 70;
        const kind = hash2(cell, s);
        const ground = h - 6 + n * 2;
        let top = ground;
        if (kind > 0.5 && lx > 10 && lx < 40) top = ground - 22 + Math.max(0, Math.abs(lx - 25) - 6) * 0.9; // barn
        if (kind > 0.5 && lx >= 44 && lx < 52) top = ground - 34 + (lx === 44 || lx === 51 ? 2 : 0); // silo
        if (lx % 9 === 0) top = Math.min(top, ground - 5); // fence posts
        col(x, top, (y) => (kind > 0.5 && lx > 21 && lx < 29 && y > top + 6 && y < top + 10 && hash2(cell, 2) > 0.3 ? c2 : y === Math.floor(ground) - 3 ? shade(c1, 1.3) : c1));
        break;
      }
      case 'domewall': {
        const top = h * 0.05 + Math.pow((x - w / 2) / (w / 2), 2) * h * 0.25;
        col(x, top, (y) => {
          if ((y - Math.floor(top)) % 20 === 6 && x % 6 < 2) return c2; // light bulbs row
          if ((y - Math.floor(top)) % 20 < 2) return shade(c1, 1.3);
          return x % 24 === 0 ? shade(c1, 0.75) : c1;
        });
        break;
      }
      case 'blocks': {
        const cell = Math.floor(x / 16);
        const stack = 1 + Math.floor(hash2(cell, s) * 4);
        const top = h - stack * 14 - 2;
        const lx = x % 16;
        col(x, top, (y) => {
          const b = Math.floor((y - top) / 14);
          const edge = lx === 0 || lx === 15 || (y - top) % 14 === 0;
          const cc = hash2(cell, b, s) > 0.5 ? c1 : c2;
          return edge ? shade(cc, 0.7) : (y - top) % 14 < 3 ? shade(cc, 1.25) : cc;
        });
        break;
      }
      case 'snowpines': {
        const cell = Math.floor(x / 9);
        const cx = cell * 9 + 4;
        const th = 24 + hash2(cell, s) * 28;
        const dx = Math.abs(x - cx);
        const top = h - th + dx * 2.4;
        const ground = h - 6 + n * 2;
        col(x, Math.min(top, ground), (y) => (y > top && (y - top) % 8 < 2 ? c2 : y < top + 3 ? c2 : c1));
        break;
      }
      case 'stalactites': {
        const cell = Math.floor(x / 14);
        const lx = x % 14;
        const len = (0.3 + hash2(cell, s) * 0.7) * h;
        const tip = len * (1 - Math.abs(lx - 7) / 7.5);
        for (let y = 0; y < Math.min(h, tip); y++) putPx(rgba, w, x, y, lx < 3 && y < tip - 2 ? c2 : c1);
        break;
      }
      case 'cavewall': {
        const top = h * 0.25 + n * h * 0.2;
        col(x, top, (y) => {
          const b = cobbleBg(x, y);
          return b ? shade(c1, 0.8) : y - top < 2 ? c2 : (x * 3 + y) % 17 === 0 ? mix(c1, c2, 0.4) : c1;
        });
        break;
      }
      case 'girders': {
        const cell = Math.floor(x / 48), lx = x % 48;
        const tw = 10;
        const top = h * (0.15 + hash2(cell, s) * 0.35);
        const inTower = lx >= 19 && lx < 19 + tw;
        if (inTower) {
          col(x, top, (y) => {
            const ly = (y - Math.floor(top)) % tw;
            const tx = lx - 19;
            if (tx === 0 || tx === tw - 1) return c1;
            if (ly === 0 || Math.abs(tx - ly) < 1 || Math.abs(tw - 1 - tx - ly) < 1) return c1;
            if (y - top < 3 && tx % 3 === 0) return c2;
            return null;
          });
        }
        // horizontal beam between towers
        const by = Math.floor(h * 0.55 + hash2(cell, s + 1) * 10);
        for (let y = by; y < by + 3; y++) putPx(rgba, w, x, y, y === by ? c2 : c1);
        break;
      }
      case 'pipes': {
        const top = h * 0.1;
        for (let y = Math.floor(top); y < h; y++) {
          const vx = x % 40;
          const hy = (y + Math.floor(x / 40) * 13) % 52;
          let c: RGB | null = null;
          if (vx >= 6 && vx < 12) c = vx === 6 || vx === 11 ? shade(c1, 0.7) : vx === 8 ? shade(c1, 1.4) : c1;
          if (hy >= 20 && hy < 25) c = hy === 20 ? shade(c1, 1.4) : hy === 24 ? shade(c1, 0.7) : c1;
          if (vx >= 6 && vx < 12 && hy === 30 && hash2(Math.floor(x / 40), 1, s) > 0.5) c = c2;
          if (c) putPx(rgba, w, x, y, c);
        }
        break;
      }
      case 'craters': {
        const top = h * 0.5 + n * 6;
        const cell = Math.floor(x / 40);
        const cx = cell * 40 + 20, rr = 8 + hash2(cell, s) * 10;
        const dx = Math.abs(x - cx);
        const rim = dx < rr ? -Math.max(0, 3 - Math.abs(dx - rr * 0.85)) : 0;
        col(x, top + rim, (y) => (y - top - rim < 1 ? c2 : c1));
        break;
      }
    }
  }
  return { w, h, rgba, factor: spec.factor, bottom: spec.bottom };
}

/** Sky: tall thin gradient with ordered dithering, plus sun/moon/stars & clouds. */
export function generateSky(theme: Theme): { w: number; h: number; rgba: Uint8ClampedArray } {
  const w = BG_W, h = 180;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const [a, b, c] = theme.sky.map(hex);
  const bands = 7;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t = y / (h - 1);
      const tt = t * bands;
      const band = Math.floor(tt);
      const frac = tt - band;
      const q = (band + (frac > bayer(x, y) ? 1 : 0)) / bands;
      const col = q < 0.5 ? mix(a, b, q * 2) : mix(b, c, (q - 0.5) * 2);
      putPx(rgba, w, x, y, col);
    }
  }
  if (theme.stars) {
    for (let i = 0; i < 90; i++) {
      const x = Math.floor(hash2(i, 1, 9) * w), y = Math.floor(hash2(i, 2, 9) * h * 0.7);
      putPx(rgba, w, x, y, hash2(i, 3) > 0.7 ? [255, 255, 255] : [170, 180, 220]);
    }
  }
  const ce = theme.celestial;
  if (ce) {
    const cx = ce.x * w, cy = ce.y * h;
    const col = hex(ce.color);
    for (let y = Math.floor(cy - ce.r - 4); y <= cy + ce.r + 4; y++) {
      for (let x = Math.floor(cx - ce.r - 4); x <= cx + ce.r + 4; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d <= ce.r) {
          let cc = col;
          if (ce.kind === 'moon' && hash2(x >> 1, y >> 1, 4) > 0.8) cc = shade(col, 0.85);
          if (ce.kind === 'planet') cc = Math.floor((y - cy) / 3) % 2 === 0 ? col : shade(col, 0.8);
          if (ce.kind === 'planet' && x - cx > ce.r * 0.4 - (y - cy) * 0.2) cc = shade(cc, 0.65);
          putPx(rgba, w, x, y, cc);
        } else if (ce.kind === 'sun' && d < ce.r + 4 && bayer(x, y) < 0.5 - (d - ce.r) / 8) {
          putPx(rgba, w, x, y, mix(col, hex(theme.sky[1]), 0.5));
        }
      }
    }
    if (ce.kind === 'planet') {
      for (let x = Math.floor(cx - ce.r * 1.8); x < cx + ce.r * 1.8; x++) {
        const y = Math.round(cy + (x - cx) * 0.25);
        if (x >= 0 && x < w && y >= 0 && y < h && Math.abs(x - cx) > ce.r * 0.7) putPx(rgba, w, x, y, shade(col, 1.3));
      }
    }
  }
  if (theme.clouds) {
    const cc = hex(theme.clouds);
    for (let i = 0; i < 6; i++) {
      const cx = hash2(i, 5, 2) * w, cy = 20 + hash2(i, 6, 2) * 60;
      const len = 18 + hash2(i, 7) * 26;
      for (let k = 0; k < 4; k++) {
        const bx = cx + (k - 1.5) * len * 0.3, by = cy - (k % 2) * 3, r = len * (0.22 + (k % 2) * 0.1);
        for (let y = Math.floor(by - r); y <= by + r * 0.5; y++)
          for (let x = Math.floor(bx - r); x <= bx + r; x++) {
            const xx = ((x % w) + w) % w;
            if (y < 0 || y >= h) continue;
            if (Math.hypot(x - bx, (y - by) * 1.4) <= r) putPx(rgba, w, xx, y, y > by ? shade(cc, 0.9) : cc);
          }
      }
    }
  }
  return { w, h, rgba };
}
