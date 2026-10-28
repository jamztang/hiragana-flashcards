# Test suite design

The app is a dependency-free static prototype (plain JS loaded as classic
`<script>` tags, one dynamic ES-module import for Whisper). The test suite
mirrors that: **no changes to app code**, dev-dependencies only
(`vitest`, `happy-dom`), and tests load the real `prototype/*.js` files the
same way the browser does.

```bash
npm install        # devDependencies only — the app itself stays dependency-free
npm test           # vitest run (unit + integration)
npm run test:watch
npm run test:e2e   # Playwright (see "Layer 4" — not yet scaffolded)
```

## Layout

```
package.json            vitest + happy-dom (dev-only)
vitest.config.js        happy-dom environment
tests/
  helpers/env.js        script loader + browser-API stubs + app boot/reset
  romaji.test.js        romaji↔kana conversion, answer checkers
  data.test.js          word-bank/level/audio asset integrity, 意味-mode checks
  app.test.js           DOM integration: screens, state, voice fallback
  e2e/                  (planned) Playwright specs, see Layer 4
```

## The four layers

### 1. Asset & data integrity (`tests/data.test.js`) — the highest-value canary

The word bank is the app's core data and it's edited by hand (see README
"Adding words"), so these tests catch the most likely regressions:

- every word's `r` **round-trips** through `romajiToKana()` to exactly `k`
  (catches typos in either field)
- every word has a recording at `audio/words/<kana>.m4a`
  (compares NFC-normalized filenames — macOS stores some NFD)
- every word's kana is spellable from `ROWS` (reachable at Level 10)
- `ROWS` have no duplicate characters; all 46 gojūon + dakuten + small present
- `LEVELS` reference valid rows and grow monotonically
- per-level word counts match the documented values (6 → 114)
- no duplicate kana; required fields (`k, r, en, e`) present

### 2. Unit tests for pure logic (`tests/romaji.test.js`)

`romaji.js` is where the subtle correctness lives — each accepted input style
gets its own case:

- **romajiToKana**: basic words; all style aliases (`shi/si`, `chi/ti`,
  `tsu/tu`, `fu/hu`, `ji/zi`); gemination (`gakkou` → がっこう); `n` handling
  (`sensei`, `hon`, `n`); long vowels (`toukyou`, `kyouto`); digraphs;
  case/punctuation tolerance; `null` for unparseable input
- **kanaToRomaji**: reverse direction incl. dakuten, っ, digraphs
- **kataToHira** and **normalizeInput** (punctuation, full-width spaces, ー)
- **checkTypedAnswer**: exact romaji, kana, katakana; rejects near-misses
  (`nneko` → んねこ) and empty input
- **checkSpeechResult**: kanji transcripts (猫, 子猫), word-inside-phrase,
  romaji transcripts; rejects unrelated kanji (犬 for ねこ)
- **replaceKanjiReadings**: longest-match-first (子猫 → こねこ, not 子+猫)
- **checkMeaningAnswer**: case/punctuation, `/` alternatives ("rice" for
  "rice / meal"), leading articles, simple plurals; rejects wrong meanings

### 3. DOM integration (`tests/app.test.js`)

The real `index.html` DOM + the real `app.js` run in happy-dom, with
`Audio`, `speechSynthesis`, and `SpeechRecognition` stubbed
(`tests/helpers/env.js`). Covered:

- boot state: setup screen, default Level 5 selection, live word count
- level switching updates count; empty custom selection disables Start
- session start: card screen, shuffled deck = exactly the available words
- answering: correct → score/streak/reveal/Next unlocked; wrong → retryable,
  and the word is **immediately considered failed** (goes to review, can no
  longer earn score in this pass — scoring is first-try only, reveal counts
  as a failure too)
- Enter submits; Arrow keys navigate (and don't double-score revisits)
- reveal → miss recorded; no redemption within the same pass
- 意味 mode: meaning hidden, English accepted, kana rejected
- done screen: final score + missed review list
- **review-missed button**: shown on the done screen only when words were
  missed; starts a session with exactly those words (fresh `failed` set, so
  first-try corrects there clear them from the list); a fully redeemed review
  ends perfect and hides the button; re-revealed words aren't duplicated in
  the missed list
- **voice fallback**: cloud ASR `network` error → `voiceMode` becomes
  `'whisper'` and persists to localStorage (the app's most fragile path)
- recognizer **alternatives** all tried (犬 wrong, ねこ right → ✅)
- `splitMoras` pacing (digraphs together, っ joins the next mora)

Loader mechanics (why `tests/helpers/env.js` exists): the app is classic
non-module JS, so scripts are executed with `vm.runInThisContext` — top-level
declarations share one global lexical scope exactly like consecutive
`<script>` tags. Named bindings are copied onto `globalThis` for assertions,
and `app.resetForTest()` re-runs the app's init logic between tests (module
state can't be re-declared, but it can be reassigned from that scope).

### 4. End-to-end (planned — Playwright)

Worth adding once behavior stabilizes; the integration layer already covers
most logic. Plan:

- `webServer`: `python3 -m http.server 8766` in `prototype/`
- **input**: mock `navigator.mediaDevices.getUserMedia` with a fake audio
  stream; stub `SpeechRecognition` (same doubles as Layer 3); keep real click
  paths (`btn-start`, `btn-check`, `btn-mic`, `btn-restart`)
- scenarios: full happy path (setup → answer all → done), a missed-word
  session, mic-permission-denied messaging, Whisper-fallback switch in a real
  browser, offline mode after first model load
- run headless in CI; skip voice scenarios when no mic codec is available

## What is deliberately not tested

- `whisper.js` model download/inference (network + WASM; exercised in Layer 4)
- actual audio playback and TTS quality (manual)
- styling/visuals (`styles.css`)