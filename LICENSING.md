# Licensing Notes — Hiragana Flashcards

**Status: fine for a personal prototype. One blocker to fix before any public release.**

## Component-by-component

| Component | Source | License status |
|-----------|--------|----------------|
| App code (HTML/CSS/JS) | Written for this project | Ours — no issues |
| Word bank (114 nouns) | Original curation; single words are facts, not copyrightable | Clean. Word lists generally aren't protected; our list wasn't copied from any single source |
| Translations / romaji | Written for this project | Ours |
| Emoji | Unicode standard characters | Free to use |
| Web Speech API (recognition) | Browser platform feature | Platform license; fine to call |
| transformers.js (Whisper offline ASR) | Hugging Face (MIT) + OpenAI Whisper (MIT, incl. model weights) | ✅ Clean for commercial use |
| **Kyoko voice recordings** (`audio/words/*.m4a`) | Generated with macOS `say` (Apple) | ⚠️ **Restricted** |

## ⚠️ The Kyoko issue

Apple's system voices are licensed **for use on Apple devices within Apple software
contexts**. The macOS software license agreement does not grant the right to
redistribute synthesized audio as part of another product. Shipping these 114
clips — in a public website, TestFlight build, or App Store app — is a license
violation risk. Apple has historically tolerated small internal use, but there
is no explicit commercial grant.

**Fine:** personal use, local prototype, testing with a few friends.
**Not fine:** public deployment or distribution.

## Replacement paths before shipping

1. **VOICEVOX / AivisSpeech** — open-source Japanese TTS engine. Voices have
   character-specific terms (mostly: commercial use OK with attribution to the
   character, e.g. ずんだもん, 四国めたん). Same local-generation pipeline as `say`,
   regenerate all clips with one script. Best free option for a JP learning app.
2. **Cloud neural TTS** — Azure Speech (Nanami) / Google Cloud TTS. Clean
   commercial licensing via API terms; output may be stored/shipped per their
   terms. Pay per character synthesized.
3. **Record a native speaker** — cleanest and best quality. Work-for-hire
   contract → we own the recordings outright. ~1 hour for the full bank.

## For the native iOS app later

- `AVSpeechSynthesizer` with Apple voices: same restriction — Apple voices are
  for on-device spoken output to the user, **not** to be recorded and bundled.
  Live on-device synthesis (never stored) is the intended use.
- SFSpeechRecognizer: fine; supports on-device recognition.
- Bundled recordings: use path 1–3 above.

## Verification checklist before public release

- [ ] Replace all Kyoko-generated clips (VOICEVOX regenerate or VOICEVOX regenerate or human recordings)
- [ ] If VOICEVOX: add required character credits to the About screen
- [ ] MIT notices for transformers.js/Whisper in an open-source notice screen
- [ ] Confirm word bank spellings with a native speaker (quality, not licensing)
