import { CARS, CAR_BY_ID } from '../cars/defs';
import { ARCH_NAMES, CATEGORIES, CATEGORY_BY_ID, categoryOf, countByCategory, filterCars, type CarFilter } from '../cars/catalog';
import { carPreviewCanvas } from '../cars/preview';
import type { CategoryId } from '../cars/types';
import { MAPS } from '../maps/defs';
import { altPalette, PLAYER_COLORS } from '../render/view';
import { audio } from '../audio/audio';
import { music } from '../audio/music';
import type { BotLevel } from '../ai/bot';
import type { Settings } from './settings';
import { mapThumb } from './thumbs';
import { abilityLabel } from '../game/abilities';
import { button, el, statBars, titleCanvas } from './dom';
import { openCarBrowser, type CarBrowser } from './garage';

export type Mode = 'pvp' | 'bot';

/** The vs-bot mode is hidden for now: the game focuses on local 2-player. Flip to re-enable. */
export const SHOW_BOT_MODE = true;

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
export class Menu {
  private root: HTMLElement;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  /** Garage overlay currently open on top of a screen (gets the keys). */
  private overlay: CarBrowser | null = null;
  /** Per-player collection filter on the car-select screen. */
  private carCat: (CategoryId | 'all')[] = ['all', 'all'];
  private garageFilter: CarFilter = {};
  mode: Mode = 'pvp';

  constructor(host: HTMLElement, private settings: Settings, private hooks: MenuHooks) {
    this.root = el('div', 'menu-root');
    host.appendChild(this.root);
    window.addEventListener('keydown', (e) => {
      if (this.overlay) this.overlay.handleKey(e);
      else this.keyHandler?.(e);
    });
  }

  get visible() {
    return this.root.childElementCount > 0;
  }

  hide() {
    this.overlay?.close();
    this.overlay = null;
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
    row.append(button('🚙 гараж', 'small', () => this.openGarage()));
    row.append(button('налаштування', 'small', () => this.showSettings()));
    if (this.hooks.install) row.append(button('встановити', 'small gold', () => this.hooks.install?.()));
    col.appendChild(row);
    s.appendChild(col);
    s.appendChild(el('div', 'hint', 'P1: <b>A</b> / <b>D</b>, дія <b>W</b> &nbsp; P2: <b>←</b> / <b>→</b>, дія <b>↑</b> &nbsp;·&nbsp; на телефоні — кнопки в кутах'));
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
    mk('Музика', [1, 0], music.enabled ? 1 : 0, (v) => (v ? 'увімк' : 'вимк'), (v) => music.setEnabled(!!v));
    s.appendChild(button('◀ назад', '', () => this.showMain(), 'back'));
    this.keyHandler = (e) => e.code === 'Escape' && this.showMain();
  }

  /** Browse every car (from the main menu). */
  openGarage() {
    this.overlay = openCarBrowser(this.root, {
      title: `ГАРАЖ · ${CARS.length} авто`,
      mode: 'browse',
      color: PLAYER_COLORS[0],
      filter: this.garageFilter,
      onAssign: (p, def) => {
        if (p === 0) this.settings.p1 = def.id;
        else this.settings.p2 = def.id;
        this.hooks.settingsChanged();
      },
      onClose: (f) => {
        this.garageFilter = f;
        this.overlay = null;
      },
    });
  }

