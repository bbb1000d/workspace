import { RoguelikeGame } from './roguelike.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game');
  const log = document.getElementById('log');

  if (!canvas || !log) {
    throw new Error('Game canvas or log element missing from document.');
  }

  const game = new RoguelikeGame({ canvas, log });
  game.start();
});
