// Gobble Dash world: the run itself — spawning, physics, the farmer's pursuit,
// collisions, pickups, zones, the Rest Stop shop and the win/lose conditions.
// Rendering lives in render.js; this file only decides what is true.
import {
  FARMER, GOBBLE, GROUND_Y, HAZARDS, PICKUPS, PLAYER, PX_PER_M, SCORE,
  SHOP, STAMINA, STEP, ZONE_LENGTH_M, ZONES, ESCAPE_DISTANCE_M,
} from './config.js';
import { makeRng, pick, range } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_HIT = 1 << 0;
export const EVENT_PICKUP = 1 << 1;
export const EVENT_ZONE = 1 << 2;
export const EVENT_OVER = 1 << 3;
export const EVENT_ESCAPED = 1 << 4;
export const EVENT_SHOP = 1 << 5;
export const EVENT_GOBBLE = 1 << 6;

export const PHASE_RUN = 'run';
export const PHASE_SHOP = 'shop';
export const PHASE_OVER = 'over';
export const PHASE_ESCAPED = 'escaped';

let nextId = 1;

function makeObstacle(kind, x, rng) {
  const def = HAZARDS[kind];
  const obstacle = {
    id: nextId, kind, x, y: GROUND_Y - def.height,
    width: def.width, height: def.height, passed: false,
  };
  if (kind === 'knife') {
    // A carving knife on a rope: it swings down and up on a timer.
    obstacle.swingPeriod = range(rng, 1.5, 2.2);
    obstacle.swingPhase = rng() * Math.PI * 2;
    obstacle.y = GROUND_Y - def.height;
  }
  if (kind === 'oven') {
    // The oven's flame cycles: on (deadly to jump over) then off (safe).
    obstacle.flamePeriod = range(rng, 1.8, 2.6);
    obstacle.flamePhase = rng() * Math.PI * 2;
  }
  if (kind === 'branch') {
    // A low branch hangs high: its bar sits at y 522..560, above a sliding
    // turkey's head (564) but in the path of a standing one.
    obstacle.y = GROUND_Y - 78;
  }
  return obstacle;
}

function makePickup(kind, x, y) {
  return { id: nextId, kind, x, y, width: 34, height: 34, taken: false, bob: 0 };
}

export class World {
  constructor(seed) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    nextId = 1;
    this.rng = makeRng(this.seed);
    this.time = 0;
    this.distanceM = 0;
    this.score = 0;
    this.corn = 0;
    this.lives = PLAYER.startLives;
    this.stamina = STAMINA.max;
    this.gobbleCharge = GOBBLE.maxCharge;
    this.farmerGap = FARMER.startGap;
    this.farmerScared = 0;
    this.phase = PHASE_RUN;
    this.zoneIndex = 0;
    this.zoneBanner = 0;
    this.speedBoost = 0;
    this.slowMo = 0;
    this.shield = false;
    this.upgrades = { boots: 0, heart: 0, horn: 0 };
    this.speedMul = 1;
    this.player = {
      x: 260, y: GROUND_Y - PLAYER.height,
      width: PLAYER.width, height: PLAYER.height,
      vy: 0, onGround: true, sliding: false, slideTimer: 0,
      invulnerable: 0, runCycle: 0, stumble: 0,
    };
    this.obstacles = [];
    this.pickups = [];
    this.particles = [];
    this.events = [];
    this.lastEvent = EVENT_NONE;
    this.spawnX = 1400;
    this.stats = { jumps: 0, gobbles: 0, cornEaten: 0, hits: 0, zone: 0 };
    this.shopHover = -1;
    this.spawnInitial();
  }

  zone() {
    return ZONES[Math.min(this.zoneIndex, ZONES.length - 1)];
  }

  speed() {
    const base = this.zone().speed * this.speedMul;
    const boost = this.speedBoost > 0 ? 1.45 : 1;
    return base * boost;
  }

  spawnInitial() {
    // Opening stretch: a fence to teach jumping, corn to teach collecting.
    this.obstacles.push(makeObstacle('fence', 900, this.rng));
    for (let i = 0; i < 4; i += 1) {
      this.pickups.push(makePickup('corn', 700 + i * 52, GROUND_Y - 60));
    }
  }

  spawnAhead() {
    const zone = this.zone();
    const kind = pick(this.rng, zone.hazards);
    const gap = range(this.rng, zone.hazardGap[0], zone.hazardGap[1]);
    const x = this.spawnX + gap;
    this.obstacles.push(makeObstacle(kind, x, this.rng));
    // Corn trails: sometimes a low arc over a jumpable hazard, sometimes a line.
    if (this.rng() < 0.62) {
      const n = 3 + Math.floor(this.rng() * 3);
      const arc = kind === 'fence' || kind === 'log' || kind === 'oven';
      for (let i = 0; i < n; i += 1) {
        const px = x - 90 + i * 52;
        const py = arc ? GROUND_Y - 150 + Math.abs(i - (n - 1) / 2) * 34 : GROUND_Y - 60;
        this.pickups.push(makePickup('corn', px, py));
      }
    }
    // Rare special pickup, floating above the ground line.
    const roll = this.rng();
    if (roll < 0.05) this.pickups.push(makePickup('wishbone', x + 160, GROUND_Y - 170));
    else if (roll < 0.12) this.pickups.push(makePickup('feather', x + 160, GROUND_Y - 170));
    else if (roll < 0.19) this.pickups.push(makePickup('chili', x + 160, GROUND_Y - 170));
    else if (roll < 0.26) this.pickups.push(makePickup('pie', x + 160, GROUND_Y - 170));
    this.spawnX = x;
  }

  burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      this.particles.push({
        x, y, vx: range(this.rng, -160, 160), vy: range(this.rng, -260, -40),
        life: range(this.rng, 0.35, 0.8), maxLife: 0.8, color, size: range(this.rng, 3, 7),
      });
    }
  }

  hitObstacle(obstacle) {
    this.stats.hits += 1;
    this.lastEvent |= EVENT_HIT;
    this.events.push({ type: 'hit', kind: obstacle.kind, at: this.time });
    if (this.shield) {
      this.shield = false;
      this.player.invulnerable = 1.2;
      this.burst(this.player.x + 40, this.player.y + 30, '#ffd94a', 18);
      return;
    }
    this.lives -= 1;
    this.farmerGap -= FARMER.stumbleLoss;
    this.player.invulnerable = 1.5;
    this.player.stumble = 0.45;
    this.burst(this.player.x + 40, this.player.y + 30, '#ff5a4a', 22);
    if (this.lives <= 0) {
      this.phase = PHASE_OVER;
      this.lastEvent |= EVENT_OVER;
    }
  }

  takePickup(pickup) {
    pickup.taken = true;
    const def = PICKUPS[pickup.kind];
    this.score += def.score;
    this.lastEvent |= EVENT_PICKUP;
    this.events.push({ type: 'pickup', kind: pickup.kind, at: this.time });
    if (pickup.kind === 'corn') {
      this.corn += 1;
      this.stats.cornEaten += 1;
      this.stamina = Math.min(STAMINA.max, this.stamina + STAMINA.cornRestore);
      this.burst(pickup.x, pickup.y, '#ffd94a', 8);
    } else if (pickup.kind === 'feather') {
      this.shield = true;
      this.burst(pickup.x, pickup.y, '#ffe98a', 14);
    } else if (pickup.kind === 'chili') {
      this.speedBoost = 2.2;
      this.burst(pickup.x, pickup.y, '#ff6a2a', 14);
    } else if (pickup.kind === 'pie') {
      this.slowMo = 3;
      this.burst(pickup.x, pickup.y, '#e8a04a', 14);
    } else if (pickup.kind === 'wishbone') {
      this.lives = Math.min(PLAYER.maxLives, this.lives + 1);
      this.burst(pickup.x, pickup.y, '#fff2c9', 18);
    }
  }

  gobble() {
    if (this.phase !== PHASE_RUN || this.gobbleCharge < GOBBLE.cost) return false;
    this.gobbleCharge -= GOBBLE.cost;
    this.farmerGap += FARMER.gobbleGain;
    this.farmerScared = GOBBLE.scareSeconds;
    this.stats.gobbles += 1;
    this.lastEvent |= EVENT_GOBBLE;
    this.events.push({ type: 'gobble', at: this.time });
    this.burst(this.player.x + 70, this.player.y + 10, '#ffb84a', 16);
    return true;
  }

  buyUpgrade(id) {
    const item = SHOP.find((entry) => entry.id === id);
    if (!item || this.phase !== PHASE_SHOP) return false;
    if (this.upgrades[id] >= item.max || this.corn < item.cost) return false;
    this.corn -= item.cost;
    this.upgrades[id] += 1;
    if (id === 'boots') this.speedMul = 1 + 0.12 * this.upgrades.boots;
    if (id === 'heart') this.lives = Math.min(PLAYER.maxLives, this.lives + 1);
    return true;
  }

  leaveShop() {
    this.phase = PHASE_RUN;
    this.zoneBanner = 2.2;
    this.obstacles = [];
    this.pickups = [];
    this.spawnX = 1400;
    this.spawnInitial();
  }

  overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  }

  knifeBladeY(obstacle) {
    // The blade hangs from a rope and swings: its low point stops at y=495, so
    // its 64 px blade bottoms out at 559 — a sliding turkey (top 564) always
    // clears it, while a turkey running through standing gets cut when the
    // blade is low. Slide under it; never run through it.
    const swing = Math.sin((this.time / obstacle.swingPeriod) * Math.PI * 2 + obstacle.swingPhase);
    return 430 + (swing * 0.5 + 0.5) * 65;
  }

  ovenFlameOn(obstacle) {
    const cycle = ((this.time / obstacle.flamePeriod) + obstacle.flamePhase / (Math.PI * 2)) % 1;
    return cycle < 0.55;
  }

  step(dt, input) {
    this.lastEvent = EVENT_NONE;
    if (this.phase !== PHASE_RUN) return this.lastEvent;
    const scaledDt = this.slowMo > 0 ? dt * 0.55 : dt;
    this.time += scaledDt;
    if (this.slowMo > 0) this.slowMo -= dt;
    if (this.speedBoost > 0) this.speedBoost -= dt;
    if (this.zoneBanner > 0) this.zoneBanner -= dt;

    const p = this.player;
    const sprinting = input.sprint && this.stamina > 0 && p.onGround && p.stumble <= 0;
    const speed = this.speed() * (sprinting ? PLAYER.sprintSpeed / PLAYER.runSpeed : 1);

    // Stamina: sprint drains, corn and rest restore.
    if (sprinting) this.stamina = Math.max(0, this.stamina - STAMINA.sprintDrainPerSecond * dt);
    else this.stamina = Math.min(STAMINA.max, this.stamina + STAMINA.regenPerSecond * dt);
    // Gobble charge regens, faster with the horn upgrade.
    const hornMul = 1 + 0.5 * this.upgrades.horn;
    this.gobbleCharge = Math.min(GOBBLE.maxCharge, this.gobbleCharge + GOBBLE.regenPerSecond * hornMul * dt);

    // Jump / slide.
    if (input.jump && p.onGround && p.stumble <= 0) {
      p.vy = PLAYER.jumpVelocity;
      p.onGround = false;
      p.sliding = false;
      this.stats.jumps += 1;
    }
    if (input.slide && p.onGround) {
      p.sliding = true;
      p.slideTimer = 0.55;
    }
    if (p.slideTimer > 0) {
      p.slideTimer -= dt;
      if (p.slideTimer <= 0) p.sliding = false;
    }
    p.vy += PLAYER.gravity * scaledDt;
    p.y += p.vy * scaledDt;
    if (p.y >= GROUND_Y - p.height) {
      p.y = GROUND_Y - p.height;
      p.vy = 0;
      p.onGround = true;
    }
    p.height = p.sliding ? PLAYER.slideHeight : PLAYER.height;
    if (p.sliding) p.y = GROUND_Y - p.height;
    if (p.stumble > 0) p.stumble -= dt;
    if (p.invulnerable > 0) p.invulnerable -= dt;
    p.runCycle += (speed / 60) * dt;

    // Distance, score and the farmer's pursuit.
    const metres = (speed * scaledDt) / PX_PER_M;
    this.distanceM += metres;
    this.score += metres * SCORE.perMetre;
    let creep = FARMER.creepPerSecond;
    if (this.farmerScared > 0) {
      creep = GOBBLE.scaredCreepPerSecond;
      this.farmerScared -= dt;
    }
    this.farmerGap -= creep * dt;
    if (sprinting) this.farmerGap += FARMER.sprintGainPerSecond * dt;
    this.farmerGap = Math.min(420, this.farmerGap);
    if (this.farmerGap <= FARMER.catchGap) {
      this.phase = PHASE_OVER;
      this.lastEvent |= EVENT_OVER;
      this.events.push({ type: 'caught', at: this.time });
      return this.lastEvent;
    }

    // Scroll the world left; spawn ahead of the camera.
    const scroll = speed * scaledDt;
    for (const obstacle of this.obstacles) obstacle.x -= scroll;
    for (const pickup of this.pickups) pickup.x -= scroll;
    this.spawnX -= scroll;
    if (this.spawnX < 1280 + 320) this.spawnAhead();
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -80);
    this.pickups = this.pickups.filter((u) => u.x + u.width > -80 && !u.taken);

    // Collisions.
    const box = { x: p.x + 8, y: p.y + 4, width: p.width - 16, height: p.height - 6 };
    for (const obstacle of this.obstacles) {
      if (obstacle.passed || obstacle.x + obstacle.width < p.x) {
        if (!obstacle.passed && obstacle.x + obstacle.width < p.x) {
          obstacle.passed = true;
          this.score += 10;
        }
        continue;
      }
      let hitBox = { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height };
      if (obstacle.kind === 'knife') {
        const bladeY = this.knifeBladeY(obstacle);
        hitBox = { x: obstacle.x, y: bladeY, width: obstacle.width, height: 64 };
      }
      if (obstacle.kind === 'puddle') {
        if (this.overlaps(box, hitBox) && p.onGround) {
          // A slip, not a hit: the farmer gains and the turkey stumbles.
          this.farmerGap -= FARMER.slipLoss;
          p.stumble = 0.4;
          this.burst(p.x + 30, GROUND_Y - 6, '#8a6b3f', 10);
          obstacle.passed = true;
        }
        continue;
      }
      if (obstacle.kind === 'oven' && this.ovenFlameOn(obstacle)) {
        // Flame on: the fire licks 12 px above the oven — a full, well-timed
        // jump still clears it (apex 226 px), a late jump burns.
        hitBox = { x: obstacle.x - 6, y: obstacle.y - 12, width: obstacle.width + 12, height: obstacle.height + 12 };
      }
      if (p.invulnerable <= 0 && this.overlaps(box, hitBox)) {
        this.hitObstacle(obstacle);
        obstacle.passed = true;
        if (this.phase !== PHASE_RUN) return this.lastEvent;
      }
    }
    for (const pickup of this.pickups) {
      if (!pickup.taken && this.overlaps(box, pickup)) this.takePickup(pickup);
    }

    // Particles.
    for (const particle of this.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 500 * dt;
      particle.life -= dt;
    }
    this.particles = this.particles.filter((particle) => particle.life > 0);

    // Zone changes and the escape.
    if (this.distanceM >= ESCAPE_DISTANCE_M) {
      this.phase = PHASE_ESCAPED;
      this.score += SCORE.escapeBonus;
      this.lastEvent |= EVENT_ESCAPED;
      this.events.push({ type: 'escaped', at: this.time });
      return this.lastEvent;
    }
    const zoneIndex = Math.min(Math.floor(this.distanceM / ZONE_LENGTH_M), ZONES.length - 1);
    if (zoneIndex > this.zoneIndex) {
      this.zoneIndex = zoneIndex;
      this.stats.zone = zoneIndex;
      this.score += SCORE.zoneBonus;
      this.zoneBanner = 2.4;
      this.lastEvent |= EVENT_ZONE;
      this.events.push({ type: 'zone', zone: zoneIndex, at: this.time });
      if (zoneIndex < ZONES.length) {
        this.phase = PHASE_SHOP;
        this.lastEvent |= EVENT_SHOP;
      }
    }
    return this.lastEvent;
  }
}
