import { describe, it, expect } from 'vitest';
import { Vec2 } from 'planck';
import { Game } from '../src/game/game';
import { CARS, CAR_BY_ID } from '../src/cars/defs';
import { MAP_BY_ID } from '../src/maps/defs';
import { abilityOf, ABILITY_INFO, PROJECTILES } from '../src/game/abilities';
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
  it('abilities are known kinds, and plenty of cars just drive', () => {
    let none = 0;
    for (const c of CARS) {
      const a = abilityOf(c);
      if (!a) { none++; continue; }
      expect(ABILITY_INFO[a.kind], c.id).toBeDefined();
      if (a.kind === 'shoot') expect(PROJECTILES[a.projectile!], c.id).toBeDefined();
    }
    expect(none).toBeGreaterThan(CARS.length * 0.25);
    expect(none).toBeLessThan(CARS.length * 0.75);
  });
  it('abilities fit the car', () => {
    expect(abilityOf(CAR_BY_ID.tank)?.projectile).toBe('cannon');
    expect(abilityOf(CAR_BY_ID['toaster-racer'])?.projectile).toBe('toast');
    expect(abilityOf(CAR_BY_ID['snowball-cannon'])?.projectile).toBe('bigsnow');
    expect(abilityOf(CAR_BY_ID['flying-saucer'])?.kind).toBe('beam');
    expect(abilityOf(CAR_BY_ID['fire-truck'])?.projectile).toBe('water');
    expect(abilityOf(CAR_BY_ID['ghost-train'])?.kind).toBe('phase');
    expect(abilityOf(CAR_BY_ID['invisible-car'])?.kind).toBe('invis');
    expect(abilityOf(CAR_BY_ID['mine-lander'])?.item).toBe('mine');
    expect(abilityOf(CAR_BY_ID.limousine)).toBeNull();
    expect(abilityOf(CAR_BY_ID.firework)).toBeNull(); // booster only
  });
  it('cargo cars carry loose cargo that spills', () => {
    const def = CAR_BY_ID['soccer-delivery'];
    expect(def.cargo?.kind).toBe('ball');
    const g = new Game({ cars: [def, CARS[1]], maps: [MAP_BY_ID.meadow], randomMaps: false, target: 9, roundTime: 60, seed: 3 });
    expect(g.items.filter((i) => i.owner === 0 && i.kind === 'ball').length).toBe(def.cargo!.n);
    // Cargo rides hidden in the bed and only shows once it has left it.
    for (let i = 0; i < 90; i++) g.step();
    const own = g.items.filter((i) => i.owner === 0 && i.kind === 'ball');
    expect(own.some((i) => i.stowed)).toBe(true);
    const it = own.find((i) => i.stowed)!;
    it.body.setPosition(it.body.getPosition().clone().add({ x: 0, y: -3 } as never));
    g.step();
    expect(it.stowed).toBeUndefined();
    expect(CAR_BY_ID['wrecking-crane'].flail).toBeDefined();
    expect(g.cars[1].flail).toBeNull();
  });
  it('the hearse carries its coffin inside the body, not on the roof', () => {
    const def = CAR_BY_ID.hearse;
    expect(def.cargo?.kind).toBe('coffin');
    const roof = Math.min(...def.body.flatMap((p) => p.pts.map((q) => q[1])));
    expect(def.cargo!.at[2]).toBeGreaterThan(roof + 0.4);
  });
  it('sleds and the bumper car hide their wheels', () => {
    for (const id of ['sleigh', 'santa-sleigh', 'kicksled', 'snowmobile', 'bumper-car']) expect(CAR_BY_ID[id].wheels.every((w) => w.hidden)).toBe(true);
    expect(CAR_BY_ID['go-kart'].wheels.some((w) => w.hidden)).toBe(false);
  });
  it('cars with a drawn gun fire it, from its muzzle', () => {
    const guns = ['tank', 'mini-tank', 'tankette', 'snowball-tank', 'dual-snowballer', 'dual-soccer-cannon', 'army-bike', 'serpent-tank', 'cannon-carriage', 'gun-truck', 'monster-cannon', 'laser-tank', 'firework-truck', 'rocket-launcher'];
    for (const id of guns) {
      const a = CAR_BY_ID[id].ability;
      expect(a?.kind, id).toBe('shoot');
      expect(a?.muzzle?.length, id).toBeGreaterThan(0);
    }
    // fireworks go up out of the bed battery, not straight out of the nose
    const fw = CAR_BY_ID['firework-truck'].ability!;
    expect(fw.aim!).toBeGreaterThan(0.9);
    expect(Math.max(...fw.muzzle!.map((m) => m[0]))).toBeLessThan(CAR_BY_ID['firework-truck'].head.x);
  });
  it('a car without an ability ignores the button', () => {
    const g = ready({ kind: 'jump' });
    (g.cars[0] as { ability: unknown }).ability = null;
    const vy = g.cars[0].chassis.getLinearVelocity().y;
    press(g, 0);
    expect(Math.abs(g.cars[0].chassis.getLinearVelocity().y - vy)).toBeLessThan(2);
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

  const placeFoe = (g: Game, dx: number) => {
    const c0 = g.cars[0], c1 = g.cars[1];
    const p0 = c0.position;
    for (const b of c1.allBodies) {
      const p = b.getPosition();
      b.setPosition(new Vec2(p.x - c1.position.x + p0.x + dx, p.y));
    }
  };
  it('roar pushes, stun roar kills the engine', () => {
    let g = ready({ kind: 'roar' });
    placeFoe(g, 3.5);
    const vx = g.cars[1].chassis.getLinearVelocity().x;
    g.useAbility(0);
    expect(g.cars[1].chassis.getLinearVelocity().x).toBeGreaterThan(vx + 2);
    g = ready({ kind: 'discharge' });
    placeFoe(g, 3);
    g.useAbility(0);
    expect(g.cars[1].stunT).toBeGreaterThan(0.5);
  });
  it('drop leaves a mine behind that blows up the opponent', () => {
    const g = ready({ kind: 'drop', item: 'mine' });
    g.useAbility(0);
    const mine = g.items.find((i) => i.kind === 'mine');
    expect(mine).toBeDefined();
    expect(mine!.body.getPosition().x).toBeLessThan(g.cars[0].position.x);
    for (let i = 0; i < 30; i++) g.step();
    const events: string[] = [];
    g.on((e) => { if (e.type === 'blast') events.push(e.kind); });
    // drive the opponent onto it
    const from = g.cars[1].position.clone(), to = mine!.body.getPosition().clone();
    for (const b of g.cars[1].allBodies) {
      const p = b.getPosition();
      b.setPosition(new Vec2(p.x - from.x + to.x, p.y - from.y + to.y - 1.2));
    }
    for (let i = 0; i < 60 && !events.length; i++) g.step();
    expect(events).toContain('bomb');
  });
  it('dump throws cargo out the back', () => {
    const g = ready({ kind: 'dump', item: 'log' });
    const n = g.items.length;
    g.useAbility(0);
    expect(g.items.length).toBe(n + 4);
  });
  it('phase lets the car pass through and then turns solid again', () => {
    const g = ready({ kind: 'phase' });
    g.useAbility(0);
    expect(g.cars[0].phaseT).toBeGreaterThan(1);
    g.kill(0, 'hit', 1); // shots/cars cannot touch a ghost; head contacts are filtered
    for (let i = 0; i < 200; i++) g.step();
    expect(g.cars[0].phaseT).toBe(0);
  });
  it('blink teleports forward', () => {
    const g = ready({ kind: 'blink' });
    const x0 = g.cars[0].position.x;
    g.useAbility(0);
    expect(g.cars[0].position.x).toBeGreaterThan(x0 + 1.5);
  });
  it('ice shots freeze, bubbles lift, water does not knock the head off', () => {
    for (const [proj, check] of [['ice', (c: Game['cars'][0]) => c.stunT > 0], ['bubble', (c: Game['cars'][0]) => c.liftT > 0]] as const) {
      const g = ready({ kind: 'shoot', projectile: proj });
      placeFoe(g, 4);
      g.useAbility(0);
      let hit = false;
      for (let i = 0; i < 90 && !hit; i++) { g.step(); hit = check(g.cars[1]); }
      expect(hit, proj).toBe(true);
    }
    expect(PROJECTILES.water.harmless).toBe(true);
  });
});
