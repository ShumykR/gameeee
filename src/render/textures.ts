import { Texture } from 'pixi.js';
import type { RGB } from './color';
import { PixelGrid, gridToRGBA } from './grid';

export function rgbaCanvas(w: number, h: number, rgba: Uint8ClampedArray): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba), w, h), 0, 0);
  return c;
}

export function canvasTexture(c: HTMLCanvasElement): Texture {
  const t = Texture.from(c);
  t.source.scaleMode = 'nearest';
  return t;
}

export function rgbaTexture(w: number, h: number, rgba: Uint8ClampedArray): Texture {
  return canvasTexture(rgbaCanvas(w, h, rgba));
}

export function gridTexture(g: PixelGrid, palette: (RGB | null)[]): Texture {
  return rgbaTexture(g.w, g.h, gridToRGBA(g, palette));
}

let white: Texture | null = null;
export function whiteTexture(): Texture {
  if (!white) {
    const c = document.createElement('canvas');
    c.width = c.height = 2;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 2, 2);
    white = canvasTexture(c);
  }
  return white;
}
