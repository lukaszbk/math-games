# Family Math Arcade

A zero-build, static HTML/CSS/ES-module math arcade for elementary learners, featuring independent kid profiles, strict per-profile game assignment, six full games built on a shared XtraMath-style practice engine, synthesized Web Audio feedback, and a PIN-protected Parent Dashboard.

## Games Included

1. **Factors & Multiples** (3rd Grade — `#/game/factors-and-multiples`, assigned to `grade3`)
   - Formerly *Wings of Math*, with 43 collectible Wings of Fire dragon companions.
   - Modes: **Jade Mountain Daily Mix**, **Division & Leftovers**, **Factors & Factor Pairs**, **Multiples & Patterns**, **Primes, Composites & Squares**, **GCF & LCM Arena**, and **Mystery Number (1–100)** with an interactive 1–100 Detective Grid sieve.
2. **Multiplication Facts** (3rd Grade — `#/game/multiplication-facts`, assigned to `grade3`)
   - Timed `1 × 1` to `12 × 12` multiplication fluency sprints with zero-lag input, a live **100-in-5:00 Target Pace** race bar, a **Personal Best Ghost** chaser indicator, starter coach **Moonwatcher**, and an oversized book-faithful **Colossal King Darkstalker** grand prize unlocked by solving 100+ facts in 5 minutes or less.
   - Modes: **5-Minute 100-Fact Challenge**, **1-Minute Speed Check**, **2:30 Half-Challenge**, **Foundation Sprint (×1, ×2, ×5, ×10)**, **Core Tables Sprint (×3, ×4, ×6)**, **Tricky Tables Sprint (×7, ×8, ×9)**, and **Big Tables & Squares (×11, ×12, n²)**.
3. **Money Match: Dragon Hoard Duel** (3rd Grade — `#/game/money-match`, assigned to `grade3`)
   - **The goal is to get the most money:** two treasure hoards face off and the child taps the amount that puts the MOST money in their purse — `$478` versus `$239 + $245`, `−$462` versus `−$219 + −$248`, a pile of real bills and coins versus one flat amount like `$386.65`, or equal-group market stories like `7 × $34` versus `$245`. Hoards render as tappable treasure cards with explicit `+` sums, green cash chips and red IOU chips, plus a `> < =` reveal in the coaching feedback. A `🎯 Goal: walk away with the MOST money!` banner sits above every duel, switching to `…take the debt you owe the LEAST of!` whenever both sides are in the red.
   - **Challenge numbers, one difficulty:** every quest is written for advanced 3rd graders and stays inside grade-3 place value (nothing leaves `$1,000`), but the generators deliberately build *close calls* — the two sides usually differ by well under 10%, so the puzzle has to be calculated, not eyeballed. Amounts are 3-digit sums of two or three piles, bills up to `$100` (with the occasional `$2` bill) landing on odd cents, up to three signed amounts per pocket, and `2-digit × 1-digit` market deals such as `8 × $47`.
   - **Negative money is a first-class quest:** the *Debt Duel* quest only ever generates debts below `$0`, so owing less is the better amount, and the guide explains it on a `−$600 … $0 … +$600` money line.
   - **The egg rule:** this game awards **1 ⭐ per first-try match** (via the optional `gameDef.calculateRoundStars` hook in the shared progression engine), so **ten correct choices fills an egg bar `10/10 ⭐` and hatches a dragon** — with a `+1 ⭐` Daily Mix courage bonus on top. 22 collectible Hoard Dragons (3 per quest + 3 for the Daily Mix) reuse the dragon portraits already in the repo.
   - Modes: **Daily Hoard Mix**, **Wallet Showdowns**, **Bill & Coin Stacks**, **Debt Duel (Negative $)**, **Earn & Spend Mix**, **Equal or Not?**, and **Dragon Market Stories**. New `hoard` theme (`css/tokens.css`) and `css/money.css` duel/bill/IOU styling; quest logic lives in `src/games/money-match/`.
