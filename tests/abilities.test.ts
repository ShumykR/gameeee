import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { abilityOf, ABILITY_INFO } from '../src/game/abilities';
import type { AbilityDef, CarDef } from '../src/cars/types';

const withAbility = (def: CarDef, ability: AbilityDef): CarDef => ({ ...def, ability });

function ready(a: AbilityDef, b: AbilityDef = { kind: 'jump' }) {
  const g = new Game({ cars: [withAbility(CARS[0], a), withAbility(CARS[1], b)], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 9, roundTime: 60, seed: 3 });
  while (g.phase !== 'play') g.step();
  for (let i = 0; i < 100; i++) g.step(); // charge up
  return g;
}

function press(g: Game, p: number, steps = 1) {
  g.actions[p] = true;
  for (let i = 0; i < steps; i++) g.step();
  g.actions[p] = false;
  g.step();
}

describe('abilities', () => {
  it('every car has a known ability', () => {
    for (const c of CARS) expect(ABILITY_INFO[abilityOf(c).kind], c.id).toBeDefined();
  });
  it('gun-carrying cars shoot, rockets boost', () => {
    expect(abilityOf(CAR_BY_ID.tank).kind).toBe('shoot');
    expect(abilityOf(CAR_BY_ID['snowball-cannon']).projectile).toBe('snowball');
    expect(abilityOf(CAR_BY_ID.firework).kind).toBe('nitro');
    expect(abilityOf(CAR_BY_ID['flying-saucer']).kind).toBe('fly');
  });
  it('jump throws the car upward, then needs to recharge', () => {
    const g = ready({ kind: 'jump' });
    const vy0 = g.cars[0].chassis.getLinearVelocity().y;
    press(g, 0);
    expect(g.cars[0].chassis.getLinearVelocity().y).toBeLessThan(vy0 - 5);
    expect(g.cars[0].abilityCharge).toBeLessThan(0.1);
    const cd = g.cars[0].abilityCd;
    press(g, 0);
    expect(g.cars[0].abilityCd).toBeLessThan(cd); // not re-triggered
  });
  it('holding the button fires once (edge-triggered)', () => {
    const g = ready({ kind: 'shoot', projectile: 'cannon' });
    g.actions[0] = true;
    for (let i = 0; i < 30; i++) g.step();
    expect(g.shots.length).toBe(1);
  });
  it('a projectile into the head scores for the shooter', () => {
    const g = ready({ kind: 'shoot', projectile: 'laser' });
    const deaths: string[] = [];
    g.on((e) => { if (e.type === 'death') deaths.push(`${e.player}:${e.cause}`); });
    // Put P2's head right in front of P1's muzzle.
    const c0 = g.cars[0], c1 = g.cars[1];
    // Level the shooter in mid-air, and hang P2 upside down so only its head is in the line of fire.
    const turn = (car: typeof c0, about: Vec2, da: number, lift: number) => {
      for (const b of car.bodies) {
        const p = b.getPosition();
        const rx = p.x - about.x, ry = p.y - about.y;
        const c = Math.cos(da), sn = Math.sin(da);
        b.setTransform(new Vec2(about.x + rx * c - ry * sn, about.y + rx * sn + ry * c - lift), b.getAngle() + da);
        b.setLinearVelocity(new Vec2(0, 0));
        b.setAngularVelocity(0);
        b.setGravityScale(0);
      }
    };
    turn(c0, c0.chassis.getPosition().clone(), -c0.chassis.getAngle(), 6);
    const muzzle = c0.chassis.getWorldPoint(new Vec2(2, Math.min(-0.2, c0.def.head.y * 0.6)));
    const target = new Vec2(muzzle.x + 4, muzzle.y - 4 * Math.tan(0.12));
    turn(c1, c1.headWorld(), Math.PI - c1.chassis.getAngle(), 0);
    const head = c1.headWorld();
    for (const b of c1.bodies) {
      const p = b.getPosition();
      b.setPosition(new Vec2(p.x + target.x - head.x, p.y + target.y - head.y));
    }
    press(g, 0);
    for (let i = 0; i < 30 && !deaths.length; i++) g.step();
    expect(deaths).toEqual(['1:hit']);
  });
  it('a shield blocks a head hit', () => {
    const g = ready({ kind: 'jump' }, { kind: 'shield' });
    press(g, 1);
    expect(g.cars[1].shieldT).toBeGreaterThan(1);
    g.kill(1, 'hit', 0);
    expect(g.cars[1].alive).toBe(true);
    g.kill(1, 'ground');
    expect(g.cars[1].alive).toBe(false);
  });
  it('slam pushes a nearby opponent away', () => {
    const g = ready({ kind: 'slam' });
    const c0 = g.cars[0], c1 = g.cars[1];
    const p0 = c0.position;
    for (const b of c1.bodies) {
      const p = b.getPosition();
      b.setPosition(new Vec2(p.x - c1.position.x + p0.x + 3.5, p.y));
    }
    const vx = c1.chassis.getLinearVelocity().x;
    g.useAbility(0);
    expect(c1.chassis.getLinearVelocity().x).toBeGreaterThan(vx + 3);
  });
});
