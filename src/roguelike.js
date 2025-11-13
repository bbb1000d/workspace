export const TILE_SIZE = 32;
const FLOOR_COLOR = '#1f2937';
const WALL_COLOR = '#0b1220';
const PLAYER_COLOR = '#f97316';
const ENEMY_COLOR = '#38bdf8';
const BULLET_COLOR = '#facc15';
const ENEMY_BULLET_COLOR = '#c084fc';

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

const ENEMY_CONTACT_DAMAGE = 10;
const ENEMY_STEP_INTERVAL = 0.5; // seconds
const ENEMY_BASE_COUNT = 8;

const PLAYER_BULLET_SPEED = 13; // tiles per second
const PLAYER_BULLET_LIFETIME = 2.6; // seconds
const PLAYER_BULLET_DAMAGE = 1;

const ENEMY_BASE_HEALTH = 3;
const ENEMY_PROJECTILE_SPEED = 9;
const ENEMY_PROJECTILE_LIFETIME = 4;
const ENEMY_PROJECTILE_DAMAGE = 14;
const ENEMY_MIN_SHOT_INTERVAL = 1.6;
const ENEMY_MAX_SHOT_INTERVAL = 3.2;
const ENEMY_VIEW_DISTANCE = 12;

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

  drawEnemyProjectile(projectile) {
    this.context.fillStyle = ENEMY_BULLET_COLOR;
    this.context.beginPath();
    this.context.arc(
      projectile.x * TILE_SIZE,
      projectile.y * TILE_SIZE,
      TILE_SIZE * 0.18,
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

  const rooms = [];
  const minRoomSize = 5;
  const maxRoomSize = 12;
  const roomAttempts = Math.max(32, Math.floor((width * height) / 24));

  const carveTile = (x, y) => {
    if (x <= 0 || y <= 0 || x >= width - 1 || y >= height - 1) {
      return;
    }
    grid[y][x] = TILE_FLOOR;
  };

  const carveRoom = (room) => {
    for (let y = room.y; y < room.y + room.height; y += 1) {
      for (let x = room.x; x < room.x + room.width; x += 1) {
        carveTile(x, y);
      }
    }
  };

  const carveCorridor = (from, to) => {
    const horizontalFirst = Math.random() < 0.5;
    const carveHorizontal = (startX, endX, y) => {
      const [minX, maxX] =
        startX < endX ? [startX, endX] : [endX, startX];
      for (let x = minX; x <= maxX; x += 1) {
        carveTile(x, y);
        if (Math.random() < 0.55) carveTile(x, y + 1);
      }
    };
    const carveVertical = (startY, endY, x) => {
      const [minY, maxY] =
        startY < endY ? [startY, endY] : [endY, startY];
      for (let y = minY; y <= maxY; y += 1) {
        carveTile(x, y);
        if (Math.random() < 0.55) carveTile(x + 1, y);
      }
    };

    if (horizontalFirst) {
      carveHorizontal(from.x, to.x, from.y);
      carveVertical(from.y, to.y, to.x);
    } else {
      carveVertical(from.y, to.y, from.x);
      carveHorizontal(from.x, to.x, to.y);
    }
  };

  const intersects = (roomA, roomB) => {
    return !(
      roomA.x + roomA.width + 1 < roomB.x ||
      roomB.x + roomB.width + 1 < roomA.x ||
      roomA.y + roomA.height + 1 < roomB.y ||
      roomB.y + roomB.height + 1 < roomA.y
    );
  };

  for (let attempt = 0; attempt < roomAttempts; attempt += 1) {
    const widthRange = maxRoomSize - minRoomSize;
    const roomWidth =
      minRoomSize + Math.floor(Math.random() * (widthRange + 1));
    const roomHeight =
      minRoomSize + Math.floor(Math.random() * (widthRange + 1));
    const roomX = Math.floor(Math.random() * (width - roomWidth - 2)) + 1;
    const roomY = Math.floor(Math.random() * (height - roomHeight - 2)) + 1;

    const newRoom = {
      x: roomX,
      y: roomY,
      width: roomWidth,
      height: roomHeight,
      center: {
        x: Math.floor(roomX + roomWidth / 2),
        y: Math.floor(roomY + roomHeight / 2),
      },
    };

    if (rooms.some((room) => intersects(room, newRoom))) {
      continue;
    }

    carveRoom(newRoom);
    rooms.push(newRoom);
  }

  if (rooms.length === 0) {
    carveTile(Math.floor(width / 2), Math.floor(height / 2));
    return grid;
  }

  rooms.sort((a, b) => a.center.x - b.center.x);
  for (let i = 1; i < rooms.length; i += 1) {
    carveCorridor(rooms[i - 1].center, rooms[i].center);
  }

  const extraLinks = Math.min(rooms.length, 6);
  for (let i = 0; i < extraLinks; i += 1) {
    const roomA = rooms[Math.floor(Math.random() * rooms.length)];
    const roomB = rooms[Math.floor(Math.random() * rooms.length)];
    if (roomA !== roomB) {
      carveCorridor(roomA.center, roomB.center);
    }
  }

  const carveCavern = (start, steps) => {
    let current = { ...start };
    for (let i = 0; i < steps; i += 1) {
      carveTile(current.x, current.y);
      const direction = CARDINAL_DIRECTIONS[
        Math.floor(Math.random() * CARDINAL_DIRECTIONS.length)
      ];
      current = {
        x: Math.min(Math.max(current.x + direction.x, 1), width - 2),
        y: Math.min(Math.max(current.y + direction.y, 1), height - 2),
      };
      if (Math.random() < 0.35) {
        carveTile(current.x + 1, current.y);
        carveTile(current.x, current.y + 1);
      }
    }
  };

  for (let i = 0; i < rooms.length; i += 1) {
    if (Math.random() < 0.5) {
      carveCavern(rooms[i].center, 24 + Math.floor(Math.random() * 24));
    }
  }

  const visited = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false)
  );
  const queue = [];
  queue.push(rooms[0].center);
  visited[rooms[0].center.y][rooms[0].center.x] = true;

  while (queue.length > 0) {
    const current = queue.shift();
    for (const direction of CARDINAL_DIRECTIONS) {
      const nx = current.x + direction.x;
      const ny = current.y + direction.y;
      if (
        nx <= 0 ||
        ny <= 0 ||
        nx >= width - 1 ||
        ny >= height - 1 ||
        visited[ny][nx] ||
        grid[ny][nx] !== TILE_FLOOR
      ) {
        continue;
      }
      visited[ny][nx] = true;
      queue.push({ x: nx, y: ny });
    }
  }

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      if (grid[y][x] === TILE_FLOOR && !visited[y][x]) {
        grid[y][x] = TILE_WALL;
      }
    }
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

