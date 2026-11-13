# Family Math Arcade

A zero-build, static HTML/CSS/ES-module math arcade for elementary learners, featuring independent kid profiles, strict per-profile game assignment, two full games built on a shared XtraMath-style practice engine, synthesized Web Audio feedback, and a PIN-protected Parent Dashboard.

## Games Included

1. **Factors & Multiples** (3rd Grade — `#/game/factors-and-multiples`, assigned to `grade3`)
   - Formerly *Wings of Math*, with 43 collectible Wings of Fire dragon companions.
   - Modes: **Jade Mountain Daily Mix**, **Division & Leftovers**, **Factors & Factor Pairs**, **Multiples & Patterns**, **Primes, Composites & Squares**, **GCF & LCM Arena**, and **Mystery Number (1–100)** with an interactive 1–100 Detective Grid sieve.
2. **Addition & Subtraction** (1st Grade — `#/game/addition-subtraction`, assigned to `grade1`)
   - Built around i-Ready Grade 1 mental-math strategies (*Teen Numbers as 10 and Some More*, *Make a Ten to Add*, *Use a Ten to Subtract*) with a warm storybook Meadow theme, `relaxed` untimed default pace, optional `🔊 Read` prompt speech synthesis, visual number-path jump arcs, counter-slide / break-apart bonds, interactive **20-Frame Counters**, and 29 collectible Dog Man & Supa Buddies companions.
   - Modes: **Supa Buddies Daily Mix**, **Teen Numbers & Friends of 10**, **Make a Ten to Add**, **Use a Ten to Subtract**, **Doubles & Near-Doubles**, **Fluency Within 10**, and **Fact Families & Balance**.

## Running Locally

Because browsers enforce CORS on `<script type="module">`, serve the folder over any static HTTP server (no build step or `npm install` required):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/` in your browser. All paths are relative (`./css/...`, `./src/...`, `./assets/...`), so it deploys cleanly at root or under any subpath (such as GitHub Pages).

## Kid Profiles & Legacy Save Migration

- Default profiles: **3rd Grader** (`🐉`, `grade3` → *Factors & Multiples*) and **1st Grader** (`🐶`, `grade1` → *Addition & Subtraction*), stored under `localStorage['math_arcade_save_v1']`.
- Automatic non-destructive migrations:
  - `localStorage['wings_of_math_save_v1']` migrates into `grade3`’s `factors-and-multiples` save.
  - Existing `math_arcade_save_v1` saves keyed under `primes-and-factors` migrate automatically into `factors-and-multiples`.
- The **Parents** dashboard (default PIN `885174`) supports renaming profiles, choosing avatars, reviewing sub-skill accuracy and recent mistakes for each child's assigned game, toggling companion unlocks, and importing/exporting backups (both `.json` files and Base64 backup codes, including legacy `wings_of_math_save_v1` codes).

## Tests

Run the Node unit & fuzz test suite (Node 18+):

```bash
node --test tests/*.test.js
```
