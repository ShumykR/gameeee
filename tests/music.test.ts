import { describe, it, expect } from 'vitest';
import { TRACKS, degreeMidi } from '../src/audio/music';

const toks = (s: string) => s.trim().split(/\s+/);

describe('music tracks', () => {
  it('has a menu track, several match tracks and a sudden-death track', () => {
    expect(Object.keys(TRACKS)).toEqual(expect.arrayContaining(['menu', 'match1', 'match2', 'match3', 'sudden']));
  });
  it.each(Object.entries(TRACKS))('%s patterns are well-formed', (_id, t) => {
    for (const p of [t.bass, t.arp, t.kick, t.snare, t.hat]) expect(toks(p)).toHaveLength(16);
    for (const phrase of [t.leadA, t.leadB ?? t.leadA]) {
      expect(phrase).toHaveLength(t.prog.length);
      for (const bar of phrase) {
        const row = toks(bar);
        expect(row).toHaveLength(16);
        for (const x of row) expect(x === '.' || x === '-' || Number.isFinite(Number(x)), `${_id}: ${x}`).toBe(true);
      }
    }
    expect(t.bpm).toBeGreaterThan(60);
  });
  it('maps scale degrees across octaves', () => {
    const t = TRACKS.menu; // C major from MIDI 48
    expect(degreeMidi(t, 0, 60)).toBe(60);
    expect(degreeMidi(t, 2, 60)).toBe(64);
    expect(degreeMidi(t, 7, 60)).toBe(72);
    expect(degreeMidi(t, -1, 60)).toBe(59);
  });
});
