// app.js — Hiragana Flashcards
//
// Screens: setup → cards → done
// Answers: type romaji/kana, or speak (Web Speech API, ja-JP)

// ---------- state ----------
let deck = [];            // shuffled words for this session
let cardIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let missed = [];          // words answered wrong this session
let answered = false;     // current card already answered?
let selection = null;     // { mode:'level'|'custom', level: n|null, rows: [ids] }
let recognizer = null;    // SpeechRecognition instance
let listening = false;

// voice input modes: 'auto' (cloud ASR) → falls back to 'whisper' (offline) on network errors
let voiceMode = localStorage.getItem('voiceMode') || 'auto';

// answer mode: 'reading' (romaji/kana/voice) or 'meaning' (type the English meaning;
// emoji + meaning hidden on the card, mic hidden — ASR hears Japanese, not English)
let answerMode = localStorage.getItem('answerMode') === 'meaning' ? 'meaning' : 'reading';

// Whisper capture state
let whisperModulePromise = null;
let whisperStream = null;
let whisperCtx = null;
let whisperProcessor = null;
let pcmChunks = [];

async function loadWhisperModule() {
  if (!whisperModulePromise) {
    whisperModulePromise = import('./whisper.js');
    whisperModulePromise.catch(() => { whisperModulePromise = null; });
  }
  return whisperModulePromise;
}

function showModelProgress(p) {
  if (p && p.status === 'progress' && typeof p.progress === 'number') {
    el('card-feedback').textContent = `⏳ Loading offline model… ${Math.round(p.progress)}% (first time only)`;
  } else if (p && p.status === 'initiate' && p.file) {
    el('card-feedback').textContent = `⏳ Downloading offline model (first time only)…`;
  }
}

// ---------- helpers ----------
function el(id) { return document.getElementById(id); }

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectedCharSet() {
  const set = new Set();
  selection.rows.forEach(rowId => {
    const row = ROWS.find(r => r.id === rowId);
    if (row) for (const ch of row.chars) set.add(ch);
  });
  return set;
}

function availableWords() {
  const set = selectedCharSet();
  return WORDS.filter(w => [...w.k].every(ch => set.has(ch)));
}

function saveSelection() {
  localStorage.setItem('hiragana-flashcards-selection', JSON.stringify(selection));
}

function loadSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem('hiragana-flashcards-selection'));
    if (saved && (saved.mode === 'level' || saved.mode === 'custom')) return saved;
  } catch (e) { /* ignore */ }
  return null;
}

// ---------- setup screen ----------
function renderSetup() {
  const levelSelect = el('level-select');
  levelSelect.innerHTML = LEVELS.map(l =>
    `<option value="${l.n}" ${selection.mode === 'level' && selection.level === l.n ? 'selected' : ''}>${l.label}</option>`
  ).join('');

  const custom = selection.mode === 'custom';
  el('custom-rows').classList.toggle('visible', custom);

  const rowGrid = el('row-grid');
  rowGrid.innerHTML = ROWS.map(r => `
    <label class="row-check ${selection.rows.includes(r.id) ? 'on' : ''}">
      <input type="checkbox" value="${r.id}" ${selection.rows.includes(r.id) ? 'checked' : ''}>
      <span>${r.name}</span>
      <span class="row-chars">${r.chars}</span>
    </label>
  `).join('');

  rowGrid.querySelectorAll('input').forEach(cb => {
    cb.addEventListener('change', () => {
      const id = cb.value;
      if (cb.checked) {
        if (!selection.rows.includes(id)) selection.rows.push(id);
      } else {
        selection.rows = selection.rows.filter(x => x !== id);
      }
      selection.mode = 'custom';
      selection.level = null;
      renderSetup();
    });
  });

  const count = availableWords().length;
  el('word-count').textContent = count
    ? `${count} words available`
    : 'No words available — pick more characters';
  el('btn-start').disabled = count === 0;

  el('answer-mode').value = answerMode;
}

function onAnswerModeChange(ev) {
  answerMode = ev.target.value;
  localStorage.setItem('answerMode', answerMode);
}

function onLevelChange(ev) {
  const level = LEVELS.find(l => l.n === +ev.target.value);
  if (level) {
    selection = { mode: 'level', level: level.n, rows: level.rows.slice() };
    saveSelection();
    renderSetup();
  }
}

function startSession() {
  deck = shuffle(availableWords());
  cardIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  missed = [];
  saveSelection();
  el('screen-setup').classList.remove('active');
  el('screen-card').classList.add('active');
  renderCard();
}

