import { STORAGE_KEYS } from './utils/constants.js';

export class StorageService {
  constructor(storage) {
    this.storage = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  }

  getItem(key, fallback = null) {
    try {
      if (!this.storage) return fallback;
      const raw = this.storage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  setItem(key, value) {
    try {
      if (!this.storage) return false;
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  getBestScore() { return this.getItem(STORAGE_KEYS.bestScore, 0) ?? 0; }
  setBestScore(score) { return this.setItem(STORAGE_KEYS.bestScore, Number(score) || 0); }

  getMute() { return Boolean(this.getItem(STORAGE_KEYS.mute, false)); }
  setMute(mute) { return this.setItem(STORAGE_KEYS.mute, Boolean(mute)); }

  getQueuedScores() { return this.getItem(STORAGE_KEYS.queuedScores, []); }
  setQueuedScores(queue) { return this.setItem(STORAGE_KEYS.queuedScores, Array.isArray(queue) ? queue : []); }

  queueScore(score, timestampMs) {
    const queue = this.getQueuedScores();
    queue.push({ score, ts: timestampMs });
    this.setQueuedScores(queue);
  }
}