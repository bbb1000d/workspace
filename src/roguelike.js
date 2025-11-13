const TILE_SIZE = 32;
const FLOOR_COLOR = '#1f2937';
const WALL_COLOR = '#111827';
const PLAYER_COLOR = '#f97316';
const ENEMY_COLOR = '#38bdf8';
const BULLET_COLOR = '#facc15';

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

const TILE_WALL = 1;
const TILE_FLOOR = 0;

const ENEMY_DAMAGE = 12;
const ENEMY_STEP_INTERVAL = 0.55; // seconds
const ENEMY_COUNT = 8;

const BULLET_BASE_SPEED = 12; // tiles per second
const BULLET_LIFETIME = 2.5; // seconds
const DASH_DISTANCE_DEFAULT = 3; // tiles
const DASH_COOLDOWN = 1.4; // seconds
const SHOOT_COOLDOWN = 0.25; // seconds

class InputHandler {
  #directionListeners = new Set();
  #actionListeners = new Set();

  constructor() {
    window.addEventListener('keydown', (event) => {
      if (event.defaultPrevented) return;
      const key = event.key;
      const direction = DIRECTIONS[key];
      if (direction) {
        event.preventDefault();
        this.#directionListeners.forEach((listener) => listener(direction));
        return;
      }

      if (key === ' ') {
        event.preventDefault();
        this.#actionListeners.forEach((listener) =>
          listener({ type: 'shoot' })
        );
        return;
      }

      if (key === 'e' || key === 'E') {
        event.preventDefault();
        this.#actionListeners.forEach((listener) => listener({ type: 'dash' }));
      }
    });
  }

  onDirection(callback) {
    this.#directionListeners.add(callback);
    return () => this.#directionListeners.delete(callback);
  }

  onAction(callback) {
    this.#actionListeners.add(callback);
    return () => this.#actionListeners.delete(callback);
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

  drawEnemy(enemy) {
    const { x, y } = enemy.position;
    this.context.fillStyle = ENEMY_COLOR;
    this.context.beginPath();
    this.context.arc(
      x * TILE_SIZE + TILE_SIZE / 2,
      y * TILE_SIZE + TILE_SIZE / 2,
      TILE_SIZE * 0.3,
      0,
      Math.PI * 2
    );
    this.context.fill();
  }

  drawBullet(bullet) {
    this.context.fillStyle = BULLET_COLOR;
    this.context.beginPath();
    this.context.arc(
      bullet.x * TILE_SIZE,
      bullet.y * TILE_SIZE,
      TILE_SIZE * 0.15,
      0,
      Math.PI * 2
    );
    this.context.fill();
  }
}

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
    this.entries = this.entries.slice(0, 10);

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

class Player extends Entity {
  constructor({ position }) {
    super({ position });
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.level = 1;
    this.xp = 0;
    this.nextLevelXp = 100;
    this.totalXp = 0;
    this.skillPoints = 0;
    this.lastDirection = { x: 0, y: -1 };
    this.invulnerabilityTimer = 0;
    this.bulletSpeedBonus = 0;
  }

  takeDamage(amount) {
    if (this.invulnerabilityTimer > 0) {
      return true;
    }
    this.health = Math.max(0, this.health - amount);
    this.invulnerabilityTimer = 0.6;
    return this.health > 0;
  }

  grantXp(amount) {
    this.totalXp += amount;
    this.xp += amount;
    let leveledUp = false;
    while (this.xp >= this.nextLevelXp) {
      this.xp -= this.nextLevelXp;
      this.level += 1;
      this.skillPoints += 1;
      this.nextLevelXp = Math.floor(this.nextLevelXp * 1.4);
      leveledUp = true;
    }
    return leveledUp;
  }

  update(deltaSeconds) {
    if (this.invulnerabilityTimer > 0) {
      this.invulnerabilityTimer = Math.max(
        0,
        this.invulnerabilityTimer - deltaSeconds
      );
    }
  }

