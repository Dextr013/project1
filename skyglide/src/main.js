import { GAME_WIDTH, GAME_HEIGHT } from './utils/constants.js';
import { Renderer } from './renderer.js';
import { GameLoop } from './loop.js';
import { Game } from './game.js';
import { UIController } from './ui.js';
import { StorageService } from './storage.js';
import { AudioService } from './audio.js';
import { NetworkService } from './network.js';

function fitCanvasToViewport(canvas) {
  const ratio = GAME_WIDTH / GAME_HEIGHT;
  const vw = Math.min(window.innerWidth - 16, GAME_WIDTH);
  const vh = Math.min(window.innerHeight - 16, GAME_HEIGHT);
  let width = vw;
  let height = Math.round(vw / ratio);
  if (height > vh) {
    height = vh;
    width = Math.round(vh * ratio);
  }
  return { width, height };
}

function main() {
  const canvas = document.getElementById('gameCanvas');
  const renderer = new Renderer(canvas);
  const storage = new StorageService();
  const audio = new AudioService({ muted: storage.getMute() });
  const network = new NetworkService(storage);

  const game = new Game({ renderer, audio, storage, network });
  const ui = new UIController({ game, audio, storage });

  // Set logical size once; only CSS size changes on viewport resize
  renderer.setLogicalSize(GAME_WIDTH, GAME_HEIGHT);

  const loop = new GameLoop((dt) => game.update(dt), () => game.render());
  loop.start();

  function onResize() {
    const { width, height } = fitCanvasToViewport(canvas);
    renderer.setCssSize(width, height);
  }
  window.addEventListener('resize', onResize);
  onResize();

  // Initialize UI state
  game.reset();
}

window.addEventListener('DOMContentLoaded', main);