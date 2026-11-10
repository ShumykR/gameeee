import { Application, Container, Sprite, TilingSprite, Graphics, Texture } from 'pixi.js';
import { Vec2 } from 'planck';
import { ART_PPM, CAR_PPM } from '../physics/constants';
import type { Game, GameEvent } from '../game/game';
import type { Car } from '../cars/car';
import type { CarDef, CarPalette } from '../cars/types';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateTorsoGrid, generateLinkGrid, generateWheelGrid, wheelPalette } from '../cars/sprite';
import { generateLayer, generateSky, generateTerrain, THEMES } from '../maps/art';
import type { MapDef } from '../maps/types';
import { PROP_PAL, crateGrid, hazardStripGrid, lavaGrid, lavaSurfaceGrid, padGrid, plateGrid, sawGrid, spikesGrid, wallGrid, waterGrid, waterSurfaceGrid } from '../maps/props';
import { SUDDEN_INFO } from '../maps/sudden';
import { DECOR_PAL, ballGrid, decorGrid, flailGrid, itemGrid, placedDecor, shotGrid } from '../maps/decor';
import { isPropDecor } from '../maps/arena';
import { ITEMS, PROJECTILES } from '../game/abilities';
import { Cam, fitCamera, lerpCam } from './camera';
import { Particles } from './particles';
import { pixelText } from './pixeltext';
import { gridTexture, rgbaTexture, whiteTexture } from './textures';
import { hex, hueShift, toHex } from './color';
import type { InputManager } from '../input/input';
import { drawPhysicsDebug } from './debug';

export const PLAYER_COLORS = ['#3ec1ff', '#ff5a6e'];
export const PLAYER_NAMES = ['P1', 'P2'];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Shots drawn rotated along their flight. */
const ALONG = new Set<string>(['laser', 'zap', 'bullet', 'tracer', 'firework', 'missile', 'harpoon', 'cork', 'volley', 'seeker', 'torpedo', 'railgun', 'hook', 'quill', 'bat', 'penguin', 'fist']);
/** A sagging rope (tow hook, tether). */
function fxRope(g: Graphics, x0: number, y0: number, x1: number, y1: number) {
  const n = 10;
  const sag = Math.max(0, 1.2 - Math.hypot(x1 - x0, y1 - y0) * 0.1);
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    pts.push(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * sag);
  }
  g.poly(pts, false).stroke({ color: 0x3a3028, width: 0.08 });
}
const shadeHex = (c: number, f: number) => (Math.round(((c >> 16) & 255) * f) << 16) | (Math.round(((c >> 8) & 255) * f) << 8) | Math.round((c & 255) * f);
const DUST: Record<string, number> = { meadow: 0xb08a5a, foundry: 0x8a8a96, sawmill: 0xc49a64, sky: 0xb08a5a, ice: 0xe8f6ff, neon: 0x7a5aa8, desert: 0xf0cc80, moon: 0xb4b2c0 };
const lerpAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};

export function altPalette(p: CarPalette): CarPalette {
  const sh = (c: string) => '#' + toHex(hueShift(hex(c), 150)).toString(16).padStart(6, '0');
  return { ...p, body: sh(p.body), accent: sh(p.accent) };
}

const texCache = new Map<string, Texture>();
function cached(key: string, make: () => Texture): Texture {
  let t = texCache.get(key);
  if (!t) {
    t = make();
    texCache.set(key, t);
  }
  return t;
}

export function carTexture(def: CarDef, alt = false): { tex: Texture; ox: number; oy: number } {
  const grid = generateCarGrid(def);
  const pal = alt ? altPalette(def.palette) : def.palette;
  const tex = cached(`car:${def.id}:${alt}`, () => gridTexture(grid, carPalette(pal)));
  return { tex, ox: grid.ox, oy: grid.oy };
}

class CarView {
  readonly root = new Container();
  readonly body = new Container();
  readonly wheels: Sprite[] = [];
  readonly head: Sprite;
  readonly torso: Sprite;
  readonly flame: Sprite;
  readonly marker: Sprite;
  readonly flail: Sprite | null = null;
  readonly chain = new Graphics();
  /** Moving pieces, then their wheels (same order as Car.links / Car.linkWheels). */
  readonly links: Container[] = [];

  constructor(readonly car: Car, alt: boolean) {
    const def = car.def;
    const pal = alt ? altPalette(def.palette) : def.palette;
    const { tex, ox, oy } = carTexture(def, alt);
    const s = new Sprite(tex);
    s.anchor.set(ox / tex.width, oy / tex.height);
    s.scale.set(1 / CAR_PPM);

    const dpal = driverPalette(PLAYER_COLORS[car.player]);
    const hg = generateHeadGrid(def.head.r);
    this.head = new Sprite(cached(`head:${def.head.r}:${car.player}`, () => gridTexture(hg, dpal)));
    this.head.anchor.set(0.5);
    this.head.scale.set(1 / CAR_PPM);
    this.head.position.set(def.head.x, def.head.y);
    const tg = generateTorsoGrid(def.head.r);
    this.torso = new Sprite(cached(`torso:${def.head.r}:${car.player}`, () => gridTexture(tg, dpal)));
    this.torso.anchor.set(tg.ox / tg.w, 0);
    this.torso.scale.set(1 / CAR_PPM);
    this.torso.position.set(def.head.x - def.head.r * 0.1, def.head.y + def.head.r * 0.6);

    this.flame = new Sprite(whiteTexture());
    this.flame.anchor.set(1, 0.5);
    this.flame.tint = 0xffa030;
    this.flame.visible = false;

    this.body.addChild(this.flame, this.torso, s, this.head);
    this.body.scale.x = car.facing;

    for (const wd of def.wheels) {
      const wg = generateWheelGrid(wd);
      const ws = new Sprite(cached(`wheel:${def.id}:${wd.r}:${wd.rim}:${alt}`, () => gridTexture(wg, wheelPalette(pal))));
      ws.anchor.set(0.5);
      ws.scale.set(1 / CAR_PPM);
      ws.visible = !wd.hidden;
      this.wheels.push(ws);
    }
    this.marker = new Sprite(pixelText(PLAYER_NAMES[car.player], { size: 8, color: PLAYER_COLORS[car.player] }));
    this.marker.anchor.set(0.5, 1);
    this.marker.scale.set(1 / ART_PPM);
    const behind: Container[] = [], front: Container[] = [];
    (def.links ?? []).forEach((ld, i) => {
      const lg = generateLinkGrid(def, i);
      const ls = new Sprite(cached(`link:${def.id}:${i}:${alt}`, () => gridTexture(lg, carPalette(pal))));
      ls.anchor.set(lg.ox / lg.w, lg.oy / lg.h);
      ls.scale.set(1 / CAR_PPM);
      const box = new Container();
      box.addChild(ls);
      box.scale.x = car.facing;
      if (def.headOn === i) { box.addChildAt(this.torso, 0); box.addChild(this.head); }
      this.links.push(box);
      (ld.behind ? behind : front).push(box);
    });
    for (const lw of car.linkWheels) {
      const wg = generateWheelGrid(lw.def);
      const ws = new Sprite(cached(`wheel:${def.id}:${lw.def.r}:${lw.def.rim}:${alt}`, () => gridTexture(wg, wheelPalette(pal))));
      ws.anchor.set(0.5);
      ws.scale.set(1 / CAR_PPM);
      ws.visible = !lw.def.hidden;
      this.links.push(ws);
      front.push(ws);
    }
    this.root.addChild(this.chain, ...behind, this.body, ...this.wheels, ...front, this.marker);
    if (def.flail) {
      const fl = def.flail;
      this.flail = new Sprite(cached(`flail:${fl.look}:${fl.r}`, () => gridTexture(flailGrid(fl.look, fl.r, CAR_PPM), DECOR_PAL)));
      this.flail.anchor.set(0.5);
      this.flail.scale.set(1 / CAR_PPM);
      this.root.addChild(this.flail);
    }
  }

