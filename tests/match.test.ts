import { describe, it, expect } from 'vitest';
import { MatchState, DeathResolver } from '../src/game/match';
import { FixedStepper } from '../src/physics/stepper';

describe('MatchState', () => {
  it('awards points and ends at target', () => {
    const m = new MatchState({ target: 3, roundTime: 60 });
    expect(m.record(0)).toBe(false);
    expect(m.record('draw')).toBe(false);
    expect(m.record(1)).toBe(false);
    expect(m.record(0)).toBe(false);
    expect(m.scores).toEqual([2, 1]);
    expect(m.record(0)).toBe(true);
    expect(m.winner).toBe(0);
    expect(m.round).toBe(6);
  });
  it('draw gives nobody a point', () => {
    const m = new MatchState({ target: 1, roundTime: 60 });
    m.record('draw');
    expect(m.scores).toEqual([0, 0]);
    expect(m.over).toBe(false);
  });
});

describe('DeathResolver', () => {
  it('first death gives the point to the other player', () => {
    const r = new DeathResolver(4);
    r.report({ player: 0, step: 10 });
    expect(r.resolve(11)).toBe(null);
    expect(r.resolve(14)).toBe(1);
  });
  it('simultaneous deaths are a draw', () => {
    const r = new DeathResolver(4);
    r.report({ player: 1, step: 10 });
    r.report({ player: 0, step: 12 });
    expect(r.resolve(12)).toBe('draw');
  });
  it('late second death does not cancel', () => {
    const r = new DeathResolver(4);
    r.report({ player: 1, step: 10 });
    r.report({ player: 0, step: 20 });
    expect(r.resolve(20)).toBe(0);
  });
});

describe('FixedStepper', () => {
  it('steps at a fixed rate independent of frame time', () => {
    const s = new FixedStepper(1 / 60, 10);
    let n = 0;
    for (let i = 0; i < 120; i++) s.advance(1 / 120, () => n++);
    expect(n).toBe(60);
    n = 0;
    for (let i = 0; i < 30; i++) s.advance(1 / 30, () => n++);
    expect(n).toBeGreaterThanOrEqual(59);
    expect(n).toBeLessThanOrEqual(61);
  });
  it('time scale slows the simulation', () => {
    const s = new FixedStepper(1 / 60, 10);
    s.timeScale = 0.25;
    let n = 0;
    for (let i = 0; i < 60; i++) s.advance(1 / 60, () => n++);
    expect(n).toBe(15);
  });
  it('clamps long frames', () => {
    const s = new FixedStepper(1 / 60, 5);
    let n = 0;
    s.advance(10, () => n++);
    expect(n).toBe(5);
  });
});
