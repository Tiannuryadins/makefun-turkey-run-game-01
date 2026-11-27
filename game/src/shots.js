// Screenshot staging behind ?shot=title|play|shop|end. Each scene plays the real
// rules forward from a fresh world for a fixed time, steered by an autopilot that
// looks at the next obstacle and picks jump / slide / stay, so every frame is what
// a real run looks like — and the same seed always gives the same frame.
import { GROUND_Y, STEP } from './config.js';
import { EVENT_ESCAPED, EVENT_OVER, EVENT_SHOP, PHASE_ESCAPED, PHASE_OVER, PHASE_SHOP } from './world.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE } from './render.js';

const TITLE_SECONDS = 2;
const PLAY_SECONDS = 21;
const SHOP_LIMIT_SECONDS = 400;
const END_LIMIT_SECONDS = 900;

/** The autopilot's move for the next obstacle ahead of the turkey. */
function autopilot(world) {
  const p = world.player;
  const ahead = world.obstacles
    .filter((o) => !o.passed && o.x + o.width > p.x - 10)
    .sort((a, b) => a.x - b.x)[0];
  if (!ahead) return { jump: false, slide: false, sprint: true, gobble: false };
  const gap = ahead.x - (p.x + p.width);
  const speed = world.speed();
  const timeTo = gap / Math.max(1, speed);
  // Jump timing (measured, not guessed): with jump velocity -950 and gravity
  // 2000 the turkey is high enough for 0.8 s, so start the jump when the
  // obstacle is ~90 px out — jumping at 175 px lands on it.
  if (ahead.kind === 'hay' || ahead.kind === 'knife' || ahead.kind === 'branch') {
    if (ahead.kind === 'hay') return { jump: gap < 90 && p.onGround, slide: false, sprint: timeTo > 0.9, gobble: false };
    return { jump: false, slide: gap < 200, sprint: false, gobble: false };
  }
  if (ahead.kind === 'puddle') {
    return { jump: gap < 150 && p.onGround, slide: false, sprint: false, gobble: false };
  }
  if (ahead.kind === 'oven') {
    const flameOn = world.ovenFlameOn(ahead);
    // Jump a cold oven at 90 px; a lit one needs the later, higher jump.
    const threshold = flameOn ? 60 : 90;
    return { jump: gap < threshold && p.onGround, slide: false, sprint: false, gobble: false };
  }
  // fence / log / scarecrow: jump.
  return { jump: gap < 90 && p.onGround, slide: false, sprint: timeTo > 0.9, gobble: false };
}

/**
 * Set `world` to the named scene and return the screen to draw and the best
 * score to show. The play pilot sprints when clear; the end pilot plays well
 * enough to escape, so the end shot shows the ESCAPED screen.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'shop' && name !== 'end') {
    for (let i = 0; i < TITLE_SECONDS / STEP; i += 1) world.step(STEP, { jump: false, slide: false, sprint: false, gobble: false });
    return { screen: SCREEN_TITLE, best: 1250, scroll: world.distanceM * 2.2 };
  }
  if (name === 'play') {
    for (let i = 0; i < PLAY_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world));
      if (events & EVENT_OVER) break;
      // A shop can open mid-shot (zone boundary at 1200 m): keep running.
      if (world.phase === PHASE_SHOP) world.leaveShop();
    }
    return { screen: SCREEN_PLAY, best: 1250, scroll: world.distanceM * 2.2 };
  }
  if (name === 'shop') {
    for (let i = 0; i < SHOP_LIMIT_SECONDS / STEP; i += 1) {
      const events = world.step(STEP, autopilot(world));
      if (events & EVENT_SHOP) break;
      if (events & EVENT_OVER) break;
    }
    if (world.phase === PHASE_SHOP) return { screen: SCREEN_SHOP, best: 1250, scroll: world.distanceM * 2.2 };
    return { screen: SCREEN_PLAY, best: 1250, scroll: world.distanceM * 2.2 };
  }
  // end: play to the Freedom Gate, shopping on the way like a real player.
  for (let i = 0; i < END_LIMIT_SECONDS / STEP; i += 1) {
    const events = world.step(STEP, autopilot(world));
    if (events & (EVENT_OVER | EVENT_ESCAPED)) break;
    if (world.phase === PHASE_SHOP) {
      // Buy the cheapest upgrade the run can afford, then keep running.
      for (const item of ['boots', 'heart', 'horn']) {
        if (world.buyUpgrade(item)) break;
      }
      world.leaveShop();
    }
  }
  if (world.phase === PHASE_ESCAPED) return { screen: SCREEN_ESCAPED, best: 1250, scroll: world.distanceM * 2.2 };
  if (world.phase === PHASE_OVER) return { screen: SCREEN_OVER, best: 1250, scroll: world.distanceM * 2.2 };
  return { screen: SCREEN_PLAY, best: 1250, scroll: world.distanceM * 2.2 };
}
