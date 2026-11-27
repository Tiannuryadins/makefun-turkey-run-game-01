// Capture Gobble Dash screenshots + a real-time autopilot play-test in headless
// Chrome via playwright-core (from the npx cache, as previous entries did).
// Run from the repo root. Serves game/ on 127.0.0.1:8081 — start
// `node serve.ts --port 8081` first.
const { chromium } = require('/home/hatch/.npm/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const { join, resolve } = require('node:path');
const { statSync, readFileSync } = require('node:fs');

const here = resolve(__dirname);
const BASE = 'http://127.0.0.1:8081';
const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({
    executablePath: '/home/hatch/cft-dl/chrome-linux64/chrome',
    args: ['--no-sandbox', '--disable-gpu', '--force-color-profile=srgb'],
  });
  const errors = [];
  // --- Screenshots ---
  for (const shot of shots) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(`pageerror ${shot.name}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console ${shot.name}: ${m.text()}`); });
    await page.goto(`${BASE}/${shot.query}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__shotReady === true, null, { timeout: 30000 });
    const out = join(here, 'screenshots', shot.name);
    await page.screenshot({ path: out, type: 'jpeg', quality: 82 });
    const size = statSync(out).size;
    console.log('SHOT_OK', shot.name, `${size} bytes`, size <= 262144 ? 'UNDER_256K' : 'OVER_256K!');
    await page.close();
  }
  // --- Real-time play-test: start a run, play with keyboard, report the state ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', (e) => errors.push(`pageerror playtest: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`console playtest: ${m.text()}`); });
    await page.goto(`${BASE}/?seed=7`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    console.log('PLAYTEST title screen:', await page.evaluate(() => window.__game.screen()));
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    console.log('PLAYTEST after Enter:', await page.evaluate(() => window.__game.screen()));
    // Play 25 s: jump on a timer, slide sometimes, gobble sometimes.
    const t0 = Date.now();
    let jumps = 0;
    while (Date.now() - t0 < 25000) {
      const state = await page.evaluate(() => {
        const w = window.__game.world;
        return { screen: window.__game.screen(), lives: w.lives, dist: Math.floor(w.distanceM), gap: Math.round(w.farmerGap), score: Math.floor(w.score), phase: w.phase };
      });
      if (state.screen !== 'play') {
        console.log('PLAYTEST left play:', JSON.stringify(state));
        if (state.screen === 'shop') {
          await page.keyboard.press('Enter');
          await page.waitForTimeout(300);
          continue;
        }
        break;
      }
      // Simple live pilot: look at the next obstacle via the debug handle.
      const move = await page.evaluate(() => {
        const w = window.__game.world;
        const p = w.player;
        if (w.farmerGap < 90 && w.gobbleCharge >= 34) return 'gobble';
        const next = w.obstacles.filter((o) => !o.passed && o.x + o.width > p.x - 10).sort((a, b) => a.x - b.x)[0];
        if (!next) return 'sprint';
        const gap = next.x - (p.x + p.width);
        if (next.kind === 'knife' || next.kind === 'branch') return gap < 200 ? 'slide' : 'sprint';
        if (next.kind === 'oven') {
          const threshold = w.ovenFlameOn(next) ? 60 : 90;
          return gap < threshold && p.onGround ? 'jump' : 'wait';
        }
        return gap < 90 && p.onGround ? 'jump' : 'sprint';
      });
      if (move === 'jump') { await page.keyboard.press('ArrowUp'); jumps += 1; }
      else if (move === 'gobble') { await page.keyboard.press('KeyG'); }
      else if (move === 'slide') { await page.keyboard.down('ArrowDown'); await page.waitForTimeout(220); await page.keyboard.up('ArrowDown'); }
      else if (move === 'sprint') { await page.keyboard.down('Shift'); await page.waitForTimeout(120); await page.keyboard.up('Shift'); }
      await page.waitForTimeout(90);
    }
    const final = await page.evaluate(() => {
      const w = window.__game.world;
      return { screen: window.__game.screen(), lives: w.lives, dist: Math.floor(w.distanceM), zone: w.zoneIndex, score: Math.floor(w.score), corn: w.corn, jumps: w.stats.jumps, gobbles: w.stats.gobbles, phase: w.phase };
    });
    console.log('PLAYTEST final:', JSON.stringify(final), 'keys jumps:', jumps);
    await page.close();
  }
  console.log(errors.length ? `ERRORS (${errors.length}):\n${errors.join('\n')}` : 'NO_ERRORS');
  await browser.close();
})().catch((e) => { console.error('CAPTURE_FAILED', e); process.exit(1); });
