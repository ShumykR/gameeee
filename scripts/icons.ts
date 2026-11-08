// Generates PWA icons (PNG) from the same pixel-art generators the game uses.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { CAR_BY_ID } from '../src/cars/defs';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateWheelGrid, wheelPalette } from '../src/cars/sprite';
import { CAR_PPM } from '../src/physics/constants';
import type { PixelGrid } from '../src/render/grid';
import type { RGB } from '../src/render/color';

function crc32(buf: Buffer) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(w: number, h: number, rgba: Uint8Array) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const S = 76; // base canvas in art pixels
const img = new Uint8Array(S * S * 4);
const put = (x: number, y: number, c: RGB) => { if (x < 0 || y < 0 || x >= S || y >= S) return; const i = (y * S + x) * 4; img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; img[i + 3] = 255; };
// background: dithered sunset gradient + ground
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  const t = y / S;
  const b = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16;
  const band = Math.floor(t * 6 + b * 0.9);
  const cols: RGB[] = [[42, 20, 70], [70, 30, 100], [120, 40, 110], [190, 60, 100], [240, 110, 80], [255, 170, 80], [255, 200, 110]];
  put(x, y, cols[Math.min(6, band)]);
}
for (let y = 54; y < S; y++) for (let x = 0; x < S; x++) put(x, y, y === 54 ? [140, 230, 90] : y < 57 ? [80, 180, 60] : (x * 7 + y * 3) % 11 === 0 ? [90, 56, 30] : [130, 86, 50]);
const blit = (g: PixelGrid, pal: (RGB | null)[], ox: number, oy: number) => {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) { const v = g.data[y * g.w + x]; const c = pal[v]; if (c) put(ox + x - g.ox, oy + y - g.oy, c); }
};
const def = CAR_BY_ID.sparrow;
const cx = 38, cy = 45;
blit(generateHeadGrid(def.head.r), driverPalette('#3ec1ff'), Math.round(cx + def.head.x * CAR_PPM), Math.round(cy + def.head.y * CAR_PPM));
blit(generateCarGrid(def), carPalette(def.palette), cx, cy);
for (const w of def.wheels) blit(generateWheelGrid(w), wheelPalette(def.palette), Math.round(cx + w.x * CAR_PPM), Math.round(cy + w.y * CAR_PPM));

function scaled(size: number, pad: number) {
  const out = new Uint8Array(size * size * 4);
  const inner = size - pad * 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = Math.floor(((x - pad) / inner) * S), sy = Math.floor(((y - pad) / inner) * S);
    const i = (y * size + x) * 4;
    const j = (Math.min(S - 1, Math.max(0, sy)) * S + Math.min(S - 1, Math.max(0, sx))) * 4;
    out.set(img.subarray(j, j + 4), i);
  }
  return out;
}
mkdirSync('public/icons', { recursive: true });
for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, png(s, s, scaled(s, 0)));
writeFileSync('public/icons/maskable-512.png', png(512, 512, scaled(512, 0)));
writeFileSync('public/icons/favicon-32.png', png(32, 32, scaled(32, 0)));
writeFileSync('public/icons/apple-touch-180.png', png(180, 180, scaled(180, 0)));
console.log('icons written');
