import { ART_PPM } from '../physics/constants';
import type { RGB } from '../render/color';
import { PixelGrid, makeGrid, gset } from '../render/grid';

/** Shared palette for map props (saws, pads, crates, platforms, lava, spikes). */
export const PROP_PAL: (RGB | null)[] = [
  null,
  [16, 14, 22], // 1 outline
  [120, 128, 142], // 2 steel
  [196, 204, 216], // 3 steel light
  [70, 76, 90], // 4 steel dark
  [240, 190, 40], // 5 yellow
  [30, 28, 36], // 6 black
  [166, 104, 58], // 7 wood
  [112, 66, 38], // 8 wood dark
  [255, 120, 30], // 9 lava orange
  [255, 220, 90], // 10 lava light
  [200, 40, 20], // 11 lava dark
  [255, 250, 200], // 12 lava hot
  [230, 60, 60], // 13 red
];

export function sawGrid(r: number, ppm = ART_PPM): PixelGrid {
  const R = Math.round(r * ppm);
  const size = R * 2 + 3;
  const c = R + 1;
  const g = makeGrid(size, size, c, c);
  const teeth = Math.max(8, Math.round(R * 0.9));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - c, dy = y - c;
      const d = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      const t = (((a / (Math.PI * 2)) * teeth) % 1 + 1) % 1;
      const edgeR = R * 0.82 + t * R * 0.2;
      if (d > edgeR + 0.4) continue;
      let v = 2;
      if (d > edgeR - 0.8) v = 1;
      else if (d > R * 0.72) v = 3;
      else if (d < R * 0.18) v = 6;
      else if (d < R * 0.26) v = 4;
      else if (Math.abs(Math.sin(a * 3)) < 0.15) v = 4;
      gset(g, x, y, v);
    }
  }
  return g;
}

export function crateGrid(size: number, ppm = ART_PPM): PixelGrid {
  const n = Math.round(size * ppm);
  const g = makeGrid(n, n, n / 2, n / 2);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      let v = 7;
      if (x === 0 || y === 0 || x === n - 1 || y === n - 1) v = 1;
      else if (x < 3 || y < 3 || x > n - 4 || y > n - 4) v = 8;
      else if (Math.abs(x - y) < 2 || Math.abs(x + y - n) < 2) v = 8;
      else if (y % 4 === 0) v = 8;
      gset(g, x, y, v);
    }
  return g;
}

export function plateGrid(w: number, h: number, ppm = ART_PPM): PixelGrid {
  const W = Math.round(w * ppm), H = Math.round(h * ppm);
  const g = makeGrid(W, H, W / 2, H / 2);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 2;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) v = 1;
      else if (y === 1) v = 3;
      else if (y >= H - 2) v = 4;
      else if ((x + 2) % 8 === 0 && y === Math.floor(H / 2)) v = 3;
      else if (y > 1 && y < 4 && (Math.floor(x / 4) % 2 === 0)) v = 5;
      else if (y > 1 && y < 4) v = 6;
      gset(g, x, y, v);
    }
  return g;
}

export function padGrid(w: number, ppm = ART_PPM): PixelGrid {
  const W = Math.round(w * ppm), H = Math.round(0.4 * ppm) + 4;
  const g = makeGrid(W, H, W / 2, 4);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let v = 0;
      if (y < 4) v = y === 0 ? 1 : (Math.floor((x + y) / 3) % 2 ? 5 : 6);
      else if (x === 0 || x === W - 1 || y === H - 1) v = 1;
      else v = (y - 4) % 3 === 0 && x > 2 && x < W - 3 ? 3 : 4;
      if (y >= 4 && (x === 0 || x === W - 1)) v = 1;
      gset(g, x, y, v);
    }
  return g;
}

export function spikesGrid(w: number, ppm = ART_PPM): PixelGrid {
  const W = Math.round(w * ppm), H = Math.round(0.5 * ppm);
  const g = makeGrid(W, H, 0, H);
  const tw = 6;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const lx = x % tw;
      const half = (tw - 1) / 2;
      const top = H - 1 - (half - Math.abs(lx - half)) * (H / half) ;
      if (y < top) continue;
      gset(g, x, y, Math.abs(y - top) < 1 ? 1 : lx < half ? 3 : 2);
    }
  return g;
}

/** Tileable lava tile (animated by scrolling). */
export function lavaGrid(): PixelGrid {
  const W = 32, H = 32;
  const g = makeGrid(W, H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const w1 = Math.sin((x / W) * Math.PI * 4 + y * 0.3) + Math.sin((y / H) * Math.PI * 2 * 2 + x * 0.2);
      let v = w1 > 1.1 ? 12 : w1 > 0.4 ? 10 : w1 > -0.6 ? 9 : 11;
      gset(g, x, y, v);
    }
  return g;
}

export function lavaSurfaceGrid(): PixelGrid {
  const W = 32, H = 4;
  const g = makeGrid(W, H);
  for (let x = 0; x < W; x++) {
    const top = Math.round(1.5 + Math.sin((x / W) * Math.PI * 4) * 1.5);
    for (let y = top; y < H; y++) gset(g, x, y, y === top ? 12 : 10);
  }
  return g;
}
