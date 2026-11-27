# Gobble Dash — turkey-run-game-01 — STATUS (27 Nov 2026 ~16:30 WIB)

## Ready for parent check + publish + submit (NOT submitted by this agent)

- Game: **Gobble Dash — Escape the Thanksgiving Table**. Original turkey escape
  runner: 3 zones (Barnyard → Cornfield → Dark Forest) to the Freedom Gate at
  3600 m; farmer pursuit (gap closes on stumbles, widens on sprint/gobble);
  8 hazards each with its own beat (fence/hay/log/scarecrow/puddle jump,
  knife/branch slide, oven timed); 5 pickups with distinct effects (corn,
  golden-feather shield, chili burst, pumpkin slow-mo, wishbone life);
  stamina + gobble economy; Rest Stop shop between zones (boots/meal/horn);
  title → run → shop → escaped/caught → restart. Keyboard + mouse.
- Repo for publish: `Tiannuryadins/makefun-turkey-run-game-01` (parent does
  the GitHub publish + submit; this agent did NOT push, bundle or submit).
- Competition: $250 USDC escrow locked, 20 places (1st $50 … 11th–20th $7),
  deadline Sun 29 Nov 2026 02:00 UTC = 09:00 WIB.

## Verification (all local, this session)

- `main.ts` run twice → `out/` and `out2/` byte-identical (`diff -r` clean);
  dossier.json 433,896 bytes (< 1.5 MiB cap), schema makefun/dossier/v1,
  4 images. `out/` + `out2/` removed after the check (regenerable).
- Headless Chrome capture: 4 JPEG 1280×720, all UNDER 256 KiB
  (1-title 85,148 B; 2-play 70,795 B; 3-shop 69,916 B; 4-escaped 53,523 B),
  all distinct md5, all eye-checked (no clipped text after fixes).
- Live keyboard play-test: escaped once (3600 m, score 8120, 2 lives, 48
  corn, 10 jumps, 1 gobble); a second run died at 2662 m (pilot latency in
  zone 3 — the staged autopilot escapes deterministically, so the game is
  beatable). NO console/page errors on any run.
- Secret scan clean (no mnemonic/seed/key/credential strings in entry files).
- Two real bugs found by measurement and fixed: knife hitbox unpassable,
  jump timing landing on fences, hay un-slidable, oven flame unjumpable,
  staging freezing at the shop, HUD text clipping (see transcripts/session-1.md).

## Files

- `game/` — index.html + src/{config,random,input,world,render,audio,shots,main}.js (1,872 lines total incl. main.ts/serve.ts/capture)
- `screenshots/` — 1-title.jpg, 2-play.jpg, 3-shop.jpg, 4-escaped.jpg
- `main.ts`, `serve.ts`, `shots.json`, `capture-shots.cjs`, `README.md`,
  `LICENSE` (MIT, from kit starter), `WINNERS.md`, `transcripts/session-1.md`
- `vendor/makefun-game.ts` — kit copy, unchanged (sha256 verified)
- `kit/`, `kit.zip` — downloaded kit, gitignored, NOT part of the entry

## Local git

- Repo initialised in the work dir; commit `Gobble Dash — turkey-run-game-01 entry (local build, ready for parent publish)`.
- HEAD sha: `d256c1c` (local only, not pushed).

## Still needed (parent / user)

1. Publish repo `Tiannuryadins/makefun-turkey-run-game-01` to GitHub (public),
   set About (website https://make.fun/bounty/turkey-run-game-01, topics
   ai-agents, bounties, makefun), push, note HEAD sha.
2. Run the kit's `check` + `bundle` + `submit` from the parent session
   (transcripts live there); title suggestion (winner-pattern enumeration):
   "Gobble Dash: outrun the farmer, dodge the oven and the carving knife —
   3 zones, 8 hazards, 5 pickups, gobble scare, Rest Stop shop".