class Enemy extends Entity {
  constructor({ position, tier = 1 }) {
    super({ position });
    this.tier = tier;
    this.maxHealth = ENEMY_BASE_HEALTH + (tier - 1);
    this.health = this.maxHealth;
    this.resetCooldown();
    this.slowTimer = 0;
  }

  resetCooldown() {
    this.shotCooldown =
      ENEMY_MIN_SHOT_INTERVAL +
      Math.random() * (ENEMY_MAX_SHOT_INTERVAL - ENEMY_MIN_SHOT_INTERVAL);
  }

  tickCooldown(deltaSeconds) {
    this.shotCooldown -= deltaSeconds;
  }

  readyToShoot() {
    return this.shotCooldown <= 0;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    return this.health > 0;
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
    this.projectileDamage = PLAYER_BULLET_DAMAGE;
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

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
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

    this.stats = {
      enemiesDefeated: 0,
      shotsFired: 0,
      shotsHit: 0,
      dashesUsed: 0,
      hitsTaken: 0,
      wavesCleared: 0,
    };

    this.wave = 1;
    this.baseEnemyCount = ENEMY_BASE_COUNT;
    this.dashDistance = DASH_DISTANCE_DEFAULT;
    this.dashCooldownDuration = DASH_COOLDOWN;
    this.dashCooldown = 0;
    this.dashInvulnerabilityBonus = 0;
    this.damageReduction = 0;
    this.enemySlowDuration = 0;

    this.skills = [
      {
        key: 'rapidVolley',
        name: 'Rapid Volley',
        description: 'Projectiles travel 40% faster.',
        tier: 1,
        cost: 1,
        prerequisites: [],
        unlocked: false,
        apply: () => {
          this.player.bulletSpeedBonus += 5;
        },
      },
      {
        key: 'vitalSurge',
        name: 'Vital Surge',
        description: 'Max health increases by 35 and you heal fully.',
        tier: 1,
        cost: 1,
        prerequisites: [],
        unlocked: false,
        apply: () => {
          this.player.maxHealth += 35;
          this.player.heal(this.player.maxHealth);
        },
      },
      {
        key: 'kineticOverdrive',
        name: 'Kinetic Overdrive',
        description: 'Dash distance +1 and cooldown reduced.',
        tier: 1,
        cost: 1,
        prerequisites: [],
        unlocked: false,
        apply: () => {
          this.dashDistance += 1;
          this.adjustDashCooldown(-0.25);
        },
      },
      {
        key: 'piercingRounds',
        name: 'Piercing Rounds',
        description: 'Shots deal double damage.',
        tier: 2,
        cost: 2,
        prerequisites: ['rapidVolley'],
        unlocked: false,
        apply: () => {
          this.player.projectileDamage += 1;
        },
      },
      {
        key: 'chronoShift',
        name: 'Chrono Shift',
        description: 'Dashing grants 1s of invulnerability.',
        tier: 2,
        cost: 2,
        prerequisites: ['kineticOverdrive'],
        unlocked: false,
        apply: () => {
          this.dashInvulnerabilityBonus += 1;
        },
      },
      {
        key: 'aegisMatrix',
        name: 'Aegis Matrix',
        description: 'Incoming damage reduced by 20%.',
        tier: 2,
        cost: 2,
        prerequisites: ['vitalSurge'],
        unlocked: false,
        apply: () => {
          this.damageReduction = Math.min(0.4, this.damageReduction + 0.2);
        },
      },
      {
        key: 'solarFlare',
        name: 'Solar Flare',
        description: 'Shots ignite, gaining speed and damage.',
        tier: 3,
        cost: 3,
        prerequisites: ['piercingRounds'],
        unlocked: false,
        apply: () => {
          this.player.projectileDamage += 1;
          this.player.bulletSpeedBonus += 4;
        },
      },
      {
        key: 'stasisField',
        name: 'Stasis Field',
        description: 'Enemies slow briefly after being hit.',
        tier: 3,
        cost: 3,
        prerequisites: ['chronoShift'],
        unlocked: false,
        apply: () => {
          this.enemySlowDuration = (this.enemySlowDuration || 0) + 0.4;
        },
      },
    ];

    this.achievements = [
      {
        key: 'firstBlood',
        name: 'First Blood',
        description: 'Defeat your first foe.',
        target: 1,
        unlocked: false,
        progress: () => this.stats.enemiesDefeated,
      },
      {
        key: 'crowdControl',
        name: 'Crowd Control',
        description: 'Defeat 25 enemies across waves.',
        target: 25,
        unlocked: false,
        progress: () => this.stats.enemiesDefeated,
      },
      {
        key: 'blinkMaster',
        name: 'Blink Master',
        description: 'Use dash 15 times.',
        target: 15,
        unlocked: false,
        progress: () => this.stats.dashesUsed,
      },
      {
        key: 'arcaneResilience',
        name: 'Arcane Resilience',
        description: 'Survive 12 enemy hits.',
        target: 12,
        unlocked: false,
        progress: () => this.stats.hitsTaken,
      },
      {
        key: 'waveBreaker',
        name: 'Wave Breaker',
        description: 'Endure 5 assault waves.',
        target: 5,
        unlocked: false,
        progress: () => this.stats.wavesCleared,
      },
    ];

    this.initializeSkillTree();
    this.initializeAchievements();

    this.enemies = this.spawnEnemies(this.baseEnemyCount, this.wave);
    this.bullets = [];
    this.enemyProjectiles = [];

    this.enemyStepTimer = 0;
    this.shootCooldown = 0;
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
      this.advanceEnemies(ENEMY_STEP_INTERVAL);
    }

