import type { MapDef, Pt } from './types';

/** Smooth bowl helper: samples y = f(x) between x0..x1 into an outline closed at `bottom`. */
export function heightfield(x0: number, x1: number, step: number, f: (x: number) => number, bottom: number): Pt[] {
  const top: Pt[] = [];
  for (let x = x0; x <= x1 + 1e-6; x += step) top.push([+x.toFixed(3), +f(x).toFixed(3)]);
  return [...top, [x1, bottom], [x0, bottom]];
}

export const MAPS: MapDef[] = [
  {
    id: 'meadow',
    name: 'Зелена Долина',
    theme: 'meadow',
    blurb: 'Класична чаша з пагорбами по краях.',
    bounds: { x0: 0, y0: -6, x1: 44, y1: 26 },
    killY: 40,
    spawns: [[11, 14], [33, 14]],
    solids: [
      {
        mat: 'grass',
        pts: heightfield(0, 44, 0.5, (x) => {
          const t = (x - 22) / 22;
          return 18 - 1.5 * (1 - Math.cos(t * Math.PI)) - 7 * Math.pow(Math.abs(t), 5) + 0.3 * Math.sin(x * 0.9);
        }, 30),
      },
      { mat: 'rock', pts: [[-4, -10], [1.2, -10], [1.2, 30], [-4, 30]] },
      { mat: 'rock', pts: [[42.8, -10], [48, -10], [48, 30], [42.8, 30]] },
    ],
  },
];

export const MAP_BY_ID: Record<string, MapDef> = Object.fromEntries(MAPS.map((m) => [m.id, m]));
