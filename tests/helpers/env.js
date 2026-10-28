// tests/helpers/env.js — load the prototype's classic scripts into the test
// environment. The app is plain (non-module) browser JS, so we read the files
// and run them with vm.runInThisContext: top-level `const`/`function`
// declarations land in the shared global lexical scope, exactly like
// consecutive <script> tags in the browser.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PROTO = path.join(ROOT, 'prototype');

export const loaded = new Set();

/**
 * Run a prototype script like a browser <script> tag (shared global lexical
 * scope). `exposes` lists top-level const/function names to copy onto
 * globalThis so test modules can access them (lexical bindings are not
 * visible from module scope).
 */
export function loadScript(name, exposes = []) {
  if (loaded.has(name)) return;
  loaded.add(name);
  let code = readFileSync(path.join(PROTO, name), 'utf8');
  for (const n of exposes) {
    code += `\n;globalThis[${JSON.stringify(n)}] = ${n};`;
  }
  vm.runInThisContext(code, { filename: name });
}

// Expose app-internal state for assertions without touching app.js itself.
function exposeApp() {
  vm.runInThisContext(`
    globalThis.__app = {
      get deck() { return deck; },
      get cardIndex() { return cardIndex; },
      get score() { return score; },
      get streak() { return streak; },
      get bestStreak() { return bestStreak; },
      get missed() { return missed; },
      get answered() { return answered; },
      get scored() { return scored; },
      get selection() { return selection; },
      get voiceMode() { return voiceMode; },
      get answerMode() { return answerMode; },
      availableWords,
      shuffle,
      splitMoras,
      startSession,
      submitAnswer,
      nextCard,
      prevCard,
      goToCard,
      speakWord
    };
    // test-only: re-run the app's own init logic for a clean slate between
    // tests (module-level state cannot be re-declared, but it can be
    // reassigned from this shared lexical scope)
    globalThis.__app.resetForTest = function () {
      voiceMode = localStorage.getItem('voiceMode') || 'auto';
      answerMode = localStorage.getItem('answerMode') === 'meaning' ? 'meaning' : 'reading';
      stopListening();
      cleanupWhisperCapture();
      recognizer = null;
      listening = false;
      deck = [];
      cardIndex = 0;
      score = 0;
      streak = 0;
      bestStreak = 0;
      missed = [];
      answered = false;
      scored = new Set();
      el('screen-done').classList.remove('active');
      el('screen-card').classList.remove('active');
      el('screen-setup').classList.add('active');
      selection = loadSelection() || { mode: 'level', level: 5, rows: LEVELS[4].rows.slice() };
      renderSetup();
    };
  `);
}

export function bootApp() {
  // the happy-dom env used here doesn't always register localStorage —
  // provide a minimal in-memory Storage so app.js's persistence works
  if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.getItem) {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
      clear: () => store.clear(),
      key: i => [...store.keys()][i] ?? null,
      get length() { return store.size; }
    };
  }
  // --- browser API stubs app.js touches on load / on answer ---
  globalThis.Audio = class {
    constructor(src) { this.src = src; this.preload = ''; this.playbackRate = 1; }
    play() { (this.played ||= []).push(this.playbackRate); return Promise.resolve(); }
  };
  globalThis.speechSynthesis = {
    getVoices: () => [],
    cancel: () => {},
    speak: (u) => { (globalThis.speechSynthesis.spoken ||= []).push(u); }
  };
  globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  if (!globalThis.speechSynthesis.spoken) globalThis.speechSynthesis.spoken = [];

  // --- DOM from the real index.html ---
  const html = readFileSync(path.join(PROTO, 'index.html'), 'utf8');
  document.documentElement.innerHTML = html.replace(/[\s\S]*?<html>/i, '').replace(/<\/html>[\s\S]*/i, '');

  // --- app code ---
  loadScript('data.js', ['ROWS', 'LEVELS', 'WORDS']);
  loadScript('romaji.js', ['romajiToKana', 'kataToHira', 'kanaToRomaji', 'KANJI_READINGS',
    'replaceKanjiReadings', 'normalizeInput', 'checkTypedAnswer', 'checkSpeechResult',
    'normalizeEnglish', 'checkMeaningAnswer']);
  loadScript('app.js');
  exposeApp();

  // app.js registers a DOMContentLoaded listener; the document is already
  // parsed here, so fire it manually — same as a fresh page load.
  document.dispatchEvent(new Event('DOMContentLoaded'));
  return globalThis.__app;
}

// Deterministic SpeechRecognition double: records start() calls and lets the
// test fire onresult / onerror / onend whenever it wants.
export class MockRecognizer {
  static instances = [];
  constructor() {
    this.lang = '';
    this.interimResults = false;
    this.maxAlternatives = 1;
    this.started = 0;
    MockRecognizer.instances.push(this);
  }
  start() { this.started++; }
  stop() { this.onend?.(); }
  // transcripts: array of alternative transcripts, e.g. ['ねこ'] or ['猫','ねこ']
  result(transcripts, isFinal = true) {
    const alts = transcripts.map(t => ({ transcript: t }));
    alts.isFinal = isFinal;
    const results = [alts];
    results.length = 1;
    this.onresult?.({ results, resultIndex: 0 });
  }
  error(code) { this.onerror?.({ error: code }); }
}