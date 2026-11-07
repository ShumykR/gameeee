import { MAX_SUBSTEPS, STEP_DT } from './constants';

/**
 * Fixed-timestep accumulator. Feed real frame time; it calls `step` a whole
 * number of times at a fixed dt and reports the interpolation alpha.
 * `timeScale` slows the simulation (slow-mo) without changing dt.
 */
export class FixedStepper {
  acc = 0;
  timeScale = 1;
  readonly dt: number;
  readonly maxSubsteps: number;

  constructor(dt = STEP_DT, maxSubsteps = MAX_SUBSTEPS) {
    this.dt = dt;
    this.maxSubsteps = maxSubsteps;
  }

  /** Returns the number of steps executed. */
  advance(frameSeconds: number, step: (dt: number) => void): number {
    // Clamp huge frame gaps (tab switch) so we don't spiral.
    const f = Math.min(Math.max(frameSeconds, 0), 0.25) * this.timeScale;
    this.acc += f;
    let n = 0;
    while (this.acc >= this.dt && n < this.maxSubsteps) {
      step(this.dt);
      this.acc -= this.dt;
      n++;
    }
    if (n === this.maxSubsteps && this.acc > this.dt) this.acc = 0; // drop backlog
    return n;
  }

  /** 0..1 fraction between the previous and current physics state. */
  get alpha(): number {
    return Math.min(1, this.acc / this.dt);
  }
}
