import { World, Body, Polygon, Circle, WheelJoint, Vec2, Fixture } from 'planck';
import { CAT, MASK, STEP_DT } from '../physics/constants';
import type { FixtureTag } from '../physics/tags';
import type { CarDef, Pt } from './types';

export interface BodyState { x: number; y: number; a: number }

const wrapAngle = (a: number) => {
  a = (a + Math.PI) % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a - Math.PI;
};

/**
 * A spawned car: chassis + wheels joined by WheelJoints (spring suspension + motor).
 * Car-local geometry faces +x; `facing = -1` mirrors it.
 */
export class Car {
  readonly chassis: Body;
  readonly wheels: Body[] = [];
  readonly joints: WheelJoint[] = [];
  readonly drive: boolean[] = [];
  headFixture: Fixture | null;
  alive = true;
  /** -1, 0, +1 world direction requested this step. */
  input = 0;
  /** Hold the brakes (countdown). */
  locked = false;
  boostFuel: number;
  boosting = false;
  /** Seconds the car has been stuck upside down. */
  flipTimer = 0;
  /** Number of wheels touching something this step. */
  wheelsOnGround = 0;
  chassisTouching = false;
  /** Previous-step transforms for render interpolation. */
  prev: BodyState[] = [];
  private readonly restAnchors: Vec2[] = [];

  constructor(
    readonly world: World,
    readonly def: CarDef,
    readonly player: number,
    x: number,
    y: number,
    readonly facing: 1 | -1,
  ) {
    const f = facing;
    const m = (p: Pt) => new Vec2(p[0] * f, p[1]);
    const group = -(player + 1);
    this.chassis = world.createBody({ type: 'dynamic', position: new Vec2(x, y), angularDamping: 0.05 });
    const chassisTag: FixtureTag = { kind: 'car', player, part: 'chassis' };
    for (const p of def.body) {
      if (p.deco) continue;
      this.chassis.createFixture({
        shape: new Polygon(p.pts.map(m)),
        density: p.density ?? def.density,
        friction: p.friction ?? 0.5,
        restitution: def.restitution ?? 0.05,
        filterGroupIndex: group,
        filterCategoryBits: CAT.CAR,
        filterMaskBits: MASK.CAR,
        userData: chassisTag,
      });
    }
    this.headFixture = this.chassis.createFixture({
      shape: new Circle(new Vec2(def.head.x * f, def.head.y), def.head.r),
      density: 0,
      isSensor: true,
      filterGroupIndex: group,
      filterCategoryBits: CAT.HEAD,
      filterMaskBits: MASK.HEAD,
      userData: { kind: 'head', player } satisfies FixtureTag,
    });
    if (def.com) {
      const md = { mass: 0, center: new Vec2(), I: 0 };
      this.chassis.getMassData(md);
      const ic = md.I - md.mass * md.center.lengthSquared();
      const center = new Vec2(md.center.x + def.com[0] * f, md.center.y + def.com[1]);
      this.chassis.setMassData({ mass: md.mass, center, I: ic + md.mass * center.lengthSquared() });
    }

    const wheelTag: FixtureTag = { kind: 'car', player, part: 'wheel' };
    for (const wd of def.wheels) {
      const wp = new Vec2(x + wd.x * f, y + wd.y);
      const wb = world.createBody({ type: 'dynamic', position: wp, angularDamping: 0.4 });
      wb.createFixture({
        shape: new Circle(wd.r),
        density: wd.density ?? 1.2,
        friction: def.tireFriction,
        restitution: 0.1,
        filterGroupIndex: group,
        filterCategoryBits: CAT.CAR,
        filterMaskBits: MASK.CAR,
        userData: wheelTag,
      });
      const j = world.createJoint(
        new WheelJoint(
          {
            enableMotor: true,
            maxMotorTorque: 0,
            motorSpeed: 0,
            frequencyHz: def.suspension.hz,
            dampingRatio: def.suspension.damping,
          },
          this.chassis,
          wb,
          wp,
          new Vec2(0, 1),
        ),
      )!;
      this.wheels.push(wb);
      this.joints.push(j);
      this.drive.push(wd.drive ?? true);
      this.restAnchors.push(new Vec2(wd.x * f, wd.y));
    }
    this.boostFuel = def.boost?.fuel ?? 0;
    this.snapshot();
  }

  get bodies(): Body[] {
    return [this.chassis, ...this.wheels];
  }

  get mass(): number {
    return this.bodies.reduce((s, b) => s + b.getMass(), 0);
  }

  get position() {
    return this.chassis.getWorldCenter();
  }

  get angle(): number {
    return wrapAngle(this.chassis.getAngle());
  }

  get upsideDown(): boolean {
    return Math.abs(this.angle) > Math.PI * 0.6;
  }

  get inAir(): boolean {
    return this.wheelsOnGround === 0 && !this.chassisTouching;
  }

  headWorld() {
    return this.chassis.getWorldPoint(new Vec2(this.def.head.x * this.facing, this.def.head.y));
  }

  snapshot() {
    this.prev = this.bodies.map((b) => ({ x: b.getPosition().x, y: b.getPosition().y, a: b.getAngle() }));
  }

  /** Remove the driver head sensor (driver ejected). */
  ejectHead() {
    if (this.headFixture) {
      this.chassis.destroyFixture(this.headFixture);
      this.headFixture = null;
    }
  }

