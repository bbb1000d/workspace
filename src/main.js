import { RoguelikeGame, TILE_SIZE } from './roguelike.js';

const MIN_WIDTH_TILES = 24;
const MIN_HEIGHT_TILES = 18;

function resizeCanvasToViewport(canvas) {
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
  const log = document.getElementById('log');
  const ui = {
    healthFill: document.querySelector('[data-health-fill]'),
    healthValue: document.getElementById('health-value'),
    progressFill: document.querySelector('[data-progress-fill]'),
    progressValue: document.getElementById('xp-value'),
    skillList: document.getElementById('skills'),
    skillPointsValue: document.getElementById('skill-points'),
    achievementList: document.getElementById('achievements'),
  };

  if (!canvas || !log) {
    throw new Error('Game canvas or log element missing from document.');
  }

  if (!ui.healthFill || !ui.progressFill || !ui.skillList) {
    throw new Error('Game UI elements missing from document.');
  }

  resizeCanvasToViewport(canvas);

  const game = new RoguelikeGame({ canvas, log, ui });
  game.start();

  window.addEventListener('resize', () => {
    if (resizeCanvasToViewport(canvas)) {
      game.handleResize();
    }
  });
});
