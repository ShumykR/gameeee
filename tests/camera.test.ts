import { describe, it, expect } from 'vitest';
import { fitCamera } from '../src/render/camera';

const bounds = { x0: 0, y0: 0, x1: 40, y1: 25 };
const opts = { margin: 3, minZoom: 5, maxZoom: 60 };

describe('fitCamera', () => {
  it('frames both targets', () => {
    const c = fitCamera({ x0: 10, y0: 10, x1: 30, y1: 12 }, 915, 412, bounds, opts);
    const hw = 915 / c.zoom / 2;
    expect(c.x - hw).toBeLessThanOrEqual(10 - 3 + 1e-6);
    expect(c.x + hw).toBeGreaterThanOrEqual(30 + 3 - 1e-6);
  });
  it('zooms in when targets are close', () => {
    const far = fitCamera({ x0: 5, y0: 10, x1: 35, y1: 12 }, 915, 412, bounds, opts);
    const near = fitCamera({ x0: 18, y0: 10, x1: 22, y1: 12 }, 915, 412, bounds, opts);
    expect(near.zoom).toBeGreaterThan(far.zoom);
  });
  it('stays inside the bounds', () => {
    const c = fitCamera({ x0: 0, y0: 0, x1: 2, y1: 2 }, 915, 412, bounds, opts);
    expect(c.x - 915 / c.zoom / 2).toBeGreaterThanOrEqual(-1e-6);
    expect(c.y - 412 / c.zoom / 2).toBeGreaterThanOrEqual(-1e-6);
  });
});
