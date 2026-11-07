export type Pt = [number, number];

export type TerrainMat = 'grass' | 'rock' | 'sand' | 'metal' | 'ice' | 'wood' | 'snow' | 'moon' | 'neon' | 'brick';

export type ThemeId = 'meadow' | 'foundry' | 'sawmill' | 'sky' | 'ice' | 'neon' | 'desert' | 'moon';

export interface SolidDef {
  /** Closed outline, any shape (concave ok). World meters, y down. */
  pts: Pt[];
  mat: TerrainMat;
  friction?: number;
}

export interface PlatformDef {
  x: number; y: number; w: number; h: number;
  /** Waypoints for the platform center (looping back and forth). */
  path: Pt[];
  speed: number;
  /** Pause at each end, seconds. */
  wait?: number;
  mat?: TerrainMat;
}

export interface PadDef {
  /** Center of the pad top edge. */
  x: number; y: number; w: number;
  /** Tilt in radians (0 = flat, launches straight up). */
  angle?: number;
  power: number;
}

export interface LavaDef { x: number; y: number; w: number; h: number }

export interface SawDef {
  x: number; y: number; r: number;
  path?: Pt[];
  speed?: number;
}

export interface SpikesDef { x: number; y: number; w: number }

export interface FallingBlocksDef {
  x0: number; x1: number;
  /** Spawn height (y). */
  y: number;
  interval: number;
  size: number;
  style?: 'crate' | 'ice' | 'stone';
}

export interface MapDef {
  id: string;
  name: string;
  theme: ThemeId;
  blurb: string;
  gravity?: number;
  /** World bounds used by the camera. */
  bounds: { x0: number; y0: number; x1: number; y1: number };
  /** Anything falling below this y dies. */
  killY: number;
  spawns: [Pt, Pt];
  solids: SolidDef[];
  platforms?: PlatformDef[];
  pads?: PadDef[];
  lava?: LavaDef[];
  saws?: SawDef[];
  spikes?: SpikesDef[];
  fallingBlocks?: FallingBlocksDef;
  /** Where sudden-death lava starts rising from. */
  suddenDeathY?: number;
}
