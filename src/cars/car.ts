import { World, Body, Polygon, Circle, WheelJoint, RopeJoint, Vec2, Fixture } from 'planck';
import { CAT, MASK, STEP_DT, DEFAULT_GRAVITY } from '../physics/constants';

/** Tuning knobs shared by all cars. */
export const TUNE = { groundTilt: 1.6, maxSpin: 7.5, selfRight: 14 };
const SELF_RIGHT = TUNE.selfRight;
import type { FixtureTag } from '../physics/tags';
import type { AbilityDef, CarDef, Pt } from './types';
import { abilityOf, abilityCd } from '../game/abilities';

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
  private flipDir = 1;
  /** Number of wheels touching something this step. */
  wheelsOnGround = 0;
  chassisTouching = false;
  /** Special action and its runtime state. */
  readonly ability: AbilityDef | null;
  /** Seconds until the ability is ready again. */
  abilityCd = 1.5;
  shieldT = 0;
  flyT = 0;
  nitroT = 0;
  /** Ghost mode: passes through the other car and shots. */
  phaseT = 0;
  /** Engine dead (frozen / zapped). */
  stunT = 0;
  stunLook: 'ice' | 'zap' | 'web' = 'ice';
  /** Floating in a bubble. */
  liftT = 0;
  /** Swinging weight on a chain, if the car has one. */
  readonly flail: Body | null = null;
  /** Diving after a mid-air slam; the shockwave fires on landing. */
  slamming = false;
  /** Seconds before a stomp jump arms its landing shockwave. */
  stompDelay = 0;
  /** Strike window after a dash-type action: the first car hit gets `strikeFx`. */
  strikeT = 0;
  strikeFx: 'sting' | 'gore' | 'flip' | 'bump' | 'bite' | null = null;
  /** Rubber body (jelly). */
  bounceT = 0;
  /** Queued hops (hydraulics) / dashes (frenzy). */
  hops = 0;
  hopT = 0;
  hopKind: 'hydraulics' | 'frenzy' = 'hydraulics';
  /** Moon gravity, gliding. */
  lowGravT = 0;
  glideT = 0;
  /** DRS: more top speed and torque. */
  turboT = 0;
  /** Frictionless belly slide. */
  slideT = 0;
  /** Four times heavier chassis. */
  heavyT = 0;
  /** Hiding in the shell: no driving, heavy, can't lose the head. */
  shellT = 0;
  /** Shots bounce back. */
  reflectT = 0;
  /** Nearly invisible. */
  invisT = 0;
  /** Controls reversed (howl). */
  confuseT = 0;
  /** Frozen mid-air in a stasis field. */
  stasisT = 0;
  /** Engine strangled: ink / tar (speed multiplier while > 0). */
  slowT = 0;
  /** Flat tyres after a spike strip. */
  flatT = 0;
  /** Puffed up (blast fish), render scale. */
  puffT = 0;
  /** Medkit trait already used this round. */
  medkitUsed = false;
  /** Seconds to the next spilled item (spill trait). */
  spillT = 1.5;
  /** Seconds before a passive contact effect (quills / shock) can fire again. */
  touchCd = 0;
  /** Recent chassis positions for the time loop (one sample every 5 steps). */
  history: { x: number; y: number; a: number }[] = [];
  private histTick = 0;
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
        friction: this.tireGrip,
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
    if (def.flail) {
      const fl = def.flail;
      const anchor = new Vec2(x + fl.at[0] * f, y + fl.at[1]);
      const fb = world.createBody({ type: 'dynamic', position: new Vec2(anchor.x - 0.3 * f, anchor.y + fl.len * 0.9), angularDamping: 0.2, linearDamping: 0.05 });
      fb.createFixture({
        shape: new Circle(fl.r),
        density: 1.6,
        friction: 0.4,
        restitution: 0.2,
        filterGroupIndex: group,
        filterCategoryBits: CAT.CAR,
        filterMaskBits: MASK.CAR,
        userData: chassisTag,
      });
      world.createJoint(new RopeJoint({ bodyA: this.chassis, bodyB: fb, maxLength: fl.len, localAnchorA: new Vec2(fl.at[0] * f, fl.at[1]), localAnchorB: new Vec2(0, 0) }));
      this.flail = fb;
    }
    this.ability = abilityOf(def);
    this.applyGravity();
    this.boostFuel = def.boost?.fuel ?? 0;
    this.snapshot();
  }

  hasTrait(kind: NonNullable<CarDef['traits']>[number]['kind']): boolean {
    return !!this.def.traits?.some((t) => t.kind === kind);
  }

  /** Tyre friction including the grip trait. */
  get tireGrip(): number {
    return this.def.tireFriction * (this.hasTrait('grip') ? 1.8 : 1);
  }

  get bodies(): Body[] {
    return [this.chassis, ...this.wheels];
  }

  /** Every body including the chain weight (for moving the whole car). */
  get allBodies(): Body[] {
    return this.flail ? [...this.bodies, this.flail] : this.bodies;
  }

  /** Gravity scale from flight / bubble / the car's own floatiness. */
  applyGravity() {
    const g = this.stasisT > 0 ? 0
      : this.liftT > 0 ? -0.18
      : this.flyT > 0 ? -0.06
      : this.glideT > 0 ? 0.22
      : this.lowGravT > 0 ? 0.3
      : this.heavyT > 0 || this.shellT > 0 ? Math.max(1.6, this.def.float ?? 1)
      : this.def.float ?? 1;
    for (const b of this.allBodies) b.setGravityScale(g);
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

  /** 0 = just used, 1 = ready. */
  get abilityCharge(): number {
    if (!this.ability) return 0;
    return 1 - Math.max(0, this.abilityCd) / abilityCd(this.ability);
  }

  /** Add a velocity change to every body of the car. */
  kick(dx: number, dy: number) {
    for (const b of this.allBodies) {
      const v = b.getLinearVelocity();
      b.setLinearVelocity(new Vec2(v.x + dx, v.y + dy));
    }
  }

  /** Unit vector the car's nose points at (world). */
  forward(): Vec2 {
    return this.chassis.getWorldVector(new Vec2(this.facing, 0));
  }

  /** Ability timers; called once per step. */
  tickAbility(dt: number) {
    this.abilityCd = Math.max(0, this.abilityCd - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    this.nitroT = Math.max(0, this.nitroT - dt);
    this.stunT = Math.max(0, this.stunT - dt);
    this.strikeT = Math.max(0, this.strikeT - dt);
    this.turboT = Math.max(0, this.turboT - dt);
    this.reflectT = Math.max(0, this.reflectT - dt);
    this.invisT = Math.max(0, this.invisT - dt);
    this.confuseT = Math.max(0, this.confuseT - dt);
    this.slowT = Math.max(0, this.slowT - dt);
    this.flatT = Math.max(0, this.flatT - dt);
    this.puffT = Math.max(0, this.puffT - dt);
    this.touchCd = Math.max(0, this.touchCd - dt);
    let regrav = false;
    const tick = (k: 'flyT' | 'liftT' | 'glideT' | 'lowGravT' | 'stasisT') => {
      if (this[k] > 0) {
        this[k] -= dt;
        if (this[k] <= 0) { this[k] = 0; regrav = true; }
      }
    };
    tick('flyT'); tick('liftT'); tick('glideT'); tick('lowGravT'); tick('stasisT');
    if (this.heavyT > 0) {
      this.heavyT -= dt;
      if (this.heavyT <= 0) { this.heavyT = 0; this.setHeavy(false); regrav = true; }
    }
    if (this.shellT > 0) {
      this.shellT -= dt;
      if (this.shellT <= 0) { this.shellT = 0; this.setHeavy(false); regrav = true; }
    }
    if (this.slideT > 0) {
      this.slideT -= dt;
      if (this.slideT <= 0) { this.slideT = 0; this.setTireFriction(this.tireGrip); }
    }
    if (this.bounceT > 0) {
      this.bounceT -= dt;
      if (this.bounceT <= 0) { this.bounceT = 0; this.setBounce(this.def.restitution ?? 0.05); }
    }
    if (regrav) this.applyGravity();
    if (++this.histTick % 5 === 0) {
      const p = this.chassis.getPosition();
      this.history.push({ x: p.x, y: p.y, a: this.chassis.getAngle() });
      if (this.history.length > 30) this.history.shift();
    }
  }

  /** Put the car back upright at (x, y), at rest (same layout as when it was built). */
  reset(x: number, y: number) {
    const f = this.facing;
    this.chassis.setTransform(new Vec2(x, y), 0);
    this.def.wheels.forEach((wd, i) => this.wheels[i].setTransform(new Vec2(x + wd.x * f, y + wd.y), 0));
    if (this.flail && this.def.flail) {
      const fl = this.def.flail;
      this.flail.setTransform(new Vec2(x + fl.at[0] * f - 0.3 * f, y + fl.at[1] + fl.len * 0.9), 0);
    }
    for (const b of this.allBodies) {
      b.setLinearVelocity(new Vec2(0, 0));
      b.setAngularVelocity(0);
    }
    this.flipTimer = 0;
    this.snapshot();
  }

  /** Make the chassis much heavier (or back to normal). */
  setHeavy(on: boolean) {
    for (let fx = this.chassis.getFixtureList(); fx; fx = fx.getNext()) {
      if (fx.isSensor()) continue;
      const base = (fx as unknown as { baseDensity?: number });
      if (base.baseDensity === undefined) base.baseDensity = fx.getDensity();
      fx.setDensity(on ? base.baseDensity * 4 : base.baseDensity);
    }
    this.chassis.resetMassData();
    if (this.def.com) {
      const f = this.facing;
      const md = { mass: 0, center: new Vec2(), I: 0 };
      this.chassis.getMassData(md);
      const ic = md.I - md.mass * md.center.lengthSquared();
      const center = new Vec2(md.center.x + this.def.com[0] * f, md.center.y + this.def.com[1]);
      this.chassis.setMassData({ mass: md.mass, center, I: ic + md.mass * center.lengthSquared() });
    }
  }

  setTireFriction(f: number) {
    for (const w of this.wheels) for (let fx = w.getFixtureList(); fx; fx = fx.getNext()) fx.setFriction(f);
    // Already-touching contacts keep their mixed friction until refreshed.
    for (const w of this.wheels) for (let ce = w.getContactList(); ce; ce = ce.next!) ce.contact.resetFriction();
  }

  setBounce(r: number) {
    for (const b of this.bodies) for (let fx = b.getFixtureList(); fx; fx = fx.getNext()) if (!fx.isSensor()) fx.setRestitution(r);
    for (const b of this.bodies) for (let ce = b.getContactList(); ce; ce = ce.next!) ce.contact.resetRestitution();
  }

  /** Switch ghost mode collision filtering on/off. */
  setPhased(on: boolean) {
    const solid = on ? CAT.TERRAIN | CAT.PLATFORM | CAT.HAZARD : MASK.CAR;
    for (const b of this.allBodies) {
      for (let fx = b.getFixtureList(); fx; fx = fx.getNext()) {
        if (fx === this.headFixture) fx.setFilterData({ groupIndex: -(this.player + 1), categoryBits: CAT.HEAD, maskBits: on ? CAT.TERRAIN | CAT.PLATFORM | CAT.HAZARD : MASK.HEAD });
        else fx.setFilterData({ groupIndex: -(this.player + 1), categoryBits: CAT.CAR, maskBits: solid });
      }
    }
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
    const dir = this.alive && this.stunT <= 0 && this.shellT <= 0 && this.stasisT <= 0 ? this.input : 0;
    const spd = (this.turboT > 0 ? 1.5 : 1) * (this.slowT > 0 ? 0.4 : 1) * (this.flatT > 0 ? 0.55 : 1);
    const trq = (this.turboT > 0 ? 1.4 : 1) * (this.heavyT > 0 ? 2.6 : 1) * (this.slowT > 0 ? 0.6 : 1);
    if (this.stasisT > 0) {
      for (const b of this.allBodies) { b.setLinearVelocity(new Vec2(0, 0)); b.setAngularVelocity(b.getAngularVelocity() * 0.8); }
    }

    // Motor: drive wheels toward target angular speed; light rolling brake when idle.
    for (let i = 0; i < this.wheels.length; i++) {
      const j = this.joints[i];
      const r = d.wheels[i].r;
      if (dir !== 0 && this.drive[i]) {
        j.setMotorSpeed((dir * d.motor.speed * spd) / r);
        j.setMaxMotorTorque(d.motor.torque * trq);
      } else {
        j.setMotorSpeed(0);
        j.setMaxMotorTorque(d.motor.torque * (this.locked ? 1.5 : 0.12));
      }
    }

    const I = this.chassis.getInertia() + this.wheels.reduce((s, w) => s + w.getMass() * Vec2.distanceSquared(w.getPosition(), this.chassis.getWorldCenter()), 0);
    const w = this.chassis.getAngularVelocity();
    const maxSpin = TUNE.maxSpin;
    // Air control: pressing toward a direction rotates the car the way the
    // motor's reaction torque would (forward = nose up / backflip).
    if (dir !== 0 && this.inAir) {
      const want = -dir; // right -> counter-clockwise (nose up for a right-facing car)
      if (Math.sign(w) !== Math.sign(want) || Math.abs(w) < maxSpin) {
        this.chassis.applyTorque(want * d.air * I, true);
      }
    } else if (dir !== 0) {
      // Ground tilt: pressing a direction lifts that end (wheelie / stoppie).
      // A PD controller eases the car toward its wheelie angle instead of flipping it.
      const lift = -dir * this.angle; // >0 when the pressed end is already up
      const liftRate = -dir * w;
      const want = 80 * ((d.wheelie ?? 0.45) - lift) - 9 * liftRate;
      // Below the target it lifts; above it, a weaker assist pushes back down so
      // holding the throttle doesn't simply loop the car over.
      const mag = Math.min(Math.max(want, -d.air * TUNE.groundTilt * 0.6), d.air * TUNE.groundTilt);
      if (mag !== 0) this.chassis.applyTorque(-dir * mag * I, true);
    }

    // Self-righting: if stuck upside down / on the side, slowly roll back.
    const a = this.angle;
    const slow = this.chassis.getLinearVelocity().length() < 3;
    if (Math.abs(a) > 1.4 && (this.chassisTouching || this.wheelsOnGround < this.wheels.length) && slow) {
      if (this.flipTimer === 0) this.flipDir = -Math.sign(a) || 1;
      this.flipTimer += dt;
    } else if (Math.abs(a) < 0.9 || !slow) {
      this.flipTimer = Math.max(0, this.flipTimer - dt * 3);
    }
    if (this.flipTimer > 0.8 && this.alive) {
      const k = Math.min(1, (this.flipTimer - 0.8) / 0.5);
      // Still stuck after a while (e.g. propped on a wheel): push progressively harder.
      const extra = Math.min(2, Math.max(0, this.flipTimer - 1.6));
      if (Math.abs(w) < 3.5) this.chassis.applyTorque(this.flipDir * (SELF_RIGHT * k * I + extra * this.mass * DEFAULT_GRAVITY * 0.5), true);
      if (this.chassisTouching) this.chassis.applyForceToCenter(new Vec2(0, -this.mass * DEFAULT_GRAVITY * 0.75 * k), true);
    }

    // Rocket booster.
    this.boosting = this.nitroT > 0;
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
      // Progressive bump stop: stiffen the spring as the wheel nears the end of travel.
      const j = this.joints[i];
      const near = Math.max(0, Math.abs(t) / travel - 0.7) / 0.3;
      j.setSpringFrequencyHz(this.def.suspension.hz * (1 + near * near * 1.2));
      j.setSpringDampingRatio(Math.min(1.2, this.def.suspension.damping + near * 0.6));
      if (!over) continue;
      const vw = wb.getLinearVelocity();
      const vc = this.chassis.getLinearVelocityFromWorldPoint(c);
      const rel = Vec2.dot(Vec2.sub(vw, vc), axis);
      const mw = wb.getMass();
      let dv = 0;
      if ((over > 0 && rel > 0) || (over < 0 && rel < 0)) dv = -rel;
      dv -= Math.max(-0.5, Math.min(0.5, (over * 0.1) / dt));
      // Effective mass of the chassis at the wheel point along the axis (includes rotation).
      const com = this.chassis.getWorldCenter();
      const rx = c.x - com.x, ry = c.y - com.y;
      const rn = rx * axis.y - ry * axis.x;
      const invC = 1 / mc + (rn * rn) / this.chassis.getInertia();
      // When bottoming out the wheel is usually pinned by the ground, so only the chassis moves.
      const invW = over < 0 ? 0 : 1 / mw;
      const imp = axis.clone().mul(dv / (invC + invW));
      if (invW) wb.applyLinearImpulse(imp, c, true);
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
    for (const b of this.allBodies) this.world.destroyBody(b);
  }
}