  healthRatio() {
    return this.health / this.maxHealth;
  }

  progressRatio() {
    return this.xp / this.nextLevelXp;
  }
}

export class RoguelikeGame {
  constructor({ canvas, log, ui }) {
    this.canvas = canvas;
    this.log = new Log(log);
    this.renderer = new Renderer(canvas);
    this.input = new InputHandler();

    this.mapWidth = Math.floor(canvas.width / TILE_SIZE);
    this.mapHeight = Math.floor(canvas.height / TILE_SIZE);
    this.map = createDungeon(this.mapWidth, this.mapHeight);

    const spawn = this.findSpawn();
    this.player = new Player({ position: spawn });

    this.ui = ui;
    this.skills = [
      {
        name: 'Rapid Shot',
        description: 'Projectiles travel faster.',
        unlocked: false,
        apply: () => {
          this.player.bulletSpeedBonus += 4;
        },
      },
      {
        name: 'Iron Constitution',
        description: 'Max health increases by 25.',
        unlocked: false,
        apply: () => {
          this.player.maxHealth += 25;
          this.player.health += 25;
        },
      },
      {
        name: 'Blink Mastery',
        description: 'Dash travels one additional tile.',
        unlocked: false,
        apply: () => {
          this.dashDistance += 1;
        },
      },
    ];

    this.initializeSkillTree();

    this.enemies = this.spawnEnemies(ENEMY_COUNT);
    this.bullets = [];

    this.enemyStepTimer = 0;
    this.dashCooldown = 0;
    this.shootCooldown = 0;
    this.dashDistance = DASH_DISTANCE_DEFAULT;
    this.lastTimestamp = null;
    this.animationHandle = null;
    this.gameOver = false;
  }

  start() {
    this.unsubscribeDirection = this.input.onDirection((direction) =>
      this.handleMove(direction)
    );
    this.unsubscribeAction = this.input.onAction((action) =>
      this.handleAction(action)
    );
    this.log.message('You awaken in an unfamiliar dungeon.');
    this.draw();
    this.updateUi();
    const loop = (timestamp) => {
      if (!this.lastTimestamp) {
        this.lastTimestamp = timestamp;
      }
      const deltaSeconds = (timestamp - this.lastTimestamp) / 1000;
      this.lastTimestamp = timestamp;
      this.update(deltaSeconds);
      this.animationHandle = window.requestAnimationFrame(loop);
    };
    this.animationHandle = window.requestAnimationFrame(loop);
  }

  stop() {
    if (this.unsubscribeDirection) {
      this.unsubscribeDirection();
    }
    if (this.unsubscribeAction) {
      this.unsubscribeAction();
    }
    if (this.animationHandle) {
      window.cancelAnimationFrame(this.animationHandle);
    }
  }