  sync(alpha: number, time: number) {
    const c = this.car;
    const bodies = c.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      const p = c.prev[i] ?? { x: b.getPosition().x, y: b.getPosition().y, a: b.getAngle() };
      const cur = b.getPosition();
      const x = lerp(p.x, cur.x, alpha), y = lerp(p.y, cur.y, alpha), a = lerpAngle(p.a, b.getAngle(), alpha);
      const target = i === 0 ? this.body : this.wheels[i - 1];
      target.position.set(x, y);
      target.rotation = a;
    }
    if (this.links.length) {
      const extra = [...c.links, ...c.linkWheels.map((w) => w.body)];
      for (let i = 0; i < extra.length; i++) {
        const b = extra[i], cur = b.getPosition();
        const p = c.prevExtra[i] ?? { x: cur.x, y: cur.y, a: b.getAngle() };
        this.links[i].position.set(lerp(p.x, cur.x, alpha), lerp(p.y, cur.y, alpha));
        this.links[i].rotation = lerpAngle(p.a, b.getAngle(), alpha);
      }
    }
    if (this.flail && c.flail) {
      const fp = c.flail.getPosition();
      this.flail.position.set(fp.x, fp.y);
      this.flail.rotation = c.flail.getAngle();
      const fl = c.def.flail!;
      const a = (fl.on !== undefined ? c.links[fl.on] : c.chassis).getWorldPoint(new Vec2(fl.at[0] * c.facing, fl.at[1]));
      const ch = this.chain.clear();
      const n = Math.max(3, Math.round(Vec2.distance(a, fp) / 0.22));
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        ch.rect(a.x + (fp.x - a.x) * k - 0.06, a.y + (fp.y - a.y) * k - 0.06, 0.12, 0.12).fill({ color: i % 2 ? 0x5a5e6c : 0x9aa0ae });
      }
    }
    // Ghost mode flickers, invisibility nearly hides; frozen / zapped cars get a tint.
    this.root.alpha = c.invisT > 0 ? (c.invisT < 0.4 ? 0.5 : 0.06 + 0.04 * Math.sin(time * 9)) : c.phaseT > 0 ? 0.35 + 0.15 * Math.sin(time * 30) : 1;
    const tint = c.stunT > 0 ? (c.stunLook === 'zap' ? (Math.sin(time * 40) > 0 ? 0xfff6a0 : 0xffffff) : c.stunLook === 'web' ? 0xdadada : 0xa8e4ff)
      : c.stasisT > 0 ? 0x90c8ff
      : c.heavyT > 0 || c.shellT > 0 ? 0x9a9aa8
      : c.reflectT > 0 ? (Math.sin(time * 16) > 0 ? 0xd8f4ff : 0xffffff)
      : c.slowT > 0 ? 0x8a7aa0
      : c.confuseT > 0 ? (Math.sin(time * 10) > 0 ? 0xe0b0ff : 0xffffff)
      : 0xffffff;
    this.body.tint = tint;
    const puff = c.puffT > 0 ? 1 + 0.25 * Math.sin(Math.min(1, (0.9 - c.puffT) / 0.25) * Math.PI * 0.5) : 1;
    this.body.scale.set(c.facing * puff, puff);
    const alive = c.alive;
    this.head.visible = alive;
    this.torso.visible = alive;
    this.marker.visible = alive && c.invisT <= 0;
    this.marker.position.set(this.body.x, this.body.y - 2.1 + Math.sin(time * 4) * 0.08);
    const def = c.def;
    if (c.boosting) {
      const b = def.body.find((p) => p.mat === 'rocket');
      const minX = b ? Math.min(...b.pts.map((q) => q[0])) : -1.5;
      const midY = b ? b.pts.reduce((s, q) => s + q[1], 0) / b.pts.length : 0;
      this.flame.visible = true;
      this.flame.position.set(minX, midY);
      this.flame.width = 0.5 + Math.random() * 0.5;
      this.flame.height = 0.22 + Math.random() * 0.08;
      this.flame.tint = Math.random() > 0.5 ? 0xffd040 : 0xff7020;
    } else this.flame.visible = false;
  }
}

export class GameView {
  readonly bgLayer = new Container();
  readonly world = new Container();
  readonly hud = new Container();
  readonly touchLayer = new Graphics();
  readonly touchLabels = new Container();
  readonly particles = new Particles();
  private mapLayer = new Container();
  private dynLayer = new Container();
  /** Cargo still in a bed sits behind the car bodies, so bed walls and closed bodies hide it. */
  private stowLayer = new Container();
  /** Loose items (spilled cargo, drops) sit in front of the cars. */
  private itemLayer = new Container();
  private carLayer = new Container();
  private fxLayer = new Container();
  private flash = new Graphics();
  private ringGfx = new Graphics();
  private rings: { x: number; y: number; t: number; r?: number; color?: number }[] = [];
  private bolts: { x: number; y: number; t: number }[] = [];
  private beamSprites: Sprite[] = [];
  private fxGfx = new Graphics();
  private shotSprites = new Map<number, Sprite>();
  private carViews: CarView[] = [];
  private ragdollSprites: { head: Sprite; torso: Sprite }[] = [];
  private platforms: Sprite[] = [];
  private saws: Sprite[] = [];
  private ballSprites = new Map<object, Sprite>();
  private ghostSprites = new Map<number, Sprite>();
  private wallSprites: Container[] = [];
  private blocks = new Map<object, Sprite>();
  private itemSprites = new Map<number, Sprite>();
  private riseLava: TilingSprite | null = null;
  private riseTop: TilingSprite | null = null;
  private lavaTiles: TilingSprite[] = [];
  private bgSprites: { sprite: TilingSprite; factor: number; bottom: number; h: number; fill: Graphics; hang?: boolean }[] = [];
  private sky: Sprite | null = null;
  private cam: Cam = { x: 0, y: 0, zoom: 30 };
  private game: Game | null = null;
  private currentMap: MapDef | null = null;
  private trauma = 0;
  private flashA = 0;
  private time = 0;
  private hudScore: Sprite[] = [];
  private hudTimer = new Sprite();
  private hudCenter = new Sprite();
  private hudSub = new Sprite();
  private centerT = 0;
  private lastTimerText = '';
  private scoreKey = '';
  private snapCam = true;
  showTouch = false;
  debug = false;
  private debugGfx = new Graphics();

  constructor(readonly app: Application, readonly input: InputManager) {
    this.world.addChild(this.mapLayer, this.dynLayer, this.stowLayer, this.carLayer, this.itemLayer, this.particles.container, this.ringGfx, this.fxGfx, this.fxLayer, this.debugGfx);
    app.stage.addChild(this.bgLayer, this.world, this.flash, this.hud, this.touchLayer, this.touchLabels);
    for (let i = 0; i < 3; i++) {
      const s = new Sprite();
      s.anchor.set(0.5, 0);
      this.hudScore.push(s);
      this.hud.addChild(s);
    }
    this.hudTimer.anchor.set(0.5, 0);
    this.hudCenter.anchor.set(0.5);
    this.hudSub.anchor.set(0.5);
    this.hud.addChild(this.hudTimer, this.hudCenter, this.hudSub);
  }

  get pixelScale(): number {
    return Math.max(2, Math.round(this.app.screen.height / 160));
  }

  attach(game: Game) {
    this.game = game;
    game.on((e) => this.onEvent(e));
    this.buildRound();
  }

