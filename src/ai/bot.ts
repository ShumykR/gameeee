import { Vec2 } from 'planck';
import type { Controller, Game } from '../game/game';
import type { Car } from '../cars/car';
import { tagOf } from '../physics/tags';

export type BotLevel = 'easy' | 'normal' | 'hard';

interface LevelCfg {
  /** Seconds between decisions (reaction time). */
  think: number;
  /** Chance per decision to do something random. */
  noise: number;
  airControl: boolean;
  avoidHazards: boolean;
  /** Chance per decision to lose focus and drift away for a moment. */
  wander: number;
}

const LEVELS: Record<BotLevel, LevelCfg> = {
  easy: { think: 0.6, noise: 0.35, airControl: false, avoidHazards: false, wander: 0 },
  normal: { think: 0.14, noise: 0.08, airControl: true, avoidHazards: true, wander: 0.04 },
  hard: { think: 0.05, noise: 0, airControl: true, avoidHazards: true, wander: 0 },
};

type Mode = 'attack' | 'backoff';

/** Heuristic opponent: keeps pressure on the foe, levels itself in the air, avoids lava and cliffs. */
export class Bot implements Controller {
  private cfg: LevelCfg;
  private timer = 0;
  private out: -1 | 0 | 1 = 0;
  private mode: Mode = 'attack';
  private modeT = 0;
  private avoidDir: -1 | 1 = 1;
  private stuckT = 0;
  private rng: () => number;

  constructor(readonly level: BotLevel, seed = 1) {
    this.cfg = LEVELS[level];
    let s = (seed * 2654435761) >>> 0 || 1;
    this.rng = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }

  decide(game: Game, player: number, dt: number): -1 | 0 | 1 {
    this.timer -= dt;
    this.modeT += dt;
    const me = game.cars[player];
    const foe = game.cars[1 - player];
    // Detect a head-on stalemate (pushing but not moving).
    const close = Math.abs(foe.position.x - me.position.x) < 4;
    if (this.out !== 0 && close && me.speed < 1.2 && !me.inAir) this.stuckT += dt;
    else this.stuckT = Math.max(0, this.stuckT - dt);
    if (this.timer <= 0) {
      this.timer = this.cfg.think * (0.75 + this.rng() * 0.5);
      this.out = this.think(game, me, foe);
      if (this.rng() < this.cfg.noise) this.out = ([-1, 0, 1] as const)[Math.floor(this.rng() * 3)];
    }
    // Lasers are a reflex, not a decision: never drive the head into a live beam, even on a whim.
    if (this.out !== 0 && me.alive && !me.inAir) {
      const hold = this.laserCheck(game, me, this.out);
      if (hold !== null) return hold;
    }
    return this.out;
  }

  private think(game: Game, me: Car, foe: Car): -1 | 0 | 1 {
    if (!me.alive) return 0;
    const p = me.position, f = foe.position;
    const dx = f.x - p.x;
    const toward = (Math.sign(dx) || me.facing) as -1 | 1;
    const a = me.angle;

    // In the air: level out using a predictive (PD-like) estimate of the landing angle.
    if (me.inAir && this.cfg.airControl) {
      const w = me.chassis.getAngularVelocity();
      const pred = a + w * 0.25;
      if (Math.abs(pred) > 0.25) return pred > 0 ? 1 : -1;
      return toward;
    }

    // Stuck on the roof/side: self-righting kicks in; rock back and forth to help.
    if (Math.abs(a) > 1.4) return Math.floor(game.stepCount / 30) % 2 ? 1 : -1;

    if (this.mode === 'backoff') {
      if (this.modeT > 0.5) this.mode = 'attack';
      else return this.avoidDir;
    }

    // Hazard / cliff check ahead (a car going too fast toward lava or a drop backs off).
    if (this.cfg.avoidHazards && this.dangerAhead(game, me, toward)) {
      this.mode = 'backoff';
      this.modeT = 0;
      this.avoidDir = (-toward) as -1 | 1;
      return this.avoidDir;
    }

    // Break a pushing stalemate: reverse briefly, then charge again.
    if (this.stuckT > this.cfg.think * 4 + 0.9) {
      this.stuckT = 0;
      this.mode = 'backoff';
      this.modeT = -0.2 - this.rng() * 0.4;
      this.avoidDir = (-toward) as -1 | 1;
      return this.avoidDir;
    }

    // Weaker bots lose focus and drift away now and then.
    if (this.rng() < this.cfg.wander) {
      this.mode = 'backoff';
      this.modeT = -0.3 - this.rng() * 0.5;
      this.avoidDir = (-toward) as -1 | 1;
      return this.avoidDir;
    }

    // Easy bots hesitate now and then.
    if (this.level === 'easy' && this.rng() < 0.2) return 0;
    // Constant pressure wins most exchanges in this genre: keep pushing toward the foe.
    void foe;
    return toward;
  }

