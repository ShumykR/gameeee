import { Texture } from 'pixi.js';
import { canvasTexture } from './textures';

/**
 * Renders text as crisp pixel-art: draw at a tiny font size, threshold the
 * alpha to hard pixels, then add a 1px outline and drop shadow. Works for any
 * script (Latin, Cyrillic) without shipping a font.
 */
export function pixelTextCanvas(text: string, opts: { size?: number; color?: string; outline?: string; shadow?: string } = {}): HTMLCanvasElement {
  const size = opts.size ?? 9;
  const color = opts.color ?? '#ffffff';
  const outline = opts.outline ?? '#14101e';
  const font = `bold ${size}px "Trebuchet MS", Verdana, sans-serif`;
  const m = document.createElement('canvas').getContext('2d')!;
  m.font = font;
  const tw = Math.ceil(m.measureText(text).width) + 6;
  const th = Math.ceil(size * 1.35) + 6;
  const c = document.createElement('canvas');
  c.width = tw;
  c.height = th;
  const ctx = c.getContext('2d')!;
  ctx.font = font;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, 3, th / 2 + 0.5);
  const img = ctx.getImageData(0, 0, tw, th);
  const src = img.data;
  const mask = new Uint8Array(tw * th);
  for (let i = 0; i < tw * th; i++) mask[i] = src[i * 4 + 3] > 110 ? 1 : 0;
  const parse = (hexs: string) => {
    const n = parseInt(hexs.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const fc = parse(color), oc = parse(outline), sc = parse(opts.shadow ?? outline);
  const out = ctx.createImageData(tw, th);
  const d = out.data;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= tw || y >= th ? 0 : mask[y * tw + x]);
  for (let y = 0; y < th; y++) {
    for (let x = 0; x < tw; x++) {
      const i = (y * tw + x) * 4;
      let c3: number[] | null = null;
      if (at(x, y)) c3 = y > th * 0.62 && fc[0] + fc[1] + fc[2] > 200 ? fc.map((v) => v * 0.82) : fc;
      else if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1) || at(x - 1, y - 1) || at(x + 1, y - 1)) c3 = oc;
      else if (at(x - 1, y - 2) || at(x, y - 2)) c3 = sc;
      if (c3) {
        d[i] = c3[0]; d[i + 1] = c3[1]; d[i + 2] = c3[2]; d[i + 3] = 255;
      }
    }
  }
  ctx.clearRect(0, 0, tw, th);
  ctx.putImageData(out, 0, 0);
  return c;
}

const cache = new Map<string, Texture>();
export function pixelText(text: string, opts: { size?: number; color?: string; outline?: string } = {}): Texture {
  const key = `${text}|${opts.size}|${opts.color}|${opts.outline}`;
  let t = cache.get(key);
  if (!t) {
    t = canvasTexture(pixelTextCanvas(text, opts));
    cache.set(key, t);
    if (cache.size > 300) {
      const first = cache.keys().next().value!;
      cache.get(first)?.destroy(true);
      cache.delete(first);
    }
  }
  return t;
}