  private onEvent(e: GameEvent) {
    const g = this.game!;
    switch (e.type) {
      case 'roundStart':
        this.buildRound();
        this.setCenter(`РАУНД ${e.round}`, 1.2, g.cfg.randomCars ? `${g.cars[0].def.name}  vs  ${g.cars[1].def.name}` : e.map.name);
        break;
      case 'countdown':
        this.setCenter(String(e.n), 0.9);
        break;
      case 'go':
        this.setCenter('ВПЕРЕД!', 0.7);
        break;
      case 'impact': {
        const n = Math.min(24, Math.round(e.strength * 3));
        if (e.carCar) {
          this.particles.burst(e.x, e.y, n, { speed: 6 + e.strength, colors: [0xfff3a0, 0xffc040, 0xffffff], life: 0.35, size: 0.1, g: 20, drag: 2 });
          this.trauma = Math.min(1, this.trauma + Math.min(0.35, e.strength * 0.05));
        } else {
          // landing: dust puffs to both sides
          const dust = DUST[g.map.theme] ?? 0xc8b8a0;
          for (const dir of [-1, 1]) this.particles.burst(e.x, e.y, Math.ceil(n / 2), { speed: 2 + e.strength * 0.5, colors: [dust, shadeHex(dust, 0.85)], life: 0.6, size: 0.3, g: -1, drag: 3, dir: dir < 0 ? Math.PI + 0.25 : -0.25, spread: 0.6 });
          this.trauma = Math.min(1, this.trauma + Math.min(0.15, e.strength * 0.015));
        }
        break;
      }
      case 'death': {
        const col = toHex(hex(PLAYER_COLORS[e.player]));
        this.particles.burst(e.x, e.y, 46, { speed: 12, colors: [0xffffff, 0xfff080, 0xff9a30, 0xff4a20, col], life: 0.9, size: 0.22, g: 6, drag: 2.5 });
        this.particles.burst(e.x, e.y, 22, { speed: 4, colors: [0x403a48, 0x5a5464, 0x2a2630], life: 1.6, size: 0.45, g: -2, drag: 1.5 });
        this.trauma = 1;
        this.flashA = 0.55;
        this.rings.push({ x: e.x, y: e.y, t: 0 });
        break;
      }
      case 'portal': {
        const cols = [0xc07aff, 0xff7ad0, 0xffffff];
        this.particles.burst(e.from.x, e.from.y, 20, { speed: 5, colors: cols, life: 0.45, size: 0.16, g: 0, drag: 3 });
        this.particles.burst(e.x, e.y, 24, { speed: 6, colors: cols, life: 0.5, size: 0.18, g: 0, drag: 3 });
        this.rings.push({ x: e.x, y: e.y, t: 0, r: 2, color: 0xff7ad0 });
        break;
      }
      case 'goal':
        this.setCenter('ГОЛ!', 1.4, `здібність ${PLAYER_NAMES[1 - e.side]} заряджена`, PLAYER_COLORS[1 - e.side]);
        this.particles.burst(e.x, e.y - 1, 50, { speed: 9, colors: [0xff3a5a, 0xffd23f, 0x5ef0ff, 0xffffff, 0x8cff5a], life: 0.9, size: 0.16, g: 8, drag: 1 });
        break;
      case 'bolt':
        this.bolts.push({ x: e.x, y: e.y, t: 0 });
        this.flashA = Math.max(this.flashA, 0.35);
        this.trauma = Math.min(1, this.trauma + 0.3);
        break;
      case 'pad':
        this.particles.burst(e.x, e.y - 0.3, 18, { speed: 7, colors: [0xffe040, 0xffffff], life: 0.4, size: 0.12, dir: -Math.PI / 2, spread: 1.2, g: 10 });
        break;
      case 'suddenDeath':
        if (e.late) this.setCenter(e.kind === 'flood' ? 'ВОДА!' : 'ЛАВА!', 1.6, `час вийшов — ${e.kind === 'flood' ? 'вода' : 'лава'} піднімається`);
        else this.setCenter('РАПТОВА СМЕРТЬ', 2.2, SUDDEN_INFO[e.kind].sub);
        break;
      case 'ability': {
        const col = toHex(hex(PLAYER_COLORS[e.player]));
        const car = g.cars[e.player];
        if (e.kind === 'jump' || e.kind === 'stomp' || e.kind === 'ollie' || e.kind === 'backflip' || e.kind === 'moonjump' || e.kind === 'bounce' || e.kind === 'rear' || e.kind === 'pounce' || e.kind === 'hydraulics') this.particles.burst(e.x, e.y + 0.6, 16, { speed: 5, colors: [0xffffff, col], life: 0.4, size: 0.14, dir: Math.PI / 2, spread: 1.6, g: 4 });
        else if (e.kind === 'nitro' || e.kind === 'dash' || e.kind === 'drs' || e.kind === 'slide' || e.kind === 'frenzy' || e.kind === 'sting' || e.kind === 'gore' || e.kind === 'flip' || e.kind === 'bump' || e.kind === 'bite') {
          const f = car.forward();
          this.particles.burst(e.x - f.x * 1.6, e.y - f.y * 1.6, 22, { speed: 7, colors: [0xffd040, 0xff7020, 0xffffff], life: 0.35, size: 0.16, dir: Math.atan2(-f.y, -f.x), spread: 0.7, g: 0 });
        } else if (e.kind === 'shield') this.rings.push({ x: e.x, y: e.y - 0.6, t: 0, r: 1.6, color: 0x7fe0ff });
        else if (e.kind === 'phase') this.particles.burst(e.x, e.y - 0.3, 24, { speed: 3, colors: [0xffffff, 0xc8d8ff, 0x8090c0], life: 0.6, size: 0.2, g: -2, drag: 2 });
        else if (e.kind === 'blink') {
          const cols = [0xc07aff, 0x5ef0ff, 0xffffff];
          if (e.from) {
            this.particles.burst(e.from.x, e.from.y, 26, { speed: 5, colors: cols, life: 0.5, size: 0.18, g: 0, drag: 3 });
            this.rings.push({ x: e.from.x, y: e.from.y, t: 0, r: 1.8, color: 0xc07aff });
          }
          this.particles.burst(e.x, e.y, 26, { speed: 6, colors: cols, life: 0.5, size: 0.18, g: 0, drag: 3 });
          this.rings.push({ x: e.x, y: e.y, t: 0, r: 2.2, color: 0x5ef0ff });
        } else if (e.kind === 'swap' || e.kind === 'recall') {
          const cols = e.kind === 'swap' ? [0xc07aff, 0xffffff] : [0x5ef0ff, 0xffffff, 0x8090ff];
          if (e.from) this.particles.burst(e.from.x, e.from.y, 22, { speed: 4, colors: cols, life: 0.5, size: 0.16, g: 0, drag: 3 });
          this.particles.burst(e.x, e.y, 22, { speed: 5, colors: cols, life: 0.5, size: 0.16, g: 0, drag: 3 });
          this.rings.push({ x: e.x, y: e.y, t: 0, r: 2, color: cols[0] });
        } else if (e.kind === 'invis') this.particles.burst(e.x, e.y - 0.3, 26, { speed: 3, colors: [0xffffff, 0xc0e8ff], life: 0.5, size: 0.18, g: -1, drag: 2 });
        else if (e.kind === 'reflect' || e.kind === 'stasis') this.rings.push({ x: e.x, y: e.y - 0.3, t: 0, r: e.kind === 'stasis' ? 6 : 2, color: e.kind === 'stasis' ? 0x5ab0ff : 0xd8f4ff });
        else if (e.kind === 'beam') {
          this.particles.burst(e.x, e.y + 2, 30, { speed: 3, colors: [0x8cff5a, 0x5ef0ff, 0xffffff], life: 0.7, size: 0.16, dir: Math.PI / 2, spread: 0.5, g: -3 });
          this.rings.push({ x: e.x, y: e.y + 1.5, t: 0, r: 3.6, color: 0x8cff5a });
        } else if (e.kind === 'howl') this.particles.burst(e.x, e.y - 1, 20, { speed: 6, colors: [0xc07aff, 0xffffff], life: 0.5, size: 0.14, g: 0, drag: 2 });
        else if (e.kind === 'heavy' || e.kind === 'shell') this.particles.burst(e.x, e.y + 0.6, 18, { speed: 4, colors: [0xa8a8b8, 0xffffff], life: 0.4, size: 0.18, dir: Math.PI / 2, spread: 2.4, g: 6 });
        else if (e.kind === 'icewall') this.particles.burst(e.x + car.forward().x * 2.5, e.y, 20, { speed: 4, colors: [0xbfefff, 0xffffff], life: 0.5, size: 0.14, g: 2 });
        else if (e.kind === 'dump' || e.kind === 'drop') this.particles.burst(e.x, e.y + 0.3, 10, { speed: 3, colors: [0xd8c8a8, 0xffffff], life: 0.4, size: 0.16, g: 4 });
        else if (e.kind === 'fly' || e.kind === 'glide') this.particles.burst(e.x, e.y + 0.4, 20, { speed: 4, colors: [0xffffff, 0xc8f0ff], life: 0.6, size: 0.18, dir: Math.PI / 2, spread: 2, g: -1 });
        else if (e.kind === 'shoot') {
          const f = car.forward();
          this.particles.burst(e.x + f.x * 1.8, e.y + f.y * 1.8 - 0.3, 10, { speed: 4, colors: [0xffffff, 0xd0d0d8, 0xfff0a0], life: 0.35, size: 0.2, dir: Math.atan2(f.y, f.x), spread: 0.9, g: -1 });
          this.trauma = Math.min(1, this.trauma + 0.08);
        }
        break;
      }
      case 'blast': {
        if (e.kind === 'punch') {
          this.particles.burst(e.x, e.y, 16, { speed: 7, colors: [0xffffff, 0xfff3a0], life: 0.25, size: 0.14, g: 0, drag: 3 });
          this.rings.push({ x: e.x, y: e.y, t: 0, r: e.r, color: 0xffffff });
          this.trauma = Math.min(1, this.trauma + 0.25);
          break;
        }
        if (e.kind === 'roar' || e.kind === 'zap') {
          const col = e.kind === 'zap' ? 0xfff060 : 0xffffff;
          this.rings.push({ x: e.x, y: e.y, t: 0, r: e.r * 0.6, color: col });
          this.rings.push({ x: e.x, y: e.y, t: -0.12, r: e.r, color: col });
          if (e.kind === 'zap') this.particles.burst(e.x, e.y, 30, { speed: e.r * 2, colors: [0xfff060, 0xffffff, 0x5ef0ff], life: 0.3, size: 0.12, g: 0, drag: 3 });
          this.trauma = Math.min(1, this.trauma + 0.2);
          break;
        }
        const cols = e.kind === 'firework' ? [0xff3a5a, 0xffd23f, 0x5ef0ff, 0xffffff] : e.kind === 'bomb' ? [0xffffff, 0xffd040, 0xff7020, 0x403a48] : [0xd8c8a8, 0xa89880, 0xffffff];
        this.particles.burst(e.x, e.y, e.kind === 'slam' ? 34 : 40, { speed: e.r * 2.2, colors: cols, life: 0.55, size: 0.2, g: e.kind === 'slam' ? 8 : 4, drag: 2 });
        this.rings.push({ x: e.x, y: e.y, t: 0, r: e.r, color: e.kind === 'slam' ? 0xffffff : 0xffd060 });
        this.trauma = Math.min(1, this.trauma + (e.kind === 'firework' ? 0.2 : 0.45));
        break;
      }
      case 'effect': {
        const cols: Record<string, number[]> = {
          freeze: [0xbfefff, 0xffffff, 0x5ad0f0], stun: [0xfff060, 0xffffff], lift: [0x8fe8ff, 0xffffff], pull: [0xc8a060, 0xffffff], push: [0x5ab0ff, 0xffffff], web: [0xffffff, 0xd0d0d8],
          confuse: [0xc07aff, 0xffffff], stasis: [0x5ab0ff, 0xa8d8ff], slow: [0x241830, 0x6a4a8a], flat: [0x303038, 0xd0d0d8], spring: [0xffd23f, 0xff3a5a, 0xffffff],
          burn: [0xffd040, 0xff5020], tether: [0xc8a060, 0x9aa0ae], slip: [0xc89060, 0xffffff], medkit: [0xff4040, 0xffffff], reflect: [0xd8f4ff, 0xffffff],
        };
        this.particles.burst(e.x, e.y, 18, { speed: 5, colors: cols[e.effect], life: 0.4, size: 0.14, g: e.effect === 'push' ? 6 : 0, drag: 2 });
        break;
      }
      case 'shieldBlock':
        this.rings.push({ x: e.x, y: e.y, t: 0, r: 1.2, color: 0x7fe0ff });
        this.particles.burst(e.x, e.y, 16, { speed: 6, colors: [0x7fe0ff, 0xffffff], life: 0.35, size: 0.12, g: 0 });
        break;
      case 'shotHit':
        this.particles.burst(e.x, e.y, 12, { speed: 5, colors: e.proj === 'laser' ? [0x5ef0ff, 0xffffff] : [0xffffff, 0xd0d8e8], life: 0.3, size: 0.12, g: 6 });
        break;
      case 'roundEnd': {
        const r = e.result;
        if (r === 'draw') this.setCenter('НІЧИЯ', 2.4);
        else this.setCenter(`ОЧКО ${PLAYER_NAMES[r]}!`, 2.4, `${g.match.scores[0]} : ${g.match.scores[1]}`, PLAYER_COLORS[r]);
        break;
      }
      case 'matchEnd':
        this.setCenter(`ПЕРЕМОГА ${PLAYER_NAMES[e.winner]}!`, 999, `${g.match.scores[0]} : ${g.match.scores[1]}`, PLAYER_COLORS[e.winner]);
        break;
    }
  }

