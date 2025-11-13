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
    currencyValue: document.getElementById('currency'),
    goalValue: document.getElementById('current-goal'),
    zoneLabel: document.getElementById('zone-label'),
    timeOfDayValue: document.getElementById('time-of-day'),
    townFill: document.querySelector('[data-town-fill]'),
    townLabel: document.getElementById('town-progress-label'),
    skillList: document.getElementById('skills'),
    inventoryList: document.getElementById('inventory'),
    achievementList: document.getElementById('achievements'),
    log: document.getElementById('log'),
    mapInfo: document.getElementById('map-info'),
    storyline: document.getElementById('storyline'),
    npcJournal: document.getElementById('npc-journal'),
    startMenu: document.getElementById('start-menu'),
    playButton: document.getElementById('play-button'),
    pauseMenu: document.getElementById('pause-menu'),
    resumeButton: document.getElementById('resume-button'),
    restartButton: document.getElementById('restart-button'),
    levelOverlay: document.getElementById('levelup-overlay'),
    upgradeOptions: document.getElementById('upgrade-options'),
    skipUpgrade: document.getElementById('skip-upgrade'),
    shopOverlay: document.getElementById('shop-overlay'),
    shopName: document.getElementById('shop-name'),
    shopDescription: document.getElementById('shop-description'),
    shopOptions: document.getElementById('shop-options'),
    leaveShop: document.getElementById('leave-shop'),
    toast: document.getElementById('toast'),
    prompt: document.getElementById('prompt'),
  };

  for (const [key, element] of Object.entries(ui)) {
    if (!element) {
      throw new Error(`Missing UI element: ${key}`);
    }
  }

  resizeCanvas(canvas);

  const game = new RoguelikeGame({ canvas, ui });
  game.showStartMenu(true);

  window.addEventListener('resize', () => {
    if (resizeCanvas(canvas)) {
      game.handleResize();
    }
  });

  ui.playButton.addEventListener('click', () => game.start());
  ui.resumeButton.addEventListener('click', () => game.resume());
  ui.restartButton.addEventListener('click', () => game.restart());
  ui.leaveShop.addEventListener('click', () => game.leaveShop());
});
