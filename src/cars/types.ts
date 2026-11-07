export type Pt = [number, number];

/** Materials a car polygon can be drawn with (palette slot or special texture). */
export type CarMat = 'body' | 'accent' | 'dark' | 'metal' | 'spike' | 'scoop' | 'rocket' | 'wood' | 'glass';

export type Archetype =
  | 'allround' | 'heavy' | 'fast' | 'monster' | 'tiny' | 'long'
  | 'scoop' | 'ram' | 'spike' | 'rocket' | 'tall' | 'bouncy';

export interface CarPoly {
  /** Convex polygon, 3..8 vertices, car-local meters (car faces +x, y down). */
  pts: Pt[];
  mat?: CarMat;
  /** Overrides car density for this piece (e.g. heavy ram). */
  density?: number;
  friction?: number;
  /** Render-only piece (no collision). */
  deco?: boolean;
}

export interface WheelDef {
  x: number;
  y: number;
  r: number;
  /** Driven by the motor (default true). */
  drive?: boolean;
  density?: number;
  /** Rim style for the sprite generator. */
  rim?: 'spokes' | 'disc' | 'star' | 'monster';
}

export interface CarPalette {
  body: string;
  accent: string;
  dark: string;
  glass: string;
  light: string;
}

export interface CarDef {
  id: string;
  name: string;
  archetype: Archetype;
  blurb: string;
  palette: CarPalette;
  /** Collision + render polygons. */
  body: CarPoly[];
  /** Render-only decoration: window polygons, stripes. */
  windows?: Pt[][];
  stripe?: { y: number; h: number };
  wheels: WheelDef[];
  suspension: {
    /** Spring frequency, Hz. */
    hz: number;
    /** Damping ratio. */
    damping: number;
    /** Max travel from rest each way, meters. */
    travel: number;
  };
  motor: {
    /** Max motor torque per driven wheel, N·m. */
    torque: number;
    /** Top linear speed at the wheel rim, m/s. */
    speed: number;
  };
  /** Chassis density, kg/m². */
  density: number;
  /** Offset added to the computed center of mass (car-local). */
  com?: Pt;
  tireFriction: number;
  /** Driver head (sensor). Car-local. */
  head: { x: number; y: number; r: number };
  /** Max nose-up angle the ground tilt assist aims for (rad). */
  wheelie?: number;
  /** Angular acceleration available in the air, rad/s². */
  air: number;
  /** Rocket booster: pushes forward while driving forward. */
  boost?: { accel: number; fuel: number; regen: number };
  /** Extra bounce on the chassis. */
  restitution?: number;
}
