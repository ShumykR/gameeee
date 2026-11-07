export type RGB = [number, number, number];

export function hex(c: string): RGB {
  const s = c.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((ch) => ch + ch).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex(c: RGB): number {
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

export function shade(c: RGB, f: number): RGB {
  // f < 1 darkens, f > 1 lightens toward white
  if (f <= 1) return [c[0] * f, c[1] * f, c[2] * f].map((v) => Math.round(v)) as RGB;
  const t = f - 1;
  return [c[0] + (255 - c[0]) * t, c[1] + (255 - c[1]) * t, c[2] + (255 - c[2]) * t].map((v) => Math.round(v)) as RGB;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map((v) => Math.round(v)) as RGB;
}

/** Rotate hue by `deg` degrees. */
export function hueShift(c: RGB, deg: number): RGB {
  const [r, g, b] = c.map((v) => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + deg + 360) % 360;
  const C = (1 - Math.abs(2 * l - 1)) * s;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - C / 2;
  let rgb: number[];
  if (h < 60) rgb = [C, X, 0];
  else if (h < 120) rgb = [X, C, 0];
  else if (h < 180) rgb = [0, C, X];
  else if (h < 240) rgb = [0, X, C];
  else if (h < 300) rgb = [X, 0, C];
  else rgb = [C, 0, X];
  return rgb.map((v) => Math.round((v + m) * 255)) as RGB;
}

/** Deterministic hash noise in [0,1). */
export function hash2(x: number, y: number, seed = 0): number {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 4x4 Bayer ordered-dither threshold in [0,1). */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(x: number, y: number): number {
  return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
}
