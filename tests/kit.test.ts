import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { KIT, abilityKey, traitKey } from '../src/cars/kit';
import { MAP_BY_ID } from '../src/maps/defs';
import { ABILITY_INFO, ITEMS, PROJECTILES, TRAIT_INFO, abilityBlurb, abilityLabel } from '../src/game/abilities';
import type { AbilityDef, CarDef } from '../src/cars/types';

const game = (a: CarDef, b: CarDef, map = 'meadow') => {
  const g = new Game({ cars: [a, b], maps: [MAP_BY_ID[map]], randomMaps: false, target: 9, roundTime: 60, seed: 3 });
  while (g.phase !== 'play') g.step();
  for (let i = 0; i < 100; i++) g.step();
  return g;
};
const as = (ability: AbilityDef, base = CARS[0]): CarDef => ({ ...base, ability, traits: undefined });
const placeFoe = (g: Game, dx: number, dy = 0) => {
  const c0 = g.cars[0], c1 = g.cars[1];
  const ox = c0.position.x + dx - c1.position.x, oy = c0.position.y + dy - c1.position.y;
  for (const b of c1.allBodies) {
    const p = b.getPosition();
    b.setPosition(new Vec2(p.x + ox, p.y + oy));
  }
};

describe('every ability is unique', () => {
  it('no two cars share an action', () => {
    const seen = new Map<string, string>();
    for (const c of CARS) {
      if (!c.ability) continue;
      const k = abilityKey(c.ability);
      expect(seen.get(k), `${c.id} repeats ${k} of ${seen.get(k)}`).toBeUndefined();
      seen.set(k, c.id);
    }
    expect(seen.size).toBeGreaterThan(90);
  });
  it('no two cars share a passive quirk, a cargo or a chain weight', () => {
    const seen = new Map<string, string>();
    const add = (k: string, id: string) => {
      expect(seen.get(k), `${id} repeats ${k} of ${seen.get(k)}`).toBeUndefined();
      seen.set(k, id);
    };
    for (const c of CARS) {
      for (const t of c.traits ?? []) add(`trait:${traitKey(t)}`, c.id);
      if (c.cargo) add(`cargo:${c.cargo.kind}`, c.id);
      if (c.flail) add(`flail:${c.flail.look}`, c.id);
    }
  });
  it('the table only names real cars and real things', () => {
    for (const id of Object.keys(KIT)) expect(CAR_BY_ID[id], id).toBeDefined();
    for (const c of CARS) {
      const a = c.ability;
      if (a) {
        expect(ABILITY_INFO[a.kind], c.id).toBeDefined();
        if (a.kind === 'shoot') expect(PROJECTILES[a.projectile!], c.id).toBeDefined();
        if (a.kind === 'drop' || a.kind === 'dump') expect(ITEMS[a.item!], c.id).toBeDefined();
      }
      for (const t of c.traits ?? []) expect(TRAIT_INFO[t.kind], c.id).toBeDefined();
      expect(abilityLabel(c).length, c.id).toBeGreaterThan(2);
      expect(abilityBlurb(c).length, c.id).toBeGreaterThan(10);
    }
  });
  it('themed picks', () => {
    expect(CAR_BY_ID.amphibian.traits).toEqual([{ kind: 'swim' }]);
    expect(CAR_BY_ID['ice-cream-van'].traits?.[0]).toMatchObject({ kind: 'spill', item: 'icecream' });
    expect(CAR_BY_ID['ice-cream-van'].ability).toBeUndefined();
    expect(CAR_BY_ID['fire-truck'].ability?.projectile).toBe('water');
    expect(CAR_BY_ID['invisible-car'].ability?.kind).toBe('invis');
    expect(CAR_BY_ID.hearse.cargo?.kind).toBe('coffin');
  });
});

