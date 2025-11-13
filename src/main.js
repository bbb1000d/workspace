import { RoguelikeGame, TILE_SIZE } from './roguelike.js';

const MIN_WIDTH_TILES = 30;
const MIN_HEIGHT_TILES = 22;

function resizeCanvas(canvas) {
  const widthTiles = Math.max(
    MIN_WIDTH_TILES,
    Math.ceil(window.innerWidth / TILE_SIZE)
  );
  const heightTiles = Math.max(
    MIN_HEIGHT_TILES,
    Math.ceil(window.innerHeight / TILE_SIZE)
  );
  const width = widthTiles * TILE_SIZE;
  const height = heightTiles * TILE_SIZE;
  const changed = canvas.width !== width || canvas.height !== height;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return changed;
}

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const ui = {
    healthFill: document.querySelector('[data-health-fill]'),
    healthValue: document.getElementById('health-value'),
    progressFill: document.querySelector('[data-progress-fill]'),
    progressValue: document.getElementById('xp-value'),
    skillPointsValue: document.getElementById('skill-points'),
    goalValue: document.getElementById('current-goal'),
    skillList: document.getElementById('skills'),
    achievementList: document.getElementById('achievements'),
    log: document.getElementById('log'),
    mapInfo: document.getElementById('map-info'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeButton: document.getElementById('resume-button'),
    restartButton: document.getElementById('restart-button'),
    levelOverlay: document.getElementById('levelup-overlay'),
    upgradeOptions: document.getElementById('upgrade-options'),
    skipUpgrade: document.getElementById('skip-upgrade'),
    toast: document.getElementById('toast'),
  };

  for (const [key, element] of Object.entries(ui)) {
    if (!element) {
      throw new Error(`Missing UI element: ${key}`);
    }
  }

  resizeCanvas(canvas);

  const game = new RoguelikeGame({ canvas, ui });
  game.start();

  window.addEventListener('resize', () => {
    if (resizeCanvas(canvas)) {
      game.handleResize();
    }
  });

  ui.resumeButton.addEventListener('click', () => game.resume());
  ui.restartButton.addEventListener('click', () => game.restart());
});
