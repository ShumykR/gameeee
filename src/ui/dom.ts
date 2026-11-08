import { CARS } from '../cars/defs';
import { rawStats, type CarStats } from '../cars/stats';
import type { CarDef } from '../cars/types';
import { pixelTextCanvas } from '../render/pixeltext';
import { audio } from '../audio/audio';

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export function button(label: string, cls: string, onClick: () => void, sound: 'click' | 'back' = 'click') {
  const b = el('button', `btn ${cls}`, label);
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    audio[sound]();
    onClick();
  });
  return b;
}

export function titleCanvas(text: string, size: number, color: string, scale: number) {
  const c = pixelTextCanvas(text, { size, color });
  c.className = 'ptitle';
  c.style.width = `${c.width * scale}px`;
  c.style.height = `${c.height * scale}px`;
  return c;
}

let ranges: Record<keyof CarStats, [number, number]> | null = null;

/** Stats normalized to 1..5 against the whole garage (ranges cached). */
export function garageStats(def: CarDef): CarStats {
  if (!ranges) {
    const raws = CARS.map(rawStats);
    ranges = {} as Record<keyof CarStats, [number, number]>;
    for (const k of Object.keys(raws[0]) as (keyof CarStats)[]) {
      const vals = raws.map((r) => r[k]);
      ranges[k] = [Math.min(...vals), Math.max(...vals)];
    }
  }
  const r = rawStats(def);
  const out = {} as CarStats;
  for (const k of Object.keys(r) as (keyof CarStats)[]) {
    const [lo, hi] = ranges[k];
    out[k] = hi - lo < 1e-9 ? 3 : 1 + ((r[k] - lo) / (hi - lo)) * 4;
  }
  return out;
}

export function statBars(def: CarDef) {
  const st = garageStats(def);
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
