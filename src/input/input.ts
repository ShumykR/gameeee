/** Per-player held buttons, in world directions. */
export interface PlayerButtons { left: boolean; right: boolean }

export function dirOf(b: PlayerButtons): -1 | 0 | 1 {
  return b.left === b.right ? 0 : b.left ? -1 : 1;
}

const KEYMAP: Record<string, [number, 'left' | 'right']> = {
  KeyA: [0, 'left'],
  KeyD: [0, 'right'],
  ArrowLeft: [1, 'left'],
  ArrowRight: [1, 'right'],
};

/** Combines keyboard and touch zones into button state for two players. */
export class InputManager {
  readonly keys: PlayerButtons[] = [{ left: false, right: false }, { left: false, right: false }];
  readonly touch: PlayerButtons[] = [{ left: false, right: false }, { left: false, right: false }];
  /** Optional overrides (bots). */
  readonly virtual: (PlayerButtons | null)[] = [null, null];
  private pointers = new Map<number, { x: number; y: number }>();
  touchEnabled = false;
  onAnyKey: ((code: string) => void) | null = null;
  /** Touch zones in client pixels, recalculated on resize. */
  zones: { player: number; btn: 'left' | 'right'; x: number; y: number; w: number; h: number }[] = [];

  constructor(private readonly el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      const m = KEYMAP[e.code];
      if (m) {
        this.keys[m[0]][m[1]] = true;
        e.preventDefault();
      }
      this.onAnyKey?.(e.code);
    });
    window.addEventListener('keyup', (e) => {
      const m = KEYMAP[e.code];
      if (m) this.keys[m[0]][m[1]] = false;
    });
    window.addEventListener('blur', () => {
      for (const k of this.keys) k.left = k.right = false;
      this.pointers.clear();
      this.recomputeTouch();
    });
    const opts = { passive: false } as AddEventListenerOptions;
    el.addEventListener('pointerdown', (e) => this.onPointer(e, true), opts);
    el.addEventListener('pointermove', (e) => this.onPointer(e, false), opts);
    const up = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      this.recomputeTouch();
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onPointer(e: PointerEvent, down: boolean) {
    if (e.pointerType === 'mouse' && !down && !this.pointers.has(e.pointerId)) return;
    if (e.pointerType === 'touch') this.touchEnabled = true;
    if (!down && !this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { this.el.setPointerCapture?.(e.pointerId); } catch { /* ignore */ }
    this.recomputeTouch();
    e.preventDefault();
  }

  private recomputeTouch() {
    for (const t of this.touch) t.left = t.right = false;
    for (const p of this.pointers.values()) {
      for (const z of this.zones) {
        if (p.x >= z.x && p.x < z.x + z.w && p.y >= z.y && p.y < z.y + z.h) this.touch[z.player][z.btn] = true;
      }
    }
  }

  /** Single-player (vs bot): only player 1's pad is shown, split to the two bottom corners and wider. */
  solo = false;

  /** Lay out the big touch buttons: two per player in the bottom corners (solo: just player 1, one per corner). */
  layout(w: number, h: number) {
    const bh = Math.min(h * 0.5, Math.max(110, h * 0.4));
    const y = h - bh;
    if (this.solo) {
      const bw = Math.min(260, Math.max(130, w * 0.24));
      this.zones = [
        { player: 0, btn: 'left', x: 0, y, w: bw, h: bh },
        { player: 0, btn: 'right', x: w - bw, y, w: bw, h: bh },
      ];
      return;
    }
    const bw = Math.min(150, Math.max(90, w * 0.13));
    this.zones = [
      { player: 0, btn: 'left', x: 0, y, w: bw, h: bh },
      { player: 0, btn: 'right', x: bw, y, w: bw, h: bh },
      { player: 1, btn: 'left', x: w - bw * 2, y, w: bw, h: bh },
      { player: 1, btn: 'right', x: w - bw, y, w: bw, h: bh },
    ];
  }

  buttons(player: number): PlayerButtons {
    const v = this.virtual[player];
    if (v) return v;
    const k = this.keys[player], t = this.touch[player];
    return { left: k.left || t.left, right: k.right || t.right };
  }

  dir(player: number): -1 | 0 | 1 {
    return dirOf(this.buttons(player));
  }
}
