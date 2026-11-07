import type { BotLevel } from '../ai/bot';

export interface Settings {
  target: number;
  roundTime: number;
  bot: BotLevel;
  p1: string;
  p2: string;
  map: string; // map id or 'random'
  /** New random car for each player every round. */
  randomCars: boolean;
}

const KEY = 'hba-settings-v1';
export const DEFAULTS: Settings = { target: 5, roundTime: 60, bot: 'normal', p1: 'sparrow', p2: 'bulldog', map: 'random', randomCars: false };

export function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}
