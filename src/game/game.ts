import { World, Vec2, Contact, Fixture, Body, Circle } from 'planck';
import { CAT, DEFAULT_GRAVITY, MASK, POSITION_ITERS, STEP_DT, VELOCITY_ITERS } from '../physics/constants';
import { FixedStepper } from '../physics/stepper';
import { tagOf, FixtureTag } from '../physics/tags';
import { Car } from '../cars/car';
import type { AbilityKind, CarDef, ProjectileKind } from '../cars/types';
import { ABILITY_INFO, PROJECTILES } from './abilities';
import { Arena } from '../maps/arena';
import type { MapDef } from '../maps/types';
import { MatchState, DeathResolver, RoundResult } from './match';
import { Ragdoll } from './ragdoll';

export type GamePhase = 'countdown' | 'play' | 'roundEnd' | 'matchEnd';

export type GameEvent =
  | { type: 'roundStart'; round: number; map: MapDef }
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'impact'; x: number; y: number; strength: number; carCar: boolean }
  | { type: 'ability'; player: number; kind: AbilityKind; x: number; y: number }
  | { type: 'blast'; x: number; y: number; r: number; kind: 'slam' | 'firework' | 'bomb' }
  | { type: 'shieldBlock'; player: number; x: number; y: number }
  | { type: 'shotHit'; x: number; y: number; proj: ProjectileKind }
  | { type: 'death'; player: number; x: number; y: number; cause: 'hit' | 'hazard' | 'fall' | 'ground' }
  | { type: 'pad'; x: number; y: number }
  | { type: 'suddenDeath' }
  | { type: 'roundEnd'; result: RoundResult }
  | { type: 'matchEnd'; winner: 0 | 1 };

export interface Controller {
  /** Return -1/0/1 for this step. */
  decide(game: Game, player: number, dt: number): -1 | 0 | 1;
  /** Hold the action button this step? */
  action?(game: Game, player: number): boolean;
}

export interface Shot {
  id: number;
  body: Body;
  owner: number;
  proj: ProjectileKind;
  born: number;
  dead: boolean;
}

export interface GameConfig {
  cars: [CarDef, CarDef];
  /** Map pool; a random one is picked each round when `randomMaps` is set. */
  maps: MapDef[];
  randomMaps: boolean;
  /** Pick a random car for each player every round. */
  randomCars?: boolean;
  /** Car pool for random cars (defaults to the two chosen cars). */
  carPool?: CarDef[];
  target: number;
  roundTime: number;
  seed?: number;
}

const COUNTDOWN = 3;
const ROUND_END_DELAY = 2.8;

export class Game {
  world!: World;
  arena!: Arena;
  cars: Car[] = [];
  ragdolls: Ragdoll[] = [];
  readonly match: MatchState;
  readonly resolver = new DeathResolver(5);
  readonly stepper = new FixedStepper();
  phase: GamePhase = 'countdown';
  phaseTime = 0;
  roundClock = 0;
  suddenDeath = false;
  stepCount = 0;
  map!: MapDef;
  /** Cars used this round (differ from cfg.cars when randomCars is on). */
  roundCars!: CarDef[];
  mapIndex = 0;
  lastResult: RoundResult | null = null;
  /** Real-time seconds of slow motion remaining. */
  slowmo = 0;
  readonly controllers: (Controller | null)[] = [null, null];
  readonly inputs: (-1 | 0 | 1)[] = [0, 0];
  /** Action button held (humans); edge-triggered. */
  readonly actions: boolean[] = [false, false];
  private prevAction = [false, false];
  shots: Shot[] = [];
  private shotId = 0;
  time = 0;
  private listeners: ((e: GameEvent) => void)[] = [];
  private contactQueue: [Fixture, Fixture, Contact][] = [];
  private impactCooldown = 0;
  private padCooldown = new Map<number, number>();
  private rngState: number;
  private lastCount = -1;

  constructor(readonly cfg: GameConfig) {
    this.match = new MatchState({ target: cfg.target, roundTime: cfg.roundTime });
    this.rngState = (cfg.seed ?? Date.now()) >>> 0 || 7;
    this.mapIndex = cfg.randomMaps ? Math.floor(this.rand() * cfg.maps.length) : 0;
    this.startRound();
  }

  rand(): number {
    this.rngState = (Math.imul(this.rngState, 1664525) + 1013904223) >>> 0;
    return this.rngState / 4294967296;
  }

  on(fn: (e: GameEvent) => void) {
    this.listeners.push(fn);
  }

  private emit(e: GameEvent) {
    for (const l of this.listeners) l(e);
  }