// ---------- card screen ----------
function renderCard() {
  const word = deck[cardIndex];
  answered = false;
  const meaningMode = answerMode === 'meaning';

  const screen = el('screen-card');
  screen.classList.toggle('mode-meaning', meaningMode);
  screen.classList.remove('revealed');

  el('card-progress').textContent = `${cardIndex + 1} / ${deck.length}`;
  el('card-streak').textContent = `🔥 ${streak}`;
  el('card-emoji').textContent = word.e;
  el('card-word').textContent = word.k;
  el('card-meaning').textContent = word.en;
  el('card-heard').textContent = '';

  const input = el('answer-input');
  input.value = '';
  input.disabled = false;
  input.placeholder = meaningMode
    ? 'English meaning (cat)'
    : 'romaji (neko) or kana (ねこ)';
  el('btn-check').disabled = false;
  el('btn-reveal').disabled = false;
  el('btn-next').disabled = true;
  el('card-feedback').textContent = '';
  el('card-feedback').className = 'card-feedback';
  el('card-romaji').textContent = '';
  el('card-romaji').classList.remove('visible');
  input.focus();
}

function submitAnswer() {
  if (answered) return;
  const word = deck[cardIndex];
  const raw = el('answer-input').value;
  const ok = answerMode === 'meaning'
    ? checkMeaningAnswer(raw, word)
    : checkTypedAnswer(raw, word);
  if (ok) {
    onCorrect();
  } else {
    onWrong();
  }
}

function onCorrect() {
  answered = true;
  score++;
  streak++;
  bestStreak = Math.max(bestStreak, streak);
  showFeedback(true, '✅ 正解!');
  el('screen-card').classList.add('revealed');   // show emoji/meaning again as confirmation
  speakWordSlowly(deck[cardIndex]);   // reward: hear the word slowly after getting it right
  el('answer-input').disabled = true;
  el('btn-check').disabled = true;
  el('btn-reveal').disabled = true;
  el('btn-next').disabled = false;
  el('btn-next').focus();
}

function onWrong() {
  streak = 0;
  showFeedback(false, '❌ Not quite — try again, or reveal');
  el('card').classList.add('shake');
  setTimeout(() => el('card').classList.remove('shake'), 400);
}

function revealAnswer() {
  answered = true;
  const word = deck[cardIndex];
  if (!missed.includes(word)) missed.push(word);
  streak = 0;
  showFeedback(false, answerMode === 'meaning'
    ? `Answer: ${word.en}`
    : 'Hint: read it out loud, then continue');
  el('screen-card').classList.add('revealed');   // show emoji/meaning if hidden
  el('card-romaji').textContent = word.r;
  el('card-romaji').classList.add('visible');
  el('answer-input').disabled = true;
  el('btn-check').disabled = true;
  el('btn-reveal').disabled = true;
  el('btn-next').disabled = false;
}

function showFeedback(ok, msg) {
  const fb = el('card-feedback');
  fb.textContent = msg;
  fb.className = 'card-feedback ' + (ok ? 'ok' : 'bad');
}

function nextCard() {
  cardIndex++;
  if (cardIndex >= deck.length) {
    showDone();
  } else {
    renderCard();
  }
}

// ---------- text-to-speech (local OS voices — works offline) ----------
let jaVoice = null;

function pickVoice() {
  const voices = speechSynthesis.getVoices();
  jaVoice = voices.find(v => v.lang === 'ja-JP') || voices.find(v => v.lang.startsWith('ja')) || null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

// ---------- word audio ----------
// Each word has a pre-generated recording (audio/words/<kana>.m4a, Kyoko voice).
// Real audio always beats live TTS: instant, smooth, consistent. Fallback: system TTS.
const wordAudioCache = {};

function speakWordText(text, rate) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();          // stop any pending utterance first
  // Chrome quirk: speak() right after cancel() can get dropped — give the queue a beat
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (jaVoice) u.voice = jaVoice;
    u.rate = rate || 0.85;
    speechSynthesis.speak(u);
  }, 60);
}

function speakWord(word, rate) {
  const speed = rate || 0.85;
  const src = `audio/words/${encodeURIComponent(word.k)}.m4a`;
  let a = wordAudioCache[src];
  if (!a) {
    a = new Audio(src);
    a.preload = 'auto';
    wordAudioCache[src] = a;
  }
  a.preservesPitch = true;
  a.webkitPreservesPitch = true;
  a.playbackRate = speed;
  a.onerror = () => speakWordText(word.k, speed);   // missing file → system TTS
  a.play().catch(() => speakWordText(word.k, speed));
}

// split kana into moras: digraphs stay together (き+ょ → きょ),
// sokuon っ attaches to the following mora (がっこう → が, っこ, う)
function splitMoras(kana) {
  const moras = [];
  let i = 0;
  const y = 'ゃゅょ';
  while (i < kana.length) {
    let m = kana[i++];
    if (i < kana.length && y.includes(kana[i])) m += kana[i++];
    if (m === 'っ' && i < kana.length) {
      m += kana[i++];
      if (i < kana.length && y.includes(kana[i])) m += kana[i++];
    }
    moras.push(m);
  }
  return moras;
}

// on a correct answer: play the word slowly.
// with a real recording, slowing playbackRate (pitch-preserved) is smooth by definition
function speakWordSlowly(word) {
  speakWord(word, 0.65);
}

// ---------- speech ----------
function setupRecognizer() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = 'ja-JP';
  rec.interimResults = true;   // show text as it is heard
  rec.maxAlternatives = 3;
  rec.onresult = e => {
    const result = e.results[e.results.length - 1];
    const transcript = result[0].transcript.trim();
    // always display what was heard — live while speaking, final after
    updateHeard(transcript, result.isFinal);
    if (!result.isFinal || answered) return;
    const word = deck[cardIndex];
    // try every alternative the recognizer offered
    const heard = Array.from(result).map(alt => alt.transcript);
    const ok = heard.some(t => checkSpeechResult(t, word));
    if (ok) {
      onCorrect();
    } else {
      onWrong();
      el('card-feedback').textContent =
        `❌ Heard "${transcript}" — try again or reveal`;
    }
    // keep what was recognized on the card, tagged with result
    updateHeard(transcript, result.isFinal, ok);
  };
  rec.onerror = e => {
    const msgs = {
      'no-speech': 'No speech detected — tap the mic and try again',
      'audio-capture': 'No microphone found',
      'not-allowed': 'Microphone permission denied — allow mic access for this page',
      'service-not-allowed': 'Speech service blocked — voice input only works on localhost or HTTPS',
      'network': 'Network error reaching the speech service',
      'aborted': 'Stopped'
    };
    recognizer = null;   // fresh instance on next tap — avoids stale-state errors
    stopListening();
    // cloud ASR unreachable → switch to the offline Whisper model permanently
    if (e.error === 'network' || e.error === 'service-not-allowed') {
      voiceMode = 'whisper';
      localStorage.setItem('voiceMode', 'whisper');
      el('card-feedback').textContent = '☁️ Speech service unreachable — switching to offline recognition…';
      setTimeout(() => startWhisperListen(), 600);
      return;
    }
    if (e.error !== 'aborted') {
      el('card-feedback').textContent = '⚠️ ' + (msgs[e.error] || e.error);
      el('card-heard').textContent = '';
    }
  };
  rec.onend = () => stopListening();
  return rec;
}

async function toggleListening() {
  if (listening) {
    if (voiceMode === 'whisper') {
      await finishWhisperListen();
    } else {
      stopListening();
    }
    return;
  }
  if (voiceMode === 'whisper') {
    await startWhisperListen();
    return;
  }
  if (!recognizer) recognizer = setupRecognizer();
  if (!recognizer) {
    showFeedback(false, 'Speech recognition not supported in this browser — type instead');
    return;
  }
  try {
    listening = true;
    el('card-heard').textContent = '';
    el('btn-mic').classList.add('listening');
    el('btn-mic').textContent = '⏸ 聆听中…';
    el('card-feedback').textContent = '🎙 Say the word in Japanese…';
    recognizer.start();
  } catch (err) {
    // start() throws InvalidStateError if the previous session hasn't fully ended —
    // recreate and retry once after a short delay
    recognizer = null;
    setTimeout(() => toggleListening(), 250);
  }
}

// display what was heard: transcript + its romaji
function updateHeard(transcript, isFinal, ok) {
  const romaji = kanaToRomaji(normalizeInput(replaceKanjiReadings(transcript)));
  const body = transcript + (romaji && romaji !== transcript ? ` (${romaji})` : '');
  let tag = '';
  if (isFinal && ok !== undefined) tag = ok ? '✅ ' : '❌ ';
  else if (!isFinal) tag = '';
  el('card-heard').textContent = tag + body + (isFinal ? '' : ' …');
}

function stopListening() {
  listening = false;
  el('btn-mic').classList.remove('listening');
  el('btn-mic').textContent = '🎙 ことば';
  if (recognizer) {
    try { recognizer.stop(); } catch (e) { /* ignore */ }
  }
}

// ---------- offline Whisper mode ----------
// tap mic → capture PCM → tap again → transcribe locally → check answer

function cleanupWhisperCapture() {
  if (whisperProcessor) {
    whisperProcessor.onaudioprocess = null;
    try { whisperProcessor.disconnect(); } catch (e) { /* ignore */ }
    whisperProcessor = null;
  }
  if (whisperStream) {
    whisperStream.getTracks().forEach(t => t.stop());
    whisperStream = null;
  }
  if (whisperCtx) {
    try { whisperCtx.close(); } catch (e) { /* ignore */ }
    whisperCtx = null;
  }
}

