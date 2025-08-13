import { INPUT_KEYS } from './utils/constants.js';

export class UIController {
  constructor({ game, audio, storage }) {
    this.game = game;
    this.audio = audio;
    this.storage = storage;

    this.elements = this._queryElements();
    this._bindUI();
    this._bindInput();

    this.setMute(storage.getMute());
    this.updateHUD(0, storage.getBestScore());
  }

  _queryElements() {
    return {
      overlay: document.getElementById('overlay'),
      statusText: document.getElementById('statusText'),
      scoreText: document.getElementById('scoreText'),
      bestScoreText: document.getElementById('bestScoreText'),
      startBtn: document.getElementById('startBtn'),
      restartBtn: document.getElementById('restartBtn'),
      pauseBtn: document.getElementById('pauseBtn'),
      muteBtn: document.getElementById('muteBtn'),
      hud: document.getElementById('hud'),
      hudScore: document.getElementById('hudScore'),
      hudBest: document.getElementById('hudBest'),
      canvas: document.getElementById('gameCanvas'),
    };
  }

  _bindUI() {
    const e = this.elements;
    e.startBtn.addEventListener('click', () => { this.game.start(); });
    e.restartBtn.addEventListener('click', () => { this.game.restart(); });
    e.pauseBtn.addEventListener('click', () => { this.game.togglePause(); });
    e.muteBtn.addEventListener('click', () => { this.toggleMute(); });

    this.game.onStateChange = (s) => this.onGameStateChange(s);
    this.game.onScore = (score) => this.onScore(score);
  }

  _bindInput() {
    const e = this.elements;
    // Keyboard
    window.addEventListener('keydown', (ev) => {
      if (INPUT_KEYS.flap.includes(ev.code)) {
        ev.preventDefault();
        this.audio.resume();
        this.game.flap();
      } else if (INPUT_KEYS.pause.includes(ev.code)) {
        ev.preventDefault();
        this.game.togglePause();
      } else if (INPUT_KEYS.restart.includes(ev.code)) {
        ev.preventDefault();
        this.game.restart();
      } else if (INPUT_KEYS.mute.includes(ev.code)) {
        ev.preventDefault();
        this.toggleMute();
      }
    });

    // Pointer only (covers mouse and touch)
    const onPrimary = (ev) => {
      ev.preventDefault();
      this.audio.resume();
      this.game.flap();
    };
    e.canvas.addEventListener('pointerdown', onPrimary, { passive: false });

    // Auto-pause on blur
    window.addEventListener('blur', () => {
      if (this.game.state === 'playing') this.game.togglePause();
    });
  }

  onScore(score) {
    this.elements.hudScore.textContent = String(score);
    this.elements.scoreText.textContent = String(score);
  }

  onGameStateChange({ state, score, best }) {
    const e = this.elements;
    this.updateHUD(score, best);
    if (state === 'menu') {
      this.setOverlay(true, 'Нажмите Старт или Пробел');
      e.startBtn.classList.remove('hidden');
      e.restartBtn.classList.add('hidden');
      e.pauseBtn.classList.add('hidden');
    } else if (state === 'playing') {
      this.setOverlay(false);
      e.startBtn.classList.add('hidden');
      e.restartBtn.classList.add('hidden');
      e.pauseBtn.classList.remove('hidden');
    } else if (state === 'paused') {
      this.setOverlay(true, 'Пауза (P — продолжить)');
      e.startBtn.classList.add('hidden');
      e.restartBtn.classList.remove('hidden');
      e.pauseBtn.classList.remove('hidden');
    } else if (state === 'gameover') {
      this.setOverlay(true, 'Игра окончена (R — заново)');
      e.startBtn.classList.add('hidden');
      e.restartBtn.classList.remove('hidden');
      e.pauseBtn.classList.add('hidden');
    }
  }

  updateHUD(score, best) {
    this.elements.hud.classList.remove('hidden');
    this.elements.hudScore.textContent = String(score);
    this.elements.hudBest.textContent = `Лучший: ${best}`;
    this.elements.scoreText.textContent = String(score);
    this.elements.bestScoreText.textContent = String(best);
  }

  setOverlay(visible, text) {
    const e = this.elements;
    e.overlay.classList.toggle('hidden', !visible);
    if (text) e.statusText.textContent = text;
  }

  setMute(mute) {
    this.audio.setMuted(mute);
    this.storage.setMute(mute);
    this.elements.muteBtn.textContent = `Звук: ${mute ? 'Выкл' : 'Вкл'}`;
  }

  toggleMute() { this.setMute(!this.audio.muted); }
}