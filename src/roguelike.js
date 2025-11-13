const TILE_SIZE = 32;
const FLOOR_COLOR = '#1f2937';
const WALL_COLOR = '#111827';
const PLAYER_COLOR = '#f97316';

const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

const CARDINAL_DIRECTIONS = [
  DIRECTIONS.ArrowUp,
  DIRECTIONS.ArrowDown,
  DIRECTIONS.ArrowLeft,
  DIRECTIONS.ArrowRight,
];

class InputHandler {
  #listeners = new Set();

  constructor() {
    window.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      const direction = DIRECTIONS[event.key];
      if (!direction) return;
      event.preventDefault();
      this.#listeners.forEach((listener) => listener(direction));
    });
  }

  onDirection(callback) {
    this.#listeners.add(callback);
    return () => this.#listeners.delete(callback);
  }
}

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    if (!this.context) {
      throw new Error('Canvas 2D context unavailable.');
    }
  }

  clear() {
    this.context.fillStyle = '#020617';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawTile(x, y, color) {
    this.context.fillStyle = color;
    this.context.fillRect(
      x * TILE_SIZE,
      y * TILE_SIZE,
      TILE_SIZE - 1,
      TILE_SIZE - 1
    );
  }

  drawPlayer(player) {
    const { x, y } = player.position;
    this.context.fillStyle = PLAYER_COLOR;
    this.context.beginPath();
    this.context.arc(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE * 0.35,
      0,
      Math.PI * 2
    );
    this.context.fill();
    this.context.strokeStyle = '#fb923c';
    this.context.lineWidth = 2;
    this.context.stroke();
  }
}

const TILE_WALL = 1;
const TILE_FLOOR = 0;

function createDungeon(width, height) {
  const grid = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => TILE_WALL)
  );

  const totalCells = width * height;
  const targetFloorCount = Math.floor(totalCells * 0.45);

  let carved = 0;
  let currentX = Math.floor(width / 2);
  let currentY = Math.floor(height / 2);

  function carve(x, y) {
    if (grid[y][x] === TILE_FLOOR) return;
    grid[y][x] = TILE_FLOOR;
    carved += 1;
  }

  carve(currentX, currentY);

  while (carved < targetFloorCount) {
    const direction = CARDINAL_DIRECTIONS[
      Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)
    ];
    const nextX = Math.max(1, Math.min(width - 2, currentX + direction.x));
    const nextY = Math.max(1, Math.min(height - 2, currentY + direction.y));

    currentX = nextX;
    currentY = nextY;
    carve(currentX, currentY);
  }

  return grid;
}

class Log {
  constructor(element) {
    this.element = element;
    this.entries = [];
  }

  message(text) {
    const timestamp = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const entry = `${timestamp} — ${text}`;
    this.entries.unshift(entry);
    this.entries = this.entries.slice(0, 8);

    this.element.innerHTML = '';
    for (const message of this.entries) {
      const item = document.createElement('li');
      item.textContent = message;
      this.element.appendChild(item);
    }
  }
}

class Entity {
  constructor({ position }) {
    this.position = { ...position };
  }

  move(dx, dy) {
    this.position.x += dx;
    this.position.y += dy;
  }
}

export class RoguelikeGame {
  constructor({ canvas, log }) {
    this.canvas = canvas;
    this.log = new Log(log);
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler();

    this.mapWidth = Math.floor(canvas.width / TILE_SIZE);
    this.mapHeight = Math.floor(canvas.height / TILE_SIZE);
    this.map = createDungeon(this.mapWidth, this.mapHeight);

    const spawn = this.findSpawn();
    this.player = new Entity({ position: spawn });
  }

  start() {
    this.unsubscribe = this.input.onDirection((direction) =>
      this.handleMove(direction)
    );
    this.log.message('You awaken in an unfamiliar dungeon.');
    this.draw();
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleMove({ x, y }) {
    const nextX = this.player.position.x + x;
    const nextY = this.player.position.y + y;

    if (!this.isWalkable(nextX, nextY)) {
      this.log.message('You bump into a cold stone wall.');
      return;
    }

    this.player.move(x, y);
    this.log.message(`You move to (${this.player.position.x}, ${this.player.position.y}).`);
    this.draw();
  }

  isWalkable(x, y) {
    if (x < 0 || y < 0 || x >= this.mapWidth || y >= this.mapHeight) {
      return false;
    }
    return this.map[y][x] === TILE_FLOOR;
  }

  findSpawn() {
    for (let attempts = 0; attempts < 200; attempts += 1) {
      const x = Math.floor(Math.random() * this.mapWidth);
      const y = Math.floor(Math.random() * this.mapHeight);
      if (this.isWalkable(x, y)) {
        return { x, y };
      }
    }
    return { x: Math.floor(this.mapWidth / 2), y: Math.floor(this.mapHeight / 2) };
  }

  draw() {
    this.renderer.clear();
    for (let y = 0; y < this.mapHeight; y += 1) {
      for (let x = 0; x < this.mapWidth; x += 1) {
        const tile = this.map[y][x];
        const color = tile === TILE_WALL ? WALL_COLOR : FLOOR_COLOR;
        this.renderer.drawTile(x, y, color);
      }
    }

    this.renderer.drawPlayer(this.player);
  }
}
