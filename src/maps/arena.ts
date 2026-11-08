import { World, Body, Chain, Box, Circle, Vec2 } from 'planck';
import { CAT, MASK } from '../physics/constants';
import type { FixtureTag } from '../physics/tags';
import type { MapDef, PlatformDef, SawDef, Pt, SuddenDeathKind } from './types';
import { groundY } from './decor';

export const MAT_FRICTION: Record<string, number> = {
  grass: 0.9, rock: 0.85, sand: 0.75, metal: 0.7, ice: 0.08, wood: 0.85, snow: 0.45, moon: 0.8, neon: 0.75, brick: 0.85,
  grave: 0.85, basalt: 0.85, turf: 0.9, track: 0.8, void: 0.75, asphalt: 0.95, tile: 0.7,
};

interface Mover {
  body: Body;
  path: Pt[];
  speed: number;
  wait: number;
  seg: number;
  dirn: 1 | -1;
  pause: number;
}

export interface PlatformRuntime extends Mover { def: PlatformDef }
export interface SawRuntime { body: Body; def: SawDef; mover?: Mover }
export type BlockStyle = 'crate' | 'ice' | 'stone' | 'toy' | 'meteor';
export interface BlockRuntime { body: Body; size: number; born: number; style: BlockStyle; seed: number }
export interface BallRuntime { body: Body; r: number; home: Pt | null; look: 'football' | 'snow'; born: number }
export interface GhostRuntime { body: Body; vx: number; baseY: number; phase: number; born: number; id: number }
export interface BombRuntime { x: number; y: number; t: number; id: number }

/** Live physics objects for a map plus per-step behaviour (movers, spawners). */
export class Arena {
  readonly terrain: Body;
  readonly platforms: PlatformRuntime[] = [];
  readonly saws: SawRuntime[] = [];
  readonly blocks: BlockRuntime[] = [];
  readonly balls: BallRuntime[] = [];
  readonly lavaBodies: Body[] = [];
  readonly padBodies: Body[] = [];
  /** Rising sudden-death lava (sensor box whose top edge is at `riseY`). */
  riseBody: Body | null = null;
  riseY = Infinity;
  /** What the rising sheet looks like. */
  riseKind: 'lava' | 'flood' = 'lava';
  /** Active sudden-death variant. */
  sudden: SuddenDeathKind | null = null;
  suddenT = 0;
  readonly walls: Body[] = [];
  readonly ghosts: GhostRuntime[] = [];
  /** Bombs about to go off (t = seconds left). */
  readonly bombs: BombRuntime[] = [];
  /** Detonations this step, for the game to apply. */
  detonations: { x: number; y: number }[] = [];
  /** Horizontal wind acceleration (m/s²). */
  wind = 0;
  private rainTimer = 0;
  private uid = 0;
  private blockTimer = 0;
  private time = 0;
  private rng: () => number;

