# Licensing Notes — Hiragana Flashcards

**Status: ✅ VOICEVOX clips in use — clean for public release with credit (see below).**

## Component-by-component

| Component | Source | License status |
|-----------|--------|----------------|
| App code (HTML/CSS/JS) | Written for this project | Ours — no issues |
| Word bank (114 nouns) | Original curation; single words are facts, not copyrightable | Clean. Word lists generally aren't protected; our list wasn't copied from any single source |
| Translations / romaji | Written for this project | Ours |
| Emoji | Unicode standard characters | Free to use |
| Web Speech API (recognition) | Browser platform feature | Platform license; fine to call |
| transformers.js (Whisper offline ASR) | Hugging Face (MIT) + OpenAI Whisper (MIT, incl. model weights) | ✅ Clean for commercial use |
| **Word recordings** (`audio/words/*.m4a`) | VOICEVOX engine, 四国めたん (ノーマル) | ✅ Commercial use permitted **with credit: "VOICEVOX:四国めたん"** |

## ⚠️ Resolved: Apple `say` clips (2025-xx)

The first batch of recordings was generated with macOS `say` (Kyoko voice).
Apple's SLA does not allow redistributing synthesized voice output, so those
clips were **replaced** by VOICEVOX-generated audio and never checked into git
(`audio/` is gitignored). No Apple-licensed audio ships with this repo.

## ⚠️ The Kyoko issue

Apple's system voices are licensed **for use on Apple devices within Apple software
contexts**. The macOS software license agreement does not grant the right to
redistribute synthesized audio as part of another product. Shipping these 114
clips — in a public website, TestFlight build, or App Store app — is a license
violation risk. Apple has historically tolerated small internal use, but there
is no explicit commercial grant.

**Fine:** personal use, local prototype, testing with a few friends.
**Not fine:** public deployment or distribution.

## Regenerating the audio

Voice: 四国めたん (ノーマル), generated via the local VOICEVOX engine.

1. Engine lives in `~/Projects/voicevox-engine/macos-arm64/` (v0.26.0, ~1.8GB
   download, includes all 43 speakers). Start it:
   ```
   cd ~/Projects/voicevox-engine/macos-arm64 && ./run
   ```
   (listens on http://127.0.0.1:50021 — Ctrl-C to stop)
2. Regenerate all clips:
   ```
   python3 scripts/generate_word_audio_voicevox.py
   ```

## Alternative paths (recorded for reference)

1. **Cloud neural TTS** — Azure Speech (Nanami) / Google Cloud TTS. Clean
   commercial licensing via API terms. Pay per character synthesized.
2. **Record a native speaker** — cleanest and best quality. Work-for-hire
   contract → we own the recordings outright. ~1 hour for the full bank.

## For the native iOS app later

- `AVSpeechSynthesizer` with Apple voices: same restriction — Apple voices are
  for on-device spoken output to the user, **not** to be recorded and bundled.
  Live on-device synthesis (never stored) is the intended use.
- SFSpeechRecognizer: fine; supports on-device recognition.
- Bundled recordings: use path 1–3 above.

## Verification checklist before public release

- [x] Replace Apple-`say` clips with VOICEVOX
- [ ] Add required VOICEVOX credit to the About screen: **"VOICEVOX:四国めたん"**
- [ ] MIT notices for transformers.js/Whisper in an open-source notice screen
- [ ] Confirm word bank spellings with a native speaker (quality, not licensing)
- [ ] Review VOICEVOX terms for the app-store distribution case (credit requirement may extend to product name/description)
