import { ART_PPM } from '../physics/constants';
import { RGB, hex, shade, mix, hash2, bayer } from '../render/color';
import { PixelGrid, makeGrid, gget, gset, fillPoly } from '../render/grid';
import type { MapDef, TerrainMat, ThemeId } from './types';

/* ------------------------------------------------------------------ */
/* Terrain                                                             */
/* ------------------------------------------------------------------ */

const MATS: TerrainMat[] = ['grass', 'rock', 'sand', 'metal', 'ice', 'wood', 'snow', 'moon', 'neon', 'brick'];
/** slots per material: 0 outline,1 top,2 surface,3 surface dark,4 base,5 base dark,6 base light,7 detail */
const SLOTS = 8;

const MAT_COLORS: Record<TerrainMat, string[]> = {
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
};

export function terrainPalette(): (RGB | null)[] {
  const pal: (RGB | null)[] = [null];
  for (const m of MATS) for (const c of MAT_COLORS[m]) pal.push(hex(c));
  return pal;
}

export interface TerrainArt {
  grid: PixelGrid;
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
  map.solids.forEach((s) => {
    const id = MATS.indexOf(s.mat) + 1;
    fillPoly(s.pts.map(([x, y]) => [(x - x0) * ppm, (y - y0) * ppm] as [number, number]), w, h, (x, y) => gset(matGrid, x, y, id));
  });
  const out = makeGrid(w, h);
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
      }
      gset(out, x, y, base + s);
    }
  }
  return { grid: out, palette: terrainPalette(), x0, y0, ppm };
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
  layers: { kind: LayerKind; color: string; color2?: string; factor: number; bottom: number; height: number; seed: number }[];
  celestial?: { kind: 'sun' | 'moon' | 'planet'; color: string; x: number; y: number; r: number };
  stars?: boolean;
  clouds?: string;
}

type LayerKind = 'mountains' | 'hills' | 'trees' | 'city' | 'factory' | 'pines' | 'dunes' | 'islands' | 'crystals' | 'craters' | 'ruins';

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

function putPx(buf: Uint8ClampedArray, w: number, x: number, y: number, c: RGB, a = 255) {
  const i = (y * w + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = a;
}

export function generateLayer(spec: Theme['layers'][number]): BgLayer {
  const w = BG_W, h = spec.height;
  const rgba = new Uint8ClampedArray(w * h * 4);
  const c1 = hex(spec.color), c2 = hex(spec.color2 ?? spec.color);
  const s = spec.seed;
  const col = (x: number, top: number, fill: (y: number) => RGB) => {
    for (let y = Math.max(0, Math.floor(top)); y < h; y++) putPx(rgba, w, x, y, fill(y));
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
        const base = h * 0.6 + n * 4;
        const cell = Math.floor(x / 9);
        const cx = cell * 9 + 4;
        const th = 10 + hash2(cell, s) * 18;
        const dx = Math.abs(x - cx);
        const crown = base - th + dx * dx * 0.25;
        col(x, Math.min(base, crown), (y) => (y < base ? ((x + y) % 3 === 0 ? c2 : y < crown + 2 ? shade(c1, 1.25) : c1) : c2));
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
        const r = 14 + hash2(cell, s + 3) * 14;
        const dx = Math.abs(x - cx);
        if (dx < r) {
          const midY = h * 0.45;
          const top = midY - Math.sqrt(r * r - dx * dx) * 0.3;
          const bot = midY + (r - dx) * 1.1;
          for (let y = Math.floor(top); y < Math.min(h, bot); y++) putPx(rgba, w, x, y, y < top + 2 ? c2 : c1);
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
