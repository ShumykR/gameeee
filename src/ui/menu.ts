import { CARS, CAR_BY_ID } from '../cars/defs';
import { carPreviewCanvas } from '../cars/preview';
import { normalizedStats } from '../cars/stats';
import type { CarDef } from '../cars/types';
import { MAPS } from '../maps/defs';
import { pixelTextCanvas } from '../render/pixeltext';
import { altPalette, PLAYER_COLORS } from '../render/view';
import { audio } from '../audio/audio';
import type { BotLevel } from '../ai/bot';
import type { Settings } from './settings';
import { mapThumb } from './thumbs';

export type Mode = 'pvp' | 'bot';

/** The vs-bot mode is hidden for now: the game focuses on local 2-player. Flip to re-enable. */
export const SHOW_BOT_MODE = false;

export interface MenuHooks {
  start(mode: Mode): void;
  resume(): void;
  restart(): void;
  toMenu(): void;
  rematch(): void;
  changeCars(): void;
  install: (() => void) | null;
  settingsChanged(): void;
}

const LEVEL_NAMES: Record<BotLevel, string> = { easy: 'ЛЕГКО', normal: 'НОРМА', hard: 'ВАЖКО' };
const ARCH_NAMES: Record<string, string> = {
  allround: 'універсал', heavy: 'важке', fast: 'швидке', monster: 'монстр-трак', tiny: 'крихітне', long: 'довга база',
  scoop: 'ківш', ram: 'таран', spike: 'шипи', rocket: 'ракета', tall: 'високе', bouncy: 'стрибуче',
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function button(label: string, cls: string, onClick: () => void, sound: 'click' | 'back' = 'click') {
  const b = el('button', `btn ${cls}`, label);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    audio[sound]();
    onClick();
  });
  return b;
}

function titleCanvas(text: string, size: number, color: string, scale: number) {
  const c = pixelTextCanvas(text, { size, color });
  c.className = 'ptitle';
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  return c;
}

export class Menu {
  private root: HTMLElement;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  mode: Mode = 'pvp';

  constructor(host: HTMLElement, private settings: Settings, private hooks: MenuHooks) {
    this.root = el('div', 'menu-root');
    host.appendChild(this.root);
    window.addEventListener('keydown', (e) => this.keyHandler?.(e));
  }

  get visible() {
    return this.root.childElementCount > 0;
  }

  hide() {
    this.root.innerHTML = '';
    this.root.className = 'menu-root';
    this.keyHandler = null;
  }

  private screen(cls: string) {
    this.hide();
    this.root.className = `menu-root ${cls}`;
    const s = el('div', `screen ${cls}`);
    this.root.appendChild(s);
    return s;
  }

  showMain() {
    const s = this.screen('main');
    const logo = el('div', 'logo');
    logo.append(titleCanvas('HEAD BASH', 18, '#ffd23f', 3), titleCanvas('ARENA', 14, '#ff5a6e', 3));
    s.appendChild(logo);
    const col = el('div', 'main-buttons');
    col.append(button('грати вдвох', 'primary big', () => this.hooks.start('pvp')));
    if (SHOW_BOT_MODE) col.append(button('проти бота', 'big', () => this.hooks.start('bot')));
    const diff = el('div', 'seg');
    for (const lv of ['easy', 'normal', 'hard'] as BotLevel[]) {
      const b = button(LEVEL_NAMES[lv], `small ${this.settings.bot === lv ? 'on' : ''}`, () => {
        this.settings.bot = lv;
        this.hooks.settingsChanged();
        this.showMain();
      });
      diff.appendChild(b);
    }
    if (SHOW_BOT_MODE) col.appendChild(diff);
    const row = el('div', 'row');
    row.append(button('налаштування', 'small', () => this.showSettings()));
    if (this.hooks.install) row.append(button('встановити', 'small gold', () => this.hooks.install?.()));
    col.appendChild(row);
    s.appendChild(col);
    s.appendChild(el('div', 'hint', 'P1: <b>A</b> / <b>D</b> &nbsp; P2: <b>←</b> / <b>→</b> &nbsp;·&nbsp; на телефоні — кнопки в кутах'));
    this.keyHandler = (e) => {
      if (e.code === 'Enter') this.hooks.start('pvp');
    };
  }

