import { GAME_WIDTH, GAME_HEIGHT, PHYSICS, PLAYER, PIPES, SCORE, GROUND_HEIGHT } from './utils/constants.js';
import { clamp, randomIntInRange } from './utils/random.js';

const GAME_STATE = Object.freeze({ menu: 'menu', playing: 'playing', paused: 'paused', gameover: 'gameover' });

export class Game {
  constructor({ renderer, audio, storage, network, onStateChange, onScore }) {
    this.renderer = renderer;
    this.audio = audio;
    this.storage = storage;
    this.network = network;
    this.onStateChange = onStateChange;
    this.onScore = onScore;

    this.state = GAME_STATE.menu;

    this.player = { x: PLAYER.x, y: GAME_HEIGHT * 0.5, vy: 0 };
    this.pipes = [];
    this.dead = false;
    this.score = 0;
    this.best = storage.getBestScore();
    this.pipeTimerMs = 0;
    this.elapsedSec = 0;
  }

  reset() {
    this.state = GAME_STATE.menu;
    this.player.x = PLAYER.x;
    this.player.y = GAME_HEIGHT * 0.5;
    this.player.vy = 0;
    this.pipes.length = 0;
    this.dead = false;
    this.score = 0;
    this.pipeTimerMs = 0;
    this.elapsedSec = 0;
    this._emitState();
  }

  start() {
    if (this.state === GAME_STATE.playing) return;
    this.state = GAME_STATE.playing;
    this.player.y = GAME_HEIGHT * 0.5;
    this.player.vy = 0;
    this.pipes.length = 0;
    this.dead = false;
    this.score = 0;
    this.pipeTimerMs = 0;
    this.elapsedSec = 0;
    this._emitState();
  }

  togglePause() {
    if (this.state === GAME_STATE.playing) {
      this.state = GAME_STATE.paused;
    } else if (this.state === GAME_STATE.paused) {
      this.state = GAME_STATE.playing;
    }
    this._emitState();
  }

  flap() {
    if (this.state === GAME_STATE.menu) this.start();
    if (this.state !== GAME_STATE.playing) return;
    this.player.vy = PHYSICS.flapVelocity;
    this.audio.playFlap();
  }

  restart() {
    this.reset();
    this.start();
  }

  update(dt) {
    if (this.state !== GAME_STATE.playing) return;
    this.elapsedSec += dt;

    // Player physics
    this.player.vy = clamp(this.player.vy + PHYSICS.gravity * dt, -Infinity, PHYSICS.terminalVelocity);
    this.player.y += this.player.vy * dt;

    // Ground and ceiling collision
    if (this.player.y - PLAYER.radius <= 0) {
      this.player.y = PLAYER.radius;
      this.player.vy = 0;
    }
    if (this.player.y + PLAYER.radius >= GAME_HEIGHT - GROUND_HEIGHT) {
      this.player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER.radius;
      this._onDeath();
    }

    // Pipes spawn
    this.pipeTimerMs += dt * 1000;
    const spawnEvery = PIPES.spawnIntervalMs;
    if (this.pipeTimerMs >= spawnEvery && this.pipes.length < PIPES.maxOnScreen) {
      this.pipeTimerMs -= spawnEvery;
      const gap = randomIntInRange(PIPES.gapMin, PIPES.gapMax);
      const centerY = randomIntInRange(140, GAME_HEIGHT - GROUND_HEIGHT - 140);
      const topHeight = Math.max(40, centerY - gap / 2);
      const bottomY = Math.min(GAME_HEIGHT - GROUND_HEIGHT - 40, centerY + gap / 2);
      const x = GAME_WIDTH + PIPES.width;
      this.pipes.push({ x, topHeight, bottomY, passed: false });
    }

    // Pipes move
    const speed = PIPES.speedBase + PIPES.speedScalePerSec * this.elapsedSec;
    for (let i = 0; i < this.pipes.length; i += 1) {
      const p = this.pipes[i];
      p.x -= speed * dt;
    }
    // Cull off-screen pipes
    while (this.pipes.length && this.pipes[0].x + PIPES.width < 0) this.pipes.shift();

    // Scoring and collisions
    for (let i = 0; i < this.pipes.length; i += 1) {
      const p = this.pipes[i];
      // Score when player passes pipe center
      if (!p.passed && p.x + PIPES.width < this.player.x) {
        p.passed = true;
        this.score += SCORE.perPipe;
        this.onScore?.(this.score);
        this.audio.playScore();
      }
      // Collision AABB vs circle simplified by treating player as AABB
      const playerLeft = this.player.x - PLAYER.radius;
      const playerRight = this.player.x + PLAYER.radius;
      const playerTop = this.player.y - PLAYER.radius;
      const playerBottom = this.player.y + PLAYER.radius;

      const pipeLeft = p.x;
      const pipeRight = p.x + PIPES.width;

      const hitsTop = playerRight > pipeLeft && playerLeft < pipeRight && playerTop < p.topHeight;
      const hitsBottom = playerRight > pipeLeft && playerLeft < pipeRight && playerBottom > p.bottomY;
      if (hitsTop || hitsBottom) {
        this._onDeath();
        break;
      }
    }
  }

  render() {
    const r = this.renderer;
    r.clear();
    r.drawBackground();
    r.drawPipes(this.pipes);
    r.drawPlayer(this.player);
  }

  _onDeath() {
    if (this.dead) return;
    this.dead = true;
    this.audio.playHit();
    this.state = GAME_STATE.gameover;
    if (this.score > this.best) {
      this.best = this.score;
      this.storage.setBestScore(this.best);
    }
    this.network?.submitScore(this.score);
    this._emitState();
  }

  _emitState() {
    this.onStateChange?.({
      state: this.state,
      score: this.score,
      best: this.best,
    });
  }
}

export { GAME_STATE };