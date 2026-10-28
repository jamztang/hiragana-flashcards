# AGENTS.md — hiragana-flashcards

## Workflow

- **Always try to use TDD**: write the failing test first (red), implement the
  minimum to make it pass (green), then refactor. Update `TESTING.md` when the
  design changes.
- Run `npm test` (vitest) before finishing any change — keep the suite green.
  Watch mode: `npm run test:watch`.
- The app itself (`prototype/`) must stay **dependency-free** — test tooling
  (vitest, happy-dom, Playwright) lives in `devDependencies` only.
- Tests load the *real* `prototype/*.js` files (`tests/helpers/env.js`); don't
  restructure app code purely for testability — add a test-only hook in
  `tests/helpers/env.js` instead.

## Layout

```
prototype/           the app: index.html, app.js, data.js, romaji.js, whisper.js
tests/               vitest suite (unit + happy-dom integration)
  helpers/env.js     script loader, browser-API stubs, app boot/reset
TESTING.md           test suite design and coverage map
PLAN.md / README.md  roadmap and usage
```

## Data changes

- Adding words: edit `WORDS` in `prototype/data.js` — `tests/data.test.js`
  enforces integrity (romaji↔kana round-trip, audio file present, level math).
  Fix the data, not the test, when the canaries fire.
- After changing the word bank, regenerate audio
  (`scripts/generate_word_audio_voicevox.py` — see README).

## Behavior notes (tested invariants)

- Score counts **first-try** corrects only; a wrong answer or reveal marks the
  word as failed → it goes to the review list and can't earn score in that pass.
- The done screen's review-missed button re-runs exactly the missed words; a
  clean review pass clears them from the list (fresh `failed` set per pass).
- Keep the app's in-memory semantics in mind when writing tests: scripts load
  once per test file, so use `app.resetForTest()` in `beforeEach`.

## Commits

- Never bypass pre-commit hooks with `--no-verify`; fix findings instead.