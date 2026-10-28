// Integration tests for prototype/app.js — the real scripts run against the
// real index.html DOM (happy-dom), with browser APIs (Audio, TTS, speech
// recognition) stubbed. The app loads once per file, so state carries between
// tests: every test that needs a known deck starts with selectLevel(5).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootApp, MockRecognizer } from './helpers/env.js';

const app = bootApp();
const el = id => document.getElementById(id);
const active = () => [...document.querySelectorAll('.screen')].find(s => s.classList.contains('active'))?.id;

function selectLevel(n) {
  el('level-select').value = String(n);
  el('level-select').dispatchEvent(new Event('change'));
}

function startLevel(n) {
  selectLevel(n);
  el('btn-start').click();
  return app.availableWords();
}

beforeEach(() => {
  localStorage.clear();
  MockRecognizer.instances = [];
  app.resetForTest();
});

describe('setup screen', () => {
  it('boots into setup with the default level 5 selection', () => {
    expect(active()).toBe('screen-setup');
    expect(app.selection).toMatchObject({ mode: 'level', level: 5 });
    expect(el('word-count').textContent).toBe('45 words available');
    expect(el('btn-start').disabled).toBe(false);
  });

  it('updates the word count when the level changes', () => {
    selectLevel(1);
    expect(el('word-count').textContent).toBe('6 words available');
    expect(app.selection).toMatchObject({ mode: 'level', level: 1 });
  });

  it('disables start when the selection unlocks no words', () => {
    el('btn-custom-toggle').click();
    document.querySelectorAll('#row-grid input').forEach(cb => {
      if (cb.checked) { cb.checked = false; cb.dispatchEvent(new Event('change')); }
    });
    expect(el('word-count').textContent).toBe('No words available — pick more characters');
    expect(el('btn-start').disabled).toBe(true);
  });

  it('persists the answer mode', () => {
    el('answer-mode').value = 'meaning';
    el('answer-mode').dispatchEvent(new Event('change'));
    expect(localStorage.getItem('answerMode')).toBe('meaning');
  });
});

describe('card screen — typing', () => {
  it('starts a session with a shuffled deck containing exactly the available words', () => {
    const words = startLevel(5);
    expect(active()).toBe('screen-card');
    expect(app.deck).toHaveLength(45);
    expect([...app.deck].sort((a, b) => a.k.localeCompare(b.k)).map(w => w.k))
      .toEqual(words.sort((a, b) => a.k.localeCompare(b.k)).map(w => w.k));
    expect(el('card-progress').textContent).toBe('1 / 45');
    expect(el('card-word').textContent).toBe(app.deck[0].k);
  });

  it('accepts a correct typed answer and unlocks Next', () => {
    startLevel(5);
    el('answer-input').value = app.deck[0].r;   // romaji of the current word
    app.submitAnswer();
    expect(app.answered).toBe(true);
    expect(app.score).toBe(1);
    expect(app.streak).toBe(1);
    expect(el('screen-card').classList.contains('revealed')).toBe(true);
    expect(el('btn-next').disabled).toBe(false);
    expect(el('btn-check').disabled).toBe(true);
  });

  it('rejects a wrong answer without advancing', () => {
    startLevel(5);
    el('answer-input').value = 'xxxxxxxx';
    app.submitAnswer();
    expect(app.answered).toBe(false);
    expect(app.score).toBe(0);
    expect(el('btn-next').disabled).toBe(true);
  });

  it('Enter submits, and arrow keys navigate after answering', () => {
    startLevel(5);
    el('answer-input').value = app.deck[0].r;
    el('answer-input').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(app.answered).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(app.cardIndex).toBe(1);
    expect(el('card-progress').textContent).toBe('2 / 45');
  });

  it('does not double-score revisited cards', () => {
    startLevel(1); // small deck for speed
    el('answer-input').value = app.deck[0].r;
    app.submitAnswer();
    expect(app.score).toBe(1);
    app.nextCard();
    app.prevCard();
    el('answer-input').value = app.deck[0].r;
    app.submitAnswer();
    expect(app.score).toBe(1);
  });

  it('a wrong first attempt puts the word in review even if answered later', () => {
    startLevel(1);
    const first = app.deck[0];
    el('answer-input').value = 'xxxxxxxx';
    app.submitAnswer();
    expect(app.answered).toBe(false);
    expect(app.missed).toContainEqual(first);   // failed at first try
    el('answer-input').value = first.r;
    app.submitAnswer();
    expect(app.answered).toBe(true);
    expect(app.score).toBe(0);                  // failure already recorded — no score
    expect(app.missed).toContainEqual(first);   // stays in review
  });

  it('revealing without a wrong attempt also counts as a failure', () => {
    startLevel(1);
    const first = app.deck[0];
    el('btn-reveal').click();
    expect(app.missed).toContainEqual(first);
    expect(el('card-romaji').textContent).toBe(first.r);
    app.nextCard();
    app.prevCard();
    el('answer-input').value = first.r;
    app.submitAnswer();
    expect(app.score).toBe(0);
    expect(app.missed).toContainEqual(first);
  });
});