  update(deltaSeconds) {
    this.player.update(deltaSeconds);
    if (this.gameOver) {
      this.draw();
      this.updateUi();
      return;
    }

    this.enemyStepTimer += deltaSeconds;
    if (this.enemyStepTimer >= ENEMY_STEP_INTERVAL) {
      this.enemyStepTimer -= ENEMY_STEP_INTERVAL;
      this.advanceEnemies();
    }

    this.updateBullets(deltaSeconds);

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - deltaSeconds);
    }

    if (this.shootCooldown > 0) {
      this.shootCooldown = Math.max(0, this.shootCooldown - deltaSeconds);
    }

    this.draw();
    this.updateUi();
  }

  updateBullets(deltaSeconds) {
    const bulletSpeed = BULLET_BASE_SPEED + this.player.bulletSpeedBonus;
    this.bullets = this.bullets
      .map((bullet) => ({
        ...bullet,
        lifetime: bullet.lifetime - deltaSeconds,
        x: bullet.x + bullet.dx * bulletSpeed * deltaSeconds,
        y: bullet.y + bullet.dy * bulletSpeed * deltaSeconds,
      }))
      .filter((bullet) => bullet.lifetime > 0);

    const survivors = [];
    for (const bullet of this.bullets) {
      const tileX = Math.floor(bullet.x);
      const tileY = Math.floor(bullet.y);
      if (!this.isWalkable(tileX, tileY)) {
        continue;
      }

      let hitEnemy = false;
      for (let i = 0; i < this.enemies.length; i += 1) {
        const enemy = this.enemies[i];
        if (enemy.position.x === tileX && enemy.position.y === tileY) {
          this.enemies.splice(i, 1);
          hitEnemy = true;
          this.handleEnemyDefeated();
          break;
        }
      }

      if (!hitEnemy) {
        survivors.push(bullet);
      }
    }
    this.bullets = survivors;
  }

  handleEnemyDefeated() {
    const leveledUp = this.player.grantXp(35);
    this.log.message('You defeated an enemy.');
    if (leveledUp) {
      this.log.message(`You reached level ${this.player.level}!`);
      this.unlockNextSkill();
    }
    if (this.enemies.length === 0) {
      this.log.message('The room falls silent. More foes will arrive soon.');
      this.enemies = this.spawnEnemies(ENEMY_COUNT + 2);
    }
  }

  unlockNextSkill() {
    const nextSkill = this.skills.find((skill) => !skill.unlocked);
    if (!nextSkill || this.player.skillPoints <= 0) {
      return;
    }
    nextSkill.unlocked = true;
    this.player.skillPoints -= 1;
    nextSkill.apply();
    this.log.message(`Skill unlocked: ${nextSkill.name}.`);
    this.updateSkillTree();
    this.updateUi();
  }

  handleMove({ x, y }) {
    if (this.gameOver) return;

    const nextX = this.player.position.x + x;
    const nextY = this.player.position.y + y;

    if (!this.isWalkable(nextX, nextY)) {
      this.log.message('You bump into a cold stone wall.');
      return;
    }

    this.player.move(x, y);
    if (x !== 0 || y !== 0) {
      this.player.lastDirection = { x, y };
    }
    this.log.message(
      `You move to (${this.player.position.x}, ${this.player.position.y}).`
    );
    this.draw();
    this.updateUi();
  }

  handleAction(action) {
    if (this.gameOver) return;
    if (action.type === 'shoot') {
      this.shoot();
    } else if (action.type === 'dash') {
      this.dash();
    }
  }

  shoot() {
    if (this.shootCooldown > 0) {
      return;
    }
    const { x, y } = this.player.lastDirection;
    if (x === 0 && y === 0) {
      return;
    }
    this.shootCooldown = SHOOT_COOLDOWN;
    const bullet = {
      x: this.player.position.x + 0.5,
      y: this.player.position.y + 0.5,
      dx: x,
      dy: y,
      lifetime: BULLET_LIFETIME,
    };
    this.bullets.push(bullet);
    this.log.message('You fire a blazing shot.');
  }

  dash() {
    if (this.dashCooldown > 0) {
      return;
    }
    const { x, y } = this.player.lastDirection;
    if (x === 0 && y === 0) {
      return;
    }
    this.dashCooldown = DASH_COOLDOWN;

    let stepsTaken = 0;
    for (let step = 0; step < this.dashDistance; step += 1) {
      const nextX = this.player.position.x + x;
      const nextY = this.player.position.y + y;
      if (!this.isWalkable(nextX, nextY)) {
        break;
      }
      this.player.move(x, y);
      stepsTaken += 1;
    }

    if (stepsTaken > 0) {
      this.log.message(`You dash ${stepsTaken} tile(s) ahead.`);
    } else {
      this.log.message('You lurch forward but cannot move.');
    }
    this.draw();
    this.updateUi();
  }

  advanceEnemies() {
    for (const enemy of this.enemies) {
      const dx = Math.sign(this.player.position.x - enemy.position.x);
      const dy = Math.sign(this.player.position.y - enemy.position.y);

      let moved = false;
      const horizontalDistance = Math.abs(
        this.player.position.x - enemy.position.x
      );
      const verticalDistance = Math.abs(
        this.player.position.y - enemy.position.y
      );

      if (horizontalDistance > verticalDistance) {
        moved = this.tryMoveEnemy(enemy, dx, 0);
        if (!moved) {
          moved = this.tryMoveEnemy(enemy, 0, dy);
        }
      } else {
        moved = this.tryMoveEnemy(enemy, 0, dy);
        if (!moved) {
          moved = this.tryMoveEnemy(enemy, dx, 0);
        }
      }

      if (!moved) {
        const fallback = CARDINAL_DIRECTIONS[
          Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)
        ];
        this.tryMoveEnemy(enemy, fallback.x, fallback.y);
      }

      if (
        enemy.position.x === this.player.position.x &&
        enemy.position.y === this.player.position.y
      ) {
        const healthBefore = this.player.health;
        const alive = this.player.takeDamage(ENEMY_DAMAGE);
        this.updateUi();
        if (!alive) {
          this.log.message('A cold chill overwhelms you. You fall.');
          this.gameOver = true;
          break;
        }
        if (this.player.health < healthBefore) {
          this.log.message('You are struck by an enemy!');
        }
      }
    }
  }

  tryMoveEnemy(enemy, dx, dy) {
    const nextX = enemy.position.x + dx;
    const nextY = enemy.position.y + dy;
    if (!this.isWalkable(nextX, nextY)) {
      return false;
    }
    enemy.move(dx, dy);
    return true;
  }

  updateUi() {
    if (this.ui.healthFill) {
      const ratio = Math.max(0, Math.min(1, this.player.healthRatio()));
      this.ui.healthFill.style.width = `${ratio * 100}%`;
      this.ui.healthFill.parentElement?.setAttribute(
        'aria-valuenow',
        String(Math.round(ratio * 100))
      );
    }

    if (this.ui.healthValue) {
      this.ui.healthValue.textContent = `${Math.round(
        this.player.health
      )} / ${this.player.maxHealth}`;
    }

    if (this.ui.progressFill) {
      const progress = Math.max(0, Math.min(1, this.player.progressRatio()));
      this.ui.progressFill.style.width = `${progress * 100}%`;
      this.ui.progressFill.parentElement?.setAttribute(
        'aria-valuenow',
        String(Math.round(progress * 100))
      );
    }

    if (this.ui.progressValue) {
      this.ui.progressValue.textContent = `Level ${this.player.level}`;
    }
  }

  initializeSkillTree() {
    if (!this.ui.skillList) {
      return;
    }
    this.ui.skillList.innerHTML = '';
    this.skills.forEach((skill) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'skill-name';
      name.textContent = skill.name;
      const description = document.createElement('span');
      description.className = 'skill-description';
      description.textContent = skill.description;
      const status = document.createElement('span');
      status.className = 'skill-status';
      status.textContent = 'Locked';
      item.append(name, description, status);
      this.ui.skillList.appendChild(item);
      skill.element = item;
      skill.statusElement = status;
    });
    this.updateSkillTree();
  }

  updateSkillTree() {
    this.skills.forEach((skill) => {
      if (!skill.element || !skill.statusElement) return;
      skill.element.classList.toggle('unlocked', skill.unlocked);
      skill.statusElement.textContent = skill.unlocked ? 'Unlocked' : 'Locked';
    });
  }

  spawnEnemies(count) {
    const enemies = [];
    for (let i = 0; i < count; i += 1) {
      const spawn = this.findSpawn();
      if (spawn.x === this.player.position.x && spawn.y === this.player.position.y) {
        i -= 1;
        continue;
      }
      enemies.push(new Entity({ position: spawn }));
    }
    return enemies;
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

    for (const enemy of this.enemies) {
      this.renderer.drawEnemy(enemy);
    }

    for (const bullet of this.bullets) {
      this.renderer.drawBullet(bullet);
    }

    this.renderer.drawPlayer(this.player);
  }
}