  showSettings() {
    const s = this.screen('settings');
    s.appendChild(titleCanvas('НАЛАШТУВАННЯ', 12, '#ffffff', 2));
    const mk = (label: string, values: number[], cur: number, fmt: (v: number) => string, set: (v: number) => void) => {
      const r = el('div', 'set-row');
      r.appendChild(el('span', '', label));
      const seg = el('div', 'seg');
      for (const v of values) seg.appendChild(button(fmt(v), `small ${v === cur ? 'on' : ''}`, () => { set(v); this.hooks.settingsChanged(); this.showSettings(); }));
      r.appendChild(seg);
      s.appendChild(r);
    };
    mk('Очок до перемоги', [3, 5, 7, 10], this.settings.target, String, (v) => (this.settings.target = v));
    mk('Час раунду', [30, 45, 60, 90], this.settings.roundTime, (v) => `${v}с`, (v) => (this.settings.roundTime = v));
    mk('Випадкові авто щораунду', [1, 0], this.settings.randomCars ? 1 : 0, (v) => (v ? 'так' : 'ні'), (v) => (this.settings.randomCars = !!v));
    mk('Звук', [1, 0], audio.muted ? 0 : 1, (v) => (v ? 'увімк' : 'вимк'), (v) => audio.setMuted(!v));
    s.appendChild(button('◀ назад', '', () => this.showMain(), 'back'));
    this.keyHandler = (e) => e.code === 'Escape' && this.showMain();
  }

  showCars(mode: Mode, onDone: () => void) {
    this.mode = mode;
    const s = this.screen('cars');
    const head = el('div', 'cars-head');
    head.appendChild(titleCanvas('ОБЕРИ АВТО', 12, '#ffffff', 2));
    s.appendChild(head);
    const wrap = el('div', 'cars-wrap');
    const idx = [Math.max(0, CARS.findIndex((c) => c.id === this.settings.p1)), Math.max(0, CARS.findIndex((c) => c.id === this.settings.p2))];
    const panels = [0, 1].map((p) => {
      const panel = el('div', `car-panel p${p + 1}`);
      wrap.appendChild(panel);
      return panel;
    });
    const render = (p: number) => {
      const def = CARS[idx[p]];
      const panel = panels[p];
      panel.innerHTML = '';
      const who = p === 0 ? 'ГРАВЕЦЬ 1' : mode === 'bot' ? `БОТ · ${LEVEL_NAMES[this.settings.bot]}` : 'ГРАВЕЦЬ 2';
      panel.appendChild(el('div', 'who', who));
      const stage = el('div', 'stage');
      const sameAsOther = CARS[idx[1 - p]].id === def.id && p === 1;
      const cv = carPreviewCanvas(def, sameAsOther ? altPalette(def.palette) : def.palette, PLAYER_COLORS[p], 3, p === 1);
      cv.className = 'preview';
      const prev = button('◀', 'arrow', () => { idx[p] = (idx[p] + CARS.length - 1) % CARS.length; renderAll(); });
      const next = button('▶', 'arrow', () => { idx[p] = (idx[p] + 1) % CARS.length; renderAll(); });
      stage.append(prev, cv, next);
      panel.appendChild(stage);
      panel.appendChild(el('div', 'car-name', `${def.name} <small>${ARCH_NAMES[def.archetype] ?? def.archetype}</small>`));
      panel.appendChild(el('div', 'blurb', def.blurb));
      panel.appendChild(statBars(def));
      panel.appendChild(el('div', 'counter', `${idx[p] + 1} / ${CARS.length}`));
    };
    const renderAll = () => { render(0); render(1); };
    renderAll();
    s.appendChild(wrap);
    const syncRandom = () => wrap.classList.toggle('random-cars', this.settings.randomCars);
    syncRandom();
    const foot = el('div', 'row foot');
    const toggle = button(this.settings.randomCars ? '🎲 щораунду: так' : '🎲 щораунду: ні', `small ${this.settings.randomCars ? 'on' : ''}`, () => {
      this.settings.randomCars = !this.settings.randomCars;
      this.hooks.settingsChanged();
      toggle.textContent = this.settings.randomCars ? '🎲 щораунду: так' : '🎲 щораунду: ні';
      toggle.classList.toggle('on', this.settings.randomCars);
      syncRandom();
    });
    toggle.title = 'Нове випадкове авто кожному гравцю кожного раунду';
    foot.append(
      button('◀ меню', '', () => this.hooks.toMenu(), 'back'),
      toggle,
      button('далі ▶', 'primary', () => commit()),
    );
    s.appendChild(foot);
    const commit = () => {
      this.settings.p1 = CARS[idx[0]].id;
      this.settings.p2 = CARS[idx[1]].id;
      this.hooks.settingsChanged();
      onDone();
    };
    this.keyHandler = (e) => {
      const step = (p: number, d: number) => { idx[p] = (idx[p] + CARS.length + d) % CARS.length; audio.click(); renderAll(); };
      if (e.code === 'KeyA') step(0, -1);
      else if (e.code === 'KeyD') step(0, 1);
      else if (e.code === 'ArrowLeft') step(1, -1);
      else if (e.code === 'ArrowRight') step(1, 1);
      else if (e.code === 'Enter') commit();
      else if (e.code === 'Escape') this.hooks.toMenu();
    };
  }

