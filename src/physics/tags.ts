import type { Body } from 'planck';
import type { ItemKind, ProjectileKind } from '../cars/types';

/** Typed userData attached to every fixture so contact logic can classify it. */
export type FixtureTag =
  | { kind: 'car'; player: number; part: 'chassis' | 'wheel' }
  | { kind: 'head'; player: number }
  | { kind: 'terrain'; mat: string }
  | { kind: 'hazard'; type: 'lava' | 'saw' | 'spikes' | 'water' | 'laser' }
  | { kind: 'field' }
  | { kind: 'block'; body: Body }
  | { kind: 'pad'; power: number; nx: number; ny: number }
  | { kind: 'platform' }
  | { kind: 'loop' }
  | { kind: 'ledge' }
  | { kind: 'ragdoll'; player: number }
  | { kind: 'shot'; owner: number; proj: ProjectileKind; id: number }
  | { kind: 'item'; owner: number; item: ItemKind; id: number };

export function tagOf(f: { getUserData(): unknown }): FixtureTag | null {
  return (f.getUserData() as FixtureTag) ?? null;
}