    for (const enemy of this.enemies) {
      enemy.tickCooldown(deltaSeconds);
      if (enemy.readyToShoot() && this.canEnemySeePlayer(enemy)) {
        this.fireEnemyProjectile(enemy);
        enemy.resetCooldown();
      }
    }

    this.updateBullets(deltaSeconds);
    this.updateEnemyProjectiles(deltaSeconds);

    if (this.gameOver) {
      this.draw();
      this.updateUi();
      return;
    }

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
    const bulletSpeed = PLAYER_BULLET_SPEED + this.player.bulletSpeedBonus;
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
          const alive = enemy.takeDamage(bullet.damage);
          this.stats.shotsHit += 1;
          if (this.enemySlowDuration) {
            enemy.slowTimer = Math.max(enemy.slowTimer, this.enemySlowDuration);
          }
          hitEnemy = true;
          if (!alive) {
            this.enemies.splice(i, 1);
            this.handleEnemyDefeated(enemy);
          }
          break;
        }
      }

      if (!hitEnemy) {
        survivors.push(bullet);
      }
    }
    this.bullets = survivors;
  }

  updateEnemyProjectiles(deltaSeconds) {
    this.enemyProjectiles = this.enemyProjectiles
      .map((projectile) => ({
        ...projectile,
        lifetime: projectile.lifetime - deltaSeconds,
        x: projectile.x + projectile.dx * ENEMY_PROJECTILE_SPEED * deltaSeconds,
        y: projectile.y + projectile.dy * ENEMY_PROJECTILE_SPEED * deltaSeconds,
      }))
      .filter((projectile) => projectile.lifetime > 0);

    const survivors = [];
    for (const projectile of this.enemyProjectiles) {
      const tileX = Math.floor(projectile.x);
      const tileY = Math.floor(projectile.y);
      if (!this.isWalkable(tileX, tileY)) {
        continue;
      }

      const distanceToPlayer = Math.hypot(
        projectile.x - (this.player.position.x + 0.5),
        projectile.y - (this.player.position.y + 0.5)
      );

      if (distanceToPlayer <= 0.45) {
        this.damagePlayer(ENEMY_PROJECTILE_DAMAGE, {
          message: 'An arcane bolt crashes into you!',
          lethalMessage: 'Arcane energy overwhelms you. Darkness follows.',
        });
        if (this.gameOver) {
          break;
        }
        continue;
      }

      survivors.push(projectile);
    }

    this.enemyProjectiles = survivors;
  }

  damagePlayer(amount, { message, lethalMessage } = {}) {
    const effectiveDamage = Math.max(
      1,
      Math.round(amount * (1 - this.damageReduction))
    );
    const healthBefore = this.player.health;
    const alive = this.player.takeDamage(effectiveDamage);
    const tookDamage = this.player.health < healthBefore;

    if (tookDamage) {
      this.stats.hitsTaken += 1;
      if (message) {
        this.log.message(message);
      }
      this.checkAchievements();
    }

    if (!alive && !this.gameOver) {
      this.log.message(
        lethalMessage || 'A cold chill overwhelms you. You fall.'
      );
      this.gameOver = true;
    }

    this.updateUi();
    return tookDamage;
  }

  handleEnemyDefeated(enemy) {
    this.stats.enemiesDefeated += 1;
    const xpReward = 30 + enemy.tier * 12;
    const leveledUp = this.player.grantXp(xpReward);
    this.log.message(`You defeated an enemy (+${xpReward} XP).`);
    if (leveledUp) {
      this.log.message(`You reached level ${this.player.level}!`);
      this.log.message('A fresh skill point is ready to spend.');
    }

    this.checkAchievements();
    this.updateSkillTree();
    this.updateUi();

    if (this.enemies.length === 0) {
      this.stats.wavesCleared += 1;
      this.wave += 1;
      const spawnCount = this.baseEnemyCount + this.wave * 2;
      this.enemyProjectiles = [];
      this.enemies = this.spawnEnemies(spawnCount, this.wave);
      this.enemyStepTimer = 0;
      this.log.message(`Wave ${this.wave} surges into the halls!`);
      this.checkAchievements();
    }
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
      lifetime: PLAYER_BULLET_LIFETIME,
      damage: this.player.projectileDamage,
    };
    this.bullets.push(bullet);
    this.stats.shotsFired += 1;
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
    this.dashCooldown = this.dashCooldownDuration;

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
      this.stats.dashesUsed += 1;
      if (this.dashInvulnerabilityBonus > 0) {
        this.player.invulnerabilityTimer = Math.max(
          this.player.invulnerabilityTimer,
          this.dashInvulnerabilityBonus
        );
      }
      this.checkAchievements();
      this.log.message(`You dash ${stepsTaken} tile(s) ahead.`);
    } else {
      this.log.message('You lurch forward but cannot move.');
    }
    this.draw();
    this.updateUi();
  }

  advanceEnemies(stepSeconds) {
    for (const enemy of this.enemies) {
      if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - stepSeconds);
        if (enemy.slowTimer > 0) {
          continue;
        }
      }

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
        this.damagePlayer(ENEMY_CONTACT_DAMAGE, {
          message: 'An enemy slams into you!',
          lethalMessage:
            'The assault overwhelms you. The dungeon claims another adventurer.',
        });
        if (this.gameOver) {
          break;
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
      this.ui.progressValue.textContent = `Level ${this.player.level} • ${Math.floor(
        this.player.xp
      )} / ${this.player.nextLevelXp} XP`;
    }

    if (this.ui.skillPointsValue) {
      this.ui.skillPointsValue.textContent = String(this.player.skillPoints);
    }
  }

  initializeSkillTree() {
    if (!this.ui.skillList) {
      return;
    }
    this.ui.skillList.innerHTML = '';
    this.skills.forEach((skill) => {
      const item = document.createElement('li');
      item.dataset.skillKey = skill.key;
      const name = document.createElement('span');
      name.className = 'skill-name';
      name.textContent = skill.name;
      const meta = document.createElement('span');
      meta.className = 'skill-meta';
      meta.textContent = `Tier ${skill.tier} • Cost ${skill.cost}`;
      const description = document.createElement('span');
      description.className = 'skill-description';
      description.textContent = skill.description;
      const status = document.createElement('span');
      status.className = 'skill-status';
      status.textContent = 'Locked';
      item.append(name, meta, description, status);
      item.addEventListener('click', () => this.attemptUnlockSkill(skill));
      this.ui.skillList.appendChild(item);
      skill.element = item;
      skill.statusElement = status;
      skill.metaElement = meta;
    });
    this.updateSkillTree();
  }

  updateSkillTree() {
    this.skills.forEach((skill) => {
      if (!skill.element || !skill.statusElement) return;
      const available = this.canUnlockSkill(skill);
      skill.element.classList.toggle('unlocked', skill.unlocked);
      skill.element.classList.toggle('available', available);
      if (skill.unlocked) {
        skill.statusElement.textContent = 'Unlocked';
      } else if (available) {
        skill.statusElement.textContent = `Ready • Cost ${skill.cost}`;
      } else {
        skill.statusElement.textContent = this.describeSkillRequirements(skill);
      }
    });
  }

  attemptUnlockSkill(skill) {
    if (skill.unlocked) {
      return;
    }

    if (!this.canUnlockSkill(skill)) {
      const reason = this.describeSkillRequirements(skill);
      this.log.message(`Cannot unlock ${skill.name}: ${reason}.`);
      return;
    }

    this.player.skillPoints = Math.max(0, this.player.skillPoints - skill.cost);
    skill.unlocked = true;
    skill.apply();
    this.log.message(`Skill unlocked: ${skill.name}.`);
    this.updateSkillTree();
    this.updateUi();
  }

  canUnlockSkill(skill) {
    if (skill.unlocked) {
      return false;
    }
    if (this.player.skillPoints < skill.cost) {
      return false;
    }
    if (!skill.prerequisites || skill.prerequisites.length === 0) {
      return true;
    }
    return skill.prerequisites.every((key) => this.findSkill(key)?.unlocked);
  }

  describeSkillRequirements(skill) {
    if (skill.unlocked) {
      return 'Unlocked';
    }
    const requirements = [];
    if (this.player.skillPoints < skill.cost) {
      requirements.push(`Need ${skill.cost} SP`);
    }
    const lockedPrereqs = (skill.prerequisites || [])
      .map((key) => this.findSkill(key))
      .filter((prereq) => prereq && !prereq.unlocked);
    if (lockedPrereqs.length > 0) {
      requirements.push(
        `Requires ${lockedPrereqs.map((prereq) => prereq.name).join(', ')}`
      );
    }
    return requirements.join(' • ') || `Tier ${skill.tier}`;
  }

  findSkill(key) {
    return this.skills.find((skill) => skill.key === key);
  }

  initializeAchievements() {
    if (!this.ui.achievementList) {
      return;
    }
    this.ui.achievementList.innerHTML = '';
    this.achievements.forEach((achievement) => {
      const item = document.createElement('li');
      const title = document.createElement('span');
      title.className = 'achievement-title';
      title.textContent = achievement.name;
      const details = document.createElement('span');
      details.className = 'achievement-details';
      details.textContent = achievement.description;
      const progress = document.createElement('span');
      progress.className = 'achievement-progress';
      progress.textContent = `0 / ${achievement.target}`;
      item.append(title, details, progress);
      this.ui.achievementList.appendChild(item);
      achievement.element = item;
      achievement.progressElement = progress;
    });
    this.updateAchievements();
  }

  updateAchievements() {
    this.achievements.forEach((achievement) => {
      if (!achievement.element || !achievement.progressElement) {
        return;
      }
      const current = achievement.progress(this.stats, this);
      const completed = achievement.unlocked || current >= achievement.target;
      achievement.element.classList.toggle('completed', completed);
      if (completed) {
        achievement.progressElement.textContent = 'Completed';
      } else {
        achievement.progressElement.textContent = `${Math.min(
          achievement.target,
          Math.floor(current)
        )} / ${achievement.target}`;
      }
    });
  }

  checkAchievements() {
    let unlockedAny = false;
    this.achievements.forEach((achievement) => {
      if (achievement.unlocked) {
        return;
      }
      if (achievement.progress(this.stats, this) >= achievement.target) {
        achievement.unlocked = true;
        unlockedAny = true;
        this.log.message(`Achievement unlocked: ${achievement.name}!`);
      }
    });
    if (unlockedAny || this.ui.achievementList) {
      this.updateAchievements();
    }
  }

  adjustDashCooldown(delta) {
    this.dashCooldownDuration = Math.max(
      0.5,
      this.dashCooldownDuration + delta
    );
    this.dashCooldown = Math.min(this.dashCooldown, this.dashCooldownDuration);
  }

  spawnEnemies(count, wave = 1) {
    const enemies = [];
    const attemptsLimit = count * 30;
    const tierBase = Math.max(1, Math.floor((wave + 1) / 2));
    for (let attempts = 0; enemies.length < count && attempts < attemptsLimit; attempts += 1) {
      const spawn = this.findSpawn();
      if (spawn.x === this.player.position.x && spawn.y === this.player.position.y) {
        continue;
      }
      if (
        enemies.some(
          (enemy) =>
            enemy.position.x === spawn.x && enemy.position.y === spawn.y
        )
      ) {
        continue;
      }
      const distance =
        Math.abs(spawn.x - this.player.position.x) +
        Math.abs(spawn.y - this.player.position.y);
      if (distance < 6) {
        continue;
      }
      const tierBonus = Math.random() < Math.min(0.45, wave * 0.08) ? 1 : 0;
      enemies.push(
        new Enemy({
          position: spawn,
          tier: tierBase + tierBonus,
        })
      );
    }
    return enemies;
  }

  fireEnemyProjectile(enemy) {
    const originX = enemy.position.x + 0.5;
    const originY = enemy.position.y + 0.5;
    const targetX = this.player.position.x + 0.5;
    const targetY = this.player.position.y + 0.5;
    const dx = targetX - originX;
    const dy = targetY - originY;
    const distance = Math.hypot(dx, dy) || 1;
    this.enemyProjectiles.push({
      x: originX,
      y: originY,
      dx: dx / distance,
      dy: dy / distance,
      lifetime: ENEMY_PROJECTILE_LIFETIME,
    });
    if (Math.random() < 0.35) {
      this.log.message('An enemy launches an arcane bolt!');
    }
  }

  canEnemySeePlayer(enemy) {
    const dx = this.player.position.x - enemy.position.x;
    const dy = this.player.position.y - enemy.position.y;
    const distance = Math.hypot(dx, dy);
    if (distance > ENEMY_VIEW_DISTANCE) {
      return false;
    }
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    if (steps === 0) {
      return false;
    }
    let currentX = enemy.position.x + 0.5;
    let currentY = enemy.position.y + 0.5;
    const stepX = dx / steps;
    const stepY = dy / steps;
    for (let i = 0; i < steps; i += 1) {
      currentX += stepX;
      currentY += stepY;
      const tileX = Math.floor(currentX);
      const tileY = Math.floor(currentY);
      if (tileX === this.player.position.x && tileY === this.player.position.y) {
        return true;
      }
      if (!this.isWalkable(tileX, tileY)) {
        return false;
      }
    }
    return true;
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

  findSpawnNear(target) {
    const visited = new Set();
    const queue = [target];
    while (queue.length > 0) {
      const current = queue.shift();
      const key = `${current.x},${current.y}`;
      if (visited.has(key)) {
        continue;
      }
      visited.add(key);
      if (
        current.x >= 0 &&
        current.y >= 0 &&
        current.x < this.mapWidth &&
        current.y < this.mapHeight
      ) {
        if (this.isWalkable(current.x, current.y)) {
          return { x: current.x, y: current.y };
        }
        for (const direction of CARDINAL_DIRECTIONS) {
          queue.push({
            x: current.x + direction.x,
            y: current.y + direction.y,
          });
        }
      }
    }
    return this.findSpawn();
  }

  handleResize() {
    const newWidth = Math.floor(this.canvas.width / TILE_SIZE);
    const newHeight = Math.floor(this.canvas.height / TILE_SIZE);
    if (newWidth === this.mapWidth && newHeight === this.mapHeight) {
      return;
    }
    this.mapWidth = newWidth;
    this.mapHeight = newHeight;
    this.map = createDungeon(this.mapWidth, this.mapHeight);
    const target = {
      x: Math.floor(this.mapWidth / 2),
      y: Math.floor(this.mapHeight / 2),
    };
    this.player.position = this.findSpawnNear(target);
    this.enemies = this.spawnEnemies(this.baseEnemyCount + this.wave * 2, this.wave);
    this.enemyProjectiles = [];
    this.bullets = [];
    this.enemyStepTimer = 0;
    this.log.message('The dungeon shifts around you, revealing fresh halls.');
    this.updateSkillTree();
    this.updateAchievements();
    this.updateUi();
    this.draw();
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

    for (const projectile of this.enemyProjectiles) {
      this.renderer.drawEnemyProjectile(projectile);
    }

    for (const bullet of this.bullets) {
      this.renderer.drawBullet(bullet);
    }

    this.renderer.drawPlayer(this.player);
  }
}
