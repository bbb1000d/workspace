import { RoguelikeGame } from './roguelike.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const log = document.getElementById('log');
  const ui = {
    healthFill: document.querySelector('[data-health-fill]'),
    healthValue: document.getElementById('health-value'),
    progressFill: document.querySelector('[data-progress-fill]'),
    progressValue: document.getElementById('xp-value'),
    skillList: document.getElementById('skills'),
  };

  if (!canvas || !log) {
    throw new Error('Game canvas or log element missing from document.');
  }

  if (!ui.healthFill || !ui.progressFill || !ui.skillList) {
    throw new Error('Game UI elements missing from document.');
  }

  const game = new RoguelikeGame({ canvas, log, ui });
  game.start();
});
