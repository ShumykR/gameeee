import { World, Body, Circle, Box, Vec2, RevoluteJoint } from 'planck';
import { CAT, MASK } from '../physics/constants';
import type { FixtureTag } from '../physics/tags';

/** Two-piece ragdoll for an ejected driver: head + torso joined at the neck. */
export class Ragdoll {
  readonly head: Body;
  readonly torso: Body;
  prev: { x: number; y: number; a: number }[] = [];

  constructor(world: World, readonly player: number, x: number, y: number, r: number, angle: number, vx: number, vy: number, readonly facing: number) {
    const tag: FixtureTag = { kind: 'ragdoll', player };
    const opts = { filterCategoryBits: CAT.RAGDOLL, filterMaskBits: MASK.RAGDOLL, filterGroupIndex: -10 - player, userData: tag, friction: 0.6, restitution: 0.35 };
    this.head = world.createBody({ type: 'dynamic', position: new Vec2(x, y), angle, bullet: true });
    this.head.createFixture({ shape: new Circle(r), density: 1.2, ...opts });
    const tx = x - Math.sin(angle) * -r * 1.6, ty = y + Math.cos(angle) * r * 1.6;
    this.torso = world.createBody({ type: 'dynamic', position: new Vec2(tx, ty), angle });
    this.torso.createFixture({ shape: new Box(r * 0.8, r * 0.8), density: 1.5, ...opts });
    world.createJoint(new RevoluteJoint({ enableLimit: true, lowerAngle: -0.8, upperAngle: 0.8 }, this.head, this.torso, new Vec2((x + tx) / 2, (y + ty) / 2)));
    for (const b of [this.head, this.torso]) b.setLinearVelocity(new Vec2(vx, vy));
    this.head.setAngularVelocity((Math.random() - 0.5) * 30);
    this.snapshot();
  }

  snapshot() {
    this.prev = [this.head, this.torso].map((b) => ({ x: b.getPosition().x, y: b.getPosition().y, a: b.getAngle() }));
  }
}
