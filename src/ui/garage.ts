import { CARS } from '../cars/defs';
import { ARCH_NAMES, CATEGORIES, CATEGORY_BY_ID, categoryOf, countByCategory, filterCars, type CarFilter } from '../cars/catalog';
import { carPreviewCanvas } from '../cars/preview';
import type { Archetype, CarDef } from '../cars/types';
import { audio } from '../audio/audio';
import { button, el, statBars } from './dom';

const thumbCache = new Map<string, string>();

/** Pixel-art preview of a car as a data URL (cached per car + driver colour). */
export function carThumb(def: CarDef, color: string, flip = false): string {
  const key = `${def.id}|${color}|${flip}`;
  let url = thumbCache.get(key);
  if (!url) {
    url = carPreviewCanvas(def, def.palette, color, 2, flip).toDataURL();
    thumbCache.set(key, url);
  }
  return url;
}

export interface BrowserOpts {
  title: string;
  /** browse: tap opens details. pick: tap chooses the car. */
  mode: 'browse' | 'pick';
  color: string;
  selected?: string;
  filter?: CarFilter;
  onPick?: (def: CarDef) => void;
  /** Browse mode: "use for player N" buttons in the details card. */
  onAssign?: (player: 0 | 1, def: CarDef) => void;
  onClose: (filter: CarFilter) => void;
}

export interface CarBrowser {
  root: HTMLElement;
  handleKey(e: KeyboardEvent): void;
  close(): void;
}

