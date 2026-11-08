import { CARS } from '../cars/defs';
import { carPreviewCanvas } from '../cars/preview';
import { normalizedStats } from '../cars/stats';
import { abilityLabel } from '../game/abilities';

/** Debug/showcase page listing every car with its generated sprite and stats (?gallery=1). */
export function showGallery(root: HTMLElement) {
  root.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.className = 'gallery';
  const f = new URLSearchParams(location.search).get('f');
  for (const def of CARS.filter((c) => !f || c.category === f || c.id === f)) {
    const card = document.createElement('div');
    card.className = 'gcard';
    const cv = carPreviewCanvas(def, def.palette, '#3ec1ff', 3);
    const st = normalizedStats(def, CARS);
    card.innerHTML = `<div class="gname">${def.name}</div><div class="garch">${def.archetype} · ${abilityLabel(def)}</div>`;
    card.prepend(cv);
    const bars = document.createElement('div');
    bars.className = 'gbars';
    for (const [k, v] of Object.entries({ ШВИД: st.speed, ПОТУЖ: st.accel, ВАГА: st.weight })) {
      bars.insertAdjacentHTML('beforeend', `<div class="gbar"><span>${k}</span><i style="width:${(v / 5) * 100}%"></i></div>`);
    }
    card.appendChild(bars);
    wrap.appendChild(card);
  }
  root.appendChild(wrap);
}
