export type Pt = [number, number];

export type TerrainMat =
  | 'grass' | 'rock' | 'sand' | 'metal' | 'ice' | 'wood' | 'snow' | 'moon' | 'neon' | 'brick'
  | 'grave' | 'basalt' | 'turf' | 'track' | 'void' | 'asphalt' | 'tile'
  /** Cave stone, steel plates, glowing amber: shaded by distance to open air (rim light). */
  | 'cave' | 'steel' | 'amber'
  /** Lattice girder: solid to drive on, see-through between the struts. */
  | 'girder';

export type ThemeId =
  | 'meadow' | 'foundry' | 'sawmill' | 'sky' | 'ice' | 'neon' | 'desert' | 'moon'
  | 'halloween' | 'winter' | 'alien' | 'dome' | 'volcano' | 'beach' | 'stadium' | 'cny' | 'rift' | 'toys'
  | 'cavern' | 'catacomb' | 'grotto' | 'mine' | 'chasm' | 'bunker' | 'crypt' | 'amber';

export type DecorKind =
  | 'tombstone' | 'cross' | 'pumpkin' | 'deadtree' | 'spruce' | 'snowman' | 'gift' | 'ufo' | 'beam' | 'cow' | 'haybale'
  | 'fence' | 'barn' | 'silo' | 'cone' | 'tires' | 'checkflag' | 'palm' | 'umbrella' | 'sandcastle' | 'goal' | 'cornerflag'
  | 'floodlight' | 'lantern' | 'gate' | 'bamboo' | 'crystal' | 'portal' | 'skull' | 'bones' | 'fern' | 'rocks' | 'block'
  | 'loop' | 'cactus' | 'ghost' | 'bomb';

/** Render-only prop planted on the ground (or floating at an explicit y). */
export interface DecorDef {
  kind: DecorKind;
  x: number;
  /** Bottom y in world meters; defaults to the ground under x. */
  y?: number;
  /** Integer-ish pixel scale (default 1). */
  s?: number;
  flip?: boolean;
  /** Draw in front of the terrain instead of behind it. */
  front?: boolean;
  seed?: number;
}

/** What happens when the round clock runs out. */
export type SuddenDeathKind = 'lava' | 'flood' | 'meteors' | 'walls' | 'blizzard' | 'bombs' | 'ghosts' | 'balls' | 'blocks' | 'lowgrav';

/** Pushable ball (e.g. a football). */
export interface BallDef { x: number; y: number; r: number }

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
  /** Pendulum: (x, y) is the pivot, the blade hangs `len` below and swings ±`amp` rad. */
  swing?: { len: number; amp: number; period: number };
}

/**
 * Energy field. `lift` pushes everything inside upward (blue), `bounce` is a solid
 * springy barrier (green), `laser` is a deadly beam for heads that switches on and off (red).
 */
export interface FieldDef {
  kind: 'lift' | 'bounce' | 'laser';
  x: number; y: number; w: number; h: number;
  /** Seconds on, seconds off (laser; lift pulses too when given). */
  cycle?: [number, number];
  /** Phase offset, seconds. */
  phase?: number;
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
  /** Sudden-death variant (defaults by theme, see maps/sudden.ts). */
  suddenDeath?: SuddenDeathKind;
  /** Background props. */
  decor?: DecorDef[];
  /** Decorative water (no physics; falling in means falling below killY). */
  water?: LavaDef[];
  /** Loose balls the cars can push around. */
  balls?: BallDef[];
  /** Energy fields (lift beams, bouncy barriers, lasers). */
  fields?: FieldDef[];
  /** Dark back wall drawn behind the play area (caves): outlines in world meters, no physics. */
  backdrop?: Pt[][];
}
