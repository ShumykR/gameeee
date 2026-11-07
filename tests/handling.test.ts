import { describe, it, expect } from 'vitest';
import { CARS } from '../src/cars/defs';
import { measure, dropTest } from '../src/physics/probe';

describe.each(CARS.map((c) => [c.id, c] as const))('handling: %s', (_id, def) => {
  const h = measure(def);
  it('accelerates to a sane top speed', () => {
    expect(h.top).toBeGreaterThan(8.5);
    expect(h.top).toBeLessThan(21);
    expect(h.t90).toBeLessThan(2.6);
  });
  it('does not flip over when launching from standstill', () => {
    expect(h.flipped).toBe(false);
    expect(h.wheelie).toBeGreaterThan(0.12);
  });
  it('can flip in the air', () => {
    expect(h.airFlip).toBeLessThan(1.7);
  });
  it('self-rights when upside down', () => {
    expect(h.recover).toBeLessThan(5);
  });
  it('survives a 4.5m drop without bottoming out', () => {
    const d = dropTest(def);
    expect(d.bottomed).toBe(false);
    expect(Math.abs(d.angle)).toBeLessThan(0.5);
  });
});
