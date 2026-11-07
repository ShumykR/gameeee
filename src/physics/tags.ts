import type { Body } from 'planck';

/** Typed userData attached to every fixture so contact logic can classify it. */
export type FixtureTag =
  | { kind: 'car'; player: number; part: 'chassis' | 'wheel' }
  | { kind: 'head'; player: number }
  | { kind: 'terrain'; mat: string }
  | { kind: 'hazard'; type: 'lava' | 'saw' | 'spikes' }
  | { kind: 'block'; body: Body }
  | { kind: 'pad'; power: number; nx: number; ny: number }
  | { kind: 'platform' }
  | { kind: 'ragdoll'; player: number };

export function tagOf(f: { getUserData(): unknown }): FixtureTag | null {
  return (f.getUserData() as FixtureTag) ?? null;
}
