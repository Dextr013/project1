import { NETWORK } from './utils/constants.js';

export class NetworkService {
  constructor(storage) {
    this.enabled = NETWORK.enabled;
    this.submitUrl = NETWORK.submitUrl;
    this.storage = storage;
  }

  async submitScore(score) {
    const timestamp = Date.now();
    if (!this.enabled) {
      this.storage?.queueScore(score, timestamp);
      return { ok: true, queued: true };
    }

    try {
      const res = await fetch(this.submitUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, timestamp })
      });
      return { ok: res.ok };
    } catch (err) {
      this.storage?.queueScore(score, timestamp);
      return { ok: false, queued: true, error: String(err) };
    }
  }
}