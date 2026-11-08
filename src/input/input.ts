/** Per-player held buttons, in world directions. */
export interface PlayerButtons { left: boolean; right: boolean; action?: boolean }

export function dirOf(b: PlayerButtons): -1 | 0 | 1 {
  return b.left === b.right ? 0 : b.left ? -1 : 1;
}

type Btn = 'left' | 'right' | 'action';

const KEYMAP: Record<string, [number, Btn]> = {
  KeyA: [0, 'left'],
  KeyD: [0, 'right'],
  KeyW: [0, 'action'],
  KeyS: [0, 'action'],
  ArrowLeft: [1, 'left'],
  ArrowRight: [1, 'right'],
  ArrowUp: [1, 'action'],
  ArrowDown: [1, 'action'],
};

/** Combines keyboard and touch zones into button state for two players. */
export class InputManager {
  readonly keys: PlayerButtons[] = [{ left: false, right: false, action: false }, { left: false, right: false, action: false }];
  readonly touch: PlayerButtons[] = [{ left: false, right: false, action: false }, { left: false, right: false, action: false }];
  /** Optional overrides (bots). */
  readonly virtual: (PlayerButtons | null)[] = [null, null];
  private pointers = new Map<number, { x: number; y: number }>();
  touchEnabled = false;
  onAnyKey: ((code: string) => void) | null = null;
  /** Touch zones in client pixels, recalculated on resize. */
  zones: { player: number; btn: Btn; x: number; y: number; w: number; h: number }[] = [];

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
      for (const k of this.keys) k.left = k.right = k.action = false;
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
    for (const t of this.touch) t.left = t.right = t.action = false;
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
    // Action buttons: smaller, just above the arrows.
    const ah = Math.min(bh * 0.62, Math.max(72, h * 0.22));
    if (this.solo) {
      const bw = Math.min(260, Math.max(130, w * 0.24));
      const aw = Math.min(170, Math.max(96, w * 0.15));
      this.zones = [
        { player: 0, btn: 'left', x: 0, y, w: bw, h: bh },
        { player: 0, btn: 'right', x: w - bw, y, w: bw, h: bh },
        { player: 0, btn: 'action', x: w - bw - aw, y: h - ah, w: aw, h: ah },
      ];
      return;
    }
    const bw = Math.min(150, Math.max(90, w * 0.13));
    this.zones = [
      { player: 0, btn: 'left', x: 0, y, w: bw, h: bh },
      { player: 0, btn: 'right', x: bw, y, w: bw, h: bh },
      { player: 0, btn: 'action', x: bw * 0.5, y: y - ah, w: bw, h: ah },
      { player: 1, btn: 'left', x: w - bw * 2, y, w: bw, h: bh },
      { player: 1, btn: 'right', x: w - bw, y, w: bw, h: bh },
      { player: 1, btn: 'action', x: w - bw * 1.5, y: y - ah, w: bw, h: ah },
    ];
  }

  /** Is the action button held (keyboard or touch)? */
  action(player: number): boolean {
    const v = this.virtual[player];
    if (v) return !!v.action;
    return !!(this.keys[player].action || this.touch[player].action);
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
