// Gobble Dash — entry point: the loop, the screens, input wiring, the HUD's
// data, and the hooks the screenshot stager and the self-test use.
// Title -> run -> Rest Stop shop (between zones) -> escaped / caught -> restart.
import { STEP } from './config.js';
import { World, EVENT_ESCAPED, EVENT_HIT, EVENT_PICKUP, EVENT_SHOP, EVENT_ZONE, PHASE_ESCAPED, PHASE_OVER, PHASE_SHOP } from './world.js';
import { render, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_SHOP, SCREEN_TITLE } from './render.js';
import { ACTIONS, attachInput, clearPresses, consumePress } from './input.js';
import { ensureAudio, sfx } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '7') >>> 0;

const world = new World(seed);
let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number(window.localStorage.getItem('gobble-dash-best') || '0') || 0;
} catch {
  best = 0;
}
let scroll = 0;
let shotReady = false;
let lastFrame = performance.now();
let accumulator = 0;

function saveBest() {
  if (world.score > best) {
    best = Math.floor(world.score);
    try {
      window.localStorage.setItem('gobble-dash-best', String(best));
    } catch {
      // Best score is a nicety; storage may be unavailable.
    }
  }
}

function setStatus(line) {
  if (statusEl) statusEl.textContent = line;
}

function startRun() {
  ensureAudio();
  world.reset();
  screen = SCREEN_PLAY;
  scroll = 0;
  setStatus('Running! Jump the fences, slide under the knives, gobble to scare the farmer.');
  sfx('zone');
}

function handleClick(x, y) {
  ensureAudio();
  if (screen === SCREEN_TITLE) {
    if (x >= 490 && x <= 790 && y >= 510 && y <= 566) startRun();
    return;
  }
  if (screen === SCREEN_SHOP) {
    // Shop cards: three cards at x 290/530/770, y 230..420; continue button y 460..516.
    const cards = [290, 530, 770];
    for (let i = 0; i < cards.length; i += 1) {
      if (x >= cards[i] && x <= cards[i] + 220 && y >= 230 && y <= 420) {
        if (world.buyUpgrade(['boots', 'heart', 'horn'][i])) sfx('pickup');
        return;
      }
    }
    if (x >= 490 && x <= 790 && y >= 460 && y <= 516) {
      world.leaveShop();
      screen = SCREEN_PLAY;
      sfx('zone');
    }
    return;
  }
  if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) {
    if (x >= 490 && x <= 790 && y >= 510 && y <= 566) startRun();
    return;
  }
  // In play, a click jumps.
  if (screen === SCREEN_PLAY) {
    queueJump = true;
  }
}

let queueJump = false;

attachInput(canvas, handleClick);

function frame(now) {
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  accumulator += dt;
  let steps = 0;
  while (accumulator >= STEP && steps < 10) {
    accumulator -= STEP;
    steps += 1;
    tick();
  }
  if (steps === 10) accumulator = 0;
  render(ctx, world, screen, best, scroll);
  requestAnimationFrame(frame);
}

function tick() {
  if (screen === SCREEN_TITLE) {
    world.time += STEP;
    scroll += 40 * STEP;
    if (consumePress('confirm') || consumePress('jump')) startRun();
    return;
  }
  if (screen === SCREEN_SHOP) {
    if (consumePress('confirm')) {
      world.leaveShop();
      screen = SCREEN_PLAY;
      sfx('zone');
      return;
    }
    return;
  }
  if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) {
    if (consumePress('restart') || consumePress('confirm') || consumePress('jump')) startRun();
    return;
  }
  // Play.
  const input = {
    jump: consumePress('jump') || queueJump,
    slide: ACTIONS.slide,
    sprint: ACTIONS.sprint,
    gobble: consumePress('gobble'),
  };
  queueJump = false;
  if (input.gobble) {
    if (world.gobble()) sfx('gobble');
  }
  const events = world.step(STEP, input);
  scroll += world.speed() * STEP;
  if (events & EVENT_PICKUP) sfx('pickup');
  if (events & EVENT_HIT) sfx('hit');
  if (events & EVENT_ZONE) sfx('zone');
  if (events & EVENT_ESCAPED) sfx('escape');
  if (events & EVENT_SHOP) {
    screen = SCREEN_SHOP;
    setStatus('Rest Stop! Spend corn, then keep running.');
    return;
  }
  if (world.phase === PHASE_OVER) {
    screen = SCREEN_OVER;
    saveBest();
    setStatus('Caught! Press R to run again.');
    return;
  }
  if (world.phase === PHASE_ESCAPED) {
    screen = SCREEN_ESCAPED;
    saveBest();
    setStatus('Escaped! You reached the Freedom Gate. Press R to run again.');
  }
}

// Number-key buys in the shop (Digit1/2/3 are not in input.js's KEYMAP).
window.addEventListener('keydown', (event) => {
  if (screen !== SCREEN_SHOP) return;
  const index = ['Digit1', 'Digit2', 'Digit3'].indexOf(event.code);
  if (index >= 0 && world.buyUpgrade(['boots', 'heart', 'horn'][index])) sfx('pickup');
});

// Screenshot staging: ?shot=title|play|shop|end stages the real world.
const shot = params.get('shot');
if (shot) {
  const staged = stageShot(shot, world);
  screen = staged.screen;
  scroll = staged.scroll;
  best = Math.max(best, staged.best);
  if (screen === SCREEN_PLAY || screen === SCREEN_SHOP) {
    // Keep the HUD honest: the staged world is mid-run.
  }
  render(ctx, world, screen, best, scroll);
  shotReady = true;
  window.__shotReady = true;
} else {
  window.__shotReady = false;
  requestAnimationFrame(frame);
}

// Debug + test hooks (used by the capture script, never by the game itself).
window.__game = {
  world,
  screen: () => screen,
  best: () => best,
  start: startRun,
  stage: (name) => {
    const staged = stageShot(name, world);
    screen = staged.screen;
    scroll = staged.scroll;
    render(ctx, world, screen, best, scroll);
    return { screen, score: world.score, distance: world.distanceM, lives: world.lives, phase: world.phase };
  },
};
