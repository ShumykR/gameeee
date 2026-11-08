import type { CarSpec, FrameId, FrameOpts } from '../factory';
import type { CategoryId } from '../types';

export type Rest = Omit<CarSpec, 'id' | 'name' | 'cat' | 'blurb' | 'frame' | 'col'>;
export type Row = [id: string, name: string, blurb: string, frame: FrameId, col: [string, string, string?], rest?: Rest];

export const group = (cat: CategoryId, rows: Row[]): CarSpec[] =>
  rows.map(([id, name, blurb, frame, col, rest]) => ({ id, name, cat, blurb, frame, col, ...(rest ?? {}) }));

export const o = (x: FrameOpts) => x;
