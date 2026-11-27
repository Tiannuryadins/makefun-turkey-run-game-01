# Gobble Dash — Escape the Thanksgiving Table

[![turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/tiannuryadins/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/tiannuryadins/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01)

A turkey escape game for make.fun's
[Make the best turkey escape game](https://make.fun/bounty/turkey-run-game-01)
bounty ($250 USDC, 20 places paid, deadline Sun 29 Nov 2026 02:00 UTC).

## The game

You are a turkey on Thanksgiving morning. The farmer is coming, the oven is
lit and the carving knife is out. Run 3600 m through three zones — **Barnyard,
Cornfield, Dark Forest** — to the Freedom Gate, or be dinner.

- **Farmer pursuit:** the farmer gains on you whenever you stumble, slip or
  dawdle. Sprint (SHIFT) and **GOBBLE (G)** to scare him back — a second lose
  condition beside your 3 lives.
- **8 hazards, each with its own beat:** fences, logs, hay bales and
  scarecrows (jump); swinging carving knives and low branches (slide); mud
  puddles (jump or slip); ovens (jump only when the flame is out).
- **5 pickups, each a different decision:** corn (+score, +stamina), golden
  feather (shield vs one hit), chili pepper (speed burst), pumpkin pie
  (slow-mo 3 s), wishbone (+1 life).
- **Stamina + gobble economy:** sprinting drains stamina, corn restores it;
  gobbling costs charge that regens over time.
- **Rest Stop shop** between zones: spend corn on Swift Boots, Hearty Meals
  and a Louder Gobble Horn.
- **Title screen, HUD** (score, distance, corn, lives, stamina, gobble,
  farmer-pursuit meter, freedom progress), **escaped / caught end screens**
  with stats and restart.

## Controls

| Key / mouse | Action |
| --- | --- |
| ↑ / W / Space / click | Jump |
| ↓ / S | Slide |
| Shift | Sprint (drains stamina) |
| G / X | Gobble — scare the farmer back |
| Enter | Start / continue |
| R | Restart after an end screen |
| 1 / 2 / 3 (in the shop) | Buy an upgrade |

## Play it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open http://localhost:8080 in desktop Chrome. No network requests, no
assets, no build step — all art is drawn in code.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and
writes `dossier.json` with the vendored make.fun library
(`vendor/makefun-game.ts`, copied from the kit unchanged).

## Files

- `game/index.html` — the page; `game/src/` — one job per file:
  `config.js` (tuning, zones, hazards, pickups, shop), `random.js` (seeded
  RNG), `input.js` (keyboard + mouse), `world.js` (physics, farmer AI,
  collisions, shop), `render.js` (all canvas art, HUD, screens),
  `audio.js` (tiny WebAudio bleeps), `shots.js` (screenshot staging),
  `main.js` (loop, screens, hooks).
- `screenshots/` — 4 real renders of the game's own code (title, play, shop,
  escaped).
- `main.ts`, `serve.ts`, `shots.json`, `capture-shots.cjs` — hand-in, local
  server, shot list, headless capture + play-test.
- `WINNERS.md` — what recent game winners did, and what this entry matches.

## License

MIT — see `LICENSE`.
