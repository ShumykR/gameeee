export interface Rect { x0: number; y0: number; x1: number; y1: number }
export interface Cam { x: number; y: number; zoom: number }

/**
 * Compute a camera (center + zoom in px/m) framing `focus` with margins,
 * clamped to zoom limits and to the map bounds when possible.
 */
export function fitCamera(focus: Rect, screenW: number, screenH: number, bounds: Rect, opts: { margin: number; minZoom: number; maxZoom: number; topPad?: number }): Cam {
  const m = opts.margin;
  const fw = focus.x1 - focus.x0 + m * 2;
  const fh = focus.y1 - focus.y0 + m * 2 + (opts.topPad ?? 0);
  let zoom = Math.min(screenW / fw, screenH / fh);
  // never zoom out further than the whole arena
  const bw = bounds.x1 - bounds.x0, bh = bounds.y1 - bounds.y0;
  const fitAll = Math.max(screenW / bw, screenH / bh);
  zoom = Math.max(zoom, opts.minZoom, Math.min(fitAll, opts.maxZoom));
  zoom = Math.min(zoom, opts.maxZoom);
  let x = (focus.x0 + focus.x1) / 2;
  let y = (focus.y0 + focus.y1) / 2 - (opts.topPad ?? 0) / 2;
  const hw = screenW / zoom / 2, hh = screenH / zoom / 2;
  x = hw * 2 >= bw ? (bounds.x0 + bounds.x1) / 2 : Math.min(Math.max(x, bounds.x0 + hw), bounds.x1 - hw);
  y = hh * 2 >= bh ? (bounds.y0 + bounds.y1) / 2 : Math.min(Math.max(y, bounds.y0 + hh), bounds.y1 - hh);
  return { x, y, zoom };
}

export function lerpCam(a: Cam, b: Cam, t: number): Cam {
  // zoom in log space for even feel
  const z = Math.exp(Math.log(a.zoom) + (Math.log(b.zoom) - Math.log(a.zoom)) * t);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, zoom: z };
}