  /** Closing walls, ghosts, bomb warnings, blizzard snow. */
  private renderSudden(simDt: number) {
    const g = this.game!;
    const a = g.arena;
    const b = g.map.bounds;
    this.fxGfx.clear();
    // walls
    if (a.walls.length && !this.wallSprites.length) {
      const hgt = (b.y1 - b.y0) + 24;
      for (let i = 0; i < a.walls.length; i++) {
        const c = new Container();
        const plate = new TilingSprite({ texture: cached('wall', () => gridTexture(wallGrid(), PROP_PAL)), width: 2.4 * ART_PPM, height: hgt * ART_PPM });
        plate.scale.set(1 / ART_PPM);
        plate.position.set(-1.2, -hgt / 2);
        const strip = new TilingSprite({ texture: cached('hazardStrip', () => gridTexture(hazardStripGrid(), PROP_PAL)), width: 6, height: hgt * ART_PPM });
        strip.scale.set(1 / ART_PPM);
        // inner edge faces the arena center
        strip.position.set(i === 0 ? 1.2 - 6 / ART_PPM : -1.2, -hgt / 2);
        c.addChild(plate, strip);
        this.fxLayer.addChild(c);
        this.wallSprites.push(c);
      }
    }
    a.walls.forEach((w, i) => {
      const p = w.getPosition();
      this.wallSprites[i]?.position.set(p.x, p.y);
      if (w.getLinearVelocity().x !== 0 && Math.random() < 0.3) this.particles.spawn(p.x + (i === 0 ? 1.2 : -1.2), p.y + (Math.random() - 0.5) * 12, { vx: (i === 0 ? 1 : -1) * 2, life: 0.3, size: 0.12, color: 0xffd040 });
    });
    // ghosts
    const live = new Set<number>();
    for (const gh of a.ghosts) {
      live.add(gh.id);
      let sp = this.ghostSprites.get(gh.id);
      if (!sp) {
        const grid = decorGrid('ghost');
        sp = new Sprite(cached('decor:ghost', () => gridTexture(grid, DECOR_PAL)));
        sp.anchor.set(0.5);
        sp.scale.set((gh.vx < 0 ? -1.3 : 1.3) / ART_PPM, 1.3 / ART_PPM);
        sp.alpha = 0.85;
        this.dynLayer.addChild(sp);
        this.ghostSprites.set(gh.id, sp);
      }
      const p = gh.body.getPosition();
      sp.position.set(p.x, p.y);
      if (Math.random() < 0.25) this.particles.spawn(p.x - Math.sign(gh.vx) * 0.6, p.y + 0.4, { life: 0.4, size: 0.14, color: 0xd8e4ff });
    }
    for (const [id, sp] of this.ghostSprites) if (!live.has(id)) {
      sp.destroy();
      this.ghostSprites.delete(id);
    }
    // bomb warnings: blinking target + the bomb itself
    const fx = this.fxGfx;
    for (const bm of a.bombs) {
      const blink = Math.sin(this.time * (10 + (1.25 - bm.t) * 20)) > 0;
      fx.circle(bm.x, bm.y, 3.8 * (0.5 + bm.t * 0.4)).stroke({ color: 0xff3a3a, width: 0.12, alpha: blink ? 0.9 : 0.35 });
      fx.circle(bm.x, bm.y - 0.35, 0.38).fill({ color: 0x1e1c24 });
      fx.rect(bm.x - 0.05, bm.y - 0.95, 0.1, 0.25).fill({ color: blink ? 0xffd040 : 0xff7020 });
    }
    // blizzard snow, low-gravity sparkles
    if (a.sudden === 'blizzard') {
      for (let i = 0; i < 4; i++) this.particles.spawn(b.x0 + Math.random() * (b.x1 - b.x0), b.y0 + Math.random() * 4, { vx: a.wind * 0.9, vy: 4 + Math.random() * 2, life: 3, size: 0.1 + Math.random() * 0.08, color: 0xffffff, shrink: false });
    } else if (a.sudden === 'lowgrav' && Math.random() < 0.4) {
      this.particles.spawn(b.x0 + Math.random() * (b.x1 - b.x0), b.y1 - Math.random() * (b.y1 - b.y0), { vy: -0.8, life: 1.6, size: 0.1, color: 0xc8a8ff });
    }
    void simDt;
  }

