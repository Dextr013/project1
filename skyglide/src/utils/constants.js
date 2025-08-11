export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 800;
export const TARGET_FPS = 60;
export const FIXED_DT = 1 / TARGET_FPS;
export const MAX_FRAME_DT = 0.05; // seconds

export const COLORS = Object.freeze({
  backgroundTop: '#2b6cb0',
  backgroundBottom: '#90cdf4',
  ground: '#22543d',
  player: '#ffe066',
  pipe: '#2f855a',
  pipeDark: '#276749',
  white: '#ffffff',
  shadow: 'rgba(0,0,0,0.2)'
});

export const GROUND_HEIGHT = 60;

export const PHYSICS = Object.freeze({
  gravity: 1800,          // px/s^2
  flapVelocity: -520,     // px/s impulse
  terminalVelocity: 980,  // px/s
});

export const PLAYER = Object.freeze({
  x: GAME_WIDTH * 0.28,
  radius: 18,
});

export const PIPES = Object.freeze({
  width: 80,
  gapMin: 150,
  gapMax: 220,
  speedBase: 180,     // px/s
  speedScalePerSec: 4,// +px/s each second
  spawnIntervalMs: 1200,
  maxOnScreen: 5,
});

export const SCORE = Object.freeze({
  perPipe: 1
});

export const INPUT_KEYS = Object.freeze({
  flap: ['Space', 'ArrowUp', 'KeyW'],
  pause: ['KeyP'],
  restart: ['KeyR'],
  mute: ['KeyM']
});

export const STORAGE_KEYS = Object.freeze({
  bestScore: 'skyglide_best_score_v1',
  mute: 'skyglide_mute_v1',
  queuedScores: 'skyglide_queued_scores_v1'
});

export const NETWORK = Object.freeze({
  enabled: false,
  submitUrl: 'https://example.com/api/score'
});