import { World, Body, Chain, Box, Circle, Vec2 } from 'planck';
import { CAT, MASK } from '../physics/constants';
import type { FixtureTag } from '../physics/tags';
import type { MapDef, PlatformDef, SawDef, Pt } from './types';

export const MAT_FRICTION: Record<string, number> = {
  grass: 0.9, rock: 0.85, sand: 0.75, metal: 0.7, ice: 0.08, wood: 0.85, snow: 0.45, moon: 0.8, neon: 0.75, brick: 0.85,
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
export interface BlockRuntime { body: Body; size: number; born: number }

/** Live physics objects for a map plus per-step behaviour (movers, spawners). */
export class Arena {
  readonly terrain: Body;
  readonly platforms: PlatformRuntime[] = [];
  readonly saws: SawRuntime[] = [];
  readonly blocks: BlockRuntime[] = [];
  readonly lavaBodies: Body[] = [];
  readonly padBodies: Body[] = [];
  /** Rising sudden-death lava (sensor box whose top edge is at `riseY`). */
  riseBody: Body | null = null;
  riseY = Infinity;
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
        this.spawnBlock(fb.x0 + this.rng() * (fb.x1 - fb.x0), fb.y, fb.size);
      }
    }
    for (let i = this.blocks.length - 1; i >= 0; i--) {
      const b = this.blocks[i];
      if (b.body.getPosition().y > this.def.killY || this.time - b.born > 14) {
        this.world.destroyBody(b.body);
        this.blocks.splice(i, 1);
      }
    }
    if (this.riseBody) {
      this.riseY -= dt * 0.9;
      this.riseBody.setPosition(new Vec2((this.def.bounds.x0 + this.def.bounds.x1) / 2, this.riseY + 20));
    }
  }

  spawnBlock(x: number, y: number, size: number) {
    const body = this.world.createBody({ type: 'dynamic', position: new Vec2(x, y), angle: this.rng() * 0.6 - 0.3 });
    const tag: FixtureTag = { kind: 'block', body };
    body.createFixture({
      shape: new Box(size / 2, size / 2),
      density: 1.5,
      friction: 0.7,
      filterCategoryBits: CAT.DEBRIS,
      filterMaskBits: MASK.DEBRIS,
      userData: tag,
    });
    this.blocks.push({ body, size, born: this.time });
  }

  /** Start sudden-death lava rising from below the arena. */
  startRise() {
    if (this.riseBody) return;
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
