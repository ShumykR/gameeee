import { audio } from './audio';

/*
 * Chiptune music, synthesized live with WebAudio — no audio files.
 * A track is a chord progression plus pattern strings; a lookahead scheduler
 * turns them into oscillator notes (lead, arpeggio, bass) and noise drums.
 */

const MINOR = [0, 2, 3, 5, 7, 8, 10];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export interface Track {
  title: string;
  bpm: number;
  /** MIDI note of the scale root (bass octave). */
  root: number;
  scale: number[];
  /** Chord root as a scale degree, one per bar. */
  prog: number[];
  /** 16-step patterns. Bass: x root, o octave, 5 fifth, . rest. */
  bass: string;
  /** Arpeggio over chord tones (0,1,2 = root/third/fifth, 3 = octave), '.' rest. */
  arp: string;
  kick: string;
  snare: string;
  hat: string;
  /** Lead melody, one string of 16 tokens per bar: scale degree, '.' rest, '-' hold. Played over A then B. */
  leadA: string[];
  leadB?: string[];
  leadWave: OscillatorType;
  bassWave: OscillatorType;
  arpWave: OscillatorType;
  vol?: number;
}

export type TrackId = 'menu' | 'match1' | 'match2' | 'match3' | 'sudden';

export const TRACKS: Record<TrackId, Track> = {
  menu: {
    title: 'Garage Groove', bpm: 100, root: 48, scale: MAJOR, prog: [0, 5, 3, 4],
    bass: 'x . . . . . x . x . . . . . 5 .',
    arp: '0 . 1 . 2 . 1 . 0 . 1 . 2 . 3 .',
    kick: 'x . . . . . . . x . . x . . . .',
    snare: '. . . . x . . . . . . . x . . .',
    hat: '. . x . . . x . . . x . . . x .',
    leadA: [
      '4 . . 2 . . 4 . 5 . 4 . 2 . 0 .',
      '2 . . 0 . . 2 . 4 . 2 . 0 . -1 .',
      '3 . . 5 . . 7 . 5 . 3 . 2 . 3 .',
      '4 . . . 6 . . . 4 . 1 . 2 . . .',
    ],
    leadB: [
      '7 . 6 . 7 . 4 . . . 4 5 4 . 2 .',
      '5 . 4 . 5 . 2 . . . 2 4 2 . 0 .',
      '3 . 2 . 3 . 5 . 7 . 5 . 3 . 2 .',
      '1 . . . 4 . . . 6 . . . 7 . . .',
    ],
    leadWave: 'square', bassWave: 'triangle', arpWave: 'triangle', vol: 0.8,
  },
  match1: {
    title: 'Bumper Rush', bpm: 150, root: 45, scale: MINOR, prog: [0, 5, 2, 6],
    bass: 'x . x . x . x o x . x . x . x o',
    arp: '0 1 2 1 0 1 2 1 0 1 2 1 0 1 2 3',
    kick: 'x . . . x . . . x . . . x . . .',
    snare: '. . . . x . . . . . . . x . . .',
    hat: 'x . x . x . x . x . x . x . x x',
    leadA: [
      '4 . 4 . 7 . 4 . 3 . 2 . 3 . 4 .',
      '5 . . . 4 . 3 . 2 . . . 0 . . .',
      '2 . 2 . 4 . 2 . 1 . 0 . 1 . 2 .',
      '1 . . . 6 . 4 . 1 . . . . . . .',
    ],
    leadB: [
      '7 . 9 . 7 . 4 . 7 . 9 . 11 . 9 .',
      '8 . . . 7 . 5 . 4 . . . 5 . 4 .',
      '2 . 4 . 7 . 4 . 2 . 4 . 9 . 7 .',
      '6 . . . 8 . . . 6 . 4 . 1 . . .',
    ],
    leadWave: 'square', bassWave: 'square', arpWave: 'triangle',
  },
  match2: {
    title: 'Head Hunter', bpm: 138, root: 40, scale: MINOR, prog: [0, 0, 3, 4],
    bass: 'x . . x . . x . x . . x . . x .',
    arp: '0 . 2 . 3 . 2 . 0 . 2 . 3 . 1 .',
    kick: 'x . . x . . x . . . x . . . . .',
    snare: '. . . . x . . . . . . . x . . x',
    hat: 'x . x . x . x . x . x . x . x .',
    leadA: [
      '0 . 2 . 4 . . 2 4 . 7 . 6 . 4 .',
      '2 . . . 4 . . . 0 . . . . . . .',
      '3 . 5 . 7 . . 5 7 . 10 . 9 . 7 .',
      '6 . . . 4 . . . 1 . 2 . 4 . . .',
    ],
    leadB: [
      '7 - - . 7 . 9 . 10 . 9 . 7 . 4 .',
      '4 - - . 4 . 2 . 4 . 7 . 4 . . .',
      '5 - - . 5 . 7 . 9 . 7 . 5 . 3 .',
      '4 . 6 . 8 . 6 . 4 . . . . . . .',
    ],
    leadWave: 'sawtooth', bassWave: 'triangle', arpWave: 'square', vol: 0.85,
  },
  match3: {
    title: 'Turbo Toy', bpm: 160, root: 41, scale: MAJOR, prog: [0, 4, 5, 3],
    bass: 'x . o . x . o . x . o . x . o .',
    arp: '2 . 1 . 0 . 1 . 2 . 3 . 2 . 1 .',
    kick: 'x . . . . . x . x . . . . . . .',
    snare: '. . . . x . . . . . . . x . . .',
    hat: '. . x . . . x . . . x . . . x .',
    leadA: [
      '4 . 2 . 4 . 7 . . . 7 . 6 . 4 .',
      '6 . 4 . 6 . 8 . . . 8 . 7 . 6 .',
      '7 . 5 . 7 . 9 . . . 9 . 8 . 7 .',
      '6 . . . 3 . . . 4 . 5 . 6 . . .',
    ],
    leadB: [
      '7 7 . 7 . 4 . . 7 7 . 7 . 9 . .',
      '8 8 . 8 . 6 . . 8 8 . 8 . 11 . .',
      '9 . 8 . 7 . 5 . 4 . 5 . 7 . 9 .',
      '8 . . . 7 . . . 6 . . . 4 . . .',
    ],
    leadWave: 'square', bassWave: 'square', arpWave: 'triangle',
  },
  sudden: {
    title: 'Overtime', bpm: 176, root: 38, scale: MINOR, prog: [0, 0, 5, 4],
    bass: 'x x o x x x o x x x o x x o x o',
    arp: '0 1 2 3 2 1 0 1 2 3 2 1 0 1 2 3',
    kick: 'x . . . x . . . x . . . x . x .',
    snare: '. . . . x . . . . . . . x . . x',
    hat: 'x x x x x x x x x x x x x x x x',
    leadA: [
      '7 . 7 . 8 . 7 . 4 . . . 7 . . .',
      '7 . 7 . 8 . 9 . 8 . 7 . 4 . . .',
      '5 . 5 . 7 . 5 . 2 . . . 5 . . .',
      '4 . 6 . 4 . 3 . 1 . 3 . 4 . . .',
    ],
    leadWave: 'sawtooth', bassWave: 'square', arpWave: 'square', vol: 0.85,
  },
};