  /** Use the special action when the situation suits it. */
  action(game: Game, player: number): boolean {
    const me = game.cars[player], foe = game.cars[1 - player];
    if (!me.ability || !me.alive || !foe.alive || me.abilityCd > 0 || me.stunT > 0 || game.phase !== 'play') return false;
    const chance = this.level === 'easy' ? 0.01 : this.level === 'normal' ? 0.05 : 0.12;
    if (this.rng() > chance) return false;
    const p = me.position, f = foe.position;
    const dx = f.x - p.x, dy = f.y - p.y;
    const dist = Math.hypot(dx, dy);
    const facingFoe = Math.sign(dx) === Math.sign(me.forward().x);
    const level = Math.abs(me.angle) < 0.6;
    const behind = !facingFoe;
    const k = me.ability.kind;
    switch (k) {
      case 'shoot': {
        const proj = me.ability.projectile;
        const range = proj === 'fire' || proj === 'tea' ? 4.5 : proj === 'water' || proj === 'hook' ? 9 : proj === 'bubble' || proj === 'ink' ? 10 : 16;
        if (proj === 'seeker' || proj === 'bone') return dist < 14;
        return facingFoe && level && Math.abs(dx) < range && Math.abs(dy) < 4;
      }
      case 'roar': case 'discharge': case 'puff': case 'slam': return dist < 4.2 || (k === 'slam' && me.inAir && Math.abs(dx) < 2 && dy > 0);
      case 'stasis': return dist < 5.5;
      case 'howl': return dist < 6.5;
      case 'beam': return Math.abs(dx) < 3.4 && dy > -1.5 && dist < 8;
      case 'storm': return dist < 18;
      case 'drop': return facingFoe && dist > 3 && dist < 9;
      case 'dump': return facingFoe && dist > 3 && dist < 11;
      case 'tailwhip': return behind && dist < 4.2;
      case 'punch': case 'kick': case 'scoop': return facingFoe && dist < 3.8;
      case 'phase': return dist < 3 || (foe.ability?.kind === 'shoot' && foe.abilityCd < 0.2 && dist < 10);
      case 'reflect': return foe.ability?.kind === 'shoot' && facingFoe && dist < 12;
      case 'blink': return facingFoe && dist > 5 && dist < 12 && Math.abs(dy) < 2;
      case 'swap': return dist > 6 && dist < 16 && me.position.y > foe.position.y + 1;
      case 'recall': return me.upsideDown || me.position.y > game.map.killY - 10;
      case 'icewall': return facingFoe && dist > 2.5 && dist < 7;
      case 'jump': case 'stomp': case 'bounce': case 'rear': case 'ollie': case 'hydraulics': case 'backflip': case 'moonjump': case 'surprise':
        return dist < 4.5 && dy > -1.5;
      case 'pounce': return dist > 2 && dist < 8;
      case 'nitro': case 'dash': case 'drs': case 'sting': case 'gore': case 'flip': case 'bump': case 'bite': case 'frenzy': case 'slide':
        return facingFoe && level && dist > 2.5 && dist < 10 && !me.inAir;
      case 'fly': case 'glide': return dist < 6 || (k === 'glide' && me.inAir);
      case 'shield': case 'shell': case 'heavy': case 'invis': return dist < 3.2;
    }
    return false;
  }

  /**
   * Lasers kill heads, so a bot that just charges at a foe across one dies as soon as it
   * switches on. Returns the move to make (hold back / wait) when a beam is ahead and it
   * isn't safe to cross, or null when the way is clear.
   */
  private laserCheck(game: Game, me: Car, dir: -1 | 1): -1 | 0 | 1 | null {
    const head = me.headWorld();
    const r = me.def.head.r;
    const v = me.chassis.getLinearVelocity().x * dir; // speed toward the beam
    for (const f of game.arena.fields) {
      const d = f.def;
      if (d.kind !== 'laser') continue;
      if (head.y + r < d.y || head.y - r > d.y + d.h) continue;
      const near = dir > 0 ? d.x - (head.x + r) : head.x - r - (d.x + d.w);
      if (near < -(d.w + 2 * r)) continue; // already past it
      // Room needed to stop short of the beam at this speed (reversing brakes at ~8 m/s²).
      const stop = 1.2 + Math.max(0, v) ** 2 / 14 + Math.max(0, v) * this.cfg.think;
      if (near > stop + 3) continue;
      // How long the beam stays in its current state.
      let on = true, left = Infinity;
      const c = d.cycle;
      if (c) {
        const t = (game.arena.time + (d.phase ?? 0)) % (c[0] + c[1]);
        on = t < c[0];
        left = on ? c[0] - t : c[0] + c[1] - t;
      } else if (!f.on) continue;
      if (near < 0) return dir; // the head is in the beam: get through
      // Time to carry the head right through, accelerating from the current speed.
      const span = near + d.w + 2 * r + 0.3;
      const cross = span / Math.max(2.5, v * 0.8 + 3) + (this.cfg.think + 0.15);
      if (!on && left > cross + 0.25) return null; // off for long enough: go
      if (near > stop + 0.8) return null; // still far: keep closing in
      return near < stop ? ((-dir) as -1 | 1) : 0;
    }
    return null;
  }

  /** Raycast down a few meters ahead: true if there's lava or no ground (cliff). */
  private dangerAhead(game: Game, me: Car, dir: number): boolean {
    const p = me.position;
    const v = me.chassis.getLinearVelocity().x;
    const look = 2.2 + Math.min(4, Math.abs(v) * 0.35);
    const x = p.x + dir * look;
    let groundY = Infinity;
    let lavaY = Infinity;
    game.world.rayCast(new Vec2(x, p.y - 1.5), new Vec2(x, p.y + 9), (fix, point) => {
      const t = tagOf(fix);
      if (!t) return -1;
      if (t.kind === 'hazard' && t.type === 'lava') lavaY = Math.min(lavaY, point.y);
      else if (t.kind === 'terrain' || t.kind === 'platform' || t.kind === 'pad') groundY = Math.min(groundY, point.y);
      return -1; // keep going, collect everything
    });
    if (game.arena.riseBody) lavaY = Math.min(lavaY, game.arena.riseY);
    if (lavaY < groundY) return true;
    return groundY === Infinity;
  }
}