describe('meaning (意味) mode', () => {
  it('hides the meaning, accepts English answers, ignores the kana answer', () => {
    startLevel(1);
    el('answer-mode').value = 'meaning';
    el('answer-mode').dispatchEvent(new Event('change'));
    app.nextCard(); // renderCard applies the new mode (advanced from answered card 0)
    expect(el('screen-card').classList.contains('mode-meaning')).toBe(true);
    el('answer-input').value = app.deck[1].k;  // kana is not a meaning answer
    app.submitAnswer();
    expect(app.answered).toBe(false);
    el('answer-input').value = app.deck[1].en.split(' / ')[0];
    app.submitAnswer();
    expect(app.answered).toBe(true);
  });
});

describe('done screen', () => {
  it('shows the final score and missed-words review', () => {
    startLevel(1);
    el('answer-input').value = app.deck[0].r;
    app.submitAnswer();
    app.nextCard();
    while (active() === 'screen-card') {
      el('btn-reveal').click();
      app.nextCard();
    }
    expect(active()).toBe('screen-done');
    expect(el('done-score').textContent).toBe('1 / 6');
    expect(el('done-missed').textContent).toContain('Review these:');
  });
});

describe('review missed words (done screen)', () => {
  // finish a 6-word Level 1 session, revealing the first `revealedFirst` cards
  function finishSession(revealedFirst = 0) {
    startLevel(1);
    for (let i = 0; i < revealedFirst; i++) {
      el('btn-reveal').click();
      app.nextCard();
    }
    while (active() === 'screen-card') {
      el('answer-input').value = app.deck[app.cardIndex].r;
      app.submitAnswer();
      app.nextCard();
    }
  }

  it('offers a retry button after a session with misses', () => {
    finishSession(2);
    expect(active()).toBe('screen-done');
    const btn = el('btn-review-missed');
    expect(btn).toBeTruthy();
    expect(btn.hidden).toBe(false);

    btn.click();
    expect(active()).toBe('screen-card');
    expect(app.deck).toHaveLength(2);
    expect(app.deck.map(w => w.k).sort()).toEqual(app.missed.map(w => w.k).sort());
    expect(app.score).toBe(0);
    expect(el('card-progress').textContent).toBe('1 / 2');
  });

  it('a redeemed review session ends with no misses and hides the button', () => {
    finishSession(2);
    el('btn-review-missed').click();
    while (active() === 'screen-card') {
      el('answer-input').value = app.deck[app.cardIndex].r;
      app.submitAnswer();
      app.nextCard();
    }
    expect(active()).toBe('screen-done');
    expect(el('done-score').textContent).toBe('2 / 2');
    expect(el('done-missed').textContent).toContain('Perfect');
    expect(el('btn-review-missed').hidden).toBe(true);
  });

  it('review-round successes clear words from the missed list', () => {
    finishSession(2);
    el('btn-review-missed').click();
    // both review words answered correctly on their (per-session) first try
    while (active() === 'screen-card') {
      el('answer-input').value = app.deck[app.cardIndex].r;
      app.submitAnswer();
      app.nextCard();
    }
    expect(active()).toBe('screen-done');
    expect(el('done-score').textContent).toBe('2 / 2');
    expect(el('done-missed').textContent).toContain('Perfect');
    expect(el('btn-review-missed').hidden).toBe(true);
  });

  it('words revealed again during review stay in the missed list', () => {
    finishSession(2);
    el('btn-review-missed').click();
    el('btn-reveal').click();
    expect(app.missed.map(w => w.k).sort()).toEqual(app.deck.map(w => w.k).sort());
    // and no duplicate entry for the same word
    expect(app.missed).toHaveLength(2);
  });

  it('hides the retry button when nothing was missed', () => {
    finishSession(0);
    expect(active()).toBe('screen-done');
    expect(el('done-missed').textContent).toContain('Perfect');
    expect(el('btn-review-missed').hidden).toBe(true);
  });
});

describe('voice input', () => {
  afterEach(() => vi.useRealTimers());

  function mockSpeech() {
    window.SpeechRecognition = MockRecognizer;
    globalThis.SpeechRecognition = MockRecognizer;
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('no mic')) }
    });
  }

  it('falls back to offline Whisper mode when the cloud service errors', async () => {
    vi.useFakeTimers();
    mockSpeech();
    startLevel(5);
    el('btn-mic').click();
    const rec = MockRecognizer.instances.at(-1);
    expect(rec.started).toBe(1);
    expect(el('btn-mic').classList.contains('listening')).toBe(true);

    rec.error('network');
    await vi.advanceTimersByTimeAsync(700); // fallback starts Whisper capture after 600ms
    expect(app.voiceMode).toBe('whisper');
    expect(localStorage.getItem('voiceMode')).toBe('whisper');
    // getUserMedia is unavailable in the test env → mic error message, not a crash
    expect(el('card-feedback').textContent).toMatch(/Microphone unavailable/);
  });

  it('tries every recognizer alternative when matching a transcript', () => {
    mockSpeech();
    startLevel(1);
    el('btn-mic').click();
    const rec = MockRecognizer.instances.at(-1);
    rec.result(['犬', app.deck[0].k]);  // first alternative wrong, second matches
    expect(app.answered).toBe(true);
    expect(el('card-heard').textContent).toContain('✅');
  });
});

describe('mora splitting (reward pacing)', () => {
  it('keeps digraphs together and attaches っ to the following mora', () => {
    expect(app.splitMoras('きょうと')).toEqual(['きょ', 'う', 'と']);
    expect(app.splitMoras('がっこう')).toEqual(['が', 'っこ', 'う']);
    expect(app.splitMoras('ねこ')).toEqual(['ね', 'こ']);
  });
});