  startRound() {
    if (this.cfg.randomMaps && this.match.round > 1) {
      let next = Math.floor(this.rand() * this.cfg.maps.length);
      if (this.cfg.maps.length > 1 && next === this.mapIndex) next = (next + 1) % this.cfg.maps.length;
      this.mapIndex = next;
    }
    this.map = this.cfg.maps[this.mapIndex];
    if (this.cfg.randomCars && this.cfg.carPool?.length) {
      const pool = this.cfg.carPool;
      const pick = (avoid?: CarDef) => {
        let c = pool[Math.floor(this.rand() * pool.length)];
        if (avoid && pool.length > 1 && c.id === avoid.id) c = pool[(pool.indexOf(c) + 1) % pool.length];
        return c;
      };
      const a = pick();
      this.roundCars = [a, pick(a)];
    } else this.roundCars = [...this.cfg.cars];
    this.world = new World({ gravity: new Vec2(0, this.map.gravity ?? DEFAULT_GRAVITY) });
    this.world.on('begin-contact', (c: Contact) => this.contactQueue.push([c.getFixtureA(), c.getFixtureB(), c]));
    this.world.on('post-solve', (c: Contact, imp) => this.onPostSolve(c, imp.normalImpulses));
    this.arena = new Arena(this.world, this.map, Math.floor(this.rand() * 1e9));
    this.cars = [0, 1].map((p) => {
      const [x, y] = this.map.spawns[p];
      return new Car(this.world, this.roundCars[p], p, x, y, p === 0 ? 1 : -1);
    });
    this.ragdolls = [];
    this.shots = [];
    this.prevAction = [false, false];
    this.resolver.reset();
    this.phase = 'countdown';
    this.phaseTime = 0;
    this.roundClock = 0;
    this.suddenDeath = false;
    this.lastCount = -1;
    this.slowmo = 0;
    this.stepper.timeScale = 1;
    this.contactQueue = [];
    this.emit({ type: 'roundStart', round: this.match.round, map: this.map });
  }

  /** Advance by a real-time frame. Returns the number of physics steps. */
  frame(realDt: number): number {
    if (this.slowmo > 0) {
      this.slowmo -= realDt;
      this.stepper.timeScale = this.slowmo > 0.35 ? 0.22 : 0.22 + (1 - 0.22) * (1 - Math.max(0, this.slowmo) / 0.35);
    } else this.stepper.timeScale = 1;
    return this.stepper.advance(realDt, (dt) => this.step(dt));
  }

  step(dt = STEP_DT) {
    this.stepCount++;
    this.phaseTime += dt;
    this.impactCooldown = Math.max(0, this.impactCooldown - dt);

    if (this.phase === 'countdown') {
      const n = COUNTDOWN - Math.floor(this.phaseTime);
      if (n !== this.lastCount && n > 0) {
        this.lastCount = n;
        this.emit({ type: 'countdown', n });
      }
      if (this.phaseTime >= COUNTDOWN) {
        this.phase = 'play';
        this.phaseTime = 0;
        this.emit({ type: 'go' });
      }
    } else if (this.phase === 'play') {
      this.roundClock += dt;
      if (!this.suddenDeath && this.roundClock >= this.cfg.roundTime) {
        this.suddenDeath = true;
        this.arena.startRise();
        this.emit({ type: 'suddenDeath' });
      }
    }

    this.time += dt;
    for (let p = 0; p < 2; p++) {
      const ctrl = this.controllers[p];
      const dir = ctrl ? ctrl.decide(this, p, dt) : this.inputs[p];
      this.cars[p].input = this.phase === 'countdown' ? 0 : dir;
      this.cars[p].locked = this.phase === 'countdown';
      const act = ctrl ? (ctrl.action?.(this, p) ?? false) : this.actions[p];
      if (act && !this.prevAction[p]) this.useAbility(p);
      this.prevAction[p] = act;
      this.cars[p].tickAbility(dt);
    }
    for (const c of this.cars) c.preStep(dt);
    for (const r of this.ragdolls) r.snapshot();
    this.arena.step(dt);
    this.world.step(dt, VELOCITY_ITERS, POSITION_ITERS);
    this.processContacts();
    this.stepShots();
    for (const c of this.cars) {
      if (c.slamming && (c.wheelsOnGround > 0 || c.chassisTouching)) {
        c.slamming = false;
        this.shockwave(c.player, 5.5, 1);
      }
    }

    // falling out of the world
    for (const c of this.cars) {
      if (c.alive && c.chassis.getPosition().y > this.map.killY) this.kill(c.player, 'fall');
    }

    if (this.phase === 'play' || this.phase === 'countdown') {
      const res = this.resolver.resolve(this.stepCount);
      if (res !== null) this.endRound(res);
    } else if (this.phase === 'roundEnd') {
      if (this.phaseTime >= ROUND_END_DELAY) {
        if (this.match.over) {
          this.phase = 'matchEnd';
          this.phaseTime = 0;
          this.emit({ type: 'matchEnd', winner: this.match.winner! });
        } else this.startRound();
      }
    }
  }