  constructor(readonly world: World, readonly def: MapDef, seed = 1) {
    let s = seed >>> 0 || 1;
    this.rng = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    this.terrain = world.createBody({ type: 'static' });
    for (const solid of def.solids) {
      this.terrain.createFixture({
        shape: new Chain(solid.pts.map(([x, y]) => new Vec2(x, y)), true),
        friction: solid.friction ?? MAT_FRICTION[solid.mat] ?? 0.8,
        filterCategoryBits: CAT.TERRAIN,
        filterMaskBits: MASK.TERRAIN,
        userData: { kind: 'terrain', mat: solid.mat } satisfies FixtureTag,
      });
    }
    for (const p of def.platforms ?? []) {
      const body = world.createBody({ type: 'kinematic', position: new Vec2(p.path[0][0], p.path[0][1]) });
      body.createFixture({
        shape: new Box(p.w / 2, p.h / 2),
        friction: MAT_FRICTION[p.mat ?? 'metal'],
        filterCategoryBits: CAT.PLATFORM,
        filterMaskBits: MASK.PLATFORM,
        userData: { kind: 'platform' } satisfies FixtureTag,
      });
      this.platforms.push({ def: p, body, path: p.path, speed: p.speed, wait: p.wait ?? 0.6, seg: 0, dirn: 1, pause: p.wait ?? 0.6 });
    }
    for (const pad of def.pads ?? []) {
      const a = pad.angle ?? 0;
      const nx = Math.sin(a), ny = -Math.cos(a);
      const body = world.createBody({ type: 'static', position: new Vec2(pad.x - nx * 0.2, pad.y - ny * 0.2), angle: a });
      body.createFixture({
        shape: new Box(pad.w / 2, 0.2),
        friction: 0.9,
        filterCategoryBits: CAT.TERRAIN,
        filterMaskBits: MASK.TERRAIN,
        userData: { kind: 'pad', power: pad.power, nx, ny } satisfies FixtureTag,
      });
      this.padBodies.push(body);
    }
    for (const l of def.lava ?? []) {
      const body = world.createBody({ type: 'static', position: new Vec2(l.x + l.w / 2, l.y + l.h / 2) });
      body.createFixture({
        shape: new Box(l.w / 2, l.h / 2),
        isSensor: true,
        filterCategoryBits: CAT.HAZARD,
        filterMaskBits: MASK.HAZARD,
        userData: { kind: 'hazard', type: 'lava' } satisfies FixtureTag,
      });
      this.lavaBodies.push(body);
    }
    for (const sp of def.spikes ?? []) {
      const body = world.createBody({ type: 'static', position: new Vec2(sp.x + sp.w / 2, sp.y - 0.25) });
      body.createFixture({
        shape: new Box(sp.w / 2, 0.25),
        isSensor: true,
        filterCategoryBits: CAT.HAZARD,
        filterMaskBits: MASK.HAZARD,
        userData: { kind: 'hazard', type: 'spikes' } satisfies FixtureTag,
      });
    }
    for (const sd of def.saws ?? []) {
      const start = sd.path?.[0] ?? [sd.x, sd.y];
      const body = world.createBody({ type: 'kinematic', position: new Vec2(start[0], start[1]), angularVelocity: 9 });
      body.createFixture({
        shape: new Circle(sd.r),
        friction: 0.2,
        restitution: 0.5,
        filterCategoryBits: CAT.HAZARD,
        filterMaskBits: MASK.HAZARD | CAT.CAR,
        userData: { kind: 'hazard', type: 'saw' } satisfies FixtureTag,
      });
      const rt: SawRuntime = { body, def: sd };
      if (sd.path && sd.path.length > 1) rt.mover = { body, path: sd.path, speed: sd.speed ?? 2, wait: 0.3, seg: 0, dirn: 1, pause: 0.3 };
      this.saws.push(rt);
    }
    this.spawnBalls();
  }

  private spawnBalls() {
    for (const b of this.def.balls ?? []) {
      const body = this.world.createBody({ type: 'dynamic', position: new Vec2(b.x, b.y), angularDamping: 0.2, linearDamping: 0.05 });
      body.createFixture({
        shape: new Circle(b.r),
        density: 0.25,
        friction: 0.6,
        restitution: 0.7,
        filterCategoryBits: CAT.DEBRIS,
        filterMaskBits: MASK.DEBRIS,
        userData: { kind: 'block', body } satisfies FixtureTag,
      });
      this.balls.push({ body, r: b.r, home: [b.x, b.y], look: 'football', born: 0 });
    }
  }

  get gravity(): number | undefined {
    return this.def.gravity;
  }

  private stepMover(m: Mover, dt: number) {
    if (m.pause > 0) {
      m.pause -= dt;
      m.body.setLinearVelocity(new Vec2(0, 0));
      return;
    }
    const nextIdx = m.seg + m.dirn;
    const target = m.path[nextIdx];
    const p = m.body.getPosition();
    const dx = target[0] - p.x, dy = target[1] - p.y;
    const dist = Math.hypot(dx, dy);
    const stepLen = m.speed * dt;
    if (dist <= stepLen + 1e-4) {
      m.body.setLinearVelocity(new Vec2(dx / dt, dy / dt));
      m.seg = nextIdx;
      if (m.seg === m.path.length - 1 || m.seg === 0) {
        m.dirn = m.seg === 0 ? 1 : -1;
        m.pause = m.wait;
      }
    } else {
      m.body.setLinearVelocity(new Vec2((dx / dist) * m.speed, (dy / dist) * m.speed));
    }
  }