4. **Shape, Perimeter & Area** (3rd Grade — `#/game/superkitties-shapes`, assigned to `grade3`, *By Hanna BK*)
   - Illustrated inline SVG geometry & measurement blueprints paired with 9 storybook cat companions led by **Kiki** across 4 squads (*Starlight Paws*, *Builder Paws*, *Shield & Laser Paws*, and *Kitty Family* — including the SuperKitties **Kiki**, **Meow-Meow**, **Cuzi**, **Cagura**, **Flame**, **Oliva**, **Cori**, and **Misha**, plus Cuzi’s mom **Anna**, who is not a SuperKitty herself and cheers everyone on from her sunny cottage window).
   - **Visual blueprints & dual locks:** every puzzle includes a custom crisp inline SVG diagram — paw-tile grid rooms & courtyard fountain cutouts, glowing laser-fence perimeter polygons, 4-orientation L-shape castles with dotted rectangle splits and missing step walls, missing-side & dual Area+Perimeter vault locks (`multi_slot`), tappable side-by-side Hernado Watch blueprint comparisons (same Area/different Perimeter and vice versa), and quadrilateral/polygon shields marked with parallel chevrons, equal ticks, and `90°` corner boxes.
   - **The Kitty Friend rule:** awards **1 ⭐ per first-try solve** (plus `+1 ⭐` Daily Patrol bonus for 8+ first-try solves), so **10 first-try solves unlocks a new Kitty friend** (`10/10 ⭐`). Features the cosmic berry-rose `kitty` theme (`css/tokens.css`, `css/shapes.css`), `relaxed` untimed default pace, and prompt read-aloud (`🔊 Read`).
   - Modes: **SuperKitties Daily Patrol**, **Paw-Tile Rooms & Gardens**, **Laser-Fence Perimeter**, **L-Shape Hero Castles**, **Mystery Side Vaults**, **Hernado Watch**, and **Shape & Shield Academy**.
5. **Addition & Subtraction** (1st Grade — `#/game/addition-subtraction`, assigned to `grade1`)
   - Built around i-Ready Grade 1 mental-math strategies (*Teen Numbers as 10 and Some More*, *Make a Ten to Add*, *Use a Ten to Subtract*) with a warm storybook Meadow theme, `relaxed` untimed default pace, optional `🔊 Read` prompt speech synthesis, visual number-path jump arcs, counter-slide / break-apart bonds, interactive **20-Frame Counters**, and 29 collectible Dog Man & Supa Buddies companions.
   - Modes: **Supa Buddies Daily Mix**, **Teen Numbers & Friends of 10**, **Make a Ten to Add**, **Use a Ten to Subtract**, **Doubles & Near-Doubles**, **Fluency Within 10**, and **Fact Families & Balance**.
6. **100-Chart Cross Puzzles** (1st Grade — `#/game/hundreds-chart`, assigned to `grade1`)
   - Built around i-Ready Grade 1 Lesson 14C (*"Finish the Puzzle"* — 100-chart & 120-chart cross cutouts) with a sunlit Sky theme, multi-box cross input with partial progress lock-in, interactive 1–100 / 1–120 chart peek with clue highlighting and cross spotlighting, and 29 collectible Dog Man & Supa Buddies Chart Detectives led by Cat Kid.
   - Modes: **Supa Chart Daily Mix**, **10 Less, 10 More & ±1 Hops**, **Center-Clue Crosses**, **Two-Clue Crosses (Find Middle!)**, **One-Clue Cross Detective**, **Chart Windows & Oops Detective**, and **Beyond 100: The 120-Chart!**.

## Running Locally

Because browsers enforce CORS on `<script type="module">`, serve the folder over any static HTTP server (no build step or `npm install` required):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in your browser. All paths are relative (`./css/...`, `./src/...`, `./assets/...`), so it deploys cleanly at root or under any subpath (such as GitHub Pages).

## Kid Profiles & Legacy Save Migration

- Default profiles: **3rd Grader** (`🐉`, `grade3` → *Factors & Multiples*, *Multiplication Facts*, *Money Match: Dragon Hoard Duel*, and *Shape, Perimeter & Area*) and **1st Grader** (`🐶`, `grade1` → *Addition & Subtraction* and *100-Chart Cross Puzzles*), stored under `localStorage['math_arcade_save_v1']`.
- Automatic non-destructive migrations:
  - `localStorage['wings_of_math_save_v1']` migrates into `grade3`’s `factors-and-multiples` save.
  - Existing `math_arcade_save_v1` saves keyed under `primes-and-factors` migrate automatically into `factors-and-multiples`.
- The **Parents** dashboard (default PIN `885174`) supports renaming profiles, choosing avatars, enabling or disabling game packs on the current device (`localStorage['math_arcade_device_v1']`) without deleting saved progress, reviewing sub-skill accuracy and recent mistakes for each child's assigned game, filtering companions by faction/tribe/squad and toggling unlocks, and importing/exporting backups (both `.json` files and Base64 backup codes, including legacy `wings_of_math_save_v1` codes).

## Tests

Run the Node unit & fuzz test suite (Node 18+):

```bash
node --test tests/*.test.js
```