async function startWhisperListen() {
  try {
    listening = true;
    pcmChunks = [];
    el('btn-mic').classList.add('listening');
    el('btn-mic').textContent = '⏸ 聆听中…';
    el('card-feedback').textContent = '🎙 Say the word in Japanese… (offline mode — tap mic again when done)';
    el('card-heard').textContent = '';

    whisperStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    whisperCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = whisperCtx.createMediaStreamSource(whisperStream);
    whisperProcessor = whisperCtx.createScriptProcessor(4096, 1, 1);
    whisperProcessor.onaudioprocess = ev => {
      pcmChunks.push(new Float32Array(ev.inputBuffer.getChannelData(0)));
    };
    source.connect(whisperProcessor);
    whisperProcessor.connect(whisperCtx.destination); // Chrome needs this to keep processing
  } catch (err) {
    cleanupWhisperCapture();
    listening = false;
    el('btn-mic').classList.remove('listening');
    el('btn-mic').textContent = '🎙 ことば';
    showFeedback(false, 'Microphone unavailable: ' + (err.message || err));
  }
}

async function finishWhisperListen() {
  const rate = whisperCtx ? whisperCtx.sampleRate : 44100;
  cleanupWhisperCapture();
  listening = false;
  el('btn-mic').classList.remove('listening');
  el('btn-mic').textContent = '🎙 ことば';

  const { transcribeWithWhisper, resampleTo16k } = await loadWhisperModule();
  const pcm = resampleTo16k(pcmChunks, rate);
  pcmChunks = [];
  if (pcm.length < 16000 * 0.3) {
    showFeedback(false, 'Too short — tap mic, speak, then tap again');
    return;
  }
  if (answered) return;

  el('card-feedback').textContent = '🧠 Recognizing locally…';
  try {
    const text = await transcribeWithWhisper(pcm, showModelProgress);
    const word = deck[cardIndex];
    const ok = checkSpeechResult(text, word);
    if (ok) {
      onCorrect();
    } else {
      onWrong();
      el('card-feedback').textContent = `❌ Heard "${text}" — try again or reveal`;
    }
    updateHeard(text, true, ok);
  } catch (err) {
    showFeedback(false, 'Local recognition failed: ' + (err.message || err));
  }
}

// ---------- done screen ----------
function showDone() {
  stopListening();
  cleanupWhisperCapture();
  el('screen-card').classList.remove('active');
  el('screen-done').classList.add('active');
  el('done-score').textContent = `${score} / ${deck.length}`;
  el('done-streak').textContent = `Best streak: ${bestStreak} 🔥`;

  const missedList = el('done-missed');
  if (missed.length) {
    missedList.innerHTML =
      '<div class="missed-title">Review these:</div>' +
      missed.map(w => `<span class="missed-word">${w.k} <small>${w.r} · ${w.en}</small></span>`).join('');
  } else {
    missedList.innerHTML = '<div class="missed-title">Perfect — no misses! 🎉</div>';
  }
}

function restartSession() {
  el('screen-done').classList.remove('active');
  el('screen-card').classList.add('active');
  cardIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  missed = [];
  deck = shuffle(deck);
  renderCard();
}

function backToSetup() {
  stopListening();
  cleanupWhisperCapture();
  el('screen-done').classList.remove('active');
  el('screen-setup').classList.add('active');
  renderSetup();
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  selection = loadSelection() || { mode: 'level', level: 5, rows: LEVELS[4].rows.slice() };

  el('level-select').addEventListener('change', onLevelChange);
  el('answer-mode').addEventListener('change', onAnswerModeChange);
  el('btn-custom-toggle').addEventListener('click', () => {
    selection.mode = 'custom';
    selection.level = null;
    saveSelection();
    renderSetup();
  });
  el('btn-start').addEventListener('click', startSession);
  el('btn-check').addEventListener('click', submitAnswer);
  el('btn-reveal').addEventListener('click', revealAnswer);
  el('btn-next').addEventListener('click', nextCard);
  el('btn-mic').addEventListener('click', toggleListening);
  el('btn-speak').addEventListener('click', () => speakWord(deck[cardIndex], 0.7));
  el('btn-restart').addEventListener('click', restartSession);
  el('btn-setup').addEventListener('click', backToSetup);

  el('answer-input').addEventListener('keydown', ev => {
    if (ev.key === 'Enter') {
      if (answered) nextCard();
      else submitAnswer();
    }
  });

  renderSetup();
});
