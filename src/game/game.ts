import { World, Vec2, Contact, Fixture, Body, Circle, Box, RopeJoint, Joint, testOverlap } from 'planck';
import { CAT, DEFAULT_GRAVITY, MASK, POSITION_ITERS, STEP_DT, VELOCITY_ITERS } from '../physics/constants';
import { FixedStepper } from '../physics/stepper';
import { tagOf, FixtureTag } from '../physics/tags';
import { Car } from '../cars/car';
import type { AbilityDef, AbilityKind, CarDef, ItemKind, ProjectileKind } from '../cars/types';
import { DROP_FX, ITEMS, ItemFx, PROJECTILES, abilityCd, cargoSlots } from './abilities';
import { Arena } from '../maps/arena';
import type { MapDef, SuddenDeathKind } from '../maps/types';
import { SUDDEN_FALLBACK, suddenKindFor } from '../maps/sudden';
import { MatchState, DeathResolver, RoundResult } from './match';
import { Ragdoll } from './ragdoll';

export type GamePhase = 'countdown' | 'play' | 'roundEnd' | 'matchEnd';

export type EffectKind =
  | 'freeze' | 'stun' | 'lift' | 'pull' | 'push' | 'web' | 'confuse' | 'stasis' | 'slow' | 'flat' | 'spring' | 'burn' | 'tether' | 'slip' | 'medkit' | 'reflect';

export type GameEvent =
  | { type: 'roundStart'; round: number; map: MapDef }
  | { type: 'countdown'; n: number }
  | { type: 'go' }
  | { type: 'impact'; x: number; y: number; strength: number; carCar: boolean }
  | { type: 'ability'; player: number; kind: AbilityKind; x: number; y: number; from?: { x: number; y: number } }
  | { type: 'blast'; x: number; y: number; r: number; kind: 'slam' | 'firework' | 'bomb' | 'roar' | 'zap' | 'punch' }
  | { type: 'effect'; player: number; effect: EffectKind; x: number; y: number }
  | { type: 'bolt'; x: number; y: number }
  | { type: 'portal'; player: number; x: number; y: number; from: { x: number; y: number } }
  | { type: 'goal'; side: 0 | 1; x: number; y: number }
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
  /** Wobble phase. */
  phase?: number;
}

export interface Item {
  id: number;
  body: Body;
  kind: ItemKind;
  owner: number;
  born: number;
  /** Seconds to live (Infinity for cargo). */
  ttl: number;
  /** What it does to the other player's car (dropped on purpose); none for cargo and props. */
  fx?: ItemFx;
  /** Bombs: seconds until they blow. */
  fuse?: number;
  dead?: boolean;
  /** Cargo still inside its car's bed: drawn behind the car body until it spills out. */
  stowed?: Car;
}

/** A lightning strike on its way down. */
export interface Strike { x: number; y: number; t: number; owner: number; id: number }