  /** Projectiles, shields, flight sparkles and the ability charge bar over each car. */
  private renderAbilities(alpha: number, simDt: number) {
    const g = this.game!;
    const live = new Set<number>();
    for (const sh of g.shots) {
      live.add(sh.id);
      let sp = this.shotSprites.get(sh.id);
      if (!sp) {
        const pr = PROJECTILES[sh.proj];
        const grid = shotGrid(sh.proj, pr.r, ART_PPM);
        sp = new Sprite(cached(`shot:${sh.proj}`, () => gridTexture(grid, DECOR_PAL)));
        sp.anchor.set(0.5);
        sp.scale.set(1 / ART_PPM);
        this.dynLayer.addChild(sp);
        this.shotSprites.set(sh.id, sp);
      }
      const p = sh.body.getPosition(), v = sh.body.getLinearVelocity();
      sp.position.set(p.x, p.y);
      const along = ALONG.has(sh.proj);
      sp.rotation = along ? Math.atan2(v.y, v.x) : sh.body.getAngle();
      if (sh.proj === 'fire') {
        const age = (g.time - sh.born) / PROJECTILES.fire.life;
        sp.scale.set((0.8 + age * 0.9) / ART_PPM);
        sp.alpha = 1 - age * 0.6;
      }
      if ((sh.proj === 'seeker' || sh.proj === 'volley' || sh.proj === 'torpedo') && Math.random() < 0.7) this.particles.spawn(p.x, p.y, { vx: -v.x * 0.1, vy: -v.y * 0.1, life: 0.35, size: 0.14, color: Math.random() > 0.5 ? 0xd0d0d8 : 0xff8020 });
      if ((sh.proj === 'plasma' || sh.proj === 'atom') && Math.random() < 0.6) this.particles.spawn(p.x, p.y, { life: 0.3, size: 0.16, color: sh.proj === 'atom' ? 0x8cff5a : 0xff7ad0 });
      if (sh.proj === 'railgun' && Math.random() < 0.9) this.particles.spawn(p.x, p.y, { life: 0.25, size: 0.1, color: 0xc07aff });
      if (sh.proj === 'ink' && Math.random() < 0.5) this.particles.spawn(p.x, p.y, { vy: 1, life: 0.4, size: 0.14, color: 0x1a1022 });
      if (sh.proj === 'hook') {
        const o = g.cars[sh.owner].position;
        fxRope(this.fxGfx, o.x, o.y - 0.3, p.x, p.y);
      }
      if (sh.proj === 'missile' && Math.random() < 0.8) this.particles.spawn(p.x, p.y, { vx: -v.x * 0.1, vy: -v.y * 0.1, life: 0.4, size: 0.16, color: Math.random() > 0.5 ? 0xd0d0d8 : 0xff8020 });
      if (sh.proj === 'fire' && Math.random() < 0.5) this.particles.spawn(p.x, p.y, { vy: -1.5, life: 0.25, size: 0.14, color: Math.random() > 0.5 ? 0xffd040 : 0xff5020 });
      if (sh.proj === 'firework' && Math.random() < 0.8) this.particles.spawn(p.x, p.y, { vx: -v.x * 0.1, vy: -v.y * 0.1, life: 0.3, size: 0.12, color: Math.random() > 0.5 ? 0xffd040 : 0xff5020 });
      if ((sh.proj === 'laser' || sh.proj === 'zap') && Math.random() < 0.5) this.particles.spawn(p.x, p.y, { life: 0.15, size: 0.1, color: sh.proj === 'zap' ? 0xfff060 : 0x5ef0ff });
    }
    for (const [id, sp] of this.shotSprites) if (!live.has(id)) {
      sp.destroy();
      this.shotSprites.delete(id);
    }
    const liveItems = new Set<number>();
    for (const it of g.items) {
      liveItems.add(it.id);
      let sp = this.itemSprites.get(it.id);
      if (!sp) {
        const info = ITEMS[it.kind];
        sp = new Sprite(cached(`item:${it.kind}`, () => gridTexture(itemGrid(it.kind, info.w, info.h, ART_PPM), DECOR_PAL)));
        sp.anchor.set(0.5);
        sp.scale.set(1 / ART_PPM);
        this.itemLayer.addChild(sp);
        this.itemSprites.set(it.id, sp);
      }
      const layer = it.stowed ? this.stowLayer : this.itemLayer;
      if (sp.parent !== layer) layer.addChild(sp);
      const p = it.body.getPosition();
      sp.position.set(p.x, p.y);
      sp.rotation = it.body.getAngle();
      if (it.fuse !== undefined) {
        sp.tint = Math.sin(this.time * (8 + (1.5 - it.fuse) * 14)) > 0 ? 0xffffff : 0xff8060;
        if (Math.random() < 0.5) this.particles.spawn(p.x, p.y - 0.3, { vy: -1, life: 0.2, size: 0.08, color: 0xffd040 });
      }
      if (it.kind === 'mine') sp.tint = Math.sin(this.time * 6) > 0.6 ? 0xff8080 : 0xffffff;
      if (it.kind === 'flame') {
        sp.scale.set(1 / ART_PPM, (0.8 + 0.4 * Math.random()) / ART_PPM);
        if (Math.random() < 0.3) this.particles.spawn(p.x, p.y - 0.1, { vy: -2, life: 0.3, size: 0.1, color: Math.random() > 0.5 ? 0xffd040 : 0xff5020 });
      }
      if (it.kind === 'concrete') sp.tint = it.body.getType() === 'static' ? 0xb8b8c0 : 0xffffff;
    }
    for (const [id, sp] of this.itemSprites) if (!liveItems.has(id)) {
      sp.destroy();
      this.itemSprites.delete(id);
    }
    const fx = this.fxGfx; // cleared in renderSudden, which runs first
    for (const c of g.cars) {
      if (!c.alive) continue;
      const hp = c.headWorld();
      if (c.shieldT > 0) {
        const a = 0.35 + 0.25 * Math.sin(this.time * 18);
        fx.circle(hp.x, hp.y, c.def.head.r + 0.35).fill({ color: 0x7fe0ff, alpha: a * 0.5 }).stroke({ color: 0xc8f4ff, width: 0.08, alpha: a + 0.3 });
      }
      if (c.flyT > 0 && Math.random() < 0.6) {
        const p = c.position;
        this.particles.spawn(p.x + (Math.random() - 0.5) * 2, p.y + 0.8, { vy: 2, life: 0.4, size: 0.12, color: 0xffffff });
      }
      if (c.stunT > 0 && Math.random() < 0.5) {
        const p = c.position;
        const col = c.stunLook === 'zap' ? 0xfff060 : c.stunLook === 'web' ? 0xffffff : 0xbfefff;
        this.particles.spawn(p.x + (Math.random() - 0.5) * 2.4, p.y + (Math.random() - 0.5) * 1.2, { life: 0.25, size: 0.1, color: col });
      }
      if (c.liftT > 0) {
        const p = c.position;
        fx.circle(p.x, p.y - 0.3, 2.1).fill({ color: 0x8fe8ff, alpha: 0.18 }).stroke({ color: 0xd8f8ff, width: 0.08, alpha: 0.6 });
      }
      if (c.reflectT > 0) {
        const p = c.position;
        const a = 0.4 + 0.3 * Math.sin(this.time * 20);
        fx.poly([p.x, p.y - 2.2, p.x + 2.2, p.y - 0.3, p.x, p.y + 1.6, p.x - 2.2, p.y - 0.3]).stroke({ color: 0xd8f4ff, width: 0.08, alpha: a });
      }
      if (c.stasisT > 0) {
        const p = c.position;
        fx.rect(p.x - 2, p.y - 1.8, 4, 3).fill({ color: 0x5ab0ff, alpha: 0.18 }).stroke({ color: 0xa8d8ff, width: 0.08, alpha: 0.7 });
      }
      if (c.confuseT > 0 && Math.random() < 0.3) {
        this.particles.spawn(hp.x + (Math.random() - 0.5) * 0.8, hp.y - 0.5, { vy: -1, life: 0.4, size: 0.12, color: 0xc07aff });
      }
      if (c.slowT > 0 && Math.random() < 0.3) {
        const p = c.position;
        this.particles.spawn(p.x + (Math.random() - 0.5) * 2, p.y + 0.3, { vy: 2, life: 0.4, size: 0.12, color: 0x241830 });
      }
      if (c.glideT > 0 && Math.random() < 0.4) {
        const p = c.position;
        this.particles.spawn(p.x + (Math.random() - 0.5) * 2.4, p.y - 0.2, { vx: -c.chassis.getLinearVelocity().x * 0.2, life: 0.35, size: 0.1, color: 0xffffff });
      }
      if (c.turboT > 0 && Math.random() < 0.6) {
        const p = c.position;
        const f = c.forward();
        this.particles.spawn(p.x - f.x * 1.8, p.y - f.y * 1.8, { vx: -f.x * 4, life: 0.25, size: 0.12, color: 0x9ae8ff });
      }
      if (c.strikeT > 0 && Math.random() < 0.7) {
        const p = c.position;
        const f = c.forward();
        this.particles.spawn(p.x + f.x * 1.6, p.y + f.y * 1.6 - 0.2, { life: 0.15, size: 0.14, color: c.strikeFx === 'sting' ? 0xfff060 : 0xffffff });
      }
      if (c.slamming) {
        const p = c.position;
        this.particles.spawn(p.x + (Math.random() - 0.5), p.y - 0.5, { vy: -4, life: 0.25, size: 0.2, color: 0xfff0c0 });
      }
      // charge bar under the P1/P2 marker
      const view = this.carViews[c.player];
      if (!view || !c.ability) continue;
      const mx = view.marker.x, my = view.marker.y + 0.18;
      const k = c.abilityCharge;
      const col = toHex(hex(PLAYER_COLORS[c.player]));
      fx.rect(mx - 0.6, my, 1.2, 0.16).fill({ color: 0x0c0914, alpha: 0.7 });
      fx.rect(mx - 0.56, my + 0.04, 1.12 * k, 0.08).fill({ color: k >= 1 ? (Math.sin(this.time * 8) > 0 ? 0xffffff : col) : col, alpha: k >= 1 ? 1 : 0.6 });
    }
    for (const t of g.tethers) {
      const a = g.cars[t.a].position, b = g.cars[t.b].position;
      fxRope(fx, a.x, a.y - 0.3, b.x, b.y - 0.3);
    }
    for (const st of g.strikes) {
      const a = 0.3 + 0.4 * Math.abs(Math.sin(this.time * 14));
      fx.circle(st.x, st.y + 0.6, 1.8).stroke({ color: 0xfff060, width: 0.1, alpha: a });
      fx.ellipse(st.x, st.y - 7, 2.2, 0.8).fill({ color: 0x40384a, alpha: 0.8 });
    }
    this.bolts = this.bolts.filter((b) => (b.t += simDt) < 0.25);
    for (const b of this.bolts) {
      let x = b.x, y = b.y - 9;
      const pts = [x, y];
      while (y < b.y) {
        y += 0.9;
        x = b.x + (Math.random() - 0.5) * 0.9;
        pts.push(x, Math.min(y, b.y));
      }
      fx.poly(pts, false).stroke({ color: 0xfff6a0, width: 0.16, alpha: 1 - b.t * 4 });
    }
    // Tractor beams flicker with the arena's on/off cycle.
    for (const s of this.beamSprites) s.alpha = g.arena.beamOn ? 0.75 + 0.25 * Math.sin(this.time * 12) : 0.12;
    this.renderFields(fx);
    void alpha;
  }

