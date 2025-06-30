import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PerformanceGuardService {
  private frameTimes: number[] = [];
  private lastTimestamp = performance.now();
  private readonly maxFrames = 120;
  private readonly minFps = 45;
  private readonly maxFps = 50;
  private readonly windowMs = 5000;
  private lowPower = false;
  private manualOverride: boolean | null = null;

  public readonly lowPowerOn$ = new Subject<void>();
  public readonly lowPowerOff$ = new Subject<void>();

  /**
   * Call this once to start monitoring FPS. Hooks into the animation loop.
   * Call from main app or SceneFactory.
   */
  start(): void {
    const loop = (now: number) => {
      const dt = now - this.lastTimestamp;
      this.lastTimestamp = now;
      this.frameTimes.push(dt);
      if (this.frameTimes.length > this.maxFrames) this.frameTimes.shift();
      this.checkFps();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Manually override low power mode (from config panel)
   */
  setManualLowPower(force: boolean|null) {
    this.manualOverride = force;
    if (force === true && !this.lowPower) {
      this.lowPower = true;
      this.lowPowerOn$.next();
    } else if (force === false && this.lowPower) {
      this.lowPower = false;
      this.lowPowerOff$.next();
    }
  }

  /**
   * Returns true if low power mode is active (auto or manual)
   */
  isLowPower(): boolean {
    return this.manualOverride !== null ? !!this.manualOverride : this.lowPower;
  }

  private checkFps() {
    if (this.manualOverride !== null) return;
    if (this.frameTimes.length < this.maxFrames) return;
    const now = performance.now();
    // Only consider frames in the last windowMs
    const cutoff = now - this.windowMs;
    const recent = this.frameTimes.filter((dt, i, arr) => {
      let t = now;
      for (let j = arr.length - 1; j > i; j--) t -= arr[j];
      return t >= cutoff;
    });
    const avgFps = 1000 / (recent.reduce((a, b) => a + b, 0) / recent.length);
    if (!this.lowPower && avgFps < this.minFps) {
      this.lowPower = true;
      this.lowPowerOn$.next();
    } else if (this.lowPower && avgFps > this.maxFps) {
      this.lowPower = false;
      this.lowPowerOff$.next();
    }
  }
}
