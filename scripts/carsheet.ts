/*
 * Contact sheet of car sprites as a PNG, without a browser:
 *   npx tsx scripts/carsheet.ts out.png [category|id,id,...] [scale]
 * Prints the index → car list so cells can be matched to names.
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { CARS } from '../src/cars/defs';
import { CAR_PPM } from '../src/physics/constants';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateLinkGrid, generateTorsoGrid, generateWheelGrid, wheelPalette } from '../src/cars/sprite';
import { ITEMS, cargoSlots } from '../src/game/abilities';
import { DECOR_PAL, flailGrid, itemGrid } from '../src/maps/decor';
import type { PixelGrid } from '../src/render/grid';
import type { RGB } from '../src/render/color';

const [out = 'sheet.png', filter = '', sc = '2'] = process.argv.slice(2);
const scale = +sc;
const ids = filter.includes(',') ? filter.split(',') : null;
const cars = CARS.filter((c) => !filter || (ids ? ids.includes(c.id) : c.category === filter || c.id === filter));
const COLS = +(process.env.COLS ?? 6);
const CW = 120 * scale, CH = 76 * scale;
const W = CW * COLS, H = CH * Math.ceil(cars.length / COLS);
const img = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) { img[i * 3] = 34; img[i * 3 + 1] = 30; img[i * 3 + 2] = 52; }
const put = (x: number, y: number, c: RGB) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2];
};
function blit(g: PixelGrid, pal: (RGB | null)[], px: number, py: number) {
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const c = pal[g.data[y * g.w + x]];
    if (!c) continue;
    for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) put((px + x) * scale + a, (py + y) * scale + b, c);
  }
}
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
function num(n: number, x0: number, y0: number) {
  const s = String(n);
  for (let k = 0; k < s.length; k++) {
    const d = DIG[+s[k]];
    for (let i = 0; i < 15; i++) if (d[i] === '1') for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) put(x0 + k * 8 + (i % 3) * 2 + a, y0 + Math.floor(i / 3) * 2 + b, [255, 220, 90]);
  }
}
cars.forEach((def, i) => {
  const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
  for (let x = 0; x < CW; x++) { put(cx + x, cy, [60, 54, 84]); }
  for (let y = 0; y < CH; y++) { put(cx, cy + y, [60, 54, 84]); }
  num(i, cx + 4, cy + 4);
  const ox = Math.round(cx / scale + CW / scale / 2), oy = Math.round(cy / scale + CH / scale * 0.6);
  const dpal = driverPalette('#3ec1ff');
  const torso = generateTorsoGrid(def.head.r);
  blit(torso, dpal, Math.round(ox + def.head.x * CAR_PPM - torso.ox - def.head.r * CAR_PPM * 0.1), Math.round(oy + (def.head.y + def.head.r * 0.6) * CAR_PPM));
  // Cargo lies in the bed behind the body (as in the game).
  if (def.cargo) {
    const info = ITEMS[def.cargo.kind];
    const ig = itemGrid(def.cargo.kind, info.w, info.h, CAR_PPM);
    for (const [x, y] of cargoSlots(def.cargo)) blit(ig, DECOR_PAL, Math.round(ox + x * CAR_PPM - ig.ox), Math.round(oy + y * CAR_PPM - ig.oy));
  }
  const drawLinks = (behind: boolean) => (def.links ?? []).forEach((ld, li) => {
    if (!!ld.behind !== behind) return;
    const lg = generateLinkGrid(def, li);
    blit(lg, carPalette(def.palette), ox - lg.ox, oy - lg.oy);
  });
  drawLinks(true);
  const body = generateCarGrid(def);
  blit(body, carPalette(def.palette), ox - body.ox, oy - body.oy);
  const head = generateHeadGrid(def.head.r);
  blit(head, dpal, Math.round(ox + def.head.x * CAR_PPM - head.ox), Math.round(oy + def.head.y * CAR_PPM - head.oy));
  for (const w of def.wheels) {
    if (w.hidden) continue;
    const g = generateWheelGrid(w);
    blit(g, wheelPalette(def.palette), Math.round(ox + w.x * CAR_PPM - g.ox), Math.round(oy + w.y * CAR_PPM - g.oy));
  }
  drawLinks(false);
  for (const ld of def.links ?? []) for (const w of (ld.wheels ?? []).filter((q) => !q.hidden)) {
    const g = generateWheelGrid(w);
    blit(g, wheelPalette(def.palette), Math.round(ox + w.x * CAR_PPM - g.ox), Math.round(oy + w.y * CAR_PPM - g.oy));
  }
  if (def.flail) {
    const fl = def.flail;
    const fg = flailGrid(fl.look, fl.r, CAR_PPM);
    blit(fg, DECOR_PAL, Math.round(ox + fl.at[0] * CAR_PPM - fg.ox), Math.round(oy + (fl.at[1] + fl.len) * CAR_PPM - fg.oy));
  }
  // MUZZLE=1: mark where shots leave (red, or yellow = default nose point) and the launch direction.
  if (process.env.MUZZLE && def.ability?.kind === 'shoot') {
    let front = 0;
    for (const p of def.body) for (const q of p.pts) front = Math.max(front, q[0]);
    const ms = def.ability.muzzle ?? [[front + 0.35, Math.min(-0.2, def.head.y * 0.6)]];
    const a = def.ability.aim ?? 0.12;
    const col: RGB = def.ability.muzzle ? [255, 40, 40] : [255, 230, 0];
    for (const [mx, my] of ms) {
      const px = ox + mx * CAR_PPM, py = oy + my * CAR_PPM;
      for (let t = 0; t < 14; t++) for (let k = 0; k < scale; k++) put(Math.round((px + Math.cos(a) * t) * scale) + k, Math.round((py - Math.sin(a) * t) * scale), [255, 255, 255]);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let a2 = 0; a2 < scale; a2++) for (let b = 0; b < scale; b++) put(Math.round(px + dx) * scale + a2, Math.round(py + dy) * scale + b, col);
    }
  }
  console.log(i, def.id, '-', def.name, def.ability?.kind === 'shoot' ? def.ability.projectile : '');
});

// PNG
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b: Buffer) => { let c = -1; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) { raw[y * (W * 3 + 1)] = 0; Buffer.from(img.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log('wrote', out, W, H);
