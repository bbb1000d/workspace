export const TILE_SIZE = 32;

const DIRECTIONS = {
  w: { x: 0, y: -1 },
  a: { x: -1, y: 0 },
  s: { x: 0, y: 1 },
  d: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowRight: { x: 1, y: 0 },
};

const AIM_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const MOVE_KEYS = new Set(['w', 'a', 's', 'd']);

const WORLD_PADDING_TILES = 10;
const PLAYER_BASE_SPEED = 3.2; // tiles per second
const PLAYER_SPRINT_SPEED = 5.6;
const PLAYER_BASE_HEALTH = 120;
const PLAYER_DASH_DISTANCE = 4;
const PLAYER_DASH_COOLDOWN = 1.8;
const PLAYER_SHOT_INTERVAL = 0.4;
const PLAYER_BASE_DAMAGE = 12;
const PLAYER_PROJECTILE_SPEED = 12;
const PLAYER_PROJECTILE_LIFETIME = 2.4;

const ENEMY_BASE_HEALTH = 28;
const ENEMY_BASE_SPEED = 1.3;
const ENEMY_SPAWN_INTERVAL = 9;
const ENEMY_CONTACT_DAMAGE = 8;
const ENEMY_RANGE = 11;
const ENEMY_FIRE_INTERVAL = 3.4;
const ENEMY_PROJECTILE_SPEED = 8;
const ENEMY_PROJECTILE_DAMAGE = 9;
const ENEMY_PROJECTILE_LIFETIME = 4;

const PICKUP_ATTRACTION_RANGE = 3;
const PICKUP_ATTRACTION_SPEED = 2.4;

const XP_PER_LEVEL = 60;
const LEVEL_XP_GROWTH = 25;

const TILE_TYPES = {
  grass: { color: '#18382b', variants: ['#1c3d33', '#1f4538', '#214d3c'] },
  meadow: { color: '#244732', variants: ['#28523a', '#30593f', '#356246'] },
  path: { color: '#5f513b', variants: ['#6a573f', '#755f43', '#816847'] },
  sand: { color: '#8f6f43', variants: ['#987548', '#a17c4d', '#aa8352'] },
  water: { color: '#163c54', variants: ['#1a4560', '#1f506d', '#235a79'], blocked: true },
  stone: { color: '#3d434f', variants: ['#454b58', '#4d5360', '#555b68'], blocked: true },
  plaza: { color: '#3c3a50', variants: ['#3f3f57', '#44455f', '#494c66'] },
};

const SCENERY_COLORS = {
  treeTrunk: '#6b3f22',
  treeLeaves: ['#2f6846', '#34744f', '#3a7f58'],
  blossom: '#f6cbd1',
  lampPost: '#fcd34d',
  houseWall: '#f8f0e0',
  houseRoof: '#c084fc',
};

const ENEMY_PALETTE = ['#f472b6', '#fb7185', '#60a5fa'];
const BULLET_COLOR = '#facc15';
const ENEMY_BULLET_COLOR = '#38bdf8';

const UPGRADE_LIBRARY = [
  {
    id: 'rapid-fire',
    name: 'Rapid Fire',
    description: 'Reduce shoot cooldown by 30% and slightly boost projectile speed.',
    apply(player) {
      player.shootInterval *= 0.7;
      player.projectileSpeed *= 1.15;
    },
  },
  {
    id: 'double-shot',
    name: 'Twin Arrows',
    description: 'Fire a second shot that fans outward for more coverage.',
    apply(player) {
      player.doubleShot = true;
    },
  },
  {
    id: 'dash-charge',
    name: 'Comet Dash',
    description: 'Dash travels farther and leaves a comet trail that damages foes.',
    apply(player) {
      player.dashDistance += 2;
      player.dashTrail = true;
    },
  },
  {
    id: 'forest-blessing',
    name: 'Forest Blessing',
    description: 'Heal for 20 every time you level up and gain +20 max health.',
    apply(player) {
      player.maxHealth += 20;
      player.health = Math.min(player.maxHealth, player.health + 20);
      player.onLevelUpRegen = (player.onLevelUpRegen || 0) + 20;
    },
  },
  {
    id: 'aurora-shell',
    name: 'Aurora Shell',
    description: 'Gain a shimmering shield that blocks one hit every 20 seconds.',
    apply(player) {
      player.shield = {
        cooldown: 20,
        timer: 0,
        active: true,
      };
    },
  },
  {
    id: 'luminous-shot',
    name: 'Luminous Shot',
    description: 'Projectiles leave light orbs that slow enemies caught inside.',
    apply(player) {
      player.glowShots = true;
    },
  },
  {
    id: 'spirit-walk',
    name: 'Spirit Walk',
    description: 'Move 25% faster and glide smoothly around obstacles.',
    apply(player) {
      player.speed *= 1.25;
      player.spiritWalk = true;
    },
  },
];

const ACHIEVEMENT_LIBRARY = [
  {
    id: 'first-steps',
    label: 'First Steps',
    check: (stats) => stats.distance > 40,
    description: 'Travel forty tiles through the valley.',
  },
  {
    id: 'spark-collector',
    label: 'Spark Collector',
    check: (stats) => stats.upgrades >= 3,
    description: 'Unlock three upgrades.',
  },
  {
    id: 'calm-guardian',
    label: 'Calm Guardian',
    check: (stats) => stats.damageTaken < 50 && stats.timeAlive > 120,
    description: 'Survive two minutes while taking minimal damage.',
  },
  {
    id: 'glow-hunter',
    label: 'Glow Hunter',
    check: (stats) => stats.enemiesDefeated >= 12,
    description: 'Defeat twelve luminous foes.',
  },
];