  private scanContacts() {
    this.wheelsOnGround = 0;
    for (const w of this.wheels) {
      for (let ce = w.getContactList(); ce; ce = ce.next!) {
        const c = ce.contact;
        if (c.isTouching() && !c.getFixtureA().isSensor() && !c.getFixtureB().isSensor()) {
          this.wheelsOnGround++;
          break;
        }
      }
    }
    this.chassisTouching = false;
    for (let ce = this.chassis.getContactList(); ce; ce = ce.next!) {
      const c = ce.contact;
      if (c.isTouching() && !c.getFixtureA().isSensor() && !c.getFixtureB().isSensor()) {
        this.chassisTouching = true;
        break;
      }
    }
  }

  /** Called every fixed step before world.step(). */
  preStep(dt = STEP_DT) {
    this.snapshot();
    this.scanContacts();
    const d = this.def;
    const dir = this.alive ? this.input : 0;

    // Motor: drive wheels toward target angular speed; light rolling brake when idle.
    for (let i = 0; i < this.wheels.length; i++) {
      const j = this.joints[i];
      const r = d.wheels[i].r;
      if (dir !== 0 && this.drive[i]) {
        j.setMotorSpeed((dir * d.motor.speed) / r);
        j.setMaxMotorTorque(d.motor.torque);
      } else {
        j.setMotorSpeed(0);
        j.setMaxMotorTorque(d.motor.torque * (this.locked ? 1.5 : 0.12));
      }
    }

    const I = this.chassis.getInertia() + this.wheels.reduce((s, w) => s + w.getMass() * Vec2.distanceSquared(w.getPosition(), this.chassis.getWorldCenter()), 0);
    const w = this.chassis.getAngularVelocity();
    const maxSpin = 7.5;
    // Air control: pressing toward a direction rotates the car the way the
    // motor's reaction torque would (forward = nose up / backflip).
    if (dir !== 0 && this.inAir) {
      const want = -dir; // right -> counter-clockwise (nose up for a right-facing car)
      if (Math.sign(w) !== Math.sign(want) || Math.abs(w) < maxSpin) {
        this.chassis.applyTorque(want * d.air * I, true);
      }
    } else if (dir !== 0) {
      // A little ground tilt helps wheelies and recovery.
      this.chassis.applyTorque(-dir * d.air * 0.18 * I, true);
    }

    // Self-righting: if stuck upside down / on the side, slowly roll back.
    const a = this.angle;
    const slow = this.chassis.getLinearVelocity().length() < 2.5;
    if (Math.abs(a) > 1.5 && (this.chassisTouching || this.wheelsOnGround < this.wheels.length) && slow) {
      this.flipTimer += dt;
    } else {
      this.flipTimer = Math.max(0, this.flipTimer - dt * 2);
    }
    if (this.flipTimer > 0.9 && this.alive) {
      const k = Math.min(1, (this.flipTimer - 0.9) / 0.6);
      this.chassis.applyTorque(-Math.sign(a) * 9 * k * I, true);
      if (this.flipTimer > 1.4 && this.chassisTouching) {
        this.chassis.applyForceToCenter(new Vec2(0, -this.mass * 14 * k), true);
      }
    }

    // Rocket booster.
    this.boosting = false;
    if (d.boost) {
      if (dir === this.facing && this.boostFuel > 0) {
        this.boosting = true;
        this.boostFuel = Math.max(0, this.boostFuel - dt);
        const fwd = this.chassis.getWorldVector(new Vec2(this.facing, 0));
        this.chassis.applyForceToCenter(fwd.mul(d.boost.accel * this.mass), true);
      } else if (dir !== this.facing) {
        this.boostFuel = Math.min(d.boost.fuel, this.boostFuel + dt * d.boost.regen);
      }
    }

    this.limitSuspension(dt);
  }

  /** Hard stops for suspension travel (Box2D wheel joints have no limits). */
  private limitSuspension(dt: number) {
    const travel = this.def.suspension.travel;
    const mc = this.chassis.getMass();
    for (let i = 0; i < this.wheels.length; i++) {
      const wb = this.wheels[i];
      const axis = this.chassis.getWorldVector(new Vec2(0, 1));
      const anchor = this.chassis.getWorldPoint(this.restAnchors[i]);
      const c = wb.getPosition();
      const t = Vec2.dot(Vec2.sub(c, anchor), axis);
      // lateral drift is handled by the joint; we only clamp along the axis
      const over = t > travel ? t - travel : t < -travel ? t + travel : 0;
      if (!over) continue;
      const vw = wb.getLinearVelocity();
      const vc = this.chassis.getLinearVelocityFromWorldPoint(c);
      const rel = Vec2.dot(Vec2.sub(vw, vc), axis);
      const mw = wb.getMass();
      const mEff = (mw * mc) / (mw + mc);
      let dv = 0;
      if ((over > 0 && rel > 0) || (over < 0 && rel < 0)) dv = -rel;
      dv -= (over * 0.3) / dt;
      const imp = axis.clone().mul(dv * mEff);
      wb.applyLinearImpulse(imp, c, true);
      this.chassis.applyLinearImpulse(imp.clone().neg(), c, true);
    }
  }

  /** Speed in m/s. */
  get speed(): number {
    return this.chassis.getLinearVelocity().length();
  }

  /** Average driven-wheel angular speed normalized to the motor's top speed (0..1+). */
  get engineLoad(): number {
    let s = 0;
    for (let i = 0; i < this.wheels.length; i++) s += Math.abs(this.wheels[i].getAngularVelocity() * this.def.wheels[i].r);
    return s / this.wheels.length / this.def.motor.speed;
  }

  destroy() {
    for (const b of this.bodies) this.world.destroyBody(b);
  }
}