  private endRound(res: RoundResult) {
    this.lastResult = res;
    this.match.record(res);
    this.phase = 'roundEnd';
    this.phaseTime = 0;
    this.emit({ type: 'roundEnd', result: res });
  }

  private onPostSolve(c: Contact, impulses: number[]) {
    const ta = tagOf(c.getFixtureA()), tb = tagOf(c.getFixtureB());
    if (!ta || !tb) return;
    const isCar = (t: FixtureTag) => t.kind === 'car';
    if (!isCar(ta) && !isCar(tb)) return;
    const carCar = isCar(ta) && isCar(tb);
    const imp = Math.max(...impulses, 0);
    const carMass = 6;
    const strength = imp / carMass;
    if (strength < (carCar ? 0.9 : 2.2) || this.impactCooldown > 0) return;
    this.impactCooldown = 0.08;
    const wm = c.getWorldManifold(null);
    const p = wm?.points[0];
    if (!p) return;
    this.emit({ type: 'impact', x: p.x, y: p.y, strength, carCar });
  }

  private processContacts() {
    const q = this.contactQueue;
    this.contactQueue = [];
    for (const [fa, fb] of q) {
      const ta = tagOf(fa), tb = tagOf(fb);
      if (!ta || !tb) continue;
      this.handlePair(ta, tb, fa, fb);
      this.handlePair(tb, ta, fb, fa);
    }
  }

  private handlePair(a: FixtureTag, b: FixtureTag, _fa: Fixture, fb: Fixture) {
    if (a.kind === 'head') {
      const car = this.cars[a.player];
      if (!car.alive || !car.headFixture) return;
      if ((b.kind === 'car' || b.kind === 'head') && b.player !== a.player) this.kill(a.player, 'hit', b.player);
      else if (b.kind === 'shot' && b.owner !== a.player) this.kill(a.player, 'hit', b.owner);
      else if (b.kind === 'hazard') this.kill(a.player, 'hazard');
      // Head touching the ground (usually after a flip) loses the round.
      else if (b.kind === 'terrain' || b.kind === 'platform') this.kill(a.player, 'ground');
      else if (b.kind === 'block' && b.body.getLinearVelocity().length() > 4) this.kill(a.player, 'hazard');
    } else if (a.kind === 'shot') {
      // Lasers and fireworks pop on the first thing they touch.
      if ((a.proj === 'laser' || a.proj === 'firework') && b.kind !== 'pad') {
        const s = this.shots.find((x) => x.id === a.id);
        if (s) s.dead = true;
      }
    } else if (a.kind === 'car') {
      if (b.kind === 'hazard' && b.type === 'lava') this.kill(a.player, 'hazard');
      if (b.kind === 'pad') {
        const car = this.cars[a.player];
        const last = this.padCooldown.get(a.player) ?? -999;
        if (this.stepCount - last < 20) return;
        this.padCooldown.set(a.player, this.stepCount);
        const v = car.chassis.getLinearVelocity();
        const vn = v.x * b.nx + v.y * b.ny;
        const boost = Math.max(0, b.power - vn);
        for (const body of car.bodies) {
          const lv = body.getLinearVelocity();
          body.setLinearVelocity(new Vec2(lv.x + b.nx * boost, lv.y + b.ny * boost));
        }
        const p = fb.getBody().getPosition();
        this.emit({ type: 'pad', x: p.x, y: p.y });
      }
    }
  }

  /** Fire the player's special action if it is charged. */
  useAbility(p: number) {
    const car = this.cars[p];
    if (!car.alive || car.abilityCd > 0 || this.phase !== 'play') return;
    const kind = car.ability.kind;
    car.abilityCd = ABILITY_INFO[kind].cd;
    const fwd = car.forward();
    switch (kind) {
      case 'jump':
        car.kick(0, -9);
        break;
      case 'nitro':
        car.kick(fwd.x * 10, fwd.y * 10 - 1);
        car.nitroT = 0.45;
        break;
      case 'dash':
        car.kick((Math.sign(fwd.x) || car.facing) * 12, -1.5);
        break;
      case 'slam':
        if (car.inAir) {
          car.slamming = true;
          car.kick(0, 16);
        } else {
          car.kick(0, -3);
          this.shockwave(p, 5.5, 1);
        }
        break;
      case 'shoot':
        this.fire(p);
        break;
      case 'fly':
        car.flyT = 2.2;
        for (const b of car.bodies) b.setGravityScale(-0.06);
        car.kick(0, -4);
        break;
      case 'shield':
        car.shieldT = 1.6;
        break;
    }
    const pos = car.position;
    this.emit({ type: 'ability', player: p, kind, x: pos.x, y: pos.y });
  }