  /** Energy fields and pendulum chains (drawn every frame, they animate). */
  private renderFields(fx: Graphics) {
    const g = this.game!;
    const t = this.time;
    for (const f of g.arena.fields) {
      const d = f.def;
      if (d.kind === 'lift') {
        const a = f.on ? 1 : 0.25;
        fx.rect(d.x, d.y, d.w, d.h).fill({ color: 0x7ae8ff, alpha: 0.16 * a });
        for (let i = 0; i < 6; i++) {
          const k = ((t * 0.6 + i / 6) % 1);
          const y = d.y + d.h - k * d.h;
          fx.rect(d.x + 0.1, y, d.w - 0.2, 0.08).fill({ color: 0xc8f8ff, alpha: 0.5 * a * (1 - k) });
        }
        fx.rect(d.x - 0.05, d.y, 0.08, d.h).fill({ color: 0xa8f0ff, alpha: 0.35 * a });
        fx.rect(d.x + d.w - 0.03, d.y, 0.08, d.h).fill({ color: 0xa8f0ff, alpha: 0.35 * a });
        fx.roundRect(d.x - 0.3, d.y + d.h - 0.18, d.w + 0.6, 0.3, 0.1).fill({ color: 0x4a5a72 }).stroke({ color: 0x141820, width: 0.06 });
        fx.rect(d.x - 0.1, d.y + d.h - 0.1, d.w + 0.2, 0.08).fill({ color: 0x7ae8ff, alpha: 0.6 + 0.4 * Math.sin(t * 6) });
      } else if (d.kind === 'bounce') {
        fx.rect(d.x, d.y, d.w, d.h).fill({ color: 0x5aff7a, alpha: 0.22 + 0.06 * Math.sin(t * 5) });
        const vertical = d.h > d.w;
        const n = Math.ceil((vertical ? d.h : d.w) / 0.5);
        for (let i = 0; i < n; i++) {
          const k = (i / n + t * 0.4) % 1;
          if (vertical) fx.rect(d.x, d.y + k * d.h, d.w, 0.06).fill({ color: 0xc8ffc8, alpha: 0.5 });
          else fx.rect(d.x + k * d.w, d.y, 0.06, d.h).fill({ color: 0xc8ffc8, alpha: 0.5 });
        }
        fx.rect(d.x, d.y, d.w, d.h).stroke({ color: 0x9aff9a, width: 0.06, alpha: 0.9 });
      } else {
        const vertical = d.h > d.w;
        const cx = d.x + d.w / 2, cy = d.y + d.h / 2;
        if (f.on) {
          const flick = 0.75 + 0.25 * Math.sin(t * 40);
          if (vertical) {
            fx.rect(cx - 0.22, d.y, 0.44, d.h).fill({ color: 0xff3a3a, alpha: 0.18 * flick });
            fx.rect(cx - 0.09, d.y, 0.18, d.h).fill({ color: 0xff5a4a, alpha: 0.85 * flick });
            fx.rect(cx - 0.03, d.y, 0.06, d.h).fill({ color: 0xffe8e0, alpha: flick });
          } else {
            fx.rect(d.x, cy - 0.22, d.w, 0.44).fill({ color: 0xff3a3a, alpha: 0.18 * flick });
            fx.rect(d.x, cy - 0.09, d.w, 0.18).fill({ color: 0xff5a4a, alpha: 0.85 * flick });
            fx.rect(d.x, cy - 0.03, d.w, 0.06).fill({ color: 0xffe8e0, alpha: flick });
          }
        } else {
          // warning: the beam is about to switch on
          const c = d.cycle;
          const left = c ? c[0] + c[1] - ((g.arena.time + (d.phase ?? 0)) % (c[0] + c[1])) : 9;
          const blink = left < 0.8 && Math.sin(t * 30) > 0;
          if (vertical) fx.rect(cx - 0.02, d.y, 0.04, d.h).fill({ color: 0xff5a4a, alpha: blink ? 0.6 : 0.15 });
          else fx.rect(d.x, cy - 0.02, d.w, 0.04).fill({ color: 0xff5a4a, alpha: blink ? 0.6 : 0.15 });
        }
        // emitters at both ends
        const em = (x: number, y: number) => fx.roundRect(x - 0.22, y - 0.22, 0.44, 0.44, 0.08).fill({ color: 0x5a6478 }).stroke({ color: 0x141820, width: 0.06 });
        if (vertical) { em(cx, d.y); em(cx, d.y + d.h); } else { em(d.x, cy); em(d.x + d.w, cy); }
        const lamp = (x: number, y: number) => fx.circle(x, y, 0.09).fill({ color: f.on ? 0xff3a3a : 0x5a1a1a });
        if (vertical) { lamp(cx, d.y); lamp(cx, d.y + d.h); } else { lamp(d.x, cy); lamp(d.x + d.w, cy); }
      }
    }
    for (const s of g.arena.saws) {
      if (!s.def.swing) continue;
      const p = s.body.getPosition();
      const n = Math.max(2, Math.round(Math.hypot(p.x - s.def.x, p.y - s.def.y) / 0.25));
      for (let i = 0; i < n; i++) {
        const k = (i + 0.5) / n;
        fx.circle(s.def.x + (p.x - s.def.x) * k, s.def.y + (p.y - s.def.y) * k, 0.07).fill({ color: i % 2 ? 0x8a92a0 : 0xb8c0cc }).stroke({ color: 0x1a1c24, width: 0.03 });
      }
      fx.circle(s.def.x, s.def.y, 0.2).fill({ color: 0x6a7280 }).stroke({ color: 0x14161c, width: 0.06 });
      fx.circle(s.def.x, s.def.y, 0.07).fill({ color: 0x2a2c34 });
    }
  }

  private setCenter(text: string, dur: number, sub = '', color = '#ffffff') {
    this.centerT = dur;
    this.hudCenter.texture = pixelText(text, { size: 12, color });
    this.hudSub.texture = sub ? pixelText(sub, { size: 8, color: '#ffffff' }) : Texture.EMPTY;
    this.hudCenter.visible = true;
    this.hudSub.visible = !!sub;
  }

  private buildRound() {
    const g = this.game!;
    if (this.currentMap !== g.map) this.buildMap(g.map);
    // dynamic props tied to this round's physics bodies
    this.dynLayer.removeChildren();
    this.platforms = g.arena.platforms.map((p) => {
      const s = new Sprite(cached(`plate:${p.def.w}x${p.def.h}`, () => gridTexture(plateGrid(p.def.w, p.def.h), PROP_PAL)));
      s.anchor.set(0.5);
      s.scale.set(1 / ART_PPM);
      this.dynLayer.addChild(s);
      return s;
    });
    this.saws = g.arena.saws.map((sw) => {
      const s = new Sprite(cached(`saw:${sw.def.r}`, () => gridTexture(sawGrid(sw.def.r), PROP_PAL)));
      s.anchor.set(0.5);
      s.scale.set(1 / ART_PPM);
      this.dynLayer.addChild(s);
      return s;
    });
    this.ballSprites.clear();
    this.ghostSprites.clear();
    this.wallSprites = [];
    this.blocks.clear();
    for (const sp of this.itemSprites.values()) sp.destroy();
    this.itemSprites.clear();
    // Sudden-death lava belongs to the previous round: remove its sprites too.
    for (const c of this.fxLayer.removeChildren()) c.destroy();
    this.riseLava = null;
    this.riseTop = null;
    this.carLayer.removeChildren();
    const sameCar = g.cars[0].def.id === g.cars[1].def.id;
    this.carViews = g.cars.map((c) => new CarView(c, sameCar && c.player === 1));
    for (const cv of this.carViews) this.carLayer.addChild(cv.root);
    this.ragdollSprites = [];
    this.particles.clear();
    this.snapCam = true;
  }

  private buildMap(map: MapDef) {
    this.currentMap = map;
    this.mapLayer.removeChildren();
    const art = generateTerrain(map);
    const terrain = new Sprite(cached(`terrain:${map.id}`, () => gridTexture(art.grid, art.palette)));
    terrain.position.set(art.x0, art.y0);
    terrain.scale.set(1 / art.ppm);
    if (art.back) {
      const back = new Sprite(cached(`terrainBack:${map.id}`, () => gridTexture(art.back!, art.palette)));
      back.position.set(art.x0, art.y0);
      back.scale.set(1 / art.ppm);
      this.mapLayer.addChild(back);
    }

    // lava pools
    this.lavaTiles = [];
    const lavaTex = cached('lava', () => gridTexture(lavaGrid(), PROP_PAL));
    const lavaTop = cached('lavaTop', () => gridTexture(lavaSurfaceGrid(), PROP_PAL));
    for (const l of map.lava ?? []) {
      const t = new TilingSprite({ texture: lavaTex, width: l.w * ART_PPM, height: l.h * ART_PPM });
      t.position.set(l.x, l.y);
      t.scale.set(1 / ART_PPM);
      const top = new TilingSprite({ texture: lavaTop, width: l.w * ART_PPM, height: 4 });
      top.position.set(l.x, l.y - 3 / ART_PPM);
      top.scale.set(1 / ART_PPM);
      this.lavaTiles.push(t, top);
      this.mapLayer.addChild(t, top);
    }
    // Decorative water
    const waterTex = cached('water', () => gridTexture(waterGrid(), PROP_PAL));
    const waterTop = cached('waterTop', () => gridTexture(waterSurfaceGrid(), PROP_PAL));
    for (const wv of map.water ?? []) {
      const t = new TilingSprite({ texture: waterTex, width: wv.w * ART_PPM, height: wv.h * ART_PPM });
      t.position.set(wv.x, wv.y);
      t.scale.set(1 / ART_PPM);
      const top = new TilingSprite({ texture: waterTop, width: wv.w * ART_PPM, height: 4 });
      top.position.set(wv.x, wv.y - 3 / ART_PPM);
      top.scale.set(1 / ART_PPM);
      this.lavaTiles.push(t, top);
      this.mapLayer.addChild(t, top);
    }
    // Background props: planted behind the terrain edge (or in front when asked).
    const front: Sprite[] = [];
    this.beamSprites = [];
    for (const d of placedDecor(map)) {
      if (isPropDecor(d.kind)) continue; // pushable props are drawn as items
      const grid = decorGrid(d.kind, d.seed);
      const s = new Sprite(cached(`decor:${d.kind}:${d.seed}`, () => gridTexture(grid, DECOR_PAL)));
      s.anchor.set(grid.ox / grid.w, grid.oy / grid.h);
      const k = (d.s ?? 1) / ART_PPM;
      s.scale.set(d.flip ? -k : k, k);
      s.position.set(d.x, d.y + 2 / ART_PPM);
      if (d.kind === 'beam') this.beamSprites.push(s);
      if (d.front) front.push(s);
      else this.mapLayer.addChild(s);
    }
    this.mapLayer.addChild(terrain);
    for (const s of front) this.mapLayer.addChild(s);
    for (const pad of map.pads ?? []) {
      const s = new Sprite(cached(`pad:${pad.w}`, () => gridTexture(padGrid(pad.w), PROP_PAL)));
      s.anchor.set(0.5, 4 / s.texture.height);
      s.scale.set(1 / ART_PPM);
      s.position.set(pad.x, pad.y);
      s.rotation = pad.angle ?? 0;
      this.mapLayer.addChild(s);
    }
    for (const sp of map.spikes ?? []) {
      const s = new Sprite(cached(`spikes:${sp.w}`, () => gridTexture(spikesGrid(sp.w), PROP_PAL)));
      s.anchor.set(0, 1);
      s.scale.set(1 / ART_PPM);
      s.position.set(sp.x, sp.y);
      this.mapLayer.addChild(s);
    }

    // Parallax background
    this.bgLayer.removeChildren();
    this.bgSprites = [];
    const theme = THEMES[map.theme];
    const sky = generateSky(theme);
    this.sky = new Sprite(cached(`sky:${map.theme}`, () => rgbaTexture(sky.w, sky.h, sky.rgba)));
    this.bgLayer.addChild(this.sky);
    theme.layers.forEach((spec, i) => {
      const layer = generateLayer(spec);
      const tex = cached(`bg:${map.theme}:${i}`, () => rgbaTexture(layer.w, layer.h, layer.rgba));
      const ts = new TilingSprite({ texture: tex, width: 100, height: layer.h });
      const fill = new Graphics();
      fill.rect(0, 0, 1, 1).fill(toHex(hex(spec.color2 && spec.kind !== 'mountains' ? spec.color : spec.color)));
      this.bgLayer.addChild(fill, ts);
      this.bgSprites.push({ sprite: ts, factor: layer.factor, bottom: layer.bottom, h: layer.h, fill, hang: spec.hang });
    });
  }

