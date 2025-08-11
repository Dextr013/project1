import { COLORS, PLAYER, PIPES, GROUND_HEIGHT } from './utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    this.logicalWidth = 0;
    this.logicalHeight = 0;
  }

  setLogicalSize(width, height) {
    this.logicalWidth = width;
    this.logicalHeight = height;
    const ratio = this.pixelRatio;
    this.canvas.width = Math.floor(width * ratio);
    this.canvas.height = Math.floor(height * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  setCssSize(cssWidth, cssHeight) {
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;
  }

  clear() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
  }

  drawBackground() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.logicalHeight);
    g.addColorStop(0, COLORS.backgroundTop);
    g.addColorStop(1, COLORS.backgroundBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.logicalWidth, this.logicalHeight);

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, this.logicalHeight - GROUND_HEIGHT, this.logicalWidth, GROUND_HEIGHT);
  }

  drawPlayer(player) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = COLORS.shadow;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER.radius, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(player.x + 4, player.y - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPipes(pipes) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.pipe;
    for (let i = 0; i < pipes.length; i += 1) {
      const p = pipes[i];
      // Top pipe
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(p.x, 0, PIPES.width, p.topHeight);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(p.x, p.topHeight - 14, PIPES.width, 14);
      // Bottom pipe
      ctx.fillStyle = COLORS.pipe;
      ctx.fillRect(p.x, p.bottomY, PIPES.width, this.logicalHeight - p.bottomY - GROUND_HEIGHT);
      ctx.fillStyle = COLORS.pipeDark;
      ctx.fillRect(p.x, p.bottomY, PIPES.width, 14);
    }
  }

  drawText(text, x, y, size = 24, align = 'center') {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = COLORS.white;
    ctx.font = `600 ${size}px Inter, system-ui, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}