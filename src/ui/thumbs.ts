import { generateSky, generateTerrain, THEMES } from '../maps/art';
import type { MapDef } from '../maps/types';
import { gridToRGBA } from '../render/grid';
import { DECOR_PAL, decorGrid, placedDecor } from '../maps/decor';

const cache = new Map<string, string>();

/** Small pixel-art thumbnail of an arena (sky + terrain), as a data URL. */
export function mapThumb(map: MapDef): string {
  const hit = cache.get(map.id);
  if (hit) return hit;
  const ppm = 4;
  const art = generateTerrain(map, ppm);
  const sky = generateSky(THEMES[map.theme]);
  const c = document.createElement('canvas');
  c.width = art.grid.w;
  c.height = art.grid.h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  const sc = document.createElement('canvas');
  sc.width = sky.w;
  sc.height = sky.h;
  sc.getContext('2d')!.putImageData(new ImageData(sky.rgba as any, sky.w, sky.h), 0, 0);
  ctx.drawImage(sc, 0, 0, c.width, c.height);
  ctx.fillStyle = '#2a8ad8';
  for (const wv of map.water ?? []) ctx.fillRect((wv.x - art.x0) * ppm, (wv.y - art.y0) * ppm, wv.w * ppm, wv.h * ppm);
  // props, scaled down from art resolution
  const k = ppm / 14;
  for (const d of placedDecor(map)) {
    const g = decorGrid(d.kind, d.seed);
    const dc = document.createElement('canvas');
    dc.width = g.w;
    dc.height = g.h;
    dc.getContext('2d')!.putImageData(new ImageData(gridToRGBA(g, DECOR_PAL) as any, g.w, g.h), 0, 0);
    const sc2 = k * (d.s ?? 1);
    ctx.save();
    ctx.translate((d.x - art.x0) * ppm, (d.y - art.y0) * ppm);
    if (d.flip) ctx.scale(-1, 1);
    ctx.drawImage(dc, -g.ox * sc2, -g.oy * sc2, g.w * sc2, g.h * sc2);
    ctx.restore();
  }
  const tc = document.createElement('canvas');
  tc.width = art.grid.w;
  tc.height = art.grid.h;
  tc.getContext('2d')!.putImageData(new ImageData(gridToRGBA(art.grid, art.palette) as any, art.grid.w, art.grid.h), 0, 0);
  ctx.drawImage(tc, 0, 0);
  // lava pools
  ctx.fillStyle = '#ff7a1e';
  for (const l of map.lava ?? []) ctx.fillRect((l.x - art.x0) * ppm, (l.y - art.y0) * ppm, l.w * ppm, l.h * ppm);
  ctx.fillStyle = '#b8c0cc';
  for (const s of map.saws ?? []) {
    ctx.beginPath();
    ctx.arc((s.x - art.x0) * ppm, (s.y - art.y0) * ppm, s.r * ppm, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#f0c030';
  for (const p of map.platforms ?? []) ctx.fillRect((p.path[0][0] - p.w / 2 - art.x0) * ppm, (p.path[0][1] - art.y0) * ppm, p.w * ppm, 2);
  // crop to bounds
  const out = document.createElement('canvas');
  const b = map.bounds;
  out.width = Math.round((b.x1 - b.x0) * ppm);
  out.height = Math.round((b.y1 - b.y0) * ppm);
  out.getContext('2d')!.drawImage(c, -(b.x0 - art.x0) * ppm, -(b.y0 - art.y0) * ppm);
  const url = out.toDataURL();
  cache.set(map.id, url);
  return url;
}