  private computeTargetCam(): Cam {
    const g = this.game!;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const add = (x: number, y: number, r: number) => {
      x0 = Math.min(x0, x - r); x1 = Math.max(x1, x + r); y0 = Math.min(y0, y - r); y1 = Math.max(y1, y + r);
    };
    for (const c of g.cars) {
      const p = c.chassis.getPosition();
      if (p.y < g.map.killY) add(p.x, p.y, 2.2);
    }
    for (const r of g.ragdolls) {
      const p = r.head.getPosition();
      if (p.y < g.map.bounds.y1 && p.y > g.map.bounds.y0) add(p.x, p.y, 1);
    }
    if (!isFinite(x0)) {
      const b = g.map.bounds;
      x0 = b.x0; x1 = b.x1; y0 = b.y0; y1 = b.y1;
    }
    const W = this.app.screen.width, H = this.app.screen.height;
    const b = g.map.bounds;
    const maxZoom = H / 8.5;
    const minZoom = Math.max(W / (b.x1 - b.x0), H / (b.y1 - b.y0)) * 0.98;
    // Keep the action above the touch buttons on phones.
    const bottomPad = this.showTouch ? H * 0.16 : 0;
    const cam = fitCamera({ x0, y0, x1, y1 }, W, H - bottomPad, b, { margin: 3.2, minZoom: Math.min(minZoom, maxZoom), maxZoom, topPad: 2 });
    cam.y += bottomPad / 2 / cam.zoom;
    return cam;
  }

