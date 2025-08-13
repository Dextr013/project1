import { FIXED_DT, MAX_FRAME_DT } from './utils/constants.js';

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this._running = false;
    this._lastTime = 0;
    this._accumulator = 0;
    this._boundFrame = (t) => this._frame(t);
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._lastTime = performance.now();
    requestAnimationFrame(this._boundFrame);
  }

  stop() {
    this._running = false;
  }

  _frame(nowMs) {
    if (!this._running) return;
    const now = nowMs / 1000;
    const last = this._lastTime / 1000;
    let dt = Math.min(now - last, MAX_FRAME_DT);
    this._lastTime = nowMs;
    this._accumulator += dt;

    while (this._accumulator >= FIXED_DT) {
      this.update(FIXED_DT);
      this._accumulator -= FIXED_DT;
    }

    this.render();
    requestAnimationFrame(this._boundFrame);
  }
}