const GOALS = [
  'Find the sunstone altar',
  'Rescue the wandering firefly spirit',
  'Relight the valley lamps',
  'Gather the moonpetal blooms',
  'Discover the hidden hot spring',
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(randRange(min, max + 1));
}

function pick(array) {
  return array[randInt(0, array.length - 1)];
}

function vectorLength(v) {
  return Math.hypot(v.x, v.y);
}

function normalize(v) {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
}

class InputHandler {
  #pressed = new Set();
  #aim = new Set();
  #shootListeners = new Set();
  #dashListeners = new Set();
  #pauseListeners = new Set();

  constructor() {
    window.addEventListener('keydown', (event) => this.#handleKeyDown(event));
    window.addEventListener('keyup', (event) => this.#handleKeyUp(event));
  }

  #handleKeyDown(event) {
    const key = event.key;
    if (MOVE_KEYS.has(key)) {
      this.#pressed.add(key);
      event.preventDefault();
    }

    if (AIM_KEYS.has(key)) {
      this.#aim.add(key);
      event.preventDefault();
    }

    if (key === ' ') {
      event.preventDefault();
      this.#shootListeners.forEach((cb) => cb());
    }

    if (key === 'e' || key === 'E') {
      event.preventDefault();
      this.#dashListeners.forEach((cb) => cb());
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.#pauseListeners.forEach((cb) => cb());
    }
  }

  #handleKeyUp(event) {
    const key = event.key;
    if (MOVE_KEYS.has(key)) {
      this.#pressed.delete(key);
      event.preventDefault();
    }

    if (AIM_KEYS.has(key)) {
      this.#aim.delete(key);
      event.preventDefault();
    }
  }

  getMovementVector() {
    let vx = 0;
    let vy = 0;
    for (const key of this.#pressed) {
      vx += DIRECTIONS[key].x;
      vy += DIRECTIONS[key].y;
    }
    if (vx === 0 && vy === 0) return { x: 0, y: 0 };
    return normalize({ x: vx, y: vy });
  }

  getAimVector(fallback) {
    let vx = 0;
    let vy = 0;
    for (const key of this.#aim) {
      vx += DIRECTIONS[key].x;
      vy += DIRECTIONS[key].y;
    }
    if (vx === 0 && vy === 0) {
      return fallback || { x: 0, y: -1 };
    }
    return normalize({ x: vx, y: vy });
  }

  onShoot(callback) {
    this.#shootListeners.add(callback);
    return () => this.#shootListeners.delete(callback);
  }

  onDash(callback) {
    this.#dashListeners.add(callback);
    return () => this.#dashListeners.delete(callback);
  }

  onPause(callback) {
    this.#pauseListeners.add(callback);
    return () => this.#pauseListeners.delete(callback);
  }
}

class EventLog {
  constructor(element, maxEntries = 8) {
    this.element = element;
    this.maxEntries = maxEntries;
    this.entries = [];
  }

  push(message) {
    const time = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    this.entries.unshift({ message, time });
    this.entries = this.entries.slice(0, this.maxEntries);
    this.render();
  }

  render() {
    if (!this.element) return;
    this.element.innerHTML = '';
    for (const entry of this.entries) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${entry.time}</strong> ${entry.message}`;
      this.element.appendChild(li);
    }
  }
}

class UIController {
  constructor(ui) {
    this.ui = ui;
  }

  setHealth(current, max) {
    const clamped = clamp(current, 0, max);
    this.ui.healthValue.textContent = `${Math.round(clamped)} / ${Math.round(max)}`;
    const ratio = max === 0 ? 0 : (clamped / max) * 100;
    this.ui.healthFill.style.width = `${ratio}%`;
    this.ui.healthFill.parentElement?.setAttribute('aria-valuenow', `${Math.round(ratio)}`);
  }

  setExperience(level, current, required) {
    this.ui.progressValue.textContent = `Level ${level}`;
    const ratio = required === 0 ? 0 : clamp((current / required) * 100, 0, 100);
    this.ui.progressFill.style.width = `${ratio}%`;
    this.ui.progressFill.parentElement?.setAttribute('aria-valuenow', `${Math.round(ratio)}`);
  }

  setSkillPoints(points) {
    this.ui.skillPointsValue.textContent = `${points}`;
  }

  setGoal(text) {
    this.ui.goalValue.textContent = text;
  }

  setUpgrades(upgrades) {
    this.ui.skillList.innerHTML = '';
    if (upgrades.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No sparks yet. Level up to choose one!';
      this.ui.skillList.appendChild(li);
      return;
    }
    for (const upgrade of upgrades) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${upgrade.name}</strong><br/>${upgrade.description}`;
      this.ui.skillList.appendChild(li);
    }
  }

  setAchievements(achievements) {
    this.ui.achievementList.innerHTML = '';
    if (achievements.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Discover hidden feats to fill this list.';
      this.ui.achievementList.appendChild(li);
      return;
    }
    for (const achievement of achievements) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${achievement.label}</strong><br/>${achievement.description}`;
      this.ui.achievementList.appendChild(li);
    }
  }

  setMapClues(clues) {
    this.ui.mapInfo.innerHTML = '';
    for (const clue of clues) {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${clue.title}</strong><br/>${clue.description}`;
      this.ui.mapInfo.appendChild(li);
    }
  }

  showMenu(show) {
    this.ui.pauseMenu.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  showLevelOverlay(show) {
    this.ui.levelOverlay.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  showToast(message) {
    const toast = this.ui.toast;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.add('hidden');
    }, 2400);
  }

  renderUpgradeChoices(choices, onSelect) {
    this.ui.upgradeOptions.innerHTML = '';
    if (choices.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No sparks available just yet. Keep exploring!';
      this.ui.upgradeOptions.appendChild(empty);
      return;
    }
    for (const choice of choices) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-option';
      button.innerHTML = `<h3>${choice.name}</h3><p>${choice.description}</p>`;
      button.addEventListener('click', () => onSelect(choice));
      this.ui.upgradeOptions.appendChild(button);
    }
    const firstButton = this.ui.upgradeOptions.querySelector('button');
    firstButton?.focus();
  }

  clearUpgradeChoices() {
    this.ui.upgradeOptions.innerHTML = '';
  }

  bindSkip(handler) {
    this.ui.skipUpgrade.onclick = handler;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(point, options) {
    this.particles.push({
      x: point.x,
      y: point.y,
      vx: options.vx ?? randRange(-0.5, 0.5),
      vy: options.vy ?? randRange(-0.5, 0.5),
      radius: options.radius ?? randRange(0.1, 0.25),
      life: options.life ?? randRange(0.5, 1.2),
      color: options.color ?? '#ffffff',
    });
  }

  update(dt) {
    this.particles = this.particles
      .map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, life: p.life - dt }))
      .filter((p) => p.life > 0);
  }

  draw(context) {
    for (const particle of this.particles) {
      const alpha = clamp(particle.life, 0, 1);
      context.fillStyle = particle.color;
      context.globalAlpha = alpha;
      context.beginPath();
      context.arc(
        particle.x * TILE_SIZE,
        particle.y * TILE_SIZE,
        particle.radius * TILE_SIZE,
        0,
        Math.PI * 2
      );
      context.fill();
      context.globalAlpha = 1;
    }
  }
}

class World {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.tiles = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ type: 'grass', variant: 0 }))
    );
    this.decorations = [];
    this.signs = [];
    this.lamps = [];
    this.spawnPoint = { x: Math.floor(width / 2), y: Math.floor(height / 2) };
    this.enemySpawns = [];
  }

  static generate(width, height) {
    const world = new World(width, height);
    world.#generateTerrain();
    world.#placeDecorations();
    world.#placePointsOfInterest();
    return world;
  }

  #setTile(x, y, type) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const variants = TILE_TYPES[type]?.variants ?? [TILE_TYPES[type]?.color];
    this.tiles[y][x] = {
      type,
      variant: randInt(0, variants.length - 1),
    };
  }

  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return { type: 'stone', variant: 0 };
    }
    return this.tiles[y][x];
  }

  isWalkable(x, y) {
    const tile = this.getTile(Math.floor(x), Math.floor(y));
    if (!tile) return false;
    const info = TILE_TYPES[tile.type];
    return !(info?.blocked ?? false);
  }

  #generateTerrain() {
    // Base layers: meadow gradients and river
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const distanceToCenter = Math.abs(y - this.height / 2);
        const type = distanceToCenter < this.height / 3 ? 'meadow' : 'grass';
        this.#setTile(x, y, type);
      }
    }

    // Winding path connecting spawn to outskirts
    let cx = randInt(Math.floor(this.width * 0.2), Math.floor(this.width * 0.8));
    let cy = randInt(Math.floor(this.height * 0.2), Math.floor(this.height * 0.8));
    this.spawnPoint = { x: cx, y: cy };

    const target = {
      x: randInt(Math.floor(this.width * 0.1), Math.floor(this.width * 0.9)),
      y: randInt(Math.floor(this.height * 0.1), Math.floor(this.height * 0.9)),
    };

    for (let i = 0; i < this.width * 3; i += 1) {
      this.#setTile(cx, cy, 'path');
      if (Math.random() < 0.25) {
        this.#setTile(cx + 1, cy, 'path');
        this.#setTile(cx, cy + 1, 'path');
      }
      const dx = Math.sign(target.x - cx) + randInt(-1, 1);
      const dy = Math.sign(target.y - cy) + randInt(-1, 1);
      cx = clamp(cx + dx, 2, this.width - 3);
      cy = clamp(cy + dy, 2, this.height - 3);
      if (Math.hypot(cx - target.x, cy - target.y) < 2) break;
    }

    // River meandering top to bottom
    let rx = randInt(Math.floor(this.width * 0.2), Math.floor(this.width * 0.4));
    for (let y = 0; y < this.height; y += 1) {
      const width = 2 + Math.floor(Math.sin(y / 6) * 2 + Math.random() * 2);
      for (let x = -width; x <= width; x += 1) {
        this.#setTile(clamp(rx + x, 0, this.width - 1), y, 'water');
      }
      rx = clamp(rx + randInt(-1, 1), 2, this.width - 3);
    }

    // Plaza near spawn
    for (let y = -2; y <= 2; y += 1) {
      for (let x = -2; x <= 2; x += 1) {
        this.#setTile(this.spawnPoint.x + x, this.spawnPoint.y + y, 'plaza');
      }
    }

    // Sandy shore near river edges
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        if (this.getTile(x, y).type === 'water') {
          for (const dir of Object.values(DIRECTIONS)) {
            const nx = x + dir.x;
            const ny = y + dir.y;
            const tile = this.getTile(nx, ny);
            if (tile.type !== 'water' && tile.type !== 'sand') {
              this.#setTile(nx, ny, 'sand');
            }
          }
        }
      }
    }
  }

  #placeDecorations() {
    for (let i = 0; i < this.width * this.height * 0.04; i += 1) {
      const x = randInt(2, this.width - 3);
      const y = randInt(2, this.height - 3);
      const tile = this.getTile(x, y);
      if (tile.type === 'grass' || tile.type === 'meadow') {
        this.decorations.push({ x, y, type: 'tree' });
        if (Math.random() < 0.15) {
          this.decorations.push({ x, y, type: 'blossom' });
        }
      }
    }

    for (let i = 0; i < this.width * this.height * 0.02; i += 1) {
      const x = randInt(3, this.width - 4);
      const y = randInt(3, this.height - 4);
      const tile = this.getTile(x, y);
      if (tile.type === 'grass' || tile.type === 'meadow') {
        this.decorations.push({ x, y, type: 'rock' });
        this.#setTile(x, y, 'stone');
      }
    }
  }

  #placePointsOfInterest() {
    const houseCount = 3 + randInt(0, 2);
    for (let i = 0; i < houseCount; i += 1) {
      const hx = randInt(4, this.width - 6);
      const hy = randInt(4, this.height - 6);
      for (let y = -1; y <= 1; y += 1) {
        for (let x = -1; x <= 1; x += 1) {
          this.#setTile(hx + x, hy + y, 'plaza');
        }
      }
      this.decorations.push({ x: hx, y: hy, type: 'house' });
      this.lamps.push({ x: hx + 2.2, y: hy - 1.4 });
      this.enemySpawns.push({ x: hx + randRange(-2, 2), y: hy + randRange(-2, 2) });
    }

    const signTexts = [
      { title: 'Aurora Plaza', description: 'Safe haven. Gather upgrades here.' },
      { title: 'Moonpetal Meadow', description: 'Slower foes, gather glowing petals.' },
      { title: 'Luminous Brook', description: 'Water slows everything – watch your dash!' },
      { title: 'Sunstone Altar', description: 'Follow the path east to reach the altar.' },
    ];

    for (const info of signTexts) {
      const x = clamp(
        this.spawnPoint.x + randInt(-12, 12),
        4,
        this.width - 5
      );
      const y = clamp(
        this.spawnPoint.y + randInt(-12, 12),
        4,
        this.height - 5
      );
      this.signs.push({ x, y, text: info.title });
    }

    this.mapClues = signTexts.map((entry) => ({ ...entry }));
  }
}

