/** Physics runs in meters, y axis points DOWN (same as screen). */
export const STEP_HZ = 60;
export const STEP_DT = 1 / STEP_HZ;
export const MAX_SUBSTEPS = 6;
export const VELOCITY_ITERS = 10;
export const POSITION_ITERS = 6;
export const DEFAULT_GRAVITY = 22;

/** Art resolution: generated pixel-art assets use this many pixels per meter. */
/** Every driver's head is this size, whatever the car. */
export const HEAD_R = 0.28;
export const ART_PPM = 14;
/** Cars, wheels and drivers are drawn finer than the terrain so their details read. */
export const CAR_PPM = 18;

/** Collision categories. */
export const CAT = {
  TERRAIN: 0x0001,
  CAR: 0x0002,
  HEAD: 0x0004,
  HAZARD: 0x0008,
  RAGDOLL: 0x0010,
  DEBRIS: 0x0020,
  PLATFORM: 0x0040,
} as const;

export const MASK = {
  TERRAIN: 0xffff,
  CAR: CAT.TERRAIN | CAT.CAR | CAT.HEAD | CAT.HAZARD | CAT.RAGDOLL | CAT.DEBRIS | CAT.PLATFORM,
  HEAD: CAT.TERRAIN | CAT.CAR | CAT.HEAD | CAT.HAZARD | CAT.DEBRIS | CAT.PLATFORM,
  HAZARD: CAT.CAR | CAT.HEAD | CAT.RAGDOLL | CAT.DEBRIS,
  RAGDOLL: CAT.TERRAIN | CAT.CAR | CAT.RAGDOLL | CAT.DEBRIS | CAT.PLATFORM | CAT.HAZARD,
  DEBRIS: 0xffff,
  PLATFORM: CAT.CAR | CAT.HEAD | CAT.RAGDOLL | CAT.DEBRIS,
} as const;