const MATCH_TRACKS: TrackId[] = ['match1', 'match2', 'match3'];

const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const toks = (s: string) => s.trim().split(/\s+/);

/** Scale degree (any octave) to MIDI. */
export function degreeMidi(t: Track, deg: number, base: number): number {
  const n = t.scale.length;
  const oct = Math.floor(deg / n);
  const i = ((deg % n) + n) % n;
  return base + oct * 12 + t.scale[i];
}

class MusicPlayer {
  enabled = true;
  private out: GainNode | null = null;
  private track: Track | null = null;
  current: TrackId | null = null;
  private wanted: TrackId | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private matchIdx = Math.floor(Math.random() * MATCH_TRACKS.length);
  private ducked = false;

  constructor() {
    try {
      this.enabled = localStorage.getItem('hba-music') !== '0';
    } catch { /* ignore */ }
  }

  private get vol() {
    return (this.ducked ? 0.2 : 0.62) * (this.track?.vol ?? 1);
  }

  private ensure(): boolean {
    const ctx = audio.ctx;
    if (!ctx) return false;
    if (!this.out) {
      this.out = ctx.createGain();
      this.out.gain.value = 0;
      this.out.connect(audio.master);
    }
    return true;
  }

  /** Switch to a track (crossfades; no-op if already playing). */
  play(id: TrackId) {
    this.wanted = id;
    if (!this.enabled || !this.ensure()) return;
    if (this.current === id && this.timer !== null) return;
    const ctx = audio.ctx!;
    this.current = id;
    this.track = TRACKS[id];
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.12;
    const g = this.out!.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(this.vol, ctx.currentTime + 0.4);
    if (this.timer === null) this.timer = window.setInterval(() => this.tick(), 25);
  }

  /** Next of the match tracks, rotating. */
  playMatch() {
    this.matchIdx = (this.matchIdx + 1) % MATCH_TRACKS.length;
    this.play(MATCH_TRACKS[this.matchIdx]);
  }

  /** Back to the current match track (e.g. after sudden death). */
  resumeMatch() {
    this.play(MATCH_TRACKS[this.matchIdx]);
  }

