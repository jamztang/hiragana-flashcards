// Unit tests for prototype/data.js and the meaning-mode checker in romaji.js.
// These are asset-integrity canaries: they catch bad word entries, missing
// audio files, and level math regressions the moment data.js is edited.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadScript } from './helpers/env.js';

const PROTO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'prototype');
loadScript('data.js', ['ROWS', 'LEVELS', 'WORDS']);
loadScript('romaji.js', ['romajiToKana', 'checkMeaningAnswer']);

const { ROWS, LEVELS, WORDS } = globalThis;

describe('ROWS', () => {
  it('has no duplicate characters across rows', () => {
    const all = ROWS.flatMap(r => [...r.chars]);
    expect(new Set(all).size).toBe(all.length);
  });

  it('covers all 46 basic gojūon + dakuten + small characters', () => {
    const chars = new Set(ROWS.flatMap(r => [...r.chars]));
    for (const ch of 'あいうえおかきくけこさしすせそたちつてとなにぬねの'
      + 'はひふへほまみむめもやゆよらりるれろわをん'
      + 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょ') {
      expect(chars.has(ch), `missing: ${ch}`).toBe(true);
    }
  });
});

describe('LEVELS', () => {
  it('references valid row ids', () => {
    const ids = new Set(ROWS.map(r => r.id));
    for (const l of LEVELS) for (const id of l.rows) expect(ids.has(id)).toBe(true);
  });

  it('grows monotonically: each level includes the previous level’s rows', () => {
    for (let i = 1; i < LEVELS.length; i++) {
      for (const id of LEVELS[i - 1].rows) {
        expect(LEVELS[i].rows).toContain(id);
      }
    }
  });

  it('matches the documented word counts (README: 6 → 114)', () => {
    const expected = [6, 16, 25, 34, 45, 53, 80, 89, 105, 114];
    LEVELS.forEach((l, i) => {
      const set = new Set(l.rows.flatMap(id => [...ROWS.find(r => r.id === id).chars]));
      const count = WORDS.filter(w => [...w.k].every(c => set.has(c))).length;
      expect(count, `level ${l.n}`).toBe(expected[i]);
    });
  });
});

describe('WORDS', () => {
  it('has 114 entries with no duplicate kana', () => {
    expect(WORDS).toHaveLength(114);
    const keys = WORDS.map(w => w.k);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('has romaji that round-trips to the kana spelling', () => {
    for (const w of WORDS) {
      expect(globalThis.romajiToKana(w.r), `${w.k} (r: ${w.r})`).toBe(w.k);
    }
  });

  it('is fully spellable from the character rows (reachable at Level 10)', () => {
    const chars = new Set(ROWS.flatMap(r => [...r.chars]));
    for (const w of WORDS) {
      for (const ch of [...w.k]) {
        expect(chars.has(ch), `${w.k} uses unlisted char ${ch}`).toBe(true);
      }
    }
  });

  it('has a required field set (k, r, en, e) for every word', () => {
    for (const w of WORDS) {
      expect(w.k, 'kana').toBeTruthy();
      expect(w.r, 'romaji').toBeTruthy();
      expect(w.en, 'meaning').toBeTruthy();
      expect(w.e, 'emoji').toBeTruthy();
    }
  });

  it('has a recording in audio/words/<kana>.m4a for every word', () => {
    // macOS may store filenames in NFD — compare NFC-normalized names
    const files = new Set(readdirSync(path.join(PROTO, 'audio', 'words')).map(f => f.normalize('NFC')));
    for (const w of WORDS) {
      expect(files.has(`${w.k.normalize('NFC')}.m4a`), `missing audio for ${w.k}`).toBe(true);
    }
  });
});

describe('checkMeaningAnswer (意味 mode)', () => {
  const gohan = { k: 'ごはん', en: 'rice / meal' };
  const kutsu = { k: 'くつ', en: 'shoes' };
  const neko = { k: 'ねこ', en: 'cat' };

  it('accepts the exact meaning, case/punctuation-insensitive', () => {
    expect(globalThis.checkMeaningAnswer('cat', neko)).toBe(true);
    expect(globalThis.checkMeaningAnswer('Cat!', neko)).toBe(true);
  });

  it('accepts any "/" alternative', () => {
    expect(globalThis.checkMeaningAnswer('rice', gohan)).toBe(true);
    expect(globalThis.checkMeaningAnswer('meal', gohan)).toBe(true);
  });

  it('tolerates a leading article and simple plurals', () => {
    expect(globalThis.checkMeaningAnswer('the shoe', kutsu)).toBe(true);
    expect(globalThis.checkMeaningAnswer('a cat', neko)).toBe(true);
    expect(globalThis.checkMeaningAnswer('vegetable', { k: 'やさい', en: 'vegetables' })).toBe(true);
  });

  it('rejects wrong meanings and empty input', () => {
    expect(globalThis.checkMeaningAnswer('dog', neko)).toBe(false);
    expect(globalThis.checkMeaningAnswer('', neko)).toBe(false);
    expect(globalThis.checkMeaningAnswer(null, neko)).toBe(false);
  });
});