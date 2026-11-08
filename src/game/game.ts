import { World, Vec2, Contact, Fixture, Body, Circle, Box, testOverlap } from 'planck';
import { CAT, DEFAULT_GRAVITY, MASK, POSITION_ITERS, STEP_DT, VELOCITY_ITERS } from '../physics/constants';
import { FixedStepper } from '../physics/stepper';
import { tagOf, FixtureTag } from '../physics/tags';
import { Car } from '../cars/car';
import type { AbilityKind, CarDef, ItemKind, ProjectileKind } from '../cars/types';
import { ITEMS, PROJECTILES, abilityCd, cargoSlots } from './abilities';
import { Arena } from '../maps/arena';
import type { MapDef, SuddenDeathKind } from '../maps/types';
import { SUDDEN_FALLBACK, suddenKindFor } from '../maps/sudden';
import { MatchState, DeathResolver, RoundResult } from './match';
import { Ragdoll } from './ragdoll';

export type GamePhase = 'countdown' | 'play' | 'roundEnd' | 'matchEnd';

export type GameEvent =
  | { type: 'roundStart'; round: number; map: MapDef }
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'impact'; x: number; y: number; strength: number; carCar: boolean }
  | { type: 'ability'; player: number; kind: AbilityKind; x: number; y: number; from?: { x: number; y: number } }
  | { type: 'blast'; x: number; y: number; r: number; kind: 'slam' | 'firework' | 'bomb' | 'roar' | 'zap' }
  | { type: 'effect'; player: number; effect: 'freeze' | 'stun' | 'lift' | 'pull' | 'push' | 'web'; x: number; y: number }
  | { type: 'shieldBlock'; player: number; x: number; y: number }
  | { type: 'shotHit'; x: number; y: number; proj: ProjectileKind }
  | { type: 'death'; player: number; x: number; y: number; cause: 'hit' | 'hazard' | 'fall' | 'ground' }
  | { type: 'pad'; x: number; y: number }
  | { type: 'suddenDeath'; kind: SuddenDeathKind; late?: boolean }
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
  /** Effect already applied to a car. */
  used?: boolean;
}

