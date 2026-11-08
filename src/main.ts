import { Application, TextureSource } from 'pixi.js';
import { Game, GameEvent } from './game/game';
import { GameView } from './render/view';
import { InputManager } from './input/input';
import { CARS, CAR_BY_ID } from './cars/defs';
import { MAPS, MAP_BY_ID } from './maps/defs';
import { Bot } from './ai/bot';
import { audio } from './audio/audio';
import { music } from './audio/music';
import { Menu, Mode } from './ui/menu';
import { loadSettings, saveSettings } from './ui/settings';
import { setupPwa } from './ui/pwa';

TextureSource.defaultOptions.scaleMode = 'nearest';

type State = 'menu' | 'play' | 'paused' | 'over';

async function boot() {
  const q = new URLSearchParams(location.search);
  if (q.has('gallery')) {
    const { showGallery } = await import('./ui/gallery');
    showGallery(document.getElementById('ui')!);
    (window as any).__ready = true;
    return;
  }

  const host = document.getElementById('app')!;
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#14101e',
    antialias: false,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  host.appendChild(app.canvas);

  const input = new InputManager(app.canvas);
  const relayout = () => input.layout(window.innerWidth, window.innerHeight);
  relayout();
  window.addEventListener('resize', relayout);
  const coarse = matchMedia('(pointer: coarse)').matches;

  const view = new GameView(app, input);
  view.debug = q.has('debug');
  const settings = loadSettings();
  let state: State = 'menu';
  let mode: Mode = 'pvp';
  let game: Game | null = null;
  let overTimer = -1;

  const pauseBtn = document.createElement('button');
  pauseBtn.className = 'btn pause-btn';
  pauseBtn.textContent = 'II';
  pauseBtn.addEventListener('click', () => pause());
  document.getElementById('ui')!.appendChild(pauseBtn);

  const setState = (s: State) => {
    state = s;
    pauseBtn.style.display = s === 'play' ? '' : 'none';
    view.hud.visible = s === 'play';
    view.showTouch = s === 'play' && (coarse || input.touchEnabled);
    if (s !== 'play') audio.stopEngines();
    if (s === 'menu') music.play('menu');
    music.duck(s === 'paused');
  };

  const onEvent = (e: GameEvent) => {
    if (state === 'menu') return; // attract mode is silent
    switch (e.type) {
      case 'countdown': audio.countdown(e.n); break;
      case 'go': audio.countdown(0); break;
      case 'impact': audio.impact(e.strength, e.carCar); break;
      case 'death': audio.explosion(); break;
      case 'pad': audio.pad(); break;
      case 'ability': audio.ability(e.kind, game?.cars[e.player].ability?.projectile); break;
      case 'blast': audio.blast(e.kind); break;
      case 'shieldBlock': audio.shieldBlock(); break;
      case 'effect': audio.effect(e.effect); break;
      case 'shotHit': audio.impact(2, false); break;
      case 'suddenDeath':
        audio.siren();
        if (!e.late) music.play('sudden');
        break;
      case 'roundStart': if (music.current === 'sudden') music.resumeMatch(); break;
      case 'roundEnd': if (e.result !== 'draw') audio.point(); break;
      case 'matchEnd':
        music.stop();
        audio.jingle(mode === 'pvp' || e.winner === 0);
        overTimer = 1.6;
        break;
    }
  };

  const newGame = (cfg: ConstructorParameters<typeof Game>[0]) => {
    game = new Game(cfg);
    game.on(onEvent);
    view.attach(game);
    (window as any).__game = game;
    (window as any).__music = music;
    (window as any).__audio = audio;
    return game;
  };

  const startDemo = () => {
    const a = CARS[Math.floor(Math.random() * CARS.length)], b = CARS[Math.floor(Math.random() * CARS.length)];
    const g = newGame({ cars: [a, b], maps: MAPS, randomMaps: true, randomCars: true, carPool: CARS, target: 999, roundTime: 40 });
    g.controllers[0] = new Bot('hard', 11);
    g.controllers[1] = new Bot('normal', 12);
    setState('menu');
  };

  const startMatch = () => {
    const map = settings.map === 'random' ? null : MAP_BY_ID[settings.map];
    const g = newGame({
      cars: [CAR_BY_ID[settings.p1] ?? CARS[0], CAR_BY_ID[settings.p2] ?? CARS[1]],
      maps: map ? [map] : MAPS,
      randomMaps: !map,
      randomCars: settings.randomCars,
      carPool: CARS,
      target: settings.target,
      roundTime: settings.roundTime,
      seed: q.has('seed') ? Number(q.get('seed')) : undefined,
    });
    if (mode === 'bot') g.controllers[1] = new Bot(settings.bot, Date.now() & 0xffff);
    input.solo = mode === 'bot';
    relayout();
    if (q.has('bots')) {
      g.controllers[0] = new Bot('hard', 5);
      g.controllers[1] = new Bot('hard', 6);
    }
    overTimer = -1;
    menu.hide();
    music.playMatch();
    setState('play');
  };

  const goFullscreen = () => {
    if (!coarse) return;
    const de = document.documentElement as any;
    if (!document.fullscreenElement && de.requestFullscreen) {
      de.requestFullscreen({ navigationUI: 'hide' }).then(() => (screen.orientation as any)?.lock?.('landscape').catch(() => {})).catch(() => {});
    }
  };

  const pause = () => {
    if (state !== 'play') return;
    setState('paused');
    menu.showPause();
  };

  const menu = new Menu(document.getElementById('ui')!, settings, {
    start: (m) => {
      mode = m;
      goFullscreen();
      menu.showCars(m, () => menu.showMaps(() => startMatch(), () => menu.showCars(m, () => menu.showMaps(startMatch, () => menu.showMain()))));
    },
    resume: () => {
      menu.hide();
      setState('play');
    },
    restart: () => startMatch(),
    toMenu: () => {
      startDemo();
      menu.showMain();
    },
    rematch: () => startMatch(),
    changeCars: () => menu.showCars(mode, () => menu.showMaps(() => startMatch(), () => menu.showMain())),
    install: null,
    settingsChanged: () => saveSettings(settings),
  });
  setupPwa((fn) => {
    (menu as any).hooks.install = fn;
    if (state === 'menu' && !document.querySelector('.cars, .maps, .settings')) menu.showMain();
  });

  input.onAnyKey = (code) => {
    audio.unlock();
    if (code === 'Backquote') view.debug = !view.debug;
    if (code === 'Escape' && state === 'play') pause();
  };
  window.addEventListener('pointerdown', () => audio.unlock(), { once: false });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  if (q.has('autostart') || q.has('map') || q.has('p1') || q.has('bots')) {
    if (q.get('p1')) settings.p1 = q.get('p1')!;
    if (q.get('p2')) settings.p2 = q.get('p2')!;
    settings.map = q.get('map') ?? settings.map;
    if (q.get('time')) settings.roundTime = Number(q.get('time'));
    if (q.get('target')) settings.target = Number(q.get('target'));
    if (q.has('randomcars')) settings.randomCars = q.get('randomcars') !== '0';
    mode = q.get('mode') === 'bot' ? 'bot' : 'pvp';
    startMatch();
  } else {
    startDemo();
    menu.showMain();
  }

  app.ticker.add((t) => {
    const dt = Math.min(t.deltaMS / 1000, 0.1);
    if (!game) return;
    if (input.touchEnabled && state === 'play') view.showTouch = true;
    if (state === 'play' || state === 'menu' || state === 'over') {
      game.inputs[0] = input.dir(0);
      game.inputs[1] = input.dir(1);
      game.actions[0] = state === 'play' && input.action(0);
      game.actions[1] = state === 'play' && input.action(1);
      game.frame(dt);
    }
    view.render(state === 'paused' ? 0 : dt);
    if (state === 'play') {
      audio.setEngines(game.cars.map((c, i) => ({ load: c.engineLoad, throttle: c.input !== 0, alive: c.alive, pitch: i === 0 ? 1 : 1.12 })));
      if (overTimer > 0) {
        overTimer -= dt;
        if (overTimer <= 0) {
          setState('over');
          menu.showOver(game.match.winner ?? 0, game.match.scores, mode);
        }
      }
    }
  });

  (window as any).__ready = true;
  (window as any).__view = view;
  (window as any).__app = { menu, settings, get state() { return state; } };
}

boot();