/** Full-screen garage: every car in a searchable, filterable grid. */
export function openCarBrowser(host: HTMLElement, o: BrowserOpts): CarBrowser {
  const f: CarFilter = { cat: 'all', arch: 'all', query: '', ...(o.filter ?? {}) };
  const root = el('div', `garage ${o.mode}`);
  const head = el('div', 'garage-head');
  head.appendChild(el('div', 'garage-title', o.title));
  const search = el('input', 'garage-search');
  search.type = 'search';
  search.placeholder = 'Пошук: назва, тип, опис…';
  search.value = f.query ?? '';
  search.setAttribute('aria-label', 'Пошук авто');
  const arch = el('select', 'garage-arch');
  arch.setAttribute('aria-label', 'Тип авто');
  arch.appendChild(new Option('Усі типи', 'all'));
  for (const [k, v] of Object.entries(ARCH_NAMES)) arch.appendChild(new Option(v, k));
  arch.value = f.arch ?? 'all';
  const close = button('✕', 'small garage-close', () => api.close(), 'back');
  close.title = 'Закрити (Esc)';
  head.append(search, arch, close);
  root.appendChild(head);

  const counts = countByCategory(CARS);
  const chips = el('div', 'garage-chips');
  const chipEls = new Map<string, HTMLButtonElement>();
  const addChip = (id: string, label: string) => {
    const c = el('button', 'chip', `${label} <small>${counts[id] ?? 0}</small>`);
    c.addEventListener('click', () => {
      audio.unlock();
      audio.click();
      f.cat = id as CarFilter['cat'];
      refresh();
    });
    chipEls.set(id, c);
    chips.appendChild(c);
  };
  addChip('all', 'Усі');
  for (const c of CATEGORIES) addChip(c.id, `${c.icon} ${c.name}`);
  root.appendChild(chips);

  const grid = el('div', 'garage-grid');
  root.appendChild(grid);
  const empty = el('div', 'garage-empty', 'Нічого не знайдено. Спробуй іншу назву або категорію.');
  root.appendChild(empty);
  const foot = el('div', 'garage-foot');
  root.appendChild(foot);

  // Thumbnails are rendered lazily as cards scroll into view.
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const card = en.target as HTMLElement;
      const def = CARS.find((c) => c.id === card.dataset.id);
      const img = card.querySelector('img');
      if (def && img && !img.src) img.src = carThumb(def, o.color);
      io.unobserve(card);
    }
  }, { root: grid, rootMargin: '200px' });

  let list: CarDef[] = [];
  const refresh = () => {
    list = filterCars(CARS, f);
    for (const [id, c] of chipEls) c.classList.toggle('on', (f.cat ?? 'all') === id);
    chipEls.get(f.cat ?? 'all')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    io.disconnect();
    grid.innerHTML = '';
    for (const def of list) {
      const card = el('button', `gcar ${def.id === o.selected ? 'on' : ''}`);
      card.dataset.id = def.id;
      const img = el('img');
      img.alt = def.name;
      img.draggable = false;
      card.appendChild(img);
      card.appendChild(el('div', 'gcar-name', def.name));
      card.title = `${def.name} — ${def.blurb}`;
      card.addEventListener('click', () => {
        audio.unlock();
        audio.click();
        if (o.mode === 'pick') {
          o.onPick?.(def);
          api.close();
        } else showDetail(def);
      });
      grid.appendChild(card);
      io.observe(card);
    }
    grid.scrollTop = 0;
    empty.style.display = list.length ? 'none' : 'block';
    foot.textContent = `${list.length} з ${CARS.length} авто`;
  };

  // Details card (browse mode)
  let detail: HTMLElement | null = null;
  const showDetail = (def: CarDef) => {
    detail?.remove();
    detail = el('div', 'garage-detail');
    const card = el('div', 'gd-card');
    const cv = carPreviewCanvas(def, def.palette, o.color, 4);
    cv.className = 'gd-preview';
    const cat = CATEGORY_BY_ID[categoryOf(def)];
    const i = list.indexOf(def);
    const nav = el('div', 'gd-stage');
    const go = (d: number) => {
      if (!list.length) return;
      showDetail(list[(list.indexOf(def) + d + list.length) % list.length]);
    };
    nav.append(button('◀', 'arrow', () => go(-1)), cv, button('▶', 'arrow', () => go(1)));
    card.appendChild(nav);
    card.appendChild(el('div', 'car-name', `${def.name}`));
    card.appendChild(el('div', 'gd-tags', `<span class="chip on">${cat.icon} ${cat.name}</span><span class="chip">${ARCH_NAMES[def.archetype]}</span>`));
    card.appendChild(el('div', 'blurb', def.blurb));
    card.appendChild(statBars(def));
    const row = el('div', 'row');
    if (o.onAssign) {
      row.append(
        button('обрати: гравець 1', 'small p1', () => { o.onAssign!(0, def); flash(row, 'Гравець 1 поїде на ' + def.name); }),
        button('обрати: гравець 2', 'small p2', () => { o.onAssign!(1, def); flash(row, 'Гравець 2 поїде на ' + def.name); }),
      );
    }
    row.append(button('назад', 'small', () => hideDetail(), 'back'));
    card.appendChild(row);
    card.appendChild(el('div', 'counter', i >= 0 ? `${i + 1} / ${list.length}` : ''));
    detail.appendChild(card);
    detail.addEventListener('click', (e) => { if (e.target === detail) hideDetail(); });
    root.appendChild(detail);
  };
  const hideDetail = () => {
    detail?.remove();
    detail = null;
  };
  const flash = (row: HTMLElement, text: string) => {
    let n = row.parentElement?.querySelector('.gd-note') as HTMLElement | null;
    if (!n) {
      n = el('div', 'gd-note');
      row.after(n);
    }
    n.textContent = `✓ ${text}`;
  };

  search.addEventListener('input', () => {
    f.query = search.value;
    refresh();
  });
  arch.addEventListener('change', () => {
    f.arch = arch.value as Archetype | 'all';
    refresh();
  });
  search.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' && list.length) {
      if (o.mode === 'pick') {
        o.onPick?.(list[0]);
        api.close();
      } else showDetail(list[0]);
    }
    if (e.key === 'Escape') api.close();
  });

  const api: CarBrowser = {
    root,
    handleKey(e) {
      if (e.code === 'Escape') {
        if (detail) hideDetail();
        else api.close();
        return;
      }
      if (detail && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
        (detail.querySelectorAll('.arrow')[e.code === 'ArrowLeft' ? 0 : 1] as HTMLButtonElement)?.click();
        return;
      }
      // Typing anywhere jumps into the search box.
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement !== search) {
        search.focus();
      }
    },
    close() {
      io.disconnect();
      root.remove();
      o.onClose(f);
    },
  };
  host.appendChild(root);
  refresh();
  // Scroll the selected car into view.
  const sel = grid.querySelector('.gcar.on') as HTMLElement | null;
  sel?.scrollIntoView({ block: 'center' });
  return api;
}
