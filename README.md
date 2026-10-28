# ひらがな フラッシュカード — Hiragana Flashcards

Learn hiragana by reading real words, not isolated characters. Pick your
character range, and the app shows nouns you can spell with exactly those
characters — read each word aloud (speech recognition) or type its romaji to
advance.

No build step, no dependencies to install, no accounts. It's plain
HTML/CSS/JS served statically.

## Quick start

```bash
cd prototype
python3 -m http.server 8766
```

Open **http://localhost:8766** — done.

> Voice recognition and the audio files need `http://localhost` (or HTTPS) —
> browsers block microphone access on other insecure origins. To test from a
> phone, use a tunnel (e.g. `ssh -R` or Tailscale Serve over HTTPS).

## How it works

1. **Setup** — choose a preset level (Level 1 = あ行 only → Level 10 = all
   46 characters + dakuten + small characters) or pick individual character
   rows yourself. The counter shows how many words your selection unlocks.
2. **Practice** — each card shows a noun in hiragana with an emoji and English
   meaning. Answer by:
   - **🎙 Voice** — say the word in Japanese; the recognized text is displayed
     live on the card as you speak
   - **⌨️ Typing** — romaji in any common style (`neko`, `shi`/`si`, `gakkou` →
     がっこう, `toukyou` → とうきょう) or kana directly
3. **Reward** — a correct answer plays the word's real recording slowly, mora
   by mora pacing.
4. **Review** — the session summary lists every word you missed or revealed.

Word availability is derived from your character selection: ねこ only appears
once both な行 and か行 are selected. The bank starts at 6 words (Level 1) and
grows to 114 (Level 10).

## Voice input — two modes

| Mode | Engine | Needs network | Notes |
|------|--------|---------------|-------|
| Cloud (default) | Web Speech API, `ja-JP` | Yes | Streams audio to Google/Apple ASR. Fails on some VPN/proxy networks. |
| Offline (auto-fallback) | Whisper via [transformers.js](https://github.com/huggingface/transformers.js) (WASM) | Model download only (~50MB, cached) | Tap mic → speak → tap mic again → local transcription. Audio never leaves your machine. |

The app switches to offline mode automatically when the cloud service is
unreachable; the choice is remembered in `localStorage`.

Cloud ASR often returns kanji (猫 not ねこ) — transcripts are resolved through
a kanji-readings map before matching, and romaji recognition results are also
accepted.

## Word audio

Each word has a pre-generated recording in
`prototype/audio/words/<kana>.m4a` (VOICEVOX engine, **四国めたん** voice,
~1MB total). Missing files fall back to the browser's built-in speech
synthesis automatically.

Regenerate after editing the word bank:

```bash
# 1. start the VOICEVOX engine (one-time download ~1.8GB)
cd ~/Projects/voicevox-engine/macos-arm64 && ./run     # listens on :50021

# 2. regenerate all clips
python3 scripts/generate_word_audio_voicevox.py
```

See [LICENSING.md](LICENSING.md) for terms and [CREDITS.md](CREDITS.md) for
attributions.

## Project layout

```
prototype/
  index.html        single-page app (setup → cards → done)
  styles.css
  app.js            screens, answer matching, speech input/output
  data.js           character rows, level presets, 114-word bank
  romaji.js         romaji↔kana converters, kanji readings, answer checking
  whisper.js        offline ASR (transformers.js + Whisper, WASM)
  audio/words/      114 word recordings (VOICEVOX, committed)
scripts/
  generate_word_audio_voicevox.py   regenerate word audio from the engine
PLAN.md             roadmap and design decisions
LICENSING.md        component-by-component license notes
CREDITS.md          required attributions
```

## Adding words

Add one object to `WORDS` in `prototype/data.js` — no code changes needed:

```js
{ k: 'くるま', r: 'kuruma', en: 'car', e: '🚙' }
```

It automatically appears in every level whose characters cover its spelling
(くるま needs だくてん, so Level 9+). Then regenerate the audio (above) so the
new word has a recording.

## License notes

App code: yours. Word recordings: VOICEVOX voice output — public use requires
the credit **VOICEVOX:四国めたん** on an About screen (see
[CREDITS.md](CREDITS.md)). Do not commit Apple-`say`-generated audio; it is
gitignored ([LICENSING.md](LICENSING.md)).