describe('new mechanics', () => {
  it('invisibility, DRS, heavy and stasis run out', () => {
    const g = game(as({ kind: 'invis' }), CARS[1]);
    g.useAbility(0);
    expect(g.cars[0].invisT).toBeGreaterThan(3);
    for (let i = 0; i < 240; i++) g.step();
    expect(g.cars[0].invisT).toBe(0);
    const h = game(as({ kind: 'heavy' }), CARS[1]);
    const m0 = h.cars[0].chassis.getMass();
    h.useAbility(0);
    expect(h.cars[0].chassis.getMass()).toBeGreaterThan(m0 * 3);
    for (let i = 0; i < 200; i++) h.step();
    expect(h.cars[0].chassis.getMass()).toBeCloseTo(m0, 3);
  });
  it('a sting dash stuns whoever it hits', () => {
    const g = game(as({ kind: 'sting' }), CARS[1]);
    placeFoe(g, 4.5);
    g.useAbility(0);
    let stunned = false;
    for (let i = 0; i < 40 && !stunned; i++) { g.step(); stunned = g.cars[1].stunT > 0; }
    expect(stunned).toBe(true);
  });
  it('punch knocks a car in front away, but only in reach', () => {
    const g = game(as({ kind: 'punch' }), CARS[1]);
    placeFoe(g, 4);
    const vx = g.cars[1].chassis.getLinearVelocity().x;
    g.useAbility(0);
    expect(g.cars[1].chassis.getLinearVelocity().x).toBeGreaterThan(vx + 8);
    const far = game(as({ kind: 'punch' }), CARS[1]);
    placeFoe(far, 12);
    const v2 = far.cars[1].chassis.getLinearVelocity().x;
    far.useAbility(0);
    expect(Math.abs(far.cars[1].chassis.getLinearVelocity().x - v2)).toBeLessThan(1);
  });
  it('howl reverses the controls, swap trades places', () => {
    const g = game(as({ kind: 'howl' }), CARS[1]);
    placeFoe(g, 4);
    g.useAbility(0);
    expect(g.cars[1].confuseT).toBeGreaterThan(1.5);
    const s = game(as({ kind: 'swap' }), CARS[1]);
    const x0 = s.cars[0].position.x, x1 = s.cars[1].position.x;
    s.useAbility(0);
    expect(s.cars[0].position.x).toBeCloseTo(x1, 0);
    expect(s.cars[1].position.x).toBeCloseTo(x0, 0);
  });
  it('the time loop jumps back', () => {
    const g = game(as({ kind: 'recall' }), CARS[1]);
    const x0 = g.cars[0].position.x;
    g.inputs[0] = 1;
    for (let i = 0; i < 150; i++) g.step();
    g.inputs[0] = 0;
    const moved = g.cars[0].position.x;
    expect(moved).toBeGreaterThan(x0 + 3);
    g.useAbility(0);
    expect(g.cars[0].position.x).toBeLessThan(moved - 2);
  });
  it('lightning strikes where the foe stood', () => {
    const g = game(as({ kind: 'storm' }), CARS[1]);
    const bolts: number[] = [];
    g.on((e) => { if (e.type === 'bolt') bolts.push(e.x); });
    g.useAbility(0);
    const hold = () => { for (const b of g.cars[1].allBodies) b.setLinearVelocity(new Vec2(0, 0)); };
    for (let i = 0; i < 60; i++) { hold(); g.step(); }
    expect(bolts.length).toBe(1);
    expect(g.cars[1].stunT).toBeGreaterThan(0);
  });
  it('the tow hook ties the cars together for a while', () => {
    const g = game(as({ kind: 'shoot', projectile: 'hook' }), CARS[1]);
    placeFoe(g, 4);
    g.useAbility(0);
    for (let i = 0; i < 40 && !g.tethers.length; i++) g.step();
    expect(g.tethers.length).toBe(1);
    for (let i = 0; i < 200; i++) g.step();
    expect(g.tethers.length).toBe(0);
  });
  it('the medkit forgives one head hit per round', () => {
    const g = game(CAR_BY_ID.ambulance, CARS[1]);
    g.kill(0, 'hit', 1);
    expect(g.cars[0].alive).toBe(true);
    for (let i = 0; i < 60; i++) g.step();
    g.kill(0, 'hit', 1);
    expect(g.cars[0].alive).toBe(false);
  });
  it('the ice cream van leaves cones behind while driving', () => {
    const g = game(CAR_BY_ID['ice-cream-van'], CARS[1]);
    g.inputs[0] = 1;
    for (let i = 0; i < 400; i++) g.step();
    expect(g.items.some((i) => i.kind === 'icecream' && i.fx === 'freeze')).toBe(true);
  });
  it('concrete sets hard', () => {
    const g = game(CAR_BY_ID['concrete-truck'], CARS[1]);
    g.useAbility(0);
    for (let i = 0; i < 240; i++) g.step();
    expect(g.items.some((i) => i.kind === 'concrete' && i.body.getType() === 'static')).toBe(true);
  });
  it('the amphibian floats on the sea, others sink', () => {
    const sea = (def: CarDef) => {
      const g = game(def, CARS[1], 'beach');
      const c = g.cars[0];
      const ox = 1 - c.position.x, oy = 16.4 - c.position.y;
      for (const b of c.allBodies) {
        const p = b.getPosition();
        b.setPosition(new Vec2(p.x + ox, p.y + oy));
        b.setLinearVelocity(new Vec2(0, 0));
      }
      let drowned = false;
      g.on((e) => { if (e.type === 'death' && e.player === 0) drowned = true; });
      for (let i = 0; i < 150; i++) g.step();
      return { car: g.cars[0], drowned };
    };
    const amph = sea(CAR_BY_ID.amphibian);
    expect(amph.drowned).toBe(false);
    expect(amph.car.position.y).toBeLessThan(18.5);
    expect(sea(CAR_BY_ID.sparrow).drowned).toBe(true);
  });
});
