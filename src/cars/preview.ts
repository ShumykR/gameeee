import { CAR_PPM } from '../physics/constants';
import { gridToRGBA, PixelGrid } from '../render/grid';
import type { RGB } from '../render/color';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateTorsoGrid, generateWheelGrid, wheelPalette } from './sprite';
import type { CarDef, CarPalette } from './types';
import { ITEMS, cargoSlots } from '../game/abilities';
import { DECOR_PAL, flailGrid, itemGrid } from '../maps/decor';
import { makeGrid, gset } from '../render/grid';

function gridCanvas(g: PixelGrid, pal: (RGB | null)[]) {
  const c = document.createElement('canvas');
  c.width = g.w;
  c.height = g.h;
  c.getContext('2d')!.putImageData(new ImageData(gridToRGBA(g, pal) as any, g.w, g.h), 0, 0);
  return c;
}

/**
 * Compose a static pixel-art preview of a car (body, wheels, driver) into a canvas,
 * scaled up by an integer factor. Used by the garage menu.
 */
export function carPreviewCanvas(def: CarDef, palette: CarPalette, playerColor: string, scale = 3, flip = false): HTMLCanvasElement {
  const body = generateCarGrid(def);
  const head = generateHeadGrid(def.head.r);
  const torso = generateTorsoGrid(def.head.r);
  const wheels = def.wheels.map((w) => generateWheelGrid(w));
  const items: { g: PixelGrid; c: HTMLCanvasElement; x: number; y: number }[] = [];
  const dpal = driverPalette(playerColor);
  items.push({ g: torso, c: gridCanvas(torso, dpal), x: def.head.x * CAR_PPM - torso.ox - def.head.r * CAR_PPM * 0.1, y: (def.head.y + def.head.r * 0.6) * CAR_PPM });
  items.push({ g: body, c: gridCanvas(body, carPalette(palette)), x: -body.ox, y: -body.oy });
  items.push({ g: head, c: gridCanvas(head, dpal), x: def.head.x * CAR_PPM - head.ox, y: def.head.y * CAR_PPM - head.oy });
  def.wheels.forEach((w, i) => items.push({ g: wheels[i], c: gridCanvas(wheels[i], wheelPalette(palette)), x: w.x * CAR_PPM - wheels[i].ox, y: w.y * CAR_PPM - wheels[i].oy }));
  if (def.cargo) {
    const info = ITEMS[def.cargo.kind];
    const ig = itemGrid(def.cargo.kind, info.w, info.h, CAR_PPM);
    const ic = gridCanvas(ig, DECOR_PAL);
    for (const [x, y] of cargoSlots(def.cargo)) items.push({ g: ig, c: ic, x: x * CAR_PPM - ig.ox, y: y * CAR_PPM - ig.oy });
  }
  if (def.flail) {
    const fl = def.flail;
    const fg = flailGrid(fl.look, fl.r, CAR_PPM);
    const bx = fl.at[0] * CAR_PPM, by = (fl.at[1] + fl.len) * CAR_PPM;
    const n = Math.max(1, Math.round(fl.len * CAR_PPM - fl.r * CAR_PPM));
    const chain = makeGrid(2, n, 0, 0);
    for (let i = 0; i < n; i++) { gset(chain, 0, i, i % 3 === 2 ? 1 : 4); gset(chain, 1, i, i % 3 === 2 ? 1 : 3); }
    items.push({ g: chain, c: gridCanvas(chain, DECOR_PAL), x: bx - 1, y: fl.at[1] * CAR_PPM });
    items.push({ g: fg, c: gridCanvas(fg, DECOR_PAL), x: bx - fg.ox, y: by - fg.oy });
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const it of items) {
    x0 = Math.min(x0, it.x); y0 = Math.min(y0, it.y);
    x1 = Math.max(x1, it.x + it.g.w); y1 = Math.max(y1, it.y + it.g.h);
  }
  const W = Math.ceil(x1 - x0) + 2, H = Math.ceil(y1 - y0) + 2;
  const out = document.createElement('canvas');
  out.width = W * scale;
  out.height = H * scale;
  const ctx = out.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
  }
  for (const it of items) ctx.drawImage(it.c, Math.round((it.x - x0 + 1)) * scale, Math.round((it.y - y0 + 1)) * scale, it.g.w * scale, it.g.h * scale);
  return out;
}