  showCars(mode: Mode, onDone: () => void) {
    this.mode = mode;
    const s = this.screen('cars');
    const head = el('div', 'cars-head');
    head.appendChild(titleCanvas('ОБЕРИ АВТО', 12, '#ffffff', 2));
    s.appendChild(head);
    const wrap = el('div', 'cars-wrap');
    const cur = [CAR_BY_ID[this.settings.p1] ?? CARS[0], CAR_BY_ID[this.settings.p2] ?? CARS[1]];
    const counts = countByCategory(CARS);
    // If a remembered collection no longer contains the car, show all.
    for (const p of [0, 1]) if (this.carCat[p] !== 'all' && categoryOf(cur[p]) !== this.carCat[p]) this.carCat[p] = 'all';
    const pool = (p: number) => filterCars(CARS, { cat: this.carCat[p] });
    const panels = [0, 1].map((p) => {
      const panel = el('div', `car-panel p${p + 1}`);
      wrap.appendChild(panel);
      return panel;
    });
    const step = (p: number, d: number) => {
      const list = pool(p);
      const i = list.indexOf(cur[p]);
      cur[p] = list[(Math.max(0, i) + d + list.length) % list.length];
      renderAll();
    };
    const setCat = (p: number, cat: CategoryId | 'all') => {
      this.carCat[p] = cat;
      const list = pool(p);
      if (!list.includes(cur[p])) cur[p] = list[0];
      renderAll();
    };
    const cycleCat = (p: number, d: number) => {
      const ids: (CategoryId | 'all')[] = ['all', ...CATEGORIES.map((c) => c.id)];
      setCat(p, ids[(ids.indexOf(this.carCat[p]) + d + ids.length) % ids.length]);
    };
    const pickFromGarage = (p: number) => {
      this.overlay = openCarBrowser(this.root, {
        title: p === 0 ? 'ГРАВЕЦЬ 1 · обери авто' : mode === 'bot' ? 'БОТ · обери авто' : 'ГРАВЕЦЬ 2 · обери авто',
        mode: 'pick',
        color: PLAYER_COLORS[p],
        selected: cur[p].id,
        filter: { cat: this.carCat[p] },
        onPick: (def) => {
          cur[p] = def;
          if (this.carCat[p] !== 'all' && categoryOf(def) !== this.carCat[p]) this.carCat[p] = 'all';
        },
        onClose: () => {
          this.overlay = null;
          renderAll();
        },
      });
    };
    const render = (p: number) => {
      const def = cur[p];
      const panel = panels[p];
      panel.innerHTML = '';
      const top = el('div', 'panel-top');
      const who = p === 0 ? 'ГРАВЕЦЬ 1' : mode === 'bot' ? `БОТ · ${LEVEL_NAMES[this.settings.bot]}` : 'ГРАВЕЦЬ 2';
      top.appendChild(el('div', 'who', who));
      const sel = el('select', 'cat-select');
      sel.setAttribute('aria-label', 'Колекція');
      sel.appendChild(new Option(`Усі колекції (${counts.all})`, 'all'));
      for (const c of CATEGORIES) sel.appendChild(new Option(`${c.icon} ${c.name} (${counts[c.id] ?? 0})`, c.id));
      sel.value = this.carCat[p];
      sel.addEventListener('change', () => { audio.click(); setCat(p, sel.value as CategoryId | 'all'); });
      top.appendChild(sel);
      panel.appendChild(top);
      const stage = el('div', 'stage');
      const sameAsOther = cur[1 - p].id === def.id && p === 1;
      const cv = carPreviewCanvas(def, sameAsOther ? altPalette(def.palette) : def.palette, PLAYER_COLORS[p], 3, p === 1);
      cv.className = 'preview';
      cv.addEventListener('click', () => pickFromGarage(p));
      cv.title = 'Відкрити всі авто';
      stage.append(button('◀', 'arrow', () => step(p, -1)), cv, button('▶', 'arrow', () => step(p, 1)));
      panel.appendChild(stage);
      const cat = CATEGORY_BY_ID[categoryOf(def)];
      panel.appendChild(el('div', 'car-name', `${def.name} <small>${cat.icon} ${ARCH_NAMES[def.archetype]}</small>`));
      panel.appendChild(el('div', 'ability', abilityLabel(def)));
      panel.appendChild(el('div', 'blurb', def.blurb));
      panel.appendChild(statBars(def));
      const row = el('div', 'row panel-actions');
      row.append(
        button('☰ усі авто', 'small', () => pickFromGarage(p)),
        button('🎲', 'small', () => {
          const list = pool(p);
          cur[p] = list[Math.floor(Math.random() * list.length)];
          renderAll();
        }),
      );
      panel.appendChild(row);
      const list = pool(p);
      panel.appendChild(el('div', 'counter', `${list.indexOf(def) + 1} / ${list.length}`));
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
      this.settings.p1 = cur[0].id;
      this.settings.p2 = cur[1].id;
      this.hooks.settingsChanged();
      onDone();
    };
    this.keyHandler = (e) => {
      const k = (p: number, d: number) => { audio.click(); step(p, d); };
      if (e.code === 'KeyA') k(0, -1);
      else if (e.code === 'KeyD') k(0, 1);
      else if (e.code === 'KeyW') cycleCat(0, -1);
      else if (e.code === 'KeyS') cycleCat(0, 1);
      else if (e.code === 'ArrowLeft') k(1, -1);
      else if (e.code === 'ArrowRight') k(1, 1);
      else if (e.code === 'ArrowUp') cycleCat(1, -1);
      else if (e.code === 'ArrowDown') cycleCat(1, 1);
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
      const cat = CATEGORIES.find((k) => k.map === id && k.id !== 'retro');
      c.appendChild(el('div', 'map-name', cat ? `${cat.icon} ${name}` : name));
      if (cat) c.title = `${blurb} · тематична арена: ${cat.name}`;
      if (!c.title) c.title = blurb;
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

export { CAR_BY_ID };
