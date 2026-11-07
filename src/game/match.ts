export type RoundResult = 0 | 1 | 'draw';

export interface MatchConfig {
  /** Points needed to win the match. */
  target: number;
  /** Seconds before sudden death starts. */
  roundTime: number;
}

/** Pure scoreboard / match progression. */
export class MatchState {
  scores: [number, number] = [0, 0];
  round = 1;
  history: RoundResult[] = [];
  winner: 0 | 1 | null = null;

  constructor(readonly cfg: MatchConfig) {}

  get over(): boolean {
    return this.winner !== null;
  }

  /** Records the result; returns true when the match is decided. */
  record(result: RoundResult): boolean {
    if (this.over) return true;
    this.history.push(result);
    if (result !== 'draw') {
      this.scores[result]++;
      if (this.scores[result] >= this.cfg.target) this.winner = result;
    }
    this.round++;
    return this.over;
  }
}

/** Something that ends a round for `player` (their driver got hit). */
export interface Death { player: number; step: number }

/**
 * Resolves near-simultaneous deaths: the first death opens a short window;
 * if the other player also dies inside it the round is a draw.
 */
export class DeathResolver {
  private first: Death | null = null;
  private other = false;
  constructor(readonly windowSteps = 4) {}

  reset() {
    this.first = null;
    this.other = false;
  }

  get pending(): boolean {
    return this.first !== null;
  }

  report(d: Death) {
    if (!this.first) this.first = d;
    else if (d.player !== this.first.player && d.step - this.first.step <= this.windowSteps) this.other = true;
  }

  /** Call once per step; returns a result when the window closes. */
  resolve(step: number): RoundResult | null {
    if (!this.first) return null;
    if (this.other) return 'draw';
    if (step - this.first.step < this.windowSteps) return null;
    return (1 - this.first.player) as 0 | 1;
  }
}