export interface Item {
  id: number;
  body: Body;
  kind: ItemKind;
  owner: number;
  born: number;
  /** Seconds to live (Infinity for cargo). */
  ttl: number;
  /** Mines, bombs and toxic barrels go off. */
  explosive: boolean;
  /** Bombs: seconds until they blow. */
  fuse?: number;
  dead?: boolean;
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
  items: Item[] = [];
  private itemId = 0;
  /** Extra ghost time spent waiting to get clear of the other car. */
  private phaseExtra = [0, 0];
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
    this.items = [];
    this.phaseExtra = [0, 0];
    for (const c of this.cars) this.loadCargo(c);
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
        const kind = suddenKindFor(this.map);
        this.arena.startSuddenDeath(kind);
        this.emit({ type: 'suddenDeath', kind });
      } else if (this.suddenDeath && !this.arena.riseBody && this.roundClock >= this.cfg.roundTime + SUDDEN_FALLBACK) {
        // Nobody fell for the variant: lava makes sure the round ends.
        this.arena.startRise('lava');
        this.emit({ type: 'suddenDeath', kind: 'lava', late: true });
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
    this.stepItems(dt);
    this.stepPhase(dt);
    for (const d of this.arena.detonations) this.shockwave(-1, 3.8, 1.3, d, 'bomb');
    this.arena.detonations = [];
    if (this.arena.wind) for (const c of this.cars) for (const b of c.bodies) b.applyForceToCenter(new Vec2(this.arena.wind * b.getMass(), 0), true);
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
      else if (b.kind === 'shot' && b.owner !== a.player) {
        const pr = PROJECTILES[b.proj];
        if (!pr.harmless) this.kill(a.player, 'hit', b.owner);
        else this.shotEffect(b.id, a.player);
      } else if (b.kind === 'item' && b.owner !== a.player) {
        const it = this.items.find((x) => x.id === b.id);
        if (it?.explosive && it.kind === 'mine') this.explode(it);
        else if (it && it.body.getLinearVelocity().length() > 4.5) this.kill(a.player, 'hit', b.owner);
      }
      else if (b.kind === 'hazard') this.kill(a.player, 'hazard');
      // Head touching the ground (usually after a flip) loses the round.
      else if (b.kind === 'terrain' || b.kind === 'platform') this.kill(a.player, 'ground');
      else if (b.kind === 'block' && b.body.getLinearVelocity().length() > 4) this.kill(a.player, 'hazard');
    } else if (a.kind === 'shot') {
      if (b.kind === 'pad' || (b.kind === 'shot' && b.owner === a.owner)) return;
      if (b.kind === 'car' && b.player !== a.owner) this.shotEffect(a.id, b.player);
      // Lasers, fireworks, snowballs… pop on the first thing they touch.
      if (PROJECTILES[a.proj].pop) {
        const s = this.shots.find((x) => x.id === a.id);
        if (s) s.dead = true;
      }
    } else if (a.kind === 'item') {
      if (b.kind === 'car' && b.player !== a.owner) {
        const it = this.items.find((x) => x.id === a.id);
        if (it?.explosive && (it.kind === 'mine' || it.kind === 'barrel')) this.explode(it);
        else if (it?.kind === 'peel' && !it.dead) {
          // Slip: spin out and lose the engine for a moment.
          it.dead = true;
          const c = this.cars[b.player];
          this.stun(b.player, 0.8, 'web');
          c.chassis.setAngularVelocity(c.chassis.getAngularVelocity() + (this.rand() > 0.5 ? 5 : -5));
          c.kick(0, -4);
        }
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
    const ab = car.ability;
    if (!ab || !car.alive || car.abilityCd > 0 || car.stunT > 0 || this.phase !== 'play') return;
    const kind = ab.kind;
    car.abilityCd = abilityCd(ab);
    const fwd = car.forward();
    const from = { x: car.position.x, y: car.position.y };
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
      case 'roar':
        if (ab.stun) {
          const o = this.cars[1 - p];
          if (o.alive && Vec2.distance(o.position, car.position) < 4.5) this.stun(1 - p, 1.1, 'zap');
          this.emit({ type: 'blast', x: from.x, y: from.y, r: 4.5, kind: 'zap' });
        } else this.shockwave(p, 6, 0.9, undefined, 'roar');
        break;
      case 'shoot':
        this.fire(p);
        break;
      case 'fly':
        car.flyT = 2.2;
        car.applyGravity();
        car.kick(0, -4);
        break;
      case 'shield':
        car.shieldT = 1.6;
        break;
      case 'phase':
        car.phaseT = 1.6;
        this.phaseExtra[p] = 0;
        car.setPhased(true);
        break;
      case 'blink':
        if (!this.blink(car)) car.abilityCd = 0.4;
        break;
      case 'drop': {
        const item = ab.item ?? 'mine';
        const tail = this.carEnd(car, -1);
        const at = car.chassis.getWorldPoint(new Vec2((tail - ITEMS[item].w * 0.6 - 0.1) * car.facing, -0.1));
        const v = car.chassis.getLinearVelocity();
        this.spawnItem(item, p, at, new Vec2(v.x * 0.3 - fwd.x * 2, v.y * 0.3 - 1), item === 'mine' || item === 'peel' ? 20 : 12, item === 'mine' || item === 'bomb' || item === 'barrel');
        break;
      }
      case 'dump': {
        const item = ab.item ?? car.def.cargo?.kind ?? 'crate';
        const tail = this.carEnd(car, -1);
        const deckY = car.def.cargo?.at[2] ?? -0.4;
        const v = car.chassis.getLinearVelocity();
        for (let i = 0; i < 4; i++) {
          const at = car.chassis.getWorldPoint(new Vec2((tail + 0.2 + i * 0.25) * car.facing, deckY - 0.4 - (i % 2) * 0.35));
          const sp = 5 + this.rand() * 3;
          this.spawnItem(item, p, at, new Vec2(v.x * 0.5 - fwd.x * sp, v.y * 0.5 - 3 - this.rand() * 2), 12, false);
        }
        break;
      }
    }
    const pos = car.position;
    this.emit({ type: 'ability', player: p, kind, x: pos.x, y: pos.y, from: kind === 'blink' ? from : undefined });
  }

  /** Car-local x of the front (+1) or back (-1) end of the hull. */
  private carEnd(car: Car, side: 1 | -1) {
    let v = 0;
    for (const poly of car.def.body) for (const q of poly.pts) v = side > 0 ? Math.max(v, q[0]) : Math.min(v, q[0]);
    return v;
  }

  /** Push everything near player p away (slam, fireworks, bombs). */
  shockwave(p: number, r: number, power: number, at?: { x: number; y: number }, kind: 'slam' | 'firework' | 'bomb' | 'roar' = 'slam') {
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
    for (const car of this.cars) if (car.player !== p && car.phaseT <= 0) push(car.allBodies, 1);
    for (const b of this.arena.balls) push([b.body], 1.4);
    for (const b of this.arena.blocks) push([b.body], 1.2);
    for (const it of this.items) if (!it.dead) push([it.body], 1.2);
    this.emit({ type: 'blast', x: c.x, y: c.y, r, kind });
  }

  private stun(p: number, t: number, look: 'ice' | 'zap' | 'web') {
    const car = this.cars[p];
    if (!car.alive || car.phaseT > 0) return;
    car.stunT = Math.max(car.stunT, t);
    car.stunLook = look;
    const pos = car.position;
    this.emit({ type: 'effect', player: p, effect: look === 'zap' ? 'stun' : look === 'web' ? 'web' : 'freeze', x: pos.x, y: pos.y });
  }

  /** A projectile touched player p's car: apply its special effect once. */
  private shotEffect(id: number, p: number) {
    const s = this.shots.find((x) => x.id === id);
    if (!s || s.used) return;
    s.used = true;
    const car = this.cars[p];
    if (!car.alive) return;
    const pr = PROJECTILES[s.proj];
    const v = s.body.getLinearVelocity();
    const vl = Math.max(1e-3, v.length());
    const pos = car.position;
    switch (pr.effect) {
      case 'freeze':
        this.stun(p, s.proj === 'web' ? 1.4 : s.proj === 'icecream' ? 1.1 : 1.5, s.proj === 'web' ? 'web' : 'ice');
        break;
      case 'stun':
        this.stun(p, 1.0, 'zap');
        break;
      case 'lift':
        car.liftT = 1.3;
        car.applyGravity();
        car.kick(0, -3);
        this.emit({ type: 'effect', player: p, effect: 'lift', x: pos.x, y: pos.y });
        break;
      case 'push':
        car.kick((v.x / vl) * 1.6, (v.y / vl) * 1.6 - 0.4);
        if (!this.shots.some((o) => o.owner === s.owner && o.proj === s.proj && o.used && o !== s && this.time - o.born < 0.1)) this.emit({ type: 'effect', player: p, effect: 'push', x: pos.x, y: pos.y });
        break;
      case 'pull': {
        const o = this.cars[s.owner].position;
        const dx = o.x - pos.x, dy = o.y - pos.y;
        const d = Math.max(1, Math.hypot(dx, dy));
        car.kick((dx / d) * 11, (dy / d) * 11 - 3);
        this.emit({ type: 'effect', player: p, effect: 'pull', x: pos.x, y: pos.y });
        break;
      }
      case 'boom':
        s.dead = true;
        break;
    }
  }

  private fire(p: number) {
    const car = this.cars[p];
    const kind = car.ability?.projectile ?? 'cannon';
    const pr = PROJECTILES[kind];
    const def = car.def;
    const front = this.carEnd(car, 1);
    const muzzle = car.chassis.getWorldPoint(new Vec2((front + pr.r + 0.15) * car.facing, Math.min(-0.2, def.head.y * 0.6)));
    const f = car.forward();
    const n = pr.count ?? 1;
    const cv = car.chassis.getLinearVelocity();
    let dir = f;
    for (let i = 0; i < n; i++) {
      // aim a little above the nose; pellets fan out
      const off = n > 1 ? ((i / (n - 1)) - 0.5) * (pr.spread ?? 0) : 0;
      const up = (0.12 + off) * car.facing;
      dir = new Vec2(f.x * Math.cos(up) + f.y * Math.sin(up), -f.x * Math.sin(up) + f.y * Math.cos(up));
      const body = this.world.createBody({ type: 'dynamic', position: muzzle, bullet: true, gravityScale: pr.gravity, angle: car.chassis.getAngle() });
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
      const sp = pr.speed * (n > 1 ? 0.92 + 0.16 * this.rand() : 1);
      body.setLinearVelocity(new Vec2(dir.x * sp + cv.x * 0.5, dir.y * sp + cv.y * 0.5));
      this.shots.push({ id, body, owner: p, proj: kind, born: this.time, dead: false });
    }
    const recoil = pr.harmless ? 0.6 : 1.6;
    car.kick(-dir.x * recoil, -dir.y * recoil);
  }

  private stepShots() {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      const pr = PROJECTILES[s.proj];
      const pos = s.body.getPosition();
      if (s.dead || this.time - s.born > pr.life || pos.y > this.map.killY) {
        if (pr.effect === 'boom') this.shockwave(s.owner, s.proj === 'firework' ? 2.6 : 3.2, s.proj === 'firework' ? 0.55 : 0.8, { x: pos.x, y: pos.y }, s.proj === 'firework' ? 'firework' : 'bomb');
        else if (s.dead) this.emit({ type: 'shotHit', x: pos.x, y: pos.y, proj: s.proj });
        this.world.destroyBody(s.body);
        this.shots.splice(i, 1);
      }
    }
  }

  /** Put a car's cargo into its bed. */
  private loadCargo(car: Car) {
    const cg = car.def.cargo;
    if (!cg) return;
    for (const [lx, ly] of cargoSlots(cg)) {
      const at = car.chassis.getWorldPoint(new Vec2(lx * car.facing, ly));
      this.spawnItem(cg.kind, car.player, at, new Vec2(0, 0), Infinity, false);
    }
  }

  spawnItem(kind: ItemKind, owner: number, at: Vec2, vel: Vec2, ttl: number, explosive: boolean): Item {
    const info = ITEMS[kind];
    const body = this.world.createBody({ type: 'dynamic', position: at, angularDamping: 0.3 });
    const id = ++this.itemId;
    body.createFixture({
      shape: info.shape === 'circle' ? new Circle(info.w / 2) : new Box(info.w / 2, info.h / 2),
      density: info.density,
      friction: kind === 'mine' ? 1.2 : 0.6,
      restitution: info.bounce,
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: { kind: 'item', owner, item: kind, id } satisfies FixtureTag,
    });
    body.setLinearVelocity(vel);
    const item: Item = { id, body, kind, owner, born: this.time, ttl, explosive, fuse: kind === 'bomb' ? 1.5 : undefined };
    this.items.push(item);
    // Keep the arena from filling up: drop the oldest throwaway items.
    const loose = this.items.filter((x) => x.ttl !== Infinity && !x.dead);
    if (loose.length > 28) loose[0].dead = true;
    return item;
  }

  private explode(it: Item) {
    if (it.dead) return;
    it.dead = true;
    const pos = it.body.getPosition();
    this.shockwave(it.owner, it.kind === 'mine' ? 3.4 : 3.8, 1.25, { x: pos.x, y: pos.y }, 'bomb');
  }

  private stepItems(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (it.fuse !== undefined && !it.dead) {
        it.fuse -= dt;
        if (it.fuse <= 0) this.explode(it);
      }
      const pos = it.body.getPosition();
      if (it.dead || this.time - it.born > it.ttl || pos.y > this.map.killY) {
        this.world.destroyBody(it.body);
        this.items.splice(i, 1);
      }
    }
  }

  /** Ghost mode countdown; stays a ghost until it is clear of the other car. */
  private stepPhase(dt: number) {
    for (const car of this.cars) {
      if (car.phaseT <= 0) continue;
      car.phaseT -= dt;
      if (car.phaseT > 0) continue;
      const other = this.cars[1 - car.player];
      if (this.phaseExtra[car.player] < 1.5 && this.carsOverlap(car, other)) {
        car.phaseT = 0.05;
        this.phaseExtra[car.player] += 0.05;
        continue;
      }
      car.phaseT = 0;
      car.setPhased(false);
    }
  }

  private carsOverlap(a: Car, b: Car) {
    for (const ba of a.allBodies) for (let fa = ba.getFixtureList(); fa; fa = fa.getNext()) {
      for (const bb of b.allBodies) for (let fb = bb.getFixtureList(); fb; fb = fb.getNext()) {
        const ra = fa.isSensor() ? 0.25 : 0, rb = fb.isSensor() ? 0.25 : 0;
        const aa = fa.getAABB(0), ab = fb.getAABB(0);
        if (aa.lowerBound.x - ra > ab.upperBound.x + rb || ab.lowerBound.x - rb > aa.upperBound.x + ra) continue;
        if (aa.lowerBound.y - ra > ab.upperBound.y + rb || ab.lowerBound.y - rb > aa.upperBound.y + ra) continue;
        if (fa.isSensor() || fb.isSensor() || testOverlap(fa.getShape(), 0, fb.getShape(), 0, ba.getTransform(), bb.getTransform())) return true;
      }
    }
    return false;
  }

  /** Teleport forward if there is room. */
  private blink(car: Car): boolean {
    const f = car.forward();
    const dirX = Math.sign(f.x) || car.facing;
    for (const dist of [4.2, 3.2, 2.2]) {
      const dx = dirX * dist, dy = -0.5;
      if (!this.carFits(car, dx, dy)) continue;
      for (const b of car.allBodies) {
        const p = b.getPosition();
        b.setPosition(new Vec2(p.x + dx, p.y + dy));
      }
      return true;
    }
    return false;
  }

  private carFits(car: Car, dx: number, dy: number) {
    const b0 = this.map.bounds;
    for (const b of car.allBodies) {
      const xf = b.getTransform();
      const moved = { p: new Vec2(xf.p.x + dx, xf.p.y + dy), q: xf.q };
      if (moved.p.x < b0.x0 + 0.5 || moved.p.x > b0.x1 - 0.5) return false;
      for (let fx = b.getFixtureList(); fx; fx = fx.getNext()) {
        const shape = fx.getShape();
        let hit = false;
        const aabb = fx.getAABB(0);
        const q = { lowerBound: new Vec2(aabb.lowerBound.x + dx, aabb.lowerBound.y + dy), upperBound: new Vec2(aabb.upperBound.x + dx, aabb.upperBound.y + dy) };
        this.world.queryAABB(q, (other) => {
          const t = tagOf(other);
          if (!t || (t.kind !== 'terrain' && t.kind !== 'platform' && t.kind !== 'hazard' && t.kind !== 'car' && t.kind !== 'head')) return true;
          if (t.kind === 'car' || t.kind === 'head') { if (t.player === car.player) return true; }
          const ob = other.getBody();
          for (let ci = 0; ci < other.getShape().getChildCount(); ci++) {
            if (testOverlap(shape, 0, other.getShape(), ci, moved, ob.getTransform())) { hit = true; return false; }
          }
          return true;
        });
        if (hit) return false;
      }
    }
    return true;
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