  stop() {
    this.wanted = null;
    this.halt();
  }

  private halt() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.current = null;
    const ctx = audio.ctx;
    if (ctx && this.out) {
      this.out.gain.cancelScheduledValues(ctx.currentTime);
      this.out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
    }
  }

  /** Quieter while paused. */
  duck(on: boolean) {
    this.ducked = on;
    const ctx = audio.ctx;
    if (ctx && this.out && this.timer !== null) this.out.gain.setTargetAtTime(this.vol, ctx.currentTime, 0.15);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    try { localStorage.setItem('hba-music', on ? '1' : '0'); } catch { /* ignore */ }
    if (!on) {
      const w = this.wanted;
      this.halt();
      this.wanted = w;
    } else if (this.wanted) this.play(this.wanted);
  }

  /** Audio just became available (first gesture): start whatever was requested. */
  resume() {
    if (this.wanted) this.play(this.wanted);
  }

  private tick() {
    const ctx = audio.ctx;
    const t = this.track;
    if (!ctx || !t) return;
    const stepDur = 60 / t.bpm / 4;
    // If the tab was throttled, skip ahead instead of bursting notes.
    if (this.nextTime < ctx.currentTime - 0.3) this.nextTime = ctx.currentTime + 0.05;
    while (this.nextTime < ctx.currentTime + 0.15) {
      this.schedule(t, this.step, this.nextTime, stepDur);
      this.nextTime += stepDur;
      this.step++;
    }
  }

  private schedule(t: Track, step: number, at: number, dur: number) {
    const s = step % 16;
    const bars = t.prog.length;
    const bar = Math.floor(step / 16);
    const chord = t.prog[bar % bars];
    // bass
    const b = toks(t.bass)[s];
    if (b !== '.') {
      const deg = chord + (b === '5' ? 4 : 0);
      this.note(degreeMidi(t, deg, t.root) + (b === 'o' ? 12 : 0), at, dur * 1.7, t.bassWave, 0.16);
    }
    // arpeggio on chord tones
    const a = toks(t.arp)[s];
    if (a !== '.') {
      const k = Number(a);
      const deg = chord + [0, 2, 4, 7][k];
      this.note(degreeMidi(t, deg, t.root + 24), at, dur * 0.9, t.arpWave, 0.05);
    }
    // lead: A for one pass over the progression, then B (or A an octave up)
    const pass = Math.floor(bar / bars) % 2;
    const phrase = pass === 1 && t.leadB ? t.leadB : t.leadA;
    const lt = toks(phrase[bar % bars] ?? '')[s];
    if (lt && lt !== '.' && lt !== '-') {
      let len = 1;
      const row = toks(phrase[bar % bars]);
      while (row[s + len] === '-') len++;
      const up = pass === 1 && !t.leadB ? 12 : 0;
      this.note(degreeMidi(t, Number(lt), t.root + 24) + up, at, dur * (len - 0.15), t.leadWave, t.leadWave === 'sawtooth' ? 0.05 : 0.07, true);
    }
    // drums
    if (toks(t.kick)[s] === 'x') this.kick(at);
    if (toks(t.snare)[s] === 'x') this.drumNoise(at, 0.14, 0.22, 1800, 0.9);
    if (toks(t.hat)[s] === 'x') this.drumNoise(at, 0.035, 0.07, 8000, 1.2);
  }

  private note(midi: number, at: number, dur: number, wave: OscillatorType, vol: number, vibrato = false) {
    const ctx = audio.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = wave;
    o.frequency.setValueAtTime(midiHz(midi), at);
    if (vibrato && dur > 0.25) {
      const lfo = ctx.createOscillator();
      const lg = ctx.createGain();
      lfo.frequency.value = 6;
      lg.gain.value = midiHz(midi) * 0.008;
      lfo.connect(lg).connect(o.frequency);
      lfo.start(at + 0.12);
      lfo.stop(at + dur + 0.05);
    }
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.008);
    g.gain.exponentialRampToValueAtTime(vol * 0.6, at + Math.min(dur, 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.out!);
    o.start(at);
    o.stop(at + dur + 0.02);
  }

  private kick(at: number) {
    const ctx = audio.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, at);
    o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
    g.gain.setValueAtTime(0.5, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.16);
    o.connect(g).connect(this.out!);
    o.start(at);
    o.stop(at + 0.18);
  }

  private drumNoise(at: number, dur: number, vol: number, freq: number, q: number) {
    const ctx = audio.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = audio.noise;
    const f = ctx.createBiquadFilter();
    f.type = freq > 4000 ? 'highpass' : 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.out!);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.01);
  }
}

export const music = new MusicPlayer();
audio.onUnlock = () => music.resume();
