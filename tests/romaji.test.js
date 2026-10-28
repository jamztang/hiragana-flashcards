// Unit tests for prototype/romaji.js — pure logic, loaded like a browser <script>.
import { describe, it, expect } from 'vitest';
import { loadScript } from './helpers/env.js';

loadScript('romaji.js', ['romajiToKana', 'kataToHira', 'kanaToRomaji', 'replaceKanjiReadings',
  'normalizeInput', 'checkTypedAnswer', 'checkSpeechResult', 'normalizeEnglish', 'checkMeaningAnswer']);

const R = () => globalThis;

describe('romajiToKana', () => {
  it('converts basic words', () => {
    expect(R().romajiToKana('neko')).toBe('ねこ');
    expect(R().romajiToKana('umi')).toBe('うみ');
  });

  it('accepts common romanization styles', () => {
    expect(R().romajiToKana('shi')).toBe('し');
    expect(R().romajiToKana('si')).toBe('し');
    expect(R().romajiToKana('chi')).toBe('ち');
    expect(R().romajiToKana('ti')).toBe('ち');
    expect(R().romajiToKana('tsu')).toBe('つ');
    expect(R().romajiToKana('fu')).toBe('ふ');
    expect(R().romajiToKana('hu')).toBe('ふ');
    expect(R().romajiToKana('ji')).toBe('じ');
    expect(R().romajiToKana('zi')).toBe('じ');
  });

  it('handles gemination (small っ)', () => {
    expect(R().romajiToKana('gakkou')).toBe('がっこう');
    expect(R().romajiToKana('kitte')).toBe('きって');
  });

  it('handles ん before consonants and word-end', () => {
    expect(R().romajiToKana('sensei')).toBe('せんせい');
    expect(R().romajiToKana('hon')).toBe('ほん');
    expect(R().romajiToKana('n')).toBe('ん');
  });

  it('handles long vowels written as vowels', () => {
    expect(R().romajiToKana('toukyou')).toBe('とうきょう');
    expect(R().romajiToKana('kyouto')).toBe('きょうと');
  });

  it('handles digraphs', () => {
    expect(R().romajiToKana('kya')).toBe('きゃ');
    expect(R().romajiToKana('sha')).toBe('しゃ');
    expect(R().romajiToKana('ja')).toBe('じゃ');
    expect(R().romajiToKana('rya')).toBe('りゃ');
  });

  it('is case-insensitive and strips spaces/punctuation', () => {
    expect(R().romajiToKana('NEKO')).toBe('ねこ');
    expect(R().romajiToKana(' ne-ko ')).toBe('ねこ');
  });

  it('returns null for unparseable or empty input', () => {
    expect(R().romajiToKana('xyz')).toBe(null);   // x has no syllable
    expect(R().romajiToKana('')).toBe(null);
    expect(R().romajiToKana('   ')).toBe(null);
  });
});

describe('kataToHira', () => {
  it('converts katakana to hiragana', () => {
    expect(R().kataToHira('ネコ')).toBe('ねこ');
    expect(R().kataToHira('ガッコウ')).toBe('がっこう');
  });

  it('leaves hiragana and other characters untouched', () => {
    expect(R().kataToHira('ねこ ABC')).toBe('ねこ ABC');
  });
});

describe('kanaToRomaji', () => {
  it('converts hiragana to romaji', () => {
    expect(R().kanaToRomaji('ねこ')).toBe('neko');
    expect(R().kanaToRomaji('がっこう')).toBe('gakkou');
    expect(R().kanaToRomaji('きょうと')).toBe('kyouto');
    expect(R().kanaToRomaji('し')).toBe('shi');
  });

  it('handles dakuten and digraphs', () => {
    expect(R().kanaToRomaji('じてんしゃ')).toBe('jitensha');
    expect(R().kanaToRomaji('ぴょ')).toBe('pyo');
  });
});

describe('normalizeInput', () => {
  it('strips spaces and punctuation, converts katakana', () => {
    expect(R().normalizeInput('ネコ')).toBe('ねこ');
    expect(R().normalizeInput('ねこ。')).toBe('ねこ');
    expect(R().normalizeInput('ね こ')).toBe('ねこ');
    expect(R().normalizeInput('とーきょー')).toBe('ときょ'); // ー and long-vowel dash stripped
  });
});

describe('checkTypedAnswer', () => {
  const neko = { k: 'ねこ', r: 'neko' };

  it('accepts exact romaji, kana, katakana, and romaji variants', () => {
    expect(R().checkTypedAnswer('neko', neko)).toBe(true);
    expect(R().checkTypedAnswer('NEKO', neko)).toBe(true);
    expect(R().checkTypedAnswer('ねこ', neko)).toBe(true);
    expect(R().checkTypedAnswer('ネコ', neko)).toBe(true);
  });

  it('rejects romaji that parses to different kana', () => {
    expect(R().checkTypedAnswer('nneko', neko)).toBe(false); // んねこ
  });

  it('rejects wrong answers and empty input', () => {
    expect(R().checkTypedAnswer('inu', neko)).toBe(false);
    expect(R().checkTypedAnswer('いぬ', neko)).toBe(false);
    expect(R().checkTypedAnswer('', neko)).toBe(false);
    expect(R().checkTypedAnswer(null, neko)).toBe(false);
  });
});

describe('checkSpeechResult', () => {
  const neko = { k: 'ねこ', r: 'neko' };

  it('resolves kanji transcripts via the readings map', () => {
    expect(R().checkSpeechResult('猫', neko)).toBe(true);
    expect(R().checkSpeechResult('子猫', { k: 'こねこ', r: 'koneko' })).toBe(true);
  });

  it('accepts the word inside a longer phrase', () => {
    expect(R().checkSpeechResult('これは猫です', neko)).toBe(true);
  });

  it('accepts kana and katakana transcripts', () => {
    expect(R().checkSpeechResult('ねこ', neko)).toBe(true);
    expect(R().checkSpeechResult('ネコ', neko)).toBe(true);
  });

  it('rejects unrelated transcripts', () => {
    expect(R().checkSpeechResult('犬', neko)).toBe(false);
    expect(R().checkSpeechResult('', neko)).toBe(false);
  });
});

describe('replaceKanjiReadings', () => {
  it('replaces longest kanji sequences first', () => {
    expect(R().replaceKanjiReadings('子猫')).toBe('こねこ');
    expect(R().replaceKanjiReadings('猫')).toBe('ねこ');
    expect(R().replaceKanjiReadings('東京タワー')).toBe('とうきょうタワー');
  });
});