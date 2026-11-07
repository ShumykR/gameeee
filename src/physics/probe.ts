import { World, Vec2, Chain } from 'planck';
import { CAT, MASK, DEFAULT_GRAVITY, POSITION_ITERS, STEP_DT, VELOCITY_ITERS } from './constants';
import { Car } from '../cars/car';
import type { CarDef } from '../cars/types';

/** Flat test track used to measure car handling headlessly (tests + tuning). */
export function testWorld(gravity = DEFAULT_GRAVITY) {
  const world = new World({ gravity: new Vec2(0, gravity) });
  const ground = world.createBody({ type: 'static' });
  ground.createFixture({
    shape: new Chain([new Vec2(-500, 0), new Vec2(500, 0), new Vec2(500, 20), new Vec2(-500, 20)], true),
    friction: 0.9,
    filterCategoryBits: CAT.TERRAIN,
    filterMaskBits: MASK.TERRAIN,
    userData: { kind: 'terrain', mat: 'grass' },
  });
  return world;
}

export function settle(world: World, car: Car, steps = 90) {
  for (let i = 0; i < steps; i++) {
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
  }
}

export function stepN(world: World, car: Car, n: number, each?: (i: number) => void) {
  for (let i = 0; i < n; i++) {
    each?.(i);
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
  }
}

export interface Handling {
  /** Seconds to reach 90% of top speed. */
  t90: number;
  top: number;
  /** Max nose-up angle (rad) while launching from standstill. */
  wheelie: number;
  /** Did the car flip over backwards while launching? */
  flipped: boolean;
  /** Seconds to rotate 360° in the air holding forward. */
  airFlip: number;
  /** Seconds to recover from lying on the roof. */
  recover: number;
  mass: number;
}

export function measure(def: CarDef): Handling {
  // Launch test
  let world = testWorld();
  let car = new Car(world, def, 0, 0, -1.6, 1);
  settle(world, car);
  let top = 0, t90 = 0, wheelie = 0, flipped = false;
  const speeds: number[] = [];
  stepN(world, car, 60 * 5, (i) => {
    car.input = 1;
    const v = car.chassis.getLinearVelocity().x;
    speeds.push(v);
    wheelie = Math.max(wheelie, -car.angle);
    if (Math.abs(car.angle) > 2) flipped = true;
    void i;
  });
  top = Math.max(...speeds);
  t90 = speeds.findIndex((v) => v >= top * 0.9) / 60;

  // Air flip: launch it high with no rotation and hold forward
  world = testWorld();
  car = new Car(world, def, 0, 0, -40, 1);
  for (const b of car.bodies) b.setLinearVelocity(new Vec2(0, -10));
  let turned = 0, last = car.chassis.getAngle(), airFlip = Infinity;
  for (let i = 0; i < 60 * 4; i++) {
    car.input = 1;
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    const a = car.chassis.getAngle();
    turned += a - last;
    last = a;
    if (Math.abs(turned) >= Math.PI * 2) {
      airFlip = (i + 1) / 60;
      break;
    }
  }

  // Recovery from upside down
  world = testWorld();
  car = new Car(world, def, 0, 0, -2.2, 1);
  car.chassis.setAngle(Math.PI);
  for (const w of car.wheels) {
    const p = w.getPosition();
    w.setPosition(new Vec2(-p.x, -2.2 - (p.y + 2.2)));
  }
  let recover = Infinity;
  for (let i = 0; i < 60 * 8; i++) {
    car.input = 0;
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    if (i > 30 && Math.abs(car.angle) < 0.35 && car.wheelsOnGround >= 1) {
      recover = (i + 1) / 60;
      break;
    }
  }
  return { t90, top, wheelie, flipped, airFlip, recover, mass: car.mass };
}

/** Drop the car from `h` meters: returns suspension extremes and whether the chassis bottomed out. */
export function dropTest(def: CarDef, h = 4.5) {
  const world = testWorld();
  const car = new Car(world, def, 0, 0, -h, 1);
  let minT = 0, maxT = 0, bottomed = false, bounces = 0, lastVy = 0;
  for (let i = 0; i < 60 * 3; i++) {
    car.preStep(STEP_DT);
    world.step(STEP_DT, VELOCITY_ITERS, POSITION_ITERS);
    for (const j of car.joints) {
      const t = j.getJointTranslation();
      minT = Math.min(minT, t);
      maxT = Math.max(maxT, t);
    }
    if (car.chassisTouching) bottomed = true;
    const vy = car.chassis.getLinearVelocity().y;
    if (lastVy > 0.5 && vy < -0.5) bounces++;
    lastVy = vy;
  }
  return { minT, maxT, bottomed, bounces, angle: car.angle };
}
