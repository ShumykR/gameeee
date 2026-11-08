import { Application, Container, Sprite, TilingSprite, Graphics, Texture } from 'pixi.js';
import { ART_PPM } from '../physics/constants';
import type { Game, GameEvent } from '../game/game';
import type { Car } from '../cars/car';
import type { CarDef, CarPalette } from '../cars/types';
import { carPalette, driverPalette, generateCarGrid, generateHeadGrid, generateTorsoGrid, generateWheelGrid, wheelPalette } from '../cars/sprite';
import { generateLayer, generateSky, generateTerrain, THEMES } from '../maps/art';
import type { MapDef } from '../maps/types';
import { PROP_PAL, crateGrid, lavaGrid, lavaSurfaceGrid, padGrid, plateGrid, sawGrid, spikesGrid, waterGrid, waterSurfaceGrid } from '../maps/props';
import { DECOR_PAL, ballGrid, decorGrid, placedDecor } from '../maps/decor';
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

  constructor(readonly car: Car, alt: boolean) {
    const def = car.def;
    const pal = alt ? altPalette(def.palette) : def.palette;
    const { tex, ox, oy } = carTexture(def, alt);
    const s = new Sprite(tex);
    s.anchor.set(ox / tex.width, oy / tex.height);
    s.scale.set(1 / ART_PPM);

    const dpal = driverPalette(PLAYER_COLORS[car.player]);
    const hg = generateHeadGrid(def.head.r);
    this.head = new Sprite(cached(`head:${def.head.r}:${car.player}`, () => gridTexture(hg, dpal)));
    this.head.anchor.set(0.5);
    this.head.scale.set(1 / ART_PPM);
    this.head.position.set(def.head.x, def.head.y);
    const tg = generateTorsoGrid(def.head.r);
    this.torso = new Sprite(cached(`torso:${def.head.r}:${car.player}`, () => gridTexture(tg, dpal)));
    this.torso.anchor.set(tg.ox / tg.w, 0);
    this.torso.scale.set(1 / ART_PPM);
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
      ws.scale.set(1 / ART_PPM);
      this.wheels.push(ws);
    }
    this.marker = new Sprite(pixelText(PLAYER_NAMES[car.player], { size: 8, color: PLAYER_COLORS[car.player] }));
    this.marker.anchor.set(0.5, 1);
    this.marker.scale.set(1 / ART_PPM);
    this.root.addChild(this.body, ...this.wheels, this.marker);
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
    const alive = c.alive;
    this.head.visible = alive;
    this.torso.visible = alive;
    this.marker.visible = alive;
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
  private carLayer = new Container();
  private fxLayer = new Container();
  private flash = new Graphics();
  private ringGfx = new Graphics();
  private rings: { x: number; y: number; t: number }[] = [];
  private carViews: CarView[] = [];
  private ragdollSprites: { head: Sprite; torso: Sprite }[] = [];
  private platforms: Sprite[] = [];
  private saws: Sprite[] = [];
  private balls: Sprite[] = [];
  private blocks = new Map<object, Sprite>();
  private riseLava: TilingSprite | null = null;
  private riseTop: TilingSprite | null = null;
  private lavaTiles: TilingSprite[] = [];
  private bgSprites: { sprite: TilingSprite; factor: number; bottom: number; h: number; fill: Graphics }[] = [];
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
    this.world.addChild(this.mapLayer, this.dynLayer, this.carLayer, this.particles.container, this.ringGfx, this.fxLayer, this.debugGfx);
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
      case 'pad':
        this.particles.burst(e.x, e.y - 0.3, 18, { speed: 7, colors: [0xffe040, 0xffffff], life: 0.4, size: 0.12, dir: -Math.PI / 2, spread: 1.2, g: 10 });
        break;
      case 'suddenDeath':
        this.setCenter('РАПТОВА СМЕРТЬ', 1.8, 'лава піднімається!');
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
    this.balls = g.arena.balls.map((b) => {
      const s = new Sprite(cached(`ball:${b.r}`, () => gridTexture(ballGrid(b.r, ART_PPM), DECOR_PAL)));
      s.anchor.set(0.5);
      s.scale.set(1 / ART_PPM);
      this.dynLayer.addChild(s);
      return s;
    });
    this.blocks.clear();
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
    for (const d of placedDecor(map)) {
      const grid = decorGrid(d.kind, d.seed);
      const s = new Sprite(cached(`decor:${d.kind}:${d.seed}`, () => gridTexture(grid, DECOR_PAL)));
      s.anchor.set(grid.ox / grid.w, grid.oy / grid.h);
      const k = (d.s ?? 1) / ART_PPM;
      s.scale.set(d.flip ? -k : k, k);
      s.position.set(d.x, d.y + 2 / ART_PPM);
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
      this.bgSprites.push({ sprite: ts, factor: layer.factor, bottom: layer.bottom, h: layer.h, fill });
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
      l.fill.position.set(0, s.y + s.height - 1);
      l.fill.scale.set(W, Math.max(0, H - s.y - s.height + 2));
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
    g.arena.balls.forEach((b, i) => {
      const pos = b.body.getPosition();
      this.balls[i].position.set(pos.x, pos.y);
      this.balls[i].rotation = b.body.getAngle();
    });
    const live = new Set<object>();
    for (const bl of g.arena.blocks) {
      live.add(bl.body);
      let s = this.blocks.get(bl.body);
      if (!s) {
        const style = g.map.fallingBlocks?.style ?? 'crate';
        s = new Sprite(cached(`crate:${bl.size}:${style}`, () => gridTexture(crateGrid(bl.size, ART_PPM, style), PROP_PAL)));
        s.anchor.set(0.5);
        s.scale.set(1 / ART_PPM);
        this.dynLayer.addChild(s);
        this.blocks.set(bl.body, s);
      }
      const p = bl.body.getPosition();
      s.position.set(p.x, p.y);
      s.rotation = bl.body.getAngle();
    }
    for (const [k, s] of this.blocks) if (!live.has(k)) {
      s.destroy();
      this.blocks.delete(k);
    }
    for (const t of this.lavaTiles) t.tilePosition.x = Math.round(this.time * 6) % 32;
    if (g.arena.riseBody) {
      if (!this.riseLava) {
        this.riseLava = new TilingSprite({ texture: cached('lava', () => gridTexture(lavaGrid(), PROP_PAL)), width: (b.x1 - b.x0 + 40) * ART_PPM, height: 60 * ART_PPM });
        this.riseLava.scale.set(1 / ART_PPM);
        this.riseTop = new TilingSprite({ texture: cached('lavaTop', () => gridTexture(lavaSurfaceGrid(), PROP_PAL)), width: (b.x1 - b.x0 + 40) * ART_PPM, height: 4 });
        this.riseTop.scale.set(1 / ART_PPM);
        this.fxLayer.addChild(this.riseLava, this.riseTop);
      }
      this.riseLava.position.set(b.x0 - 20, g.arena.riseY);
      this.riseTop!.position.set(b.x0 - 20, g.arena.riseY - 3 / ART_PPM);
      this.riseLava.tilePosition.x = Math.round(this.time * 8) % 32;
      this.riseTop!.tilePosition.x = Math.round(-this.time * 10) % 32;
      if (Math.random() < 0.3) this.particles.spawn(b.x0 + Math.random() * (b.x1 - b.x0), g.arena.riseY, { vy: -3, g: 8, life: 0.6, size: 0.15, color: 0xffd060 });
    }
    for (const l of g.map.lava ?? []) {
      if (Math.random() < l.w * 0.01) this.particles.spawn(l.x + Math.random() * l.w, l.y, { vy: -3 - Math.random() * 3, g: 10, life: 0.6, size: 0.14, color: Math.random() > 0.5 ? 0xffd060 : 0xff7020 });
    }

    this.particles.update(simDt);
    this.ringGfx.clear();
    for (const r of this.rings) {
      r.t += simDt;
      const k = r.t / 0.45;
      if (k < 1) this.ringGfx.circle(r.x, r.y, 0.5 + k * 4.5).stroke({ color: 0xfff6c0, width: 0.35 * (1 - k), alpha: 1 - k });
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
    if (g.suddenDeath) tt = 'РАПТОВА СМЕРТЬ';
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
      const pressed = this.input.touch[z.player][z.btn];
      const col = toHex(hex(PLAYER_COLORS[z.player]));
      const pad = 6;
      t.roundRect(z.x + pad, z.y + pad, z.w - pad * 2, z.h - pad * 2, 14).fill({ color: pressed ? col : 0x000000, alpha: pressed ? 0.4 : 0.1 });
      t.roundRect(z.x + pad, z.y + pad, z.w - pad * 2, z.h - pad * 2, 14).stroke({ color: col, alpha: 0.55, width: 3 });
      const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      const s = Math.min(z.w, z.h) * 0.2;
      const d = z.btn === 'left' ? -1 : 1;
      t.poly([cx + d * s, cy, cx - d * s * 0.7, cy - s, cx - d * s * 0.7, cy + s]).fill({ color: 0xffffff, alpha: pressed ? 0.95 : 0.6 });
    }
  }
}