  render(realDt: number) {
    const g = this.game;
    if (!g) return;
    this.time += realDt;
    const simDt = realDt * g.stepper.timeScale;
    const alpha = g.stepper.alpha;
    const W = this.app.screen.width, H = this.app.screen.height;

    // camera
    const target = this.computeTargetCam();
    if (this.snapCam) {
      this.cam = target;
      this.snapCam = false;
    } else this.cam = lerpCam(this.cam, target, 1 - Math.exp(-realDt * 3.2));
    this.trauma = Math.max(0, this.trauma - realDt * 1.6);
    const sh = this.trauma * this.trauma;
    const shx = (Math.sin(this.time * 61) + Math.sin(this.time * 37)) * 0.5 * sh * 14;
    const shy = (Math.sin(this.time * 53 + 1) + Math.sin(this.time * 29)) * 0.5 * sh * 14;
    const z = this.cam.zoom;
    this.world.scale.set(z);
    this.world.position.set(W / 2 - this.cam.x * z + shx, H / 2 - this.cam.y * z + shy);
    this.world.rotation = 0;

    // background
    const ps = this.pixelScale;
    if (this.sky) {
      this.sky.width = W;
      this.sky.height = H;
    }
    const b = g.map.bounds;
    const cy = (b.y0 + b.y1) / 2;
    for (const l of this.bgSprites) {
      const s = l.sprite;
      s.tileScale.set(ps);
      s.width = W;
      s.height = l.h * ps;
      const yOff = -(this.cam.y - cy) * z * l.factor * 0.6;
      s.y = Math.round(H * l.bottom - l.h * ps + yOff);
      s.tilePosition.x = Math.round(-(this.cam.x * z * l.factor) - shx * l.factor);
      if (l.hang) {
        l.fill.position.set(0, 0);
        l.fill.scale.set(W, Math.max(0, s.y + 1));
      } else {
        l.fill.position.set(0, s.y + s.height - 1);
        l.fill.scale.set(W, Math.max(0, H - s.y - s.height + 2));
      }
    }

    // cars
    for (const cv of this.carViews) cv.sync(alpha, this.time);
    // dust & boost particles
    for (const c of g.cars) this.carFx(c, simDt);

    // ragdolls
    while (this.ragdollSprites.length < g.ragdolls.length) {
      const r = g.ragdolls[this.ragdollSprites.length];
      const cv = this.carViews[r.player];
      const head = new Sprite(cv.head.texture);
      head.anchor.set(0.5);
      head.scale.set(r.facing / ART_PPM, 1 / ART_PPM);
      const torso = new Sprite(cv.torso.texture);
      torso.anchor.set(0.5);
      torso.scale.set(r.facing / ART_PPM, 1 / ART_PPM);
      this.carLayer.addChild(torso, head);
      this.ragdollSprites.push({ head, torso });
    }
    g.ragdolls.forEach((r, i) => {
      const sp = this.ragdollSprites[i];
      const bs = [r.head, r.torso];
      [sp.head, sp.torso].forEach((s, k) => {
        const p = r.prev[k], cur = bs[k].getPosition();
        s.position.set(lerp(p.x, cur.x, alpha), lerp(p.y, cur.y, alpha));
        s.rotation = lerpAngle(p.a, bs[k].getAngle(), alpha);
      });
    });

    // dynamic props
    g.arena.platforms.forEach((p, i) => {
      const pos = p.body.getPosition();
      this.platforms[i].position.set(pos.x, pos.y);
    });
    g.arena.saws.forEach((sw, i) => {
      const pos = sw.body.getPosition();
      this.saws[i].position.set(pos.x, pos.y);
      this.saws[i].rotation = sw.body.getAngle();
    });
    const liveBalls = new Set<object>();
    for (const bl of g.arena.balls) {
      liveBalls.add(bl.body);
      let sp = this.ballSprites.get(bl.body);
      if (!sp) {
        const grid = bl.look === 'snow' ? shotGrid('snowball', bl.r, ART_PPM) : ballGrid(bl.r, ART_PPM);
        sp = new Sprite(cached(`ball:${bl.look}:${bl.r.toFixed(2)}`, () => gridTexture(grid, DECOR_PAL)));
        sp.anchor.set(0.5);
        sp.scale.set(1 / ART_PPM);
        this.dynLayer.addChild(sp);
        this.ballSprites.set(bl.body, sp);
      }
      const pos = bl.body.getPosition();
      sp.position.set(pos.x, pos.y);
      sp.rotation = bl.body.getAngle();
    }
    for (const [k, sp] of this.ballSprites) if (!liveBalls.has(k)) {
      sp.destroy();
      this.ballSprites.delete(k);
    }
    this.renderSudden(simDt);
    const live = new Set<object>();
    for (const bl of g.arena.blocks) {
      live.add(bl.body);
      let s = this.blocks.get(bl.body);
      if (!s) {
        if (bl.style === 'toy') {
          const grid = decorGrid('block', bl.seed);
          s = new Sprite(cached(`decor:block:${bl.seed % 9}`, () => gridTexture(decorGrid('block', bl.seed % 9), DECOR_PAL)));
          s.anchor.set(0.5);
          s.scale.set(bl.size / (grid.w - 2));
        } else {
          const style = bl.style === 'meteor' ? 'stone' : bl.style;
          s = new Sprite(cached(`crate:${bl.size}:${style}`, () => gridTexture(crateGrid(bl.size, ART_PPM, style), PROP_PAL)));
          s.anchor.set(0.5);
          s.scale.set(1 / ART_PPM);
        }
        this.dynLayer.addChild(s);
        this.blocks.set(bl.body, s);
      }
      const p = bl.body.getPosition();
      s.position.set(p.x, p.y);
      s.rotation = bl.body.getAngle();
      if (bl.style === 'meteor' && bl.body.getLinearVelocity().length() > 5) {
        for (let i = 0; i < 2; i++) this.particles.spawn(p.x + (Math.random() - 0.5) * bl.size, p.y - bl.size * 0.4, { vy: -2, life: 0.35, size: 0.2, color: Math.random() > 0.4 ? 0xff7020 : 0xffd040 });
      }
    }
    for (const [k, s] of this.blocks) if (!live.has(k)) {
      s.destroy();
      this.blocks.delete(k);
    }
    for (const t of this.lavaTiles) t.tilePosition.x = Math.round(this.time * 6) % 32;
    if (g.arena.riseBody) {
      if (!this.riseLava) {
        const sea = g.arena.riseKind === 'flood';
        const body = sea ? cached('water', () => gridTexture(waterGrid(), PROP_PAL)) : cached('lava', () => gridTexture(lavaGrid(), PROP_PAL));
        const top = sea ? cached('waterTop', () => gridTexture(waterSurfaceGrid(), PROP_PAL)) : cached('lavaTop', () => gridTexture(lavaSurfaceGrid(), PROP_PAL));
        this.riseLava = new TilingSprite({ texture: body, width: (b.x1 - b.x0 + 40) * ART_PPM, height: 60 * ART_PPM });
        this.riseLava.scale.set(1 / ART_PPM);
        this.riseTop = new TilingSprite({ texture: top, width: (b.x1 - b.x0 + 40) * ART_PPM, height: 4 });
        this.riseTop.scale.set(1 / ART_PPM);
        this.fxLayer.addChild(this.riseLava, this.riseTop);
      }
      this.riseLava.position.set(b.x0 - 20, g.arena.riseY);
      this.riseTop!.position.set(b.x0 - 20, g.arena.riseY - 3 / ART_PPM);
      this.riseLava.tilePosition.x = Math.round(this.time * 8) % 32;
      this.riseTop!.tilePosition.x = Math.round(-this.time * 10) % 32;
      if (Math.random() < 0.3) this.particles.spawn(b.x0 + Math.random() * (b.x1 - b.x0), g.arena.riseY, { vy: -3, g: 8, life: 0.6, size: 0.15, color: g.arena.riseKind === 'flood' ? 0xe8f8ff : 0xffd060 });
    }
    for (const l of g.map.lava ?? []) {
      if (Math.random() < l.w * 0.01) this.particles.spawn(l.x + Math.random() * l.w, l.y, { vy: -3 - Math.random() * 3, g: 10, life: 0.6, size: 0.14, color: Math.random() > 0.5 ? 0xffd060 : 0xff7020 });
    }

    this.renderAbilities(alpha, simDt);
    this.particles.update(simDt);
    this.ringGfx.clear();
    for (const r of this.rings) {
      r.t += simDt;
      const k = r.t / 0.45;
      if (k >= 0 && k < 1) this.ringGfx.circle(r.x, r.y, 0.5 + k * ((r.r ?? 5) - 0.5)).stroke({ color: r.color ?? 0xfff6c0, width: 0.35 * (1 - k), alpha: 1 - k });
    }
    this.rings = this.rings.filter((r) => r.t < 0.45);
    if (this.debug) drawPhysicsDebug(this.debugGfx, g.world);
    else this.debugGfx.clear();

    // flash
    this.flashA = Math.max(0, this.flashA - realDt * 2.2);
    this.flash.clear();
    if (this.flashA > 0) this.flash.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: this.flashA });

    this.renderHud(realDt);
    this.renderTouch();
  }

  private carFx(c: Car, dt: number) {
    if (dt <= 0) return;
    for (let i = 0; i < c.wheels.length; i++) {
      const w = c.wheels[i];
      const r = c.def.wheels[i].r;
      const slip = Math.abs(w.getAngularVelocity() * r - w.getLinearVelocity().x);
      let touching = false;
      for (let ce = w.getContactList(); ce; ce = ce.next!) if (ce.contact.isTouching()) { touching = true; break; }
      if (touching && slip > 3 && Math.random() < 0.5) {
        const p = w.getPosition();
        const back = -Math.sign(w.getAngularVelocity());
        const dust = DUST[this.game!.map.theme] ?? 0xc8b8a0;
        this.particles.spawn(p.x + back * r * 0.6, p.y + r * 0.8, { vx: back * (2 + Math.random() * 3), vy: -1.5 - Math.random() * 2, g: 6, drag: 2, life: 0.5, size: 0.16, color: dust, spin: 3 });
      }
    }
    if (c.alive && c.input !== 0 && Math.random() < 0.18) {
      const p = c.chassis.getWorldPoint({ x: -1.45 * c.facing, y: 0.1 });
      this.particles.spawn(p.x, p.y, { vx: -c.facing * 1.5, vy: -0.8, life: 0.7, size: 0.22, color: 0x9a96a4, drag: 1.5, g: -2 });
    }
    if (c.boosting && Math.random() < 0.8) {
      const fwd = c.chassis.getWorldVector({ x: c.facing, y: 0 });
      const p = c.chassis.getWorldPoint({ x: -1.6 * c.facing, y: 0 });
      this.particles.spawn(p.x, p.y, { vx: -fwd.x * 8, vy: -fwd.y * 8 + (Math.random() - 0.5) * 2, life: 0.35, size: 0.2, color: Math.random() > 0.5 ? 0xffc040 : 0xff6020, drag: 3 });
    }
  }

  private renderHud(dt: number) {
    const g = this.game!;
    const W = this.app.screen.width, H = this.app.screen.height;
    const ps = this.pixelScale;
    const key = `${g.match.scores[0]}:${g.match.scores[1]}`;
    if (key !== this.scoreKey) {
      this.scoreKey = key;
      this.hudScore[0].texture = pixelText(String(g.match.scores[0]), { size: 12, color: PLAYER_COLORS[0] });
      this.hudScore[1].texture = pixelText(':', { size: 12 });
      this.hudScore[2].texture = pixelText(String(g.match.scores[1]), { size: 12, color: PLAYER_COLORS[1] });
    }
    const top = Math.round(4 * ps * 0.5);
    this.hudScore.forEach((s, i) => {
      s.scale.set(ps);
      s.position.set(Math.round(W / 2 + (i - 1) * 16 * ps), top);
    });
    let tt: string;
    if (g.suddenDeath) tt = g.arena.sudden ? SUDDEN_INFO[g.arena.riseBody ? g.arena.riseKind : g.arena.sudden].name.toUpperCase() + '!' : 'РАПТОВА СМЕРТЬ';
    else {
      const t = Math.ceil(g.timeLeft);
      tt = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    }
    tt += `   до ${g.cfg.target}`;
    if (tt !== this.lastTimerText) {
      this.lastTimerText = tt;
      this.hudTimer.texture = pixelText(tt, { size: 9, color: g.suddenDeath ? '#ff8040' : '#ffffff' });
    }
    this.hudTimer.scale.set(Math.max(1, ps - 1));
    this.hudTimer.alpha = 0.9;
    this.hudTimer.position.set(Math.round(W / 2), top + 15 * ps);

    if (this.centerT > 0) {
      this.centerT -= dt;
      this.hudCenter.scale.set(ps * 1.5);
      this.hudCenter.position.set(Math.round(W / 2), Math.round(H * 0.38));
      this.hudSub.scale.set(ps);
      this.hudSub.position.set(Math.round(W / 2), Math.round(H * 0.38 + 16 * ps));
      if (this.centerT <= 0) {
        this.hudCenter.visible = false;
        this.hudSub.visible = false;
      }
    }
  }

  private renderTouch() {
    const t = this.touchLayer;
    t.clear();
    this.touchLabels.removeChildren();
    if (!this.showTouch) return;
    for (const z of this.input.zones) {
      if (z.btn === 'action' && this.game && !this.game.cars[z.player]?.ability) continue;
      const pressed = this.input.touch[z.player][z.btn];
      const col = toHex(hex(PLAYER_COLORS[z.player]));
      const pad = 6;
      t.roundRect(z.x + pad, z.y + pad, z.w - pad * 2, z.h - pad * 2, 14).fill({ color: pressed ? col : 0x000000, alpha: pressed ? 0.4 : 0.1 });
      t.roundRect(z.x + pad, z.y + pad, z.w - pad * 2, z.h - pad * 2, 14).stroke({ color: col, alpha: 0.55, width: 3 });
      const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      const s = Math.min(z.w, z.h) * 0.2;
      if (z.btn === 'action') {
        const car = this.game?.cars[z.player];
        const k = car ? car.abilityCharge : 1;
        const inner = z.h - pad * 2 - 6;
        t.roundRect(z.x + pad + 3, z.y + pad + 3 + inner * (1 - k), z.w - pad * 2 - 6, inner * k, 10).fill({ color: col, alpha: k >= 1 ? 0.45 : 0.18 });
        // star
        const pts: number[] = [];
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? s * 0.45 : s;
          pts.push(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        t.poly(pts).fill({ color: 0xffffff, alpha: pressed || k >= 1 ? 0.95 : 0.45 });
        continue;
      }
      const d = z.btn === 'left' ? -1 : 1;
      t.poly([cx + d * s, cy, cx - d * s * 0.7, cy - s, cx - d * s * 0.7, cy + s]).fill({ color: 0xffffff, alpha: pressed ? 0.95 : 0.6 });
    }
  }
}

