import { Application, TextureSource } from 'pixi.js';
import { Game } from './game/game';
import { GameView } from './render/view';
import { InputManager } from './input/input';
import { CARS } from './cars/defs';
import { MAPS } from './maps/defs';

TextureSource.defaultOptions.scaleMode = 'nearest';

async function boot() {
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

  const view = new GameView(app, input);
  view.showTouch = matchMedia('(pointer: coarse)').matches;
  const q = new URLSearchParams(location.search);
  const pick = (id: string | null, d: number) => CARS.find((c) => c.id === id) ?? CARS[d];
  const map = MAPS.find((m) => m.id === q.get('map'));
  const game = new Game({
    cars: [pick(q.get('p1'), 0), pick(q.get('p2'), 1)],
    maps: map ? [map] : MAPS,
    randomMaps: !map,
    target: 5,
    roundTime: Number(q.get('time') ?? 60),
    seed: q.has('seed') ? Number(q.get('seed')) : undefined,
  });
  view.attach(game);
  view.debug = q.has('debug');
  input.onAnyKey = (code) => {
    if (code === 'Backquote') view.debug = !view.debug;
  };

  app.ticker.add((t) => {
    const dt = t.deltaMS / 1000;
    if (input.touchEnabled) view.showTouch = true;
    game.inputs[0] = input.dir(0);
    game.inputs[1] = input.dir(1);
    game.frame(dt);
    view.render(dt);
  });

  (window as any).__game = game;
  (window as any).__ready = true;
}

boot();