function createProjectile({
  x,
  y,
  direction,
  speed,
  damage,
  lifetime,
  friendly,
  spread = 0,
  slowField = false,
}) {
  const angle = Math.atan2(direction.y, direction.x) + spread;
  return {
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    damage,
    lifetime,
    age: 0,
    friendly,
    slowField,
  };
}

export class RoguelikeGame {
  constructor({ canvas, ui }) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context unavailable.');
    }
    this.context = context;
    this.input = new InputHandler();
    this.ui = new UIController(ui);
    this.ui.bindSkip(() => this.skipUpgradeSelection());
    this.log = new EventLog(ui.log);
    this.particles = new ParticleSystem();
    this.lastTime = 0;
    this.state = 'loading';
    this.stats = {
      distance: 0,
      enemiesDefeated: 0,
      damageTaken: 0,
      upgrades: 0,
      timeAlive: 0,
    };

    this.input.onShoot(() => this.#handleShoot());
    this.input.onDash(() => this.#handleDash());
    this.input.onPause(() => this.toggleMenu());

    this.upgradePool = [...UPGRADE_LIBRARY];
    this.achievements = new Set();
    this.goal = pick(GOALS);
  }

  start() {
    this.restart();
    this.state = 'running';
    requestAnimationFrame((time) => this.#loop(time));
  }

  restart() {
    this.state = 'running';
    this.ui.showMenu(false);
    this.ui.showLevelOverlay(false);
    this.ui.clearUpgradeChoices();
    this.upgradeChoices = [];
    this.pendingSkillPoints = 0;
    this.upgradePool = [...UPGRADE_LIBRARY];
    this.achievements.clear();
    this.goal = pick(GOALS);
    this.stats = {
      distance: 0,
      enemiesDefeated: 0,
      damageTaken: 0,
      upgrades: 0,
      timeAlive: 0,
    };

    this.world = World.generate(
      Math.floor(this.canvas.width / TILE_SIZE) + WORLD_PADDING_TILES,
      Math.floor(this.canvas.height / TILE_SIZE) + WORLD_PADDING_TILES
    );

    this.player = {
      x: this.world.spawnPoint.x + 0.5,
      y: this.world.spawnPoint.y + 0.5,
      vx: 0,
      vy: 0,
      health: PLAYER_BASE_HEALTH,
      maxHealth: PLAYER_BASE_HEALTH,
      level: 1,
      experience: 0,
      experienceToLevel: XP_PER_LEVEL,
      shootInterval: PLAYER_SHOT_INTERVAL,
      shootTimer: 0,
      dashCooldown: PLAYER_DASH_COOLDOWN,
      dashTimer: 0,
      dashDistance: PLAYER_DASH_DISTANCE,
      projectileSpeed: PLAYER_PROJECTILE_SPEED,
      projectileLifetime: PLAYER_PROJECTILE_LIFETIME,
      damage: PLAYER_BASE_DAMAGE,
      doubleShot: false,
      dashTrail: false,
      glowShots: false,
      spiritWalk: false,
      shield: null,
      onLevelUpRegen: 0,
      speed: PLAYER_BASE_SPEED,
      aim: { x: 0, y: -1 },
      upgrades: [],
    };

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.enemies = [];
    this.pickups = [];
    this.particles = new ParticleSystem();
    this.spawnTimer = ENEMY_SPAWN_INTERVAL;

    this.ui.setHealth(this.player.health, this.player.maxHealth);
    this.ui.setExperience(
      this.player.level,
      this.player.experience,
      this.player.experienceToLevel
    );
    this.ui.setSkillPoints(0);
    this.ui.setUpgrades([]);
    this.ui.setAchievements([]);
    this.ui.setGoal(this.goal);
    this.ui.setMapClues(this.world.mapClues);
    this.log.push('You feel a calm wind guiding your steps.');
  }

  handleResize() {
    this.restart();
  }

  toggleMenu() {
    if (this.state === 'running') {
      this.state = 'menu';
      this.ui.showMenu(true);
    } else if (this.state === 'menu' && this.player?.health > 0) {
      this.state = 'running';
      this.ui.showMenu(false);
    }
  }

  resume() {
    if (this.state !== 'menu') return;
    if (this.player?.health <= 0) return;
    this.state = 'running';
    this.ui.showMenu(false);
  }

  skipUpgradeSelection() {
    if (this.state === 'choosing-upgrade') {
      this.state = 'running';
      this.ui.showLevelOverlay(false);
      this.ui.clearUpgradeChoices();
      this.ui.setSkillPoints(this.pendingSkillPoints);
      this.log.push('You pocket the spark for a future moment.');
    }
  }

  #loop(time) {
    const dt = Math.min(0.06, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;

    if (this.state === 'running') {
      this.#update(dt);
    }

    this.#render();
    requestAnimationFrame((next) => this.#loop(next));
  }

  #update(dt) {
    this.stats.timeAlive += dt;
    const movement = this.input.getMovementVector();
    const aim = this.input.getAimVector(this.player.aim);
    this.player.aim = aim;

    const speed = this.player.speed;
    const targetVx = movement.x * speed;
    const targetVy = movement.y * speed;

    this.player.vx = lerp(this.player.vx, targetVx, this.player.spiritWalk ? 0.2 : 0.12);
    this.player.vy = lerp(this.player.vy, targetVy, this.player.spiritWalk ? 0.2 : 0.12);

    const nextX = this.player.x + this.player.vx * dt;
    const nextY = this.player.y + this.player.vy * dt;

    if (this.world.isWalkable(nextX, this.player.y)) {
      this.stats.distance += Math.abs(nextX - this.player.x);
      this.player.x = nextX;
    } else {
      this.player.vx = 0;
    }

    if (this.world.isWalkable(this.player.x, nextY)) {
      this.stats.distance += Math.abs(nextY - this.player.y);
      this.player.y = nextY;
    } else {
      this.player.vy = 0;
    }

    this.player.shootTimer = Math.max(0, this.player.shootTimer - dt);
    this.player.dashTimer = Math.max(0, this.player.dashTimer - dt);

    if (this.player.shield) {
      this.player.shield.timer = Math.min(
        this.player.shield.cooldown,
        this.player.shield.timer + dt
      );
      if (this.player.shield.timer >= this.player.shield.cooldown) {
        this.player.shield.active = true;
      }
    }

    this.#updateProjectiles(dt);
    this.#updateEnemies(dt);
    this.#updateEnemyProjectiles(dt);
    this.#updatePickups(dt);
    this.particles.update(dt);
    this.#checkAchievements();

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.#spawnEnemyWave();
      this.spawnTimer = ENEMY_SPAWN_INTERVAL + randRange(-2, 2);
    }
  }

  #handleShoot() {
    if (this.state !== 'running') return;
    if (this.player.shootTimer > 0) return;
    const direction = this.player.aim;
    if (vectorLength(direction) === 0) return;

    this.player.shootTimer = this.player.shootInterval;
    const baseProjectile = createProjectile({
      x: this.player.x,
      y: this.player.y,
      direction,
      speed: this.player.projectileSpeed,
      damage: this.player.damage,
      lifetime: this.player.projectileLifetime,
      friendly: true,
      slowField: this.player.glowShots,
    });

    this.projectiles.push(baseProjectile);

    if (this.player.doubleShot) {
      const spreadAngle = randRange(-0.25, 0.25);
      this.projectiles.push(
        createProjectile({
          x: this.player.x,
          y: this.player.y,
          direction,
          speed: this.player.projectileSpeed * 0.92,
          damage: Math.round(this.player.damage * 0.8),
          lifetime: this.player.projectileLifetime,
          friendly: true,
          spread: spreadAngle,
          slowField: this.player.glowShots,
        })
      );
    }

    this.particles.spawn({ x: this.player.x, y: this.player.y }, {
      color: BULLET_COLOR,
      radius: 0.2,
      life: 0.4,
      vx: -direction.x * 0.5,
      vy: -direction.y * 0.5,
    });
    this.log.push('You release a burst of luminous light.');
  }

  #handleDash() {
    if (this.state !== 'running') return;
    if (this.player.dashTimer > 0) return;
    const direction = this.input.getMovementVector();
    if (vectorLength(direction) === 0) return;

    this.player.dashTimer = this.player.dashCooldown;
    const dashDistance = this.player.dashDistance;
    const steps = Math.ceil(dashDistance);
    let dx = direction.x;
    let dy = direction.y;
    if (!this.player.spiritWalk) {
      const norm = normalize(direction);
      dx = norm.x;
      dy = norm.y;
    }
    for (let i = 0; i < steps; i += 1) {
      const nextX = this.player.x + dx;
      const nextY = this.player.y + dy;
      if (!this.world.isWalkable(nextX, nextY)) break;
      this.player.x = nextX;
      this.player.y = nextY;
      if (this.player.dashTrail) {
        this.particles.spawn({ x: nextX, y: nextY }, {
          color: 'rgba(251, 191, 36, 0.8)',
          radius: 0.25,
          life: 0.5,
          vx: randRange(-0.3, 0.3),
          vy: randRange(-0.3, 0.3),
        });
      }
    }
    this.log.push('You dash in a streak of warm light.');
  }

  resume() {
    if (this.player?.health <= 0) return;
    this.state = 'running';
    this.ui.showMenu(false);
  }

  #updateProjectiles(dt) {
    const newProjectiles = [];
    for (const projectile of this.projectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.age += dt;

      if (!this.world.isWalkable(projectile.x, projectile.y)) {
        if (projectile.slowField) {
          this.#spawnSlowField(projectile.x, projectile.y);
        }
        continue;
      }

      let hitEnemy = false;
      for (const enemy of this.enemies) {
        const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
        if (distance < 0.6) {
          enemy.health -= projectile.damage;
          hitEnemy = true;
          this.particles.spawn({ x: enemy.x, y: enemy.y }, {
            color: '#fbbf24',
            radius: 0.18,
            life: 0.5,
            vx: randRange(-0.6, 0.6),
            vy: randRange(-0.6, 0.6),
          });
          if (projectile.slowField) {
            this.#spawnSlowField(enemy.x, enemy.y);
          }
          break;
        }
      }

      if (!hitEnemy && projectile.age < projectile.lifetime) {
        newProjectiles.push(projectile);
      }
    }
    this.projectiles = newProjectiles;

    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.health > 0) return true;
      this.#onEnemyDefeated(enemy);
      return false;
    });
  }

  #spawnSlowField(x, y) {
    const field = {
      x,
      y,
      radius: 1.8,
      duration: 3,
      age: 0,
    };
    if (!this.slowFields) this.slowFields = [];
    this.slowFields.push(field);
  }

  #updateEnemyProjectiles(dt) {
    const survivors = [];
    for (const projectile of this.enemyProjectiles) {
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.age += dt;

      const distance = Math.hypot(
        projectile.x - this.player.x,
        projectile.y - this.player.y
      );
      if (distance < 0.6) {
        this.#damagePlayer(ENEMY_PROJECTILE_DAMAGE);
        continue;
      }

      if (!this.world.isWalkable(projectile.x, projectile.y)) {
        continue;
      }

      if (projectile.age < projectile.lifetime) {
        survivors.push(projectile);
      }
    }
    this.enemyProjectiles = survivors;
  }

  #updateEnemies(dt) {
    for (const enemy of this.enemies) {
      enemy.fireTimer -= dt;
      const dx = this.player.x - enemy.x;
      const dy = this.player.y - enemy.y;
      const distance = Math.hypot(dx, dy);
      const slowed = this.#isInSlowField(enemy.x, enemy.y);
      const speedMultiplier = slowed ? 0.5 : 1;

      if (distance > 0.1) {
        const dir = normalize({ x: dx, y: dy });
        const speed = ENEMY_BASE_SPEED * speedMultiplier;
        const nextX = enemy.x + dir.x * speed * dt;
        const nextY = enemy.y + dir.y * speed * dt;
        if (this.world.isWalkable(nextX, enemy.y)) {
          enemy.x = nextX;
        }
        if (this.world.isWalkable(enemy.x, nextY)) {
          enemy.y = nextY;
        }
      }

      if (distance < 1.2) {
        this.#damagePlayer(ENEMY_CONTACT_DAMAGE * dt);
      }

      if (distance < ENEMY_RANGE && enemy.fireTimer <= 0) {
        enemy.fireTimer = ENEMY_FIRE_INTERVAL + randRange(-0.6, 0.6);
        const projectile = createProjectile({
          x: enemy.x,
          y: enemy.y,
          direction: normalize({ x: dx, y: dy }),
          speed: ENEMY_PROJECTILE_SPEED,
          damage: ENEMY_PROJECTILE_DAMAGE,
          lifetime: ENEMY_PROJECTILE_LIFETIME,
          friendly: false,
        });
        this.enemyProjectiles.push(projectile);
        this.particles.spawn({ x: enemy.x, y: enemy.y }, {
          color: ENEMY_BULLET_COLOR,
          radius: 0.18,
          life: 0.45,
        });
      }
    }

    if (this.slowFields) {
      this.slowFields = this.slowFields
        .map((field) => ({ ...field, age: field.age + dt }))
        .filter((field) => field.age < field.duration);
    }
  }

  #updatePickups(dt) {
    const survivors = [];
    for (const pickup of this.pickups) {
      const dx = this.player.x - pickup.x;
      const dy = this.player.y - pickup.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) {
        this.player.experience += pickup.value;
        this.log.push('You collect a glowing memory shard.');
        this.ui.showToast(`+${pickup.value} experience`);
        this.#checkLevelUp();
        continue;
      }

      if (distance < PICKUP_ATTRACTION_RANGE) {
        const dir = normalize({ x: dx, y: dy });
        pickup.vx = lerp(pickup.vx, dir.x * PICKUP_ATTRACTION_SPEED, 0.2);
        pickup.vy = lerp(pickup.vy, dir.y * PICKUP_ATTRACTION_SPEED, 0.2);
      }

      pickup.x += pickup.vx * dt;
      pickup.y += pickup.vy * dt;
      pickup.life -= dt;

      if (pickup.life > 0) {
        survivors.push(pickup);
      }
    }
    this.pickups = survivors;
  }

  #checkLevelUp() {
    while (this.player.experience >= this.player.experienceToLevel) {
      this.player.experience -= this.player.experienceToLevel;
      this.player.level += 1;
      this.player.experienceToLevel = Math.round(
        this.player.experienceToLevel + LEVEL_XP_GROWTH
      );
      this.pendingSkillPoints += 1;
      if (this.player.onLevelUpRegen) {
        this.player.health = clamp(
          this.player.health + this.player.onLevelUpRegen,
          0,
          this.player.maxHealth
        );
      }
      this.ui.showToast(`Level ${this.player.level}! Skill spark earned.`);
      this.log.push('A new spark flares within you.');
      this.#presentUpgrades();
    }

    this.ui.setSkillPoints(this.pendingSkillPoints);
    this.ui.setExperience(
      this.player.level,
      this.player.experience,
      this.player.experienceToLevel
    );
    this.ui.setHealth(this.player.health, this.player.maxHealth);
  }

  #presentUpgrades() {
    this.state = 'choosing-upgrade';
    this.ui.showLevelOverlay(true);
    const options = [];
    const pool = this.upgradePool.length > 0 ? this.upgradePool : [...UPGRADE_LIBRARY];
    const attempts = Math.min(3, pool.length);
    while (options.length < attempts) {
      const candidate = pick(pool);
      if (!options.includes(candidate)) {
        options.push(candidate);
      }
    }
    this.upgradeChoices = options;
    this.ui.renderUpgradeChoices(options, (choice) => this.#applyUpgrade(choice));
  }

  #applyUpgrade(upgrade) {
    this.pendingSkillPoints = Math.max(0, this.pendingSkillPoints - 1);
    upgrade.apply(this.player);
    this.player.upgrades.push(upgrade);
    this.upgradePool = this.upgradePool.filter((item) => item.id !== upgrade.id);
    this.stats.upgrades += 1;
    this.ui.setUpgrades(this.player.upgrades);
    this.ui.setSkillPoints(this.pendingSkillPoints);
    this.ui.clearUpgradeChoices();
    this.ui.showLevelOverlay(false);
    this.state = 'running';
    this.log.push(`You attune to ${upgrade.name}.`);
  }

  #onEnemyDefeated(enemy) {
    this.stats.enemiesDefeated += 1;
    this.log.push('A hostile shade dissolves into sparks.');
    const xpValue = 12 + Math.round(Math.random() * 6);
    this.pickups.push({
      x: enemy.x,
      y: enemy.y,
      vx: randRange(-0.2, 0.2),
      vy: randRange(-0.2, 0.2),
      value: xpValue,
      life: 12,
    });
    this.particles.spawn({ x: enemy.x, y: enemy.y }, {
      color: '#fbbf24',
      radius: 0.3,
      life: 0.6,
    });
  }

  #damagePlayer(amount) {
    if (amount <= 0) return;
    if (this.player.shield?.active) {
      this.player.shield.active = false;
      this.player.shield.timer = 0;
      this.log.push('Your aurora shell absorbs the impact.');
      this.ui.showToast('Shield absorbed a hit');
      return;
    }
    this.player.health = clamp(this.player.health - amount, 0, this.player.maxHealth);
    this.stats.damageTaken += amount;
    this.ui.setHealth(this.player.health, this.player.maxHealth);
    this.particles.spawn({ x: this.player.x, y: this.player.y }, {
      color: '#f87171',
      radius: 0.25,
      life: 0.6,
    });
    if (this.player.health <= 0) {
      this.log.push('You rest as the valley reknits itself. Press Restart to try again.');
      this.state = 'menu';
      this.ui.showMenu(true);
    }
  }

  #spawnEnemyWave() {
    if (this.enemies.length > 12) return;
    const spawnCount = 2 + randInt(0, 2);
    for (let i = 0; i < spawnCount; i += 1) {
      const source = this.world.enemySpawns.length
        ? pick(this.world.enemySpawns)
        : { x: this.world.spawnPoint.x + randRange(-4, 4), y: this.world.spawnPoint.y + randRange(6, 10) };
      const enemy = {
        x: source.x + randRange(-3, 3),
        y: source.y + randRange(-3, 3),
        health: ENEMY_BASE_HEALTH * randRange(0.8, 1.2),
        color: pick(ENEMY_PALETTE),
        fireTimer: randRange(0.5, ENEMY_FIRE_INTERVAL),
      };
      if (this.world.isWalkable(enemy.x, enemy.y)) {
        this.enemies.push(enemy);
      }
    }
    this.log.push('Shadows gather near the horizon...');
  }

  #checkAchievements() {
    const unlocked = [];
    for (const achievement of ACHIEVEMENT_LIBRARY) {
      if (this.achievements.has(achievement.id)) continue;
      if (achievement.check(this.stats)) {
        this.achievements.add(achievement.id);
        unlocked.push(achievement);
        this.log.push(`Achievement unlocked: ${achievement.label}`);
        this.ui.showToast(`Achievement: ${achievement.label}`);
      }
    }
    if (unlocked.length > 0) {
      const list = [...this.achievements]
        .map((id) => ACHIEVEMENT_LIBRARY.find((item) => item.id === id))
        .filter(Boolean);
      this.ui.setAchievements(list);
    }
  }

  #render() {
    const ctx = this.context;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.#drawWorld(ctx);
    this.#drawDecorations(ctx);
    this.#drawSigns(ctx);
    this.#drawPlayer(ctx);
    this.#drawEnemies(ctx);
    this.#drawProjectiles(ctx);
    this.#drawPickups(ctx);
    if (this.slowFields) {
      for (const field of this.slowFields) {
        this.#drawSlowField(ctx, field);
      }
    }
    this.particles.draw(ctx);
  }

  #drawWorld(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    for (let y = 0; y <= viewHeight; y += 1) {
      for (let x = 0; x <= viewWidth; x += 1) {
        const worldX = x + offsetX;
        const worldY = y + offsetY;
        const tile = this.world.getTile(worldX, worldY);
        const info = TILE_TYPES[tile.type];
        const color = info?.variants?.[tile.variant] ?? info?.color ?? '#000';
        ctx.fillStyle = color;
        ctx.fillRect(
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE + 1,
          TILE_SIZE + 1
        );
      }
    }
  }

  #drawDecorations(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    for (const deco of this.world.decorations) {
      const screenX = (deco.x - offsetX) * TILE_SIZE;
      const screenY = (deco.y - offsetY) * TILE_SIZE;
      if (screenX < -TILE_SIZE || screenY < -TILE_SIZE) continue;
      if (screenX > this.canvas.width || screenY > this.canvas.height) continue;
      if (deco.type === 'tree') {
        ctx.fillStyle = SCENERY_COLORS.treeTrunk;
        ctx.fillRect(screenX + TILE_SIZE * 0.45, screenY + TILE_SIZE * 0.5, TILE_SIZE * 0.1, TILE_SIZE * 0.5);
        ctx.fillStyle = pick(SCENERY_COLORS.treeLeaves);
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE * 0.35, TILE_SIZE * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else if (deco.type === 'blossom') {
        ctx.fillStyle = SCENERY_COLORS.blossom;
        ctx.beginPath();
        ctx.arc(screenX + TILE_SIZE / 2, screenY + TILE_SIZE * 0.3, TILE_SIZE * 0.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (deco.type === 'rock') {
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(
          screenX + TILE_SIZE / 2,
          screenY + TILE_SIZE * 0.7,
          TILE_SIZE * 0.35,
          TILE_SIZE * 0.25,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      } else if (deco.type === 'house') {
        ctx.fillStyle = SCENERY_COLORS.houseWall;
        ctx.fillRect(screenX + TILE_SIZE * 0.1, screenY + TILE_SIZE * 0.3, TILE_SIZE * 0.8, TILE_SIZE * 0.6);
        ctx.fillStyle = SCENERY_COLORS.houseRoof;
        ctx.beginPath();
        ctx.moveTo(screenX + TILE_SIZE * 0.05, screenY + TILE_SIZE * 0.35);
        ctx.lineTo(screenX + TILE_SIZE * 0.5, screenY + TILE_SIZE * 0.05);
        ctx.lineTo(screenX + TILE_SIZE * 0.95, screenY + TILE_SIZE * 0.35);
        ctx.closePath();
        ctx.fill();
      }
    }

    for (const lamp of this.world.lamps) {
      const screenX = (lamp.x - offsetX) * TILE_SIZE;
      const screenY = (lamp.y - offsetY) * TILE_SIZE;
      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = SCENERY_COLORS.lampPost;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawSigns(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    ctx.fillStyle = '#f8fafc';
    ctx.font = `${Math.floor(TILE_SIZE * 0.35)}px 'Trebuchet MS', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (const sign of this.world.signs) {
      const screenX = (sign.x - offsetX) * TILE_SIZE;
      const screenY = (sign.y - offsetY) * TILE_SIZE;
      if (screenX < -TILE_SIZE || screenY < -TILE_SIZE) continue;
      if (screenX > this.canvas.width + TILE_SIZE || screenY > this.canvas.height + TILE_SIZE) continue;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(
        screenX - TILE_SIZE * 0.3,
        screenY - TILE_SIZE * 0.9,
        TILE_SIZE * 0.6,
        TILE_SIZE * 0.4
      );
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(
        screenX - TILE_SIZE * 0.04,
        screenY - TILE_SIZE * 0.5,
        TILE_SIZE * 0.08,
        TILE_SIZE * 0.5
      );
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(sign.text, screenX, screenY - TILE_SIZE * 0.95);
    }
  }

  #drawPlayer(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);
    const screenX = (this.player.x - offsetX) * TILE_SIZE;
    const screenY = (this.player.y - offsetY) * TILE_SIZE;

    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(screenX, screenY, TILE_SIZE * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX, screenY, TILE_SIZE * 0.4, 0, Math.PI * 2);
    ctx.stroke();

    const aimX = screenX + this.player.aim.x * TILE_SIZE * 0.5;
    const aimY = screenY + this.player.aim.y * TILE_SIZE * 0.5;
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(aimX, aimY);
    ctx.stroke();

    if (this.player.shield?.active) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  #drawEnemies(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    ctx.lineWidth = 2;
    for (const enemy of this.enemies) {
      const screenX = (enemy.x - offsetX) * TILE_SIZE;
      const screenY = (enemy.y - offsetY) * TILE_SIZE;
      ctx.fillStyle = enemy.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.36, 0, Math.PI * 2);
      ctx.stroke();

      const ratio = clamp(enemy.health / ENEMY_BASE_HEALTH, 0, 1);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(
        screenX - TILE_SIZE * 0.3,
        screenY - TILE_SIZE * 0.5,
        TILE_SIZE * 0.6,
        TILE_SIZE * 0.12
      );
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(
        screenX - TILE_SIZE * 0.3,
        screenY - TILE_SIZE * 0.5,
        TILE_SIZE * 0.6 * ratio,
        TILE_SIZE * 0.12
      );
    }
  }

  #drawProjectiles(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    for (const projectile of this.projectiles) {
      const screenX = (projectile.x - offsetX) * TILE_SIZE;
      const screenY = (projectile.y - offsetY) * TILE_SIZE;
      ctx.fillStyle = BULLET_COLOR;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const projectile of this.enemyProjectiles) {
      const screenX = (projectile.x - offsetX) * TILE_SIZE;
      const screenY = (projectile.y - offsetY) * TILE_SIZE;
      ctx.fillStyle = ENEMY_BULLET_COLOR;
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawPickups(ctx) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);

    for (const pickup of this.pickups) {
      const screenX = (pickup.x - offsetX) * TILE_SIZE;
      const screenY = (pickup.y - offsetY) * TILE_SIZE;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
      ctx.beginPath();
      ctx.arc(screenX, screenY, TILE_SIZE * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  #drawSlowField(ctx, field) {
    const viewWidth = Math.ceil(this.canvas.width / TILE_SIZE);
    const viewHeight = Math.ceil(this.canvas.height / TILE_SIZE);
    const offsetX = Math.floor(this.player.x - viewWidth / 2);
    const offsetY = Math.floor(this.player.y - viewHeight / 2);
    const screenX = (field.x - offsetX) * TILE_SIZE;
    const screenY = (field.y - offsetY) * TILE_SIZE;
    const alpha = clamp(1 - field.age / field.duration, 0, 1) * 0.4;
    ctx.fillStyle = `rgba(96, 165, 250, ${alpha})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, field.radius * TILE_SIZE, 0, Math.PI * 2);
    ctx.fill();
  }

  #isInSlowField(x, y) {
    if (!this.slowFields) return false;
    return this.slowFields.some((field) => Math.hypot(field.x - x, field.y - y) < field.radius);
  }
}
