# Hiragana Flashcards — Project Plan

## Vision

Learn hiragana by reading actual words, not isolated characters.

**The core mechanic:** pick a level / character range → the app shows nouns
written **only with the characters you've selected** → read the word out loud
(speech recognition) or type its romaji → correct answer advances the card.

This creates natural, self-reinforcing practice: to read ねこ you must know
ね *and* こ — vocabulary grows as the alphabet does.

---

## Core features

1. **Level / character-range customization**
   - 10 preset levels (JF-style progression): Level 1 = あ行 only → Level 10 = all 46 + dakuten + small characters
   - Custom mode: pick individual rows (あ行, か行, さ行 …, dakuten, small chars)
   - Live count of available words for the current selection
2. **Filtered noun bank** (~85 common nouns)
   - A word appears only if every character in its spelling is in the selected range
   - Each word: hiragana, romaji, English meaning, emoji
3. **Flash card flow**
   - Card shows the word in big hiragana + emoji + English meaning
   - **Answer by voice** — Web Speech API (ja-JP), recognized text matched to the word
   - **Or type the reading** — romaji → kana converter accepts all common
     romanization styles (shi/si, tsu/tu, fu/hu, ou/oo/ō, double consonants → っ)
   - Correct → success feedback, auto-advance. Wrong → retry or "reveal" → skip
4. **Progress** — per-session score, streak, review of missed words at the end

---

## Phase 1 — Web prototype (current)

`prototype/` — plain HTML/CSS/JS, no build step.

- [x] Setup screen: level presets + custom row checkboxes + live word count
- [x] Flash card screen with emoji hint + hiragana target
- [x] Typed answers: romaji parser converts to kana, compares to word
- [x] Voice answers: Web Speech API with graceful fallback when unsupported
- [x] 意味 (meaning) mode — answer with the English instead: emoji + meaning hidden on
  the card (revealed after correct/reveal), mic hidden (ASR hears Japanese, not English).
  Matching is case/punctuation/article-insensitive, accepts "/" alternatives and
  simple plurals; persisted in localStorage
- [x] Session summary: score, missed words, practice again / change level
- [x] Selection + stats persisted in localStorage

## Phase 2 — Iterate on the prototype

- Test with 3–5 beginner learners: is the voice input forgiving enough?
- Tune romaji parser edge cases (long vowels, apostrophes, n vs ん)
- Consider SRS: prioritize words containing characters answered wrong

## Phase 3 — Native app (iOS)

- SwiftUI, Speech framework (SFSpeechRecognizer, ja-JP) — works offline on-device
- Full 46-character + dakuten/handakuten curriculum with stroke animations
- Dictionary-grade word bank with audio recordings by native speakers
- TestFlight beta

---

## Data model

```js
ROWS:    [{ id, name, chars }]        // あ行 … わ行, dakuten, small
LEVELS:  [{ n, label, rows: [ids] }]  // presets 1–10
WORDS:   [{ k, r, en, e }]            // kana, romaji, meaning, emoji
```

Availability is derived, not stored: `word.k` ⊆ selected chars → word is in deck.
Adding content = adding one object to `WORDS` — no code changes.

## Tech notes

| Concern | Approach |
|---------|----------|
| Romaji parsing | Greedy longest-match syllable table + gemination (っ) + n handling (`romaji.js`) |
| Speech (cloud) | `webkitSpeechRecognition`, lang `ja-JP` — streams audio to Google/Apple ASR; blocked on some networks (VPN/proxy) |
| Speech (offline) | Auto-fallback to Whisper (transformers.js, WASM, `Xenova/whisper-base` q8) — mic → PCM 16kHz → local inference; model cached after first download (~50MB). Chosen mode persisted in localStorage |
| Matching | parsed kana === word kana, or typed string === word romaji, or direct kana input; kanji ASR output resolved via `KANJI_READINGS` map |
| Word audio | 114 recordings via local VOICEVOX engine (四国めたん ノーマル) → `prototype/audio/words/*.m4a`, ~1MB total. Pitch-preserving slow-down (0.65x) for the post-answer reward. Fallback: `speechSynthesis`. Regenerate: `scripts/generate_word_audio_voicevox.py` (engine: `~/Projects/voicevox-engine/macos-arm64/run`) |
| Voice quality path | Siri's voice is not exposed to any API. VOICEVOX clips are the shipping quality; native-speaker recordings or cloud neural TTS for production polish |

## Open questions

- [ ] Should English meaning be visible up-front (reading practice) or hidden (recall practice)?
- [ ] Accept katakana spellings of words (e.g. ネコ) as correct? (currently yes via normalization)
- [ ] Word bank quality: verify each noun's spelling + naturalness with a native speaker
