import { Container, Sprite } from 'pixi.js';
import { whiteTexture } from './textures';

interface P {
  s: Sprite;
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; g: number; drag: number; shrink: boolean; spin: number;
}

/** Pooled square-pixel particles living in world space (meters). */
export class Particles {
  readonly container = new Container();
  private pool: Sprite[] = [];
  private live: P[] = [];

  spawn(x: number, y: number, o: { vx?: number; vy?: number; life?: number; size?: number; color?: number; g?: number; drag?: number; shrink?: boolean; spin?: number }) {
    if (this.live.length > 900) return;
    const s = this.pool.pop() ?? new Sprite(whiteTexture());
    s.anchor.set(0.5);
    s.tint = o.color ?? 0xffffff;
    s.visible = true;
    s.alpha = 1;
    this.container.addChild(s);
    const life = o.life ?? 0.6;
    this.live.push({ s, x, y, vx: o.vx ?? 0, vy: o.vy ?? 0, life, max: life, size: o.size ?? 0.12, g: o.g ?? 0, drag: o.drag ?? 0, shrink: o.shrink ?? true, spin: o.spin ?? 0 });
  }

  burst(x: number, y: number, n: number, o: { speed: number; life?: number; size?: number; colors: number[]; g?: number; drag?: number; up?: number; spread?: number; dir?: number }) {
    for (let i = 0; i < n; i++) {
      const a = (o.dir ?? -Math.PI / 2) + (Math.random() - 0.5) * (o.spread ?? Math.PI * 2);
      const sp = o.speed * (0.35 + Math.random() * 0.65);
      this.spawn(x, y, {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (o.up ?? 0),
        life: (o.life ?? 0.6) * (0.6 + Math.random() * 0.6),
        size: (o.size ?? 0.12) * (0.6 + Math.random() * 0.8),
        color: o.colors[Math.floor(Math.random() * o.colors.length)],
        g: o.g ?? 0,
        drag: o.drag ?? 1,
        spin: (Math.random() - 0.5) * 10,
      });
    }
  }

  update(dt: number) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.s.visible = false;
        this.container.removeChild(p.s);
        this.pool.push(p.s);
        this.live.splice(i, 1);
        continue;
      }
      p.vy += p.g * dt;
      const k = Math.exp(-p.drag * dt);
      p.vx *= k;
      p.vy *= k;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const t = p.life / p.max;
      const sz = p.shrink ? p.size * (0.3 + 0.7 * t) : p.size;
      p.s.position.set(p.x, p.y);
      p.s.width = sz;
      p.s.height = sz;
      p.s.rotation += p.spin * dt;
      p.s.alpha = Math.min(1, t * 2.5);
    }
  }

  clear() {
    for (const p of this.live) {
      p.s.visible = false;
      this.container.removeChild(p.s);
      this.pool.push(p.s);
    }
    this.live = [];
  }
}
