import type { CarDef, CarPoly, Pt } from './types';

/** Axis-aligned box polygon helper (car-local meters, y down). */
export const box = (x0: number, y0: number, x1: number, y1: number, extra: Partial<CarPoly> = {}): CarPoly => ({
  pts: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]],
  ...extra,
});
export const poly = (pts: Pt[], extra: Partial<CarPoly> = {}): CarPoly => ({ pts, ...extra });

export const CARS: CarDef[] = [
  {
    id: 'sparrow',
    name: 'Sparrow',
    archetype: 'allround',
    blurb: 'Збалансований баггі. Добре стрибає, легко керується.',
    palette: { body: '#3d8bff', accent: '#ffd23f', dark: '#22264a', glass: '#7fd8ff', light: '#fff4a8' },
    body: [
      poly([[-1.45, -0.1], [1.25, -0.1], [1.5, 0.08], [1.4, 0.32], [-1.4, 0.32], [-1.5, 0.12]]),
      poly([[-1.42, -0.1], [-0.62, -0.1], [-0.75, -0.48], [-1.32, -0.48]]),
      poly([[0.32, -0.1], [0.72, -0.1], [0.44, -0.62], [0.3, -0.62]], { mat: 'dark' }),
    ],
    windows: [[[0.34, -0.12], [0.62, -0.12], [0.43, -0.55], [0.35, -0.55]]],
    stripe: { y: 0.05, h: 0.1 },
    wheels: [
      { x: -1.0, y: 0.36, r: 0.42 },
      { x: 1.0, y: 0.36, r: 0.42 },
    ],
    suspension: { hz: 4.2, damping: 0.6, travel: 0.22 },
    motor: { torque: 26, speed: 15 },
    density: 1.6,
    tireFriction: 1.25,
    head: { x: -0.12, y: -0.62, r: 0.3 },
    air: 14,
  },
  {
    id: 'bulldog',
    name: 'Bulldog',
    archetype: 'heavy',
    blurb: 'Важкий пікап. Повільний, але його майже неможливо зрушити.',
    palette: { body: '#e8553d', accent: '#f4f1e8', dark: '#3a2228', glass: '#9fe3ff', light: '#ffe9a0' },
    body: [
      box(-1.6, -0.15, 1.6, 0.36),
      poly([[0.95, -0.15], [1.6, -0.15], [1.7, 0.05], [1.65, 0.36], [1.55, 0.36]], { mat: 'metal', density: 3 }),
      poly([[-0.5, -0.15], [0.5, -0.15], [0.32, -0.62], [-0.38, -0.62]]),
      box(-1.6, -0.4, -1.45, -0.15, { mat: 'dark' }),
    ],
    windows: [[[0.08, -0.18], [0.42, -0.18], [0.28, -0.55], [0.08, -0.55]]],
    stripe: { y: 0.1, h: 0.08 },
    wheels: [
      { x: -1.1, y: 0.42, r: 0.46, rim: 'disc' },
      { x: 1.1, y: 0.42, r: 0.46, rim: 'disc' },
    ],
    suspension: { hz: 3.6, damping: 0.7, travel: 0.2 },
    motor: { torque: 46, speed: 12.5 },
    density: 2.2,
    tireFriction: 1.3,
    head: { x: -0.65, y: -0.55, r: 0.3 },
    air: 9,
  },
];

export const CAR_BY_ID: Record<string, CarDef> = Object.fromEntries(CARS.map((c) => [c.id, c]));
