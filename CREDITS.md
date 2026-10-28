# Credits & Attributions

## Word audio — 四国めたん

The Japanese word recordings in `prototype/audio/words/*.m4a` were generated
with the [VOICEVOX](https://voicevox.hiroshiba.jp/) engine using the
**四国めたん** (Shikoku Metan) voice library (ノーマル style).

Per the [音源利用ガイドライン](https://zunko.jp/con_ongen_kiyaku.html), the
required credit is:

> **VOICEVOX:四国めたん**

This credit must be shown on an About/intro screen of the app before public
release (the guideline asks for it "somewhere a user can find with a little
looking" — for apps, the intro/about screen).

Regeneration: `scripts/generate_word_audio_voicevox.py` (requires the local
VOICEVOX engine running on port 50021).

## Offline speech recognition

- [transformers.js](https://github.com/huggingface/transformers.js) — MIT
- [Whisper](https://github.com/openai/whisper) model weights (`Xenova/whisper-base`) — MIT
