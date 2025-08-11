export class AudioService {
  constructor({ muted = false } = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.muted = Boolean(muted);
    this._initialized = false;
  }

  ensureContext() {
    if (this._initialized) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0 : 0.3;
    this.masterGain.connect(this.ctx.destination);
    this._initialized = true;
  }

  setMuted(mute) {
    this.muted = Boolean(mute);
    if (!this._initialized) return;
    this.masterGain.gain.value = this.muted ? 0 : 0.3;
  }

  async resume() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch {}
    }
  }

  playTone({ freq = 440, durationMs = 120, type = 'sine', attackMs = 5, releaseMs = 50, gain = 0.8 }) {
    this.ensureContext();
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    const attack = attackMs / 1000;
    const release = releaseMs / 1000;
    const duration = durationMs / 1000;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + attack);
    gainNode.gain.setValueAtTime(gain, now + duration);
    gainNode.gain.linearRampToValueAtTime(0, now + duration + release);

    osc.connect(gainNode).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + release + 0.02);
  }

  playFlap() { this.playTone({ freq: 600, durationMs: 90, type: 'triangle', gain: 0.7 }); }
  playScore() { this.playTone({ freq: 880, durationMs: 120, type: 'square', gain: 0.6 }); }
  playHit() { this.playTone({ freq: 220, durationMs: 180, type: 'sawtooth', gain: 0.8 }); }
}