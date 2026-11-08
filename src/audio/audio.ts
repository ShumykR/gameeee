/**
 * All sound is synthesized with WebAudio — no audio files.
 * Engines are continuous oscillators; effects are short generated buffers/envelopes.
 */
export class AudioEngine {
  ctx: AudioContext | null = null;
  master!: GainNode;
  private sfx!: GainNode;
  noise!: AudioBuffer;
  /** Called once the context exists (first user gesture). */
  onUnlock: (() => void) | null = null;
  private engines: { osc: OscillatorNode; sub: OscillatorNode; filter: BiquadFilterNode; gain: GainNode }[] = [];
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('hba-muted') === '1';
    } catch { /* ignore */ }
  }

  /** Must be called from a user gesture. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);
    this.sfx = this.ctx.createGain();
    this.sfx.connect(this.master);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.onUnlock?.();
  }

  setMuted(m: boolean) {
    this.muted = m;
    try { localStorage.setItem('hba-muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05);
  }

  private env(g: GainNode, t: number, a: number, peak: number, dur: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dur);
  }

  tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.15, slideTo?: number, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g).connect(this.sfx);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noiseBurst(dur: number, vol: number, freq: number, q = 1, sweepTo?: number) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    const g = this.ctx.createGain();
    this.env(g, t, 0.003, vol, dur);
    src.connect(f).connect(g).connect(this.sfx);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  click() { this.tone(660, 0.05, 'square', 0.08, 990); }
  back() { this.tone(500, 0.06, 'square', 0.08, 300); }
  countdown(n: number) { this.tone(n > 0 ? 440 : 880, n > 0 ? 0.12 : 0.35, 'square', 0.12); }
  pad() { this.tone(180, 0.25, 'sine', 0.3, 700); }
  impact(strength: number, carCar: boolean) {
    const v = Math.min(0.5, 0.06 + strength * 0.03);
    if (carCar) {
      this.noiseBurst(0.12, v, 1800, 1.5, 600);
      this.tone(90 + Math.random() * 40, 0.12, 'triangle', v * 0.8, 50);
    } else this.noiseBurst(0.18, v * 0.7, 400, 0.8, 120);
  }
  explosion() {
    this.noiseBurst(1.1, 0.7, 1200, 0.6, 60);
    this.tone(120, 0.6, 'sine', 0.6, 30);
    this.tone(60, 0.9, 'triangle', 0.4, 25, 0.05);
  }
  siren() {
    for (let i = 0; i < 3; i++) this.tone(300, 0.35, 'sawtooth', 0.08, 600, i * 0.4);
  }
  jingle(win: boolean) {
    const notes = win ? [523, 659, 784, 1047] : [392, 330, 262];
    notes.forEach((f, i) => this.tone(f, 0.18, 'square', 0.12, undefined, i * 0.13));
  }
  ability(kind: string, proj?: string) {
    switch (kind) {
      case 'jump': this.tone(220, 0.18, 'square', 0.12, 660); break;
      case 'nitro':
      case 'dash': this.noiseBurst(0.45, 0.35, 900, 0.7, 2600); this.tone(110, 0.3, 'sawtooth', 0.08, 220); break;
      case 'slam': this.tone(500, 0.25, 'square', 0.08, 120); break;
      case 'fly': this.tone(330, 0.5, 'sine', 0.12, 880); this.noiseBurst(0.5, 0.12, 2400, 0.5, 4000); break;
      case 'shield': [880, 1320, 1760].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.1, undefined, i * 0.05)); break;
      case 'shoot':
        if (proj === 'laser') this.tone(1800, 0.18, 'square', 0.09, 300);
        else if (proj === 'snowball' || proj === 'ball') { this.noiseBurst(0.12, 0.3, 700, 1, 300); this.tone(240, 0.1, 'triangle', 0.15, 120); }
        else if (proj === 'firework') { this.noiseBurst(0.5, 0.25, 3000, 0.6, 800); this.tone(600, 0.4, 'square', 0.05, 1600); }
        else { this.noiseBurst(0.35, 0.55, 900, 0.6, 120); this.tone(80, 0.3, 'sine', 0.5, 40); }
        break;
    }
  }
  blast(kind: string) {
    if (kind === 'firework') {
      this.noiseBurst(0.6, 0.4, 3500, 0.4, 600);
      for (let i = 0; i < 4; i++) this.tone(1200 + Math.random() * 1200, 0.08, 'square', 0.05, undefined, 0.05 + i * 0.07);
    } else if (kind === 'bomb') this.explosion();
    else { this.noiseBurst(0.5, 0.6, 500, 0.6, 60); this.tone(70, 0.5, 'sine', 0.6, 30); }
  }
  shieldBlock() { this.tone(1400, 0.2, 'triangle', 0.15, 700); }

  point() {
    [784, 988].forEach((f, i) => this.tone(f, 0.12, 'square', 0.1, undefined, i * 0.09));
  }

  /** Continuous engine drones, one per player. */
  setEngines(states: { load: number; throttle: boolean; alive: boolean; pitch: number }[]) {
    if (!this.ctx) return;
    while (this.engines.length < states.length) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      const sub = this.ctx.createOscillator();
      sub.type = 'square';
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      const gain = this.ctx.createGain();
      gain.gain.value = 0;
      osc.connect(filter);
      sub.connect(filter);
      filter.connect(gain).connect(this.master);
      osc.start();
      sub.start();
      this.engines.push({ osc, sub, filter, gain });
    }
    const t = this.ctx.currentTime;
    states.forEach((s, i) => {
      const e = this.engines[i];
      const load = Math.min(1.4, s.load);
      const f = (38 + load * 70) * s.pitch;
      e.osc.frequency.setTargetAtTime(f, t, 0.05);
      e.sub.frequency.setTargetAtTime(f * 0.5, t, 0.05);
      e.filter.frequency.setTargetAtTime(250 + load * 900 + (s.throttle ? 300 : 0), t, 0.05);
      e.gain.gain.setTargetAtTime(s.alive ? (s.throttle ? 0.07 : 0.035) : 0, t, 0.08);
    });
  }

  stopEngines() {
    if (!this.ctx) return;
    for (const e of this.engines) e.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
  }
}

export const audio = new AudioEngine();