  /** Per fixed step update. */
  step(dt: number) {
    this.time += dt;
    for (const p of this.platforms) this.stepMover(p, dt);
    for (const s of this.saws) if (s.mover) this.stepMover(s.mover, dt);

    const fb = this.def.fallingBlocks;
    if (fb) {
      this.blockTimer += dt;
      if (this.blockTimer >= fb.interval) {
        this.blockTimer = 0;
        this.spawnBlock(fb.x0 + this.rng() * (fb.x1 - fb.x0), fb.y, fb.size, fb.style ?? 'crate');
      }
    }
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (b.body.getPosition().y > this.def.killY || this.time - b.born > 14) {
        this.world.destroyBody(b.body);
        this.blocks.splice(i, 1);
      }
    }
    // Balls that fall out of the arena come back to their spot.
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const b = this.balls[i];
      if (!b.home) {
        // rain balls expire
        if (this.time - b.born > 12 || b.body.getPosition().y > this.def.killY) {
          this.world.destroyBody(b.body);
          this.balls.splice(i, 1);
        }
      } else if (b.body.getPosition().y > this.def.killY) {
        b.body.setPosition(new Vec2(b.home[0], b.home[1]));
        b.body.setLinearVelocity(new Vec2(0, 0));
        b.body.setAngularVelocity(0);
      }
    }
    if (this.sudden) this.stepSudden(dt);
    if (this.riseBody) {
      this.riseY -= dt * 0.9;
      this.riseBody.setPosition(new Vec2((this.def.bounds.x0 + this.def.bounds.x1) / 2, this.riseY + 20));
    }
  }

  spawnBlock(x: number, y: number, size: number, style: BlockStyle = 'crate', vel?: Vec2) {
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(x, y), angle: this.rng() * 0.6 - 0.3 });
    if (vel) body.setLinearVelocity(vel);
    const tag: FixtureTag = { kind: 'block', body };
    body.createFixture({
      shape: new Box(size / 2, size / 2),
      density: 1.5,
      friction: 0.7,
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: tag,
    });
    this.blocks.push({ body, size, born: this.time, style, seed: ++this.uid });
  }

  /** Begin a sudden-death variant. */
  startSuddenDeath(kind: SuddenDeathKind) {
    this.sudden = kind;
    this.suddenT = 0;
    this.rainTimer = 0;
    const b = this.def.bounds;
    switch (kind) {
      case 'lava':
        this.startRise('lava');
        break;
      case 'flood':
        this.startRise('flood');
        break;
      case 'walls':
        for (const side of [-1, 1]) {
          const x = side < 0 ? b.x0 - 1.2 : b.x1 + 1.2;
          const body = this.world.createBody({ type: 'kinematic', position: new Vec2(x, (b.y0 + b.y1) / 2) });
          body.createFixture({
            shape: new Box(1.2, (b.y1 - b.y0) / 2 + 12),
            friction: 0.6,
            filterCategoryBits: CAT.TERRAIN,
            filterMaskBits: MASK.TERRAIN,
            userData: { kind: 'terrain', mat: 'metal' } satisfies FixtureTag,
          });
          body.setLinearVelocity(new Vec2(-side * 1.0, 0));
          this.walls.push(body);
        }
        break;
      case 'blizzard':
        // everything turns to ice
        for (let f = this.terrain.getFixtureList(); f; f = f.getNext()) f.setFriction(0.06);
        for (let c = this.world.getContactList(); c; c = c.getNext()) c.resetFriction();
        break;
      case 'lowgrav': {
        const g = this.world.getGravity();
        this.world.setGravity(new Vec2(0, g.y * 0.35));
        break;
      }
      default:
        break;
    }
  }

  private stepSudden(dt: number) {
    this.suddenT += dt;
    const b = this.def.bounds;
    const k = Math.min(1, this.suddenT / 20); // intensity ramps up
    const rx = () => b.x0 + 3 + this.rng() * (b.x1 - b.x0 - 6);
    const top = b.y0 - 2;
    this.rainTimer -= dt;
    const tick = (every: number) => {
      if (this.rainTimer > 0) return false;
      this.rainTimer = every;
      return true;
    };
    switch (this.sudden) {
      case 'meteors':
      case 'lowgrav':
        if (tick(this.sudden === 'lowgrav' ? 2.2 - k : 1.2 - k * 0.75)) {
          const x = rx();
          this.spawnBlock(x, top, 0.7 + this.rng() * 0.45, 'meteor', new Vec2((this.rng() - 0.5) * 8, 14));
        }
        break;
      case 'blocks':
        if (tick(1.0 - k * 0.6)) this.spawnBlock(rx(), top, 0.8 + this.rng() * 0.4, 'toy');
        break;
      case 'balls':
        if (tick(0.9 - k * 0.5)) this.spawnRainBall(rx(), top, 0.42 + this.rng() * 0.2, 'football');
        break;
      case 'blizzard':
        this.wind = Math.sin(this.suddenT * 0.55) * (5 + 6 * k);
        if (tick(0.55 - k * 0.3)) this.spawnRainBall(rx(), top, 0.24, 'snow', new Vec2(this.wind * 0.6, 4));
        break;
      case 'bombs':
        if (tick(1.5 - k * 0.8)) {
          const x = rx();
          const y = groundY(this.def, x);
          if (y !== null) this.bombs.push({ x, y: y - 0.2, t: 1.25, id: ++this.uid });
        }
        break;
      case 'ghosts':
        if (tick(2.4 - k * 1.3)) this.spawnGhost();
        break;
      case 'walls': {
        const mid = (b.x0 + b.x1) / 2;
        for (const w of this.walls) {
          const x = w.getPosition().x;
          const gap = Math.abs(x - mid) - 1.2;
          if (gap < 4.2) w.setLinearVelocity(new Vec2(0, 0));
        }
        break;
      }
    }
    // bombs count down
    this.detonations = [];
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bm = this.bombs[i];
      bm.t -= dt;
      if (bm.t <= 0) {
        this.detonations.push({ x: bm.x, y: bm.y });
        this.bombs.splice(i, 1);
      }
    }
    // ghosts drift across, bobbing
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const gh = this.ghosts[i];
      const p = gh.body.getPosition();
      const t = this.time - gh.born;
      gh.body.setLinearVelocity(new Vec2(gh.vx, Math.cos(t * 2.4 + gh.phase) * 1.6));
      if (p.x < b.x0 - 4 || p.x > b.x1 + 4) {
        this.world.destroyBody(gh.body);
        this.ghosts.splice(i, 1);
      }
    }
  }

  private spawnRainBall(x: number, y: number, r: number, look: 'football' | 'snow', vel?: Vec2) {
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(x, y) });
    body.createFixture({
      shape: new Circle(r),
      density: look === 'snow' ? 0.8 : 0.3,
      friction: 0.5,
      restitution: look === 'snow' ? 0.05 : 0.7,
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: { kind: 'block', body } satisfies FixtureTag,
    });
    if (vel) body.setLinearVelocity(vel);
    this.balls.push({ body, r, home: null, look, born: this.time });
  }

  private spawnGhost() {
    const b = this.def.bounds;
    const fromLeft = this.rng() < 0.5;
    const x = fromLeft ? b.x0 - 2 : b.x1 + 2;
    // fly at roughly driver-head height over the middle of the arena
    const gy = groundY(this.def, (b.x0 + b.x1) / 2) ?? (b.y0 + b.y1) / 2;
    const y = gy - 1.4 - this.rng() * 3;
    const body = this.world.createBody({ type: 'kinematic', position: new Vec2(x, y) });
    body.createFixture({
      shape: new Circle(0.55),
      isSensor: true,
      filterCategoryBits: CAT.HAZARD,
      filterMaskBits: MASK.HAZARD,
      userData: { kind: 'hazard', type: 'saw' } satisfies FixtureTag,
    });
    this.ghosts.push({ body, vx: (fromLeft ? 1 : -1) * (3.2 + this.rng() * 2.2), baseY: y, phase: this.rng() * 6, born: this.time, id: ++this.uid });
  }

  /** Start sudden-death lava (or sea) rising from below the arena. */
  startRise(kind: 'lava' | 'flood' = 'lava') {
    if (this.riseBody) return;
    this.riseKind = kind;
    const b = this.def.bounds;
    this.riseY = this.def.suddenDeathY ?? b.y1;
    const w = b.x1 - b.x0 + 40;
    this.riseBody = this.world.createBody({ type: 'kinematic', position: new Vec2((b.x0 + b.x1) / 2, this.riseY + 20) });
    this.riseBody.createFixture({
      shape: new Box(w / 2, 20),
      isSensor: true,
      filterCategoryBits: CAT.HAZARD,
      filterMaskBits: MASK.HAZARD,
      userData: { kind: 'hazard', type: 'lava' } satisfies FixtureTag,
    });
  }
}
