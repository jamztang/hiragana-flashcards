// whisper.js — offline in-browser speech recognition
// Uses transformers.js (Hugging Face) running Whisper in WebAssembly.
// First use downloads the model (~50MB, cached afterwards); all inference
// is local — no audio leaves the machine.

let transcriberPromise = null;

async function getTranscriber(onProgress) {
  if (!transcriberPromise) {
    transcriberPromise = (async () => {
      const mod = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3');
      return mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base', {
        dtype: 'q8',
        progress_callback: p => { if (onProgress) onProgress(p); }
      });
    })();
    transcriberPromise.catch(() => { transcriberPromise = null; });
  }
  return transcriberPromise;
}

// pcm16k: Float32Array mono at 16 kHz. Returns transcribed text (kana/kanji mix).
export async function transcribeWithWhisper(pcm16k, onProgress) {
  const transcriber = await getTranscriber(onProgress);
  const out = await transcriber(pcm16k, { language: 'japanese', task: 'transcribe' });
  return (out && out.text ? out.text : '').trim();
}

// resample arbitrary-rate mono PCM chunks to 16 kHz (Whisper requirement)
export function resampleTo16k(chunks, sourceRate) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  if (!total) return new Float32Array(0);
  const src = new Float32Array(total);
  let off = 0;
  for (const c of chunks) { src.set(c, off); off += c.length; }
  const ratio = sourceRate / 16000;
  const outLen = Math.floor(total / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, total - 1);
    const frac = pos - i0;
    out[i] = src[i0] * (1 - frac) + src[i1] * frac;
  }
  return out;
}