  showMaps(onDone: () => void, onBack: () => void) {
    const s = this.screen('maps');
    s.appendChild(titleCanvas('ОБЕРИ АРЕНУ', 12, '#ffffff', 2));
    const grid = el('div', 'map-grid');
    const card = (id: string, name: string, blurb: string, thumb: string | null) => {
      const c = el('button', `map-card ${this.settings.map === id ? 'on' : ''}`);
      if (thumb) c.appendChild(Object.assign(new Image(), { src: thumb, className: 'thumb' }));
      else c.appendChild(el('div', 'thumb random', '?'));
      c.appendChild(el('div', 'map-name', name));
      c.title = blurb;
      c.addEventListener('click', () => {
        audio.unlock();
        audio.click();
        this.settings.map = id;
        this.hooks.settingsChanged();
        onDone();
      });
      return c;
    };
    grid.appendChild(card('random', 'Випадкова щораунду', 'Нова арена кожного раунду', null));
    for (const m of MAPS) grid.appendChild(card(m.id, m.name, m.blurb, mapThumb(m)));
    s.appendChild(grid);
    s.appendChild(button('◀ назад', '', onBack, 'back'));
    this.keyHandler = (e) => {
      if (e.code === 'Enter') onDone();
      if (e.code === 'Escape') onBack();
    };
  }

  showPause() {
    const s = this.screen('pause overlay');
    s.appendChild(titleCanvas('ПАУЗА', 14, '#ffffff', 3));
    const col = el('div', 'main-buttons');
    col.append(
      button('продовжити', 'primary big', () => this.hooks.resume()),
      button('заново', '', () => this.hooks.restart()),
      button('головне меню', '', () => this.hooks.toMenu(), 'back'),
    );
    s.appendChild(col);
    this.keyHandler = (e) => e.code === 'Escape' && this.hooks.resume();
  }

  showOver(winner: number, scores: [number, number], mode: Mode) {
    const s = this.screen('over overlay');
    const name = winner === 0 ? 'ГРАВЕЦЬ 1' : mode === 'bot' ? 'БОТ' : 'ГРАВЕЦЬ 2';
    s.appendChild(titleCanvas(`${name} ПЕРЕМІГ!`, 14, PLAYER_COLORS[winner], 3));
    s.appendChild(titleCanvas(`${scores[0]} : ${scores[1]}`, 14, '#ffffff', 3));
    const col = el('div', 'row');
    col.append(
      button('реванш', 'primary', () => this.hooks.rematch()),
      button('інші авто', '', () => this.hooks.changeCars()),
      button('меню', '', () => this.hooks.toMenu(), 'back'),
    );
    s.appendChild(col);
    this.keyHandler = (e) => e.code === 'Enter' && this.hooks.rematch();
  }
}

function statBars(def: CarDef) {
  const st = normalizedStats(def, CARS);
  const box = el('div', 'stats');
  const rows: [string, number][] = [['Швидкість', st.speed], ['Потужність', st.accel], ['Вага', st.weight], ['Зчеплення', st.grip], ['Повітря', st.air]];
  for (const [k, v] of rows) {
    const r = el('div', 'stat');
    r.appendChild(el('span', '', k));
    const bar = el('div', 'bar');
    for (let i = 1; i <= 5; i++) bar.appendChild(el('i', v >= i - 0.25 ? 'f' : ''));
    r.appendChild(bar);
    box.appendChild(r);
  }
  return box;
}

export { CAR_BY_ID };
