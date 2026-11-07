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
  const game = new Game({ cars: [CARS[0], CARS[1]], maps: MAPS, randomMaps: false, target: 5, roundTime: 60 });
  view.attach(game);

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
