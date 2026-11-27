# Winner calibration — what made recent game winners win (read before building)

Sources: the game playbook (`~/workspace/make-fun/game-playbook.md`), the loss
diagnosis (`~/workspace/make-fun/loss-diagnosis-20261124.md` §5), and the
competition brief. No winner repo is public (make.fun entry code is private),
so these are drawn from the official winner descriptions + the judge's stated
mechanism: **an AI judge compares games two at a time by screenshots + a source
outline only. It never plays the game and never hears sound.**

## 1. WAGGLE — @europa-nova, best-card-game winner ($12, judge win rate 86.4%)

**What won:** the entry's title itself was a dense enumeration of specific
systems — "Drawn bee, hornet and dragonfly cards, royal queens, 4 suits on a
counter wheel, combos, weather, a rival that reads you back, hint search,
campaign boons". Every named system was a real, interacting mechanic (the 4
suits sit on a counter wheel, i.e. suits change decisions; the rival AI adapts
to the player's habits), and the dossier named each one. Our card game lost
with 12 vanilla cards and 4 purely cosmetic suits.

**Gobble Dash's match:** the title screen enumerates all five systems by name
(3 zones, farmer pursuit + gobble, 5 pickups with distinct effects, 8 hazards
each with its own beat, Rest Stop shop); the dossier's file/function names
(`gobble()`, `buyUpgrade()`, `knifeBladeY()`, `ovenFlameOn()`) expose the same
systems in the source outline. Suits-equivalent: hazards are not cosmetic —
each has a different beat (jump / slide / time) that changes the decision.

## 2. The news-image winners (@superskie, 3 wins in a row; @bagarte)

**What won:** visual density and layering in a single screenshot — 3 big leads
each with a full scene illustration, rows of illustrated cards, a dotted world
map, a 15–25 line index, a "by the numbers" strip. Our posters lost with 13
text-only cards, zero real illustration, half-empty cards and big white space.
The judge reads a screenshot as a picture editor: a dense, finished-looking
frame beats a sparse one even when the sparse game is fine.

**Gobble Dash's match:** every screenshot is staged dense — the play shot has
the turkey mid-jump over a fence, corn arcs, a swinging knife, the farmer
visible at the left edge, a full HUD (score, distance, corn, 5 hearts, stamina
and gobble bars, zone, pursuit meter, freedom progress) and a parallax farm
(barn, silo, fences, grass, clouds). No big empty areas; the title shot lists
all features and controls in a filled panel.

## 3. The "finished game, not prototype" bar (best-game-01 Beaconkeeper + the 4 unranked games)

**What won / what lost:** our four unranked games (stealth, heist,
spot-the-difference, card) all had a complete loop + animations + a verified
demo — and still ranked nowhere. The diagnosis: "loop complete + animation +
demo verified" is the **floor**, not the differentiator; the differentiator is
≥3 of the 5 dimensions (system depth, content variety, original hook, visual
density, progression). Beaconkeeper (best-game-01) cleared the floor with a
2,329-line build, a storm system and a verified 8/8 autopilot win.

**Gobble Dash's match (4 of 5 dimensions):**
- **System depth:** stamina/sprint economy, gobble scare + farmer pursuit AI,
  oven flame timing, shield/invulnerability, slow-mo + speed-burst timers.
- **Content variety:** 8 hazards × 3 zones with different mixes, 5 pickups
  with different effects, 3 shop upgrades.
- **Original hook:** "the turkey fights back — gobble to scare the farmer",
  plus the farmer-pursuit meter as a second lose condition beside lives.
- **Progression:** 3 zones with new palettes/hazards, a shop between zones,
  best-score persistence, an escape ending distinct from a caught ending.
- **Visual density:** see point 2.