  /** Push everything near player p away (slam, fireworks, bombs). */
  shockwave(p: number, r: number, power: number, at?: { x: number; y: number }, kind: 'slam' | 'firework' | 'bomb' = 'slam') {
    const c = at ?? this.cars[p].position;
    const push = (bodies: Body[], scale: number) => {
      const pos = bodies[0].getWorldCenter();
      const dx = pos.x - c.x, dy = pos.y - c.y;
      const d = Math.hypot(dx, dy);
      if (d > r || d < 1e-3) return;
      const k = (1 - d / r) * power * scale;
      const vx = (dx / d) * (4 + 9 * k), vy = (dy / d) * (4 + 9 * k) - 6 * k;
      for (const b of bodies) {
        const v = b.getLinearVelocity();
        b.setLinearVelocity(new Vec2(v.x + vx, v.y + vy));
      }
    };
    for (const car of this.cars) if (car.player !== p) push(car.bodies, 1);
    for (const b of this.arena.balls) push([b.body], 1.4);
    for (const b of this.arena.blocks) push([b.body], 1.2);
    this.emit({ type: 'blast', x: c.x, y: c.y, r, kind });
  }

  private fire(p: number) {
    const car = this.cars[p];
    const kind = car.ability.projectile ?? 'cannon';
    const pr = PROJECTILES[kind];
    const def = car.def;
    let front = 0;
    for (const poly of def.body) for (const q of poly.pts) front = Math.max(front, q[0]);
    const muzzle = car.chassis.getWorldPoint(new Vec2((front + pr.r + 0.15) * car.facing, Math.min(-0.2, def.head.y * 0.6)));
    const f = car.forward();
    // aim a little above the nose
    const up = 0.12 * car.facing;
    const dir = new Vec2(f.x * Math.cos(up) + f.y * Math.sin(up), -f.x * Math.sin(up) + f.y * Math.cos(up));
    const body = this.world.createBody({ type: 'dynamic', position: muzzle, bullet: true, gravityScale: pr.gravity });
    const id = ++this.shotId;
    body.createFixture({
      shape: new Circle(pr.r),
      density: pr.density,
      friction: 0.4,
      restitution: pr.bounce,
      filterGroupIndex: -(p + 1),
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: { kind: 'shot', owner: p, proj: kind, id } satisfies FixtureTag,
    });
    const cv = car.chassis.getLinearVelocity();
    body.setLinearVelocity(new Vec2(dir.x * pr.speed + cv.x * 0.5, dir.y * pr.speed + cv.y * 0.5));
    this.shots.push({ id, body, owner: p, proj: kind, born: this.time, dead: false });
    car.kick(-dir.x * 1.6, -dir.y * 1.6);
  }

  private stepShots() {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      const pr = PROJECTILES[s.proj];
      const pos = s.body.getPosition();
      if (s.dead || this.time - s.born > pr.life || pos.y > this.map.killY) {
        if (s.proj === 'firework') this.shockwave(s.owner, 2.6, 0.55, { x: pos.x, y: pos.y }, 'firework');
        else if (s.dead) this.emit({ type: 'shotHit', x: pos.x, y: pos.y, proj: s.proj });
        this.world.destroyBody(s.body);
        this.shots.splice(i, 1);
      }
    }
  }

  kill(player: number, cause: 'hit' | 'hazard' | 'fall' | 'ground', by?: number) {
    const car = this.cars[player];
    if (!car.alive) return;
    if (this.phase !== 'play' && this.phase !== 'countdown') return;
    if (cause === 'hit' && car.shieldT > 0) {
      const hp = car.headWorld();
      this.emit({ type: 'shieldBlock', player, x: hp.x, y: hp.y });
      return;
    }
    car.alive = false;
    const hp = car.headWorld();
    car.ejectHead();
    // Driver flies out away from the attacker.
    let vx = (Math.random() - 0.5) * 4, vy = -9;
    if (by !== undefined) {
      const o = this.cars[by].position;
      const dx = hp.x - o.x;
      vx = Math.sign(dx || 1) * 7;
      vy = -10;
    }
    const v = car.chassis.getLinearVelocity();
    if (cause !== 'fall') {
      this.ragdolls.push(new Ragdoll(this.world, player, hp.x, hp.y, car.def.head.r, car.chassis.getAngle(), v.x * 0.5 + vx, v.y * 0.5 + vy, car.facing));
    }
    this.resolver.report({ player, step: this.stepCount });
    this.slowmo = 1.1;
    this.emit({ type: 'death', player, x: hp.x, y: hp.y, cause });
  }

  /** Time left before sudden death (seconds). */
  get timeLeft(): number {
    return Math.max(0, this.cfg.roundTime - this.roundClock);
  }
}