/** A rope between two cars (tow hook). */
export interface Tether { joint: Joint; a: number; b: number; t: number }

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
/** How far aim assist may turn a shot away from the barrel (rad). */
const AIM_ASSIST = 0.26;
/** For shots the head counts as this many times its radius. */
const HEAD_SHOT_PAD = 1.5;
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
  strikes: Strike[] = [];
  tethers: Tether[] = [];
  private strikeId = 0;
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

  /** Lava or water, at random, for a rising sudden death. */
  private riseLiquid(): 'lava' | 'flood' {
    // One swimmer keeps its edge in a flood; water can't end a round between two of them, so then it's lava.
    if (this.cars.every((c) => c.hasTrait('swim'))) return 'lava';
    return this.rand() < 0.5 ? 'lava' : 'flood';
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
    this.world.on('pre-solve', (c: Contact) => this.onPreSolve(c));
    this.arena = new Arena(this.world, this.map, Math.floor(this.rand() * 1e9));
    this.cars = [0, 1].map((p) => {
      const [x, y] = this.spawnPoint(p, this.roundCars[p]);
      return new Car(this.world, this.roundCars[p], p, x, y, p === 0 ? 1 : -1);
    });
    this.ragdolls = [];
    this.shots = [];
    this.items = [];
    this.strikes = [];
    this.tethers = [];
    this.phaseExtra = [0, 0];
    for (const c of this.cars) this.loadCargo(c);
    for (const pr of this.arena.props) this.spawnItem(pr.kind, -1, new Vec2(pr.x, pr.y), new Vec2(0, 0), Infinity);
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
        let kind = suddenKindFor(this.map);
        // A rising flood is a coin toss each time: lava or sea water.
        if (kind === 'lava' || kind === 'flood') kind = this.riseLiquid();
        this.arena.startSuddenDeath(kind);
        this.emit({ type: 'suddenDeath', kind });
      } else if (this.suddenDeath && !this.arena.riseBody && this.roundClock >= this.cfg.roundTime + SUDDEN_FALLBACK) {
        // Nobody fell for the variant: rising lava or water makes sure the round ends.
        const kind = this.riseLiquid();
        this.arena.startRise(kind);
        this.emit({ type: 'suddenDeath', kind, late: true });
      }
    }

    this.time += dt;
    for (let p = 0; p < 2; p++) {
      const ctrl = this.controllers[p];
      const dir = ctrl ? ctrl.decide(this, p, dt) : this.inputs[p];
      this.cars[p].input = this.phase === 'countdown' ? 0 : this.cars[p].confuseT > 0 ? -dir as -1 | 0 | 1 : dir;
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
    this.stepCarFx(dt);
    this.stepArenaFx(dt);
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
        if (car.reflectT > 0) this.reflectShot(b.id, a.player);
        else if (!pr.harmless) this.kill(a.player, 'hit', b.owner);
        else this.shotEffect(b.id, a.player);
      } else if (b.kind === 'item' && b.owner !== a.player) {
        const it = this.items.find((x) => x.id === b.id);
        if (it?.fx === 'explode') this.explode(it);
        else if (it && it.body.getLinearVelocity().length() > 4.5) this.kill(a.player, 'hit', b.owner >= 0 ? b.owner : undefined);
      }
      else if (b.kind === 'hazard') {
        if (!(b.type === 'water' && car.hasTrait('swim'))) this.kill(a.player, 'hazard');
      }
      // Head touching the ground (usually after a flip) loses the round.
      else if (b.kind === 'terrain' || b.kind === 'platform') this.kill(a.player, 'ground');
      else if (b.kind === 'block' && b.body.getLinearVelocity().length() > 4) this.kill(a.player, 'hazard');
    } else if (a.kind === 'shot') {
      if (b.kind === 'pad' || (b.kind === 'shot' && b.owner === a.owner)) return;
      if (b.kind === 'hazard' && b.type === 'water' && a.proj !== 'torpedo') return;
      if (b.kind === 'car' && b.player !== a.owner) {
        if (this.cars[b.player].reflectT > 0) { this.reflectShot(a.id, b.player); return; }
        this.shotEffect(a.id, b.player);
      }
      // Lasers, fireworks, snowballs… pop on the first thing they touch.
      if (PROJECTILES[a.proj].pop) {
        const s = this.shots.find((x) => x.id === a.id);
        if (s) s.dead = true;
      }
    } else if (a.kind === 'item') {
      if (b.kind === 'car' && b.player !== a.owner) {
        const it = this.items.find((x) => x.id === a.id);
        if (it && !it.dead && it.fx) this.itemHit(it, b.player);
      }
    } else if (a.kind === 'car') {
      if (b.kind === 'hazard' && b.type === 'lava') this.kill(a.player, 'hazard');
      if (b.kind === 'car' && b.player !== a.player) this.carTouch(a.player, b.player);
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

  /** Friction tweaks while touching: oil slicks, tar, the loop. */
  private onPreSolve(c: Contact) {
    const fa = c.getFixtureA(), fb = c.getFixtureB();
    const ta = tagOf(fa), tb = tagOf(fb);
    if (!ta || !tb) return;
    for (const [x, y, fy] of [[ta, tb, fb], [tb, ta, fa]] as const) {
      if (x.kind === 'item' && y.kind === 'car') {
        const it = this.items.find((i) => i.id === x.id);
        if (it?.fx === 'oil' && y.player !== it.owner) c.setFriction(0.01);
        else if (it?.fx === 'tar' && y.player !== it.owner) this.cars[y.player].slowT = Math.max(this.cars[y.player].slowT, 0.3);
      }
      if (x.kind === 'loop' && (y.kind === 'car' || y.kind === 'head')) {
        if (!this.arena.loopRiding(y.player)) c.setEnabled(false);
      }
      if (x.kind === 'loop' && y.kind !== 'car' && y.kind !== 'head') c.setEnabled(false);
      // Ledges (gate roof, goal crossbar) only hold cars from above.
      if (x.kind === 'ledge' && (y.kind === 'car' || y.kind === 'head')) {
        const ledge = (x === ta ? fa : fb).getBody();
        const other = fy.getBody();
        if (other.getWorldCenter().y > ledge.getPosition().y - 0.15 || other.getLinearVelocity().y < -2) c.setEnabled(false);
      }
    }
  }

  /** Two cars touched: strikes in flight and passive quills / shock. */
  private carTouch(p: number, q: number) {
    const me = this.cars[p], other = this.cars[q];
    if (!me.alive || !other.alive) return;
    const dx = other.position.x - me.position.x;
    const dirX = Math.sign(dx) || me.facing;
    if (me.strikeT > 0 && me.strikeFx) {
      const fx = me.strikeFx;
      me.strikeT = 0;
      me.strikeFx = null;
      const pos = other.position;
      switch (fx) {
        case 'sting': this.stun(q, 1.3, 'zap'); break;
        case 'gore': other.kick(dirX * 3, -12); break;
        case 'flip':
          other.kick(dirX * 2, -7);
          other.chassis.setAngularVelocity(other.chassis.getAngularVelocity() + dirX * 9);
          break;
        case 'bump':
          other.kick(dirX * 12, -3.5);
          me.kick(-dirX * 5, -1);
          break;
        case 'bite':
          this.stun(q, 0.5, 'web');
          other.kick(-dirX * 8, -11);
          break;
      }
      this.emit({ type: 'blast', x: (me.position.x + pos.x) / 2, y: (me.position.y + pos.y) / 2, r: 1.4, kind: 'punch' });
    }
    if (me.touchCd <= 0 && me.hasTrait('quills')) {
      me.touchCd = 0.6;
      other.kick(dirX * 7, -3);
      this.emit({ type: 'effect', player: q, effect: 'push', x: other.position.x, y: other.position.y });
    }
    if (me.touchCd <= 0 && me.hasTrait('shock')) {
      me.touchCd = 2;
      this.stun(q, 0.8, 'zap');
    }
  }

  /** The other player's car touched a trap item. */
  private itemHit(it: Item, p: number) {
    const c = this.cars[p];
    const pos = c.position;
    switch (it.fx) {
      case 'explode': this.explode(it); break;
      case 'slip':
        // Slip: spin out and lose the engine for a moment.
        it.dead = true;
        this.stun(p, 0.8, 'web');
        c.chassis.setAngularVelocity(c.chassis.getAngularVelocity() + (this.rand() > 0.5 ? 5 : -5));
        c.kick(0, -4);
        break;
      case 'freeze':
        it.dead = true;
        this.stun(p, 0.7, 'ice');
        break;
      case 'spring':
        it.dead = true;
        c.kick(0, -13);
        this.emit({ type: 'effect', player: p, effect: 'spring', x: pos.x, y: pos.y });
        break;
      case 'flat':
        it.dead = true;
        c.flatT = 3;
        this.stun(p, 0.35, 'web');
        this.emit({ type: 'effect', player: p, effect: 'flat', x: pos.x, y: pos.y });
        break;
      case 'burn':
        it.dead = true;
        c.kick(0, -5);
        this.stun(p, 0.4, 'zap');
        this.emit({ type: 'effect', player: p, effect: 'burn', x: pos.x, y: pos.y });
        break;
    }
  }

  /** A shot bounced off a mirror: it now belongs to the defender and flies back. */
  private reflectShot(id: number, p: number) {
    const s = this.shots.find((x) => x.id === id);
    if (!s || s.owner === p) return;
    s.owner = p;
    s.born = this.time;
    const v = s.body.getLinearVelocity();
    s.body.setLinearVelocity(new Vec2(-v.x * 1.1, -Math.abs(v.y) * 0.5 - 1));
    for (let fx = s.body.getFixtureList(); fx; fx = fx.getNext()) {
      fx.setFilterData({ groupIndex: -(p + 1), categoryBits: CAT.DEBRIS, maskBits: MASK.DEBRIS });
      (fx.getUserData() as { owner: number }).owner = p;
    }
    const pos = s.body.getPosition();
    this.emit({ type: 'effect', player: p, effect: 'reflect', x: pos.x, y: pos.y });
  }

  /** Fire the player's special action if it is charged. */
  useAbility(p: number) {
    const car = this.cars[p];
    const ab = car.ability;
    if (!ab || !car.alive || car.abilityCd > 0 || car.stunT > 0 || car.stasisT > 0 || this.phase !== 'play') return;
    car.abilityCd = abilityCd(ab);
    this.perform(p, ab);
  }

  /** The action itself (also used by the gift box's random surprise). */
  private perform(p: number, ab: AbilityDef) {
    const car = this.cars[p];
    const foe = this.cars[1 - p];
    const kind = ab.kind;
    const fwd = car.forward();
    const dirX = Math.sign(fwd.x) || car.facing;
    const from = { x: car.position.x, y: car.position.y };
    const strike = (fx: NonNullable<typeof car.strikeFx>, power = 11) => {
      car.kick(dirX * power, -1.5);
      car.strikeT = 0.7;
      car.strikeFx = fx;
    };
    switch (kind) {
      case 'jump': car.kick(0, -9); break;
      case 'stomp':
        car.kick(0, -8.5);
        car.stompDelay = 0.25;
        break;
      case 'bounce':
        car.bounceT = 3;
        car.setBounce(0.88);
        car.kick(0, -5);
        break;
      case 'rear':
        car.kick(fwd.x * 2, -4.5);
        car.chassis.setAngularVelocity(-car.facing * 6.5);
        break;
      case 'surprise': {
        const opts: AbilityDef[] = [{ kind: 'jump' }, { kind: 'shield' }, { kind: 'blink' }, { kind: 'roar' }, { kind: 'shoot', projectile: 'firework' }];
        const pick = opts[Math.floor(this.rand() * opts.length)];
        this.perform(p, pick);
        return;
      }
      case 'ollie': car.kick(0, -6.5); break;
      case 'pounce': {
        if (foe.alive) {
          const dx = foe.position.x - car.position.x, dy = foe.position.y - car.position.y;
          car.kick(Math.max(-12, Math.min(12, dx * 1.7)), -7 + Math.max(-4, Math.min(1, dy * 0.8)));
        } else car.kick(dirX * 8, -7);
        break;
      }
      case 'hydraulics':
        car.hops = 3;
        car.hopT = 0;
        car.hopKind = 'hydraulics';
        break;
      case 'backflip':
        car.kick(fwd.x * 1.5, -9.5);
        car.chassis.setAngularVelocity(-car.facing * 8.5);
        break;
      case 'moonjump':
        car.kick(0, -7);
        car.lowGravT = 2.5;
        car.applyGravity();
        break;
      case 'nitro':
        car.kick(fwd.x * 10, fwd.y * 10 - 1);
        car.nitroT = 0.45;
        break;
      case 'drs':
        car.turboT = 2.6;
        car.kick(dirX * 2, 0);
        break;
      case 'dash': car.kick(dirX * 12, -1.5); break;
      case 'sting': case 'gore': case 'flip': case 'bump': case 'bite':
        strike(kind);
        break;
      case 'frenzy':
        car.hops = 3;
        car.hopT = 0;
        car.hopKind = 'frenzy';
        break;
      case 'slide':
        car.slideT = 2;
        car.setTireFriction(0.02);
        car.kick(dirX * 8, -0.5);
        break;
      case 'punch':
        if (this.reach(car, foe, 1, 3.2)) {
          foe.kick(dirX * 15, -4);
          this.emitHit(car, foe);
        }
        car.kick(dirX * 2, 0);
        break;
      case 'kick': {
        if (this.reach(car, foe, 1, 3.2)) {
          foe.kick(dirX * 6, -12);
          this.emitHit(car, foe);
        }
        const tip = car.chassis.getWorldPoint(new Vec2(this.carEnd(car, 1) * car.facing, 0));
        const bump = (b: Body) => {
          const q = b.getWorldCenter();
          if ((q.x - tip.x) * dirX > -0.6 && Math.abs(q.x - tip.x) < 3.5 && Math.abs(q.y - tip.y) < 2.5) {
            const v = b.getLinearVelocity();
            b.setLinearVelocity(new Vec2(v.x + dirX * 12, v.y - 9));
          }
        };
        for (const bl of this.arena.balls) bump(bl.body);
        for (const it of this.items) if (!it.dead && it.body.getType() === 'dynamic') bump(it.body);
        break;
      }
      case 'scoop':
        if (this.reach(car, foe, 1, 3.2)) {
          foe.kick(-dirX * 7.5, -13);
          this.emitHit(car, foe);
        }
        break;
      case 'tailwhip':
        if (this.reach(car, foe, -1, 3.6)) {
          foe.kick(-dirX * 13, -5);
          this.emitHit(car, foe);
        }
        car.chassis.setAngularVelocity(car.chassis.getAngularVelocity() + car.facing * 2);
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
      case 'puff':
        car.puffT = 0.9;
        car.shieldT = Math.max(car.shieldT, 0.9);
        this.shockwave(p, 4.2, 1.1, undefined, 'roar');
        break;
      case 'roar': this.shockwave(p, 6, 0.9, undefined, 'roar'); break;
      case 'discharge':
        if (foe.alive && Vec2.distance(foe.position, car.position) < 4.5) this.stun(1 - p, 1.1, 'zap');
        this.emit({ type: 'blast', x: from.x, y: from.y, r: 4.5, kind: 'zap' });
        break;
      case 'howl':
        if (foe.alive && foe.phaseT <= 0 && Vec2.distance(foe.position, car.position) < 7) {
          foe.confuseT = 2.2;
          this.emit({ type: 'effect', player: 1 - p, effect: 'confuse', x: foe.position.x, y: foe.position.y });
        }
        this.emit({ type: 'blast', x: from.x, y: from.y, r: 7, kind: 'roar' });
        break;
      case 'stasis':
        if (foe.alive && foe.phaseT <= 0 && Vec2.distance(foe.position, car.position) < 6) {
          foe.stasisT = 1.2;
          foe.applyGravity();
          this.emit({ type: 'effect', player: 1 - p, effect: 'stasis', x: foe.position.x, y: foe.position.y });
        }
        break;
      case 'beam': {
        const dx = foe.position.x - car.position.x, dy = foe.position.y - car.position.y;
        if (foe.alive && foe.phaseT <= 0 && Math.abs(dx) < 3.6 && dy > -2 && dy < 9) {
          foe.liftT = 1.6;
          foe.applyGravity();
          foe.kick(-dx * 0.4, -4);
          this.emit({ type: 'effect', player: 1 - p, effect: 'lift', x: foe.position.x, y: foe.position.y });
        }
        break;
      }
      case 'storm': {
        const t = foe.alive ? foe.position : car.position;
        this.strikes.push({ x: t.x, y: t.y, t: 0.8, owner: p, id: ++this.strikeId });
        break;
      }
      case 'fly':
        car.flyT = 2.2;
        car.applyGravity();
        car.kick(0, -4);
        break;
      case 'glide': {
        car.glideT = 3;
        car.applyGravity();
        const v = car.chassis.getLinearVelocity();
        if (v.y > 0) car.kick(dirX * 2, -v.y * 0.7);
        else car.kick(dirX * 2, -2);
        break;
      }
      case 'shield': car.shieldT = 1.6; break;
      case 'shell':
        car.shellT = 2.2;
        car.shieldT = Math.max(car.shieldT, 2.2);
        car.setHeavy(true);
        car.applyGravity();
        break;
      case 'reflect': car.reflectT = 2; break;
      case 'heavy':
        car.heavyT = 3;
        car.setHeavy(true);
        car.applyGravity();
        break;
      case 'phase':
        car.phaseT = 1.6;
        this.phaseExtra[p] = 0;
        car.setPhased(true);
        break;
      case 'invis': car.invisT = 3.5; break;
      case 'blink':
        if (!this.blink(car)) car.abilityCd = 0.4;
        break;
      case 'swap':
        if (!foe.alive || !this.swapCars(car, foe)) car.abilityCd = 0.4;
        break;
      case 'recall':
        if (!this.recall(car)) car.abilityCd = 0.4;
        break;
      case 'icewall': {
        const front = this.carEnd(car, 1);
        const at = car.chassis.getWorldPoint(new Vec2((front + 0.9) * car.facing, -0.4));
        const it = this.spawnItem('icewall', p, at, new Vec2(0, 0), 5);
        it.body.setAngle(0);
        break;
      }
      case 'shoot':
        this.fire(p, ab.projectile ?? 'cannon');
        break;
      case 'drop': {
        const item = ab.item ?? 'mine';
        // Lobbed forward over the nose, so it lands in the foe's path.
        const nose = this.carEnd(car, 1);
        const at = car.chassis.getWorldPoint(new Vec2((nose + ITEMS[item].w * 0.6 + 0.1) * car.facing, -0.3));
        const v = car.chassis.getLinearVelocity();
        const fx = DROP_FX[item];
        const flat = fx === 'oil' || fx === 'tar' || fx === 'flat' || fx === 'slip' || fx === 'explode';
        this.spawnItem(item, p, at, new Vec2(v.x * 0.5 + fwd.x * 6, v.y * 0.3 - 4), flat ? 20 : 12, fx);
        break;
      }
      case 'dump': {
        // The bed tips forward and the load flies out over the cab.
        const item = ab.item ?? car.def.cargo?.kind ?? 'crate';
        const nose = this.carEnd(car, 1);
        const deckY = car.def.cargo?.at[2] ?? -0.4;
        const v = car.chassis.getLinearVelocity();
        const fx = item === 'concrete' ? 'set' : undefined;
        for (let i = 0; i < 4; i++) {
          const at = car.chassis.getWorldPoint(new Vec2((nose + 0.3 + i * 0.25) * car.facing, deckY - 0.4 - (i % 2) * 0.35));
          const sp = 6 + this.rand() * 3;
          this.spawnItem(item, p, at, new Vec2(v.x * 0.5 + fwd.x * sp, v.y * 0.5 - 4 - this.rand() * 2), 12, fx);
        }
        break;
      }
    }
    const pos = car.position;
    const moved = kind === 'blink' || kind === 'swap' || kind === 'recall';
    this.emit({ type: 'ability', player: p, kind, x: pos.x, y: pos.y, from: moved ? from : undefined });
  }

  /** Is the other car within `range` of this car's front (side 1) or back (side -1)? */
  private reach(car: Car, foe: Car, side: 1 | -1, range: number): boolean {
    if (!foe.alive || foe.phaseT > 0) return false;
    const end = car.chassis.getWorldPoint(new Vec2(this.carEnd(car, side) * car.facing, 0));
    const dirX = (Math.sign(car.forward().x) || car.facing) * side;
    const q = foe.position;
    const along = (q.x - end.x) * dirX;
    return along > -1.6 && along < range && Math.abs(q.y - end.y) < 2.4;
  }

  private emitHit(car: Car, foe: Car) {
    const a = car.position, b = foe.position;
    this.emit({ type: 'blast', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: 1.4, kind: 'punch' });
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
    const ux = v.x / vl, uy = v.y / vl;
    switch (pr.effect) {
      case 'freeze':
        this.stun(p, s.proj === 'web' ? 1.4 : 1.5, s.proj === 'web' ? 'web' : 'ice');
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
      case 'push': {
        const k = s.proj === 'water' ? 1.6 : s.proj === 'tea' ? 1.2 : 5;
        car.kick(ux * k, uy * k - 0.4 - (k > 2 ? 2 : 0));
        if (!this.shots.some((o) => o.owner === s.owner && o.proj === s.proj && o.used && o !== s && this.time - o.born < 0.1)) this.emit({ type: 'effect', player: p, effect: 'push', x: pos.x, y: pos.y });
        break;
      }
      case 'knock':
        car.kick(ux * 10, uy * 4 - 4);
        this.emit({ type: 'blast', x: pos.x, y: pos.y, r: 1.4, kind: 'punch' });
        break;
      case 'slip':
        if (!this.shots.some((o) => o.owner === s.owner && o.proj === s.proj && o.used && o !== s && this.time - o.born < 0.1)) {
          this.stun(p, 0.5, 'web');
          car.chassis.setAngularVelocity(car.chassis.getAngularVelocity() + (ux > 0 ? 6 : -6));
          this.emit({ type: 'effect', player: p, effect: 'slip', x: pos.x, y: pos.y });
        }
        break;
      case 'slow':
        car.slowT = 2.6;
        this.emit({ type: 'effect', player: p, effect: 'slow', x: pos.x, y: pos.y });
        break;
      case 'tether': {
        const o = this.cars[s.owner];
        if (!o.alive || this.tethers.some((t) => t.a === s.owner)) break;
        const len = Math.max(2.5, Vec2.distance(o.position, pos) * 0.55);
        const joint = this.world.createJoint(new RopeJoint({ bodyA: o.chassis, bodyB: car.chassis, maxLength: len, localAnchorA: new Vec2(0, 0), localAnchorB: new Vec2(0, 0) }));
        if (joint) this.tethers.push({ joint, a: s.owner, b: p, t: 3 });
        this.emit({ type: 'effect', player: p, effect: 'tether', x: pos.x, y: pos.y });
        break;
      }
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
      default:
        // A plain shell, ball or bullet still shoves the car it lands on: heavier shots harder, pellets share.
        if (!pr.harmless) {
          const k = Math.min(7, 2.5 + 45 * pr.r * pr.r * pr.density) / Math.max(1, (pr.count ?? 1) * 0.6);
          car.kick(ux * k, uy * k * 0.4 - k * 0.35);
        }
    }
  }

  private fire(p: number, kind: ProjectileKind) {
    const car = this.cars[p];
    const pr = PROJECTILES[kind];
    const def = car.def;
    const ab = car.ability;
    const front = this.carEnd(car, 1);
    // Shots leave from the car's own barrel when it has one, else just past the nose.
    const muzzles = ab?.muzzle?.length ? ab.muzzle : [[front + pr.r + 0.15, Math.min(-0.2, def.head.y * 0.6)] as [number, number]];
    const f = car.forward();
    const n = pr.count ?? 1;
    const cv = car.chassis.getLinearVelocity();
    const lift = this.assistAim(p, pr, muzzles[(this.shotId + 1) % muzzles.length], ab?.aim ?? (pr.flight === 'flat' || pr.flight === 'skid' ? 0 : pr.flight === 'lob' ? 0.6 : 0.12));
    let dir = f;
    for (let i = 0; i < n; i++) {
      // aim along the barrel; pellets fan out
      const off = n > 1 ? ((i / (n - 1)) - 0.5) * (pr.spread ?? 0) : 0;
      const up = (lift + off) * car.facing;
      dir = new Vec2(f.x * Math.cos(up) + f.y * Math.sin(up), -f.x * Math.sin(up) + f.y * Math.cos(up));
      // Several barrels take turns (or share a volley).
      const [mx, my] = muzzles[(this.shotId + 1) % muzzles.length];
      let at: Vec2;
      if (pr.flight === 'skid' && !ab?.muzzle) at = car.chassis.getWorldPoint(new Vec2((front + pr.r + 0.2) * car.facing, 0.1));
      else {
        at = car.chassis.getWorldPoint(new Vec2(mx * car.facing, my));
        // a barrel's shot starts just out of its mouth
        if (ab?.muzzle) at = new Vec2(at.x + dir.x * pr.r, at.y + dir.y * pr.r);
      }
      const body = this.world.createBody({ type: 'dynamic', position: at, bullet: true, gravityScale: pr.gravity, angle: car.chassis.getAngle(), fixedRotation: pr.flight === 'skid' });
      const id = ++this.shotId;
      body.createFixture({
        shape: new Circle(pr.r),
        density: pr.density,
        friction: pr.friction ?? 0.4,
        restitution: pr.bounce,
        isSensor: pr.flight === 'pierce',
        filterGroupIndex: -(p + 1),
        filterCategoryBits: CAT.DEBRIS,
        filterMaskBits: MASK.DEBRIS,
        userData: { kind: 'shot', owner: p, proj: kind, id } satisfies FixtureTag,
      });
      const sp = pr.speed * (n > 1 ? 0.92 + 0.16 * this.rand() : 1);
      body.setLinearVelocity(new Vec2(dir.x * sp + cv.x * 0.5, dir.y * sp + cv.y * 0.5));
      this.shots.push({ id, body, owner: p, proj: kind, born: this.time, dead: false, phase: this.rand() * 6 });
    }
    const recoil = (pr.harmless ? 0.6 : 1.6) * (pr.recoil ?? 1);
    car.kick(-dir.x * recoil, -dir.y * recoil);
  }

  /**
   * Aim assist: nudge the launch angle (at most AIM_ASSIST either way from the barrel) so the
   * shot's path passes as close as it can to where the opponent's head is right now. The
   * player still has to face the foe and time the shot; a moving target can drive out of it.
   */
  private assistAim(p: number, pr: (typeof PROJECTILES)[ProjectileKind], muzzle: [number, number], lift: number): number {
    const car = this.cars[p];
    if (pr.flight === 'flat' || pr.flight === 'skid' || pr.flight === 'homing' || pr.flight === 'wobble') return lift;
    const foe = this.cars[1 - p];
    if (!foe.alive) return lift;
    const f = car.forward();
    const from = car.chassis.getWorldPoint(new Vec2(muzzle[0] * car.facing, muzzle[1]));
    const hp = foe.headWorld();
    // aim at the crown of the helmet: a shot that skims in over the bonnet still finds it
    const crown = foe.chassis.getWorldVector(new Vec2(0, -foe.def.head.r * 0.7));
    const tx = hp.x + crown.x - from.x, ty = hp.y + crown.y - from.y;
    if (tx * f.x + ty * f.y <= 0.5) return lift;
    const g = (this.map.gravity ?? DEFAULT_GRAVITY) * pr.gravity;
    const cv = car.chassis.getLinearVelocity();
    let best = lift, bestD = Infinity, high: number | undefined;
    const N = 32, T = 40;
    // A barrel that points at the sky may still be levelled.
    const lo = Math.min(lift - AIM_ASSIST, 0.03), hi = lift + AIM_ASSIST;
    for (let i = 0; i <= N; i++) {
      const a = lo + (i / N) * (hi - lo);
      const up = a * car.facing;
      const vx = (f.x * Math.cos(up) + f.y * Math.sin(up)) * pr.speed + cv.x * 0.5;
      const vy = (-f.x * Math.sin(up) + f.y * Math.cos(up)) * pr.speed + cv.y * 0.5;
      let d = Infinity;
      for (let k = 1; k <= T; k++) {
        const t = (k / T) * pr.life;
        d = Math.min(d, Math.hypot(vx * t - tx, vy * t + 0.5 * g * t * t - ty));
      }
      // Of the angles that find the head, the steepest drops in over the bonnet.
      if (d < 0.2) high = a;
      if (d < bestD) { bestD = d; best = a; }
    }
    return high ?? best;
  }

  private stepShots() {
    for (let i = this.shots.length - 1; i >= 0; i--) {
      const s = this.shots[i];
      const pr = PROJECTILES[s.proj];
      const pos = s.body.getPosition();
      const age = this.time - s.born;
      const v = s.body.getLinearVelocity();
      // Shots find a head a little more easily than its outline suggests: a near miss counts.
      const foe = this.cars[1 - s.owner];
      if (!pr.harmless && !s.dead && foe.alive && foe.headFixture) {
        const hp = foe.headWorld();
        if (Math.hypot(hp.x - pos.x, hp.y - pos.y) < foe.def.head.r * HEAD_SHOT_PAD + pr.r) {
          if (foe.reflectT > 0) this.reflectShot(s.id, 1 - s.owner);
          else { this.kill(1 - s.owner, 'hit', s.owner); if (pr.pop) s.dead = true; }
        }
      }
      if (pr.flight === 'boomerang' && age > 0.4) {
        // Swing back to the thrower; caught when it gets home.
        const o = this.cars[s.owner];
        const dx = o.position.x - pos.x, dy = o.position.y - 0.4 - pos.y;
        const d = Math.max(0.5, Math.hypot(dx, dy));
        s.body.setLinearVelocity(new Vec2(v.x * 0.94 + (dx / d) * 1.6, v.y * 0.94 + (dy / d) * 1.6));
        if (d < 1.2 && age > 0.6) s.dead = true;
      } else if (pr.flight === 'wobble') {
        // Flutters up and down; a seeking swarm also drifts toward the foe's height.
        const drift = pr.seek && foe.alive ? Math.max(-3, Math.min(3, (foe.headWorld().y - pos.y) * pr.seek * 40)) : 0;
        s.body.setLinearVelocity(new Vec2(v.x, Math.sin(age * 14 + (s.phase ?? 0)) * 4 + drift));
      } else if (pr.flight === 'homing' || pr.seek) {
        if (foe.alive && age > 0.15) {
          const want = Math.atan2(foe.position.y - 0.3 - pos.y, foe.position.x - pos.x);
          const cur = Math.atan2(v.y, v.x);
          let da = want - cur;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          const lim = pr.seek ?? 0.07;
          const turn = Math.max(-lim, Math.min(lim, da));
          const sp = Math.max(pr.speed, v.length());
          s.body.setLinearVelocity(new Vec2(Math.cos(cur + turn) * sp, Math.sin(cur + turn) * sp));
        }
      }
      if (s.dead || age > pr.life || pos.y > this.map.killY) {
        if (pr.effect === 'boom') {
          const r = pr.blast ?? 3.2;
          this.shockwave(s.owner, r, s.proj === 'firework' ? 0.55 : r > 4 ? 1.1 : 0.8, { x: pos.x, y: pos.y }, s.proj === 'firework' || s.proj === 'volley' ? 'firework' : 'bomb');
        } else if (s.dead) this.emit({ type: 'shotHit', x: pos.x, y: pos.y, proj: s.proj });
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
      this.spawnItem(cg.kind, car.player, at, new Vec2(0, 0), Infinity).stowed = car;
    }
  }

  /** Cargo that has left its bed (spilled, tossed, car flipped) moves in front of the cars for good. */
  private checkStowed(it: Item) {
    const car = it.stowed;
    if (!car) return;
    const cg = car.def.cargo;
    if (!cg || !car.alive) { it.stowed = undefined; return; }
    const l = car.chassis.getLocalPoint(it.body.getPosition());
    const lx = l.x * car.facing;
    const info = ITEMS[it.kind];
    const [x0, x1, top] = cg.at;
    const up = Math.max(0.6, info.h * 2.2);
    if (lx < x0 - 0.15 || lx > x1 + 0.15 || l.y < top - up || l.y > top + 0.3) it.stowed = undefined;
  }

  spawnItem(kind: ItemKind, owner: number, at: Vec2, vel: Vec2, ttl: number, fx?: ItemFx): Item {
    const info = ITEMS[kind];
    const body = this.world.createBody({ type: 'dynamic', position: at, angularDamping: 0.3 });
    const id = ++this.itemId;
    body.createFixture({
      shape: info.shape === 'circle' ? new Circle(info.w / 2) : new Box(info.w / 2, info.h / 2),
      density: info.density,
      friction: info.friction ?? 0.6,
      restitution: info.bounce,
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: { kind: 'item', owner, item: kind, id } satisfies FixtureTag,
    });
    body.setLinearVelocity(vel);
    const item: Item = { id, body, kind, owner, born: this.time, ttl, fx, fuse: fx === 'fuse' ? 1.5 : undefined };
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
    // Mines and bombs don't just push: they toss the car up.
    if (it.owner >= 0) {
      const o = this.cars[1 - it.owner];
      if (o.alive && Vec2.distance(o.position, pos) < 2.6) o.kick(0, -5);
    }
  }

  private stepItems(dt: number) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      this.checkStowed(it);
      if (it.fuse !== undefined && !it.dead) {
        it.fuse -= dt;
        if (it.fuse <= 0) this.explode(it);
      }
      // Concrete sets hard once it has stopped.
      if (it.fx === 'set' && it.body.getType() === 'dynamic' && this.time - it.born > 0.8 && it.body.getLinearVelocity().length() < 1.2) {
        it.body.setType('static');
        it.ttl = this.time - it.born + 9;
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

  /** Swap the two cars' places. */
  private swapCars(a: Car, b: Car): boolean {
    const pa = a.chassis.getPosition(), pb = b.chassis.getPosition();
    const dx = pb.x - pa.x, dy = pb.y - pa.y;
    if (Math.hypot(dx, dy) < 1.5) return false;
    const lift = -0.4;
    for (const body of a.allBodies) { const q = body.getPosition(); body.setPosition(new Vec2(q.x + dx, q.y + dy + lift)); }
    for (const body of b.allBodies) { const q = body.getPosition(); body.setPosition(new Vec2(q.x - dx, q.y - dy + lift)); }
    if (b.alive) {
      const pos = b.position;
      this.emit({ type: 'effect', player: b.player, effect: 'stasis', x: pos.x, y: pos.y });
    }
    return true;
  }

  /** Jump back to where the car was ~2 s ago. */
  private recall(car: Car): boolean {
    const h = car.history;
    if (h.length < 6) return false;
    const target = h[Math.max(0, h.length - 24)];
    const p = car.chassis.getPosition();
    for (const lift of [0, -0.6, -1.2]) {
      const dx = target.x - p.x, dy = target.y - p.y + lift;
      if (!this.carFits(car, dx, dy)) continue;
      for (const b of car.allBodies) {
        const q = b.getPosition();
        b.setPosition(new Vec2(q.x + dx, q.y + dy));
        b.setLinearVelocity(new Vec2(0, 0));
        b.setAngularVelocity(0);
      }
      car.history.length = 0;
      return true;
    }
    return false;
  }

  /** Timed car effects: stomps, hops, spills, swimming, lightning, ropes. */
  private stepCarFx(dt: number) {
    for (const car of this.cars) {
      if (car.stompDelay > 0) {
        car.stompDelay -= dt;
        if (car.stompDelay <= 0) car.slamming = true;
      }
      if (car.hops > 0 && car.alive) {
        car.hopT -= dt;
        if (car.hopT <= 0) {
          car.hops--;
          if (car.hopKind === 'hydraulics') {
            car.kick(0, car.wheelsOnGround > 0 ? -6 : -2.5);
            car.hopT = 0.34;
          } else {
            const dirX = Math.sign(car.forward().x) || car.facing;
            car.kick(dirX * 7, -1.2);
            car.strikeT = 0.25;
            car.strikeFx = 'bump';
            car.hopT = 0.22;
          }
        }
      }
      const spill = car.def.traits?.find((t) => t.kind === 'spill');
      if (spill && spill.kind === 'spill' && car.alive && this.phase === 'play' && car.speed > 2.5) {
        car.spillT -= dt;
        if (car.spillT <= 0) {
          car.spillT = spill.every;
          const tail = this.carEnd(car, -1);
          const at = car.chassis.getWorldPoint(new Vec2((tail - 0.25) * car.facing, -0.2));
          const v = car.chassis.getLinearVelocity();
          this.spawnItem(spill.item, car.player, at, new Vec2(v.x * 0.2, -1), spill.item === 'flame' ? 2.6 : 9, DROP_FX[spill.item]);
        }
      }
    }
    // Swimmers float on water instead of sinking.
    const surf = this.arena.waterSurfaces();
    if (surf.length) {
      const g = this.map.gravity ?? DEFAULT_GRAVITY;
      for (const car of this.cars) {
        if (!car.hasTrait('swim')) continue;
        for (const b of car.bodies) {
          const q = b.getWorldCenter();
          for (const [x0, x1, top] of surf) {
            if (q.x < x0 || q.x > x1 || q.y < top - 0.2) continue;
            const depth = Math.min(1.2, q.y - top + 0.2);
            b.applyForceToCenter(new Vec2(car.input * b.getMass() * 6, -b.getMass() * g * (0.6 + depth * 1.6)), true);
            const v = b.getLinearVelocity();
            b.setLinearVelocity(new Vec2(v.x * 0.985, v.y * 0.93));
          }
        }
      }
    }
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const st = this.strikes[i];
      st.t -= dt;
      if (st.t > 0) continue;
      this.strikes.splice(i, 1);
      this.emit({ type: 'bolt', x: st.x, y: st.y });
      const foe = this.cars[1 - st.owner];
      if (foe.alive && Math.abs(foe.position.x - st.x) < 1.8 && Math.abs(foe.position.y - st.y) < 3) {
        this.stun(1 - st.owner, 1.2, 'zap');
        foe.kick(0, -7);
      }
      this.emit({ type: 'blast', x: st.x, y: st.y, r: 1.8, kind: 'zap' });
    }
    for (let i = this.tethers.length - 1; i >= 0; i--) {
      const t = this.tethers[i];
      t.t -= dt;
      if (t.t <= 0 || !this.cars[t.a].alive || !this.cars[t.b].alive) {
        this.world.destroyJoint(t.joint);
        this.tethers.splice(i, 1);
      }
    }
  }

  /** Arena gadgets that act on cars: portals, the loop, tractor beams, goals. */
  private stepArenaFx(dt: number) {
    const loose = [...this.shots.map((s) => s.body), ...this.items.filter((i) => !i.dead).map((i) => i.body)];
    for (const e of this.arena.interact(this.cars, loose, dt)) {
      // A goal recharges the attacker's special.
      if (e.type === 'goal' && this.phase === 'play') this.cars[1 - e.side].abilityCd = 0;
      this.emit(e);
    }
  }

  /**
   * Where a car starts: the map's spawn spot, lowered or raised so its lowest wheel (or
   * hull corner) just rests on the ground below. One fixed height can't suit every car:
   * tall cars would drop and topple, low ones would start with a wheel in the ground.
   */
  spawnPoint(player: number, def: CarDef): [number, number] {
    const [x, y] = this.map.spawns[player];
    const f = player === 0 ? 1 : -1;
    const feet: [number, number][] = [];
    // A few points along each tyre's lower arc, so a step beside the contact point counts too.
    for (const w of def.wheels) for (const k of [-0.75, -0.4, 0, 0.4, 0.75]) feet.push([(w.x + k * w.r) * f, w.y + w.r * Math.sqrt(1 - k * k)]);
    for (const p of def.body) if (!p.deco) for (const [px, py] of p.pts) feet.push([px * f, py]);
    let best = Infinity;
    for (const [fx, fy] of feet) {
      let g = Infinity;
      // Ground up to 1.5 m above where the foot sits now counts (a hump under a long car);
      // anything higher is a beam overhead.
      this.world.rayCast(new Vec2(x + fx, y + fy - 1.5), new Vec2(x + fx, y + fy + 4), (fix, point) => {
        const k = tagOf(fix)?.kind;
        if (fix.isSensor() || (k !== 'terrain' && k !== 'platform' && k !== 'field')) return -1;
        g = Math.min(g, point.y);
        return -1;
      });
      if (g < Infinity) best = Math.min(best, g - fy);
    }
    return [x, best < Infinity ? best - 0.04 : y];
  }

  kill(player: number, cause: 'hit' | 'hazard' | 'fall' | 'ground', by?: number) {
    const car = this.cars[player];
    if (!car.alive) return;
    if (this.phase !== 'play' && this.phase !== 'countdown') return;
    // Nobody loses before the start: a car that rolled over during the countdown goes back to its spot.
    if (this.phase === 'countdown') {
      const [x, y] = this.spawnPoint(player, car.def);
      car.reset(x, y);
      return;
    }
    if (cause === 'hit' && car.shieldT > 0) {
      const hp = car.headWorld();
      this.emit({ type: 'shieldBlock', player, x: hp.x, y: hp.y });
      return;
    }
    if (cause === 'hit' && car.hasTrait('medkit') && !car.medkitUsed) {
      // First aid: the first knock each round is patched up (with a moment of grace).
      car.medkitUsed = true;
      car.shieldT = 0.8;
      const hp = car.headWorld();
      this.emit({ type: 'effect', player, effect: 'medkit', x: hp.x, y: hp.y });
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
