// romaji.js — romaji → kana conversion + input normalization
//
// Accepts common romanization styles:
//   shi/si → し, chi/ti → ち, tsu/tu → つ, fu/hu → ふ, ji/zi → じ
//   double consonants → small っ (gakkou → がっこう)
//   "n" before consonant / at end → ん (sensei → せんせい)
//   long vowels as vowels: ou → おう (toukyou → とうきょう)
//   digraphs: kya/sha/cha/ja/rya… → きゃ/しゃ/ちゃ/じゃ/りゃ

const SYL = {
  // digraphs (3-char / special) first
  'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ', 'kye': 'きぇ',
  'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ', 'she': 'しぇ', 'shi': 'し',
  'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ', 'che': 'ちぇ', 'chi': 'ち',
  'tsa': 'つぁ', 'tsu': 'つ', 'tso': 'つぉ',
  'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
  'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
  'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
  'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
  'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
  'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ', 'je': 'じぇ', 'ji': 'じ',
  'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
  'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
  'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ', 'fyu': 'ふゅ',
  // base syllables
  'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お',
  'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
  'sa': 'さ', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
  'ta': 'た', 'ti': 'ち', 'tu': 'つ', 'te': 'て', 'to': 'と',
  'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
  'ha': 'は', 'hi': 'ひ', 'hu': 'ふ', 'fu': 'ふ', 'he': 'へ', 'ho': 'ほ',
  'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
  'ya': 'や', 'yu': 'ゆ', 'yo': 'よ', 'yi': 'い',
  'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
  'wa': 'わ', 'wi': 'ゐ', 'we': 'ゑ', 'wo': 'を',
  'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
  'za': 'ざ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
  'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
  'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
  'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
  'vu': 'ゔ',
  'n': 'ん'
};

const CONSONANTS = 'bcdfghjklmnpqrstvwz';

// Convert romaji string to hiragana. Returns null if unparseable.
function romajiToKana(input) {
  const s = input.toLowerCase().replace(/[\s\-_.']/g, '');
  if (!s) return null;
  let out = '';
  let i = 0;
  while (i < s.length) {
    const c1 = s[i], c2 = s.slice(i, i + 2), c3 = s.slice(i, i + 3);
    // gemination: same consonant twice (not "nn" — that's just ん)
    if (c2.length === 2 && c1 !== 'n' && CONSONANTS.includes(c1) && c1 === s[i + 1]) {
      out += 'っ';
      i += 1;
      continue;
    }
    // "n" before consonant or at end → ん
    if (c1 === 'n' && !/[aiueoy]/.test(s[i + 1] || '')) {
      out += 'ん';
      i += 1;
      continue;
    }
    // longest match first
    if (SYL[c3]) { out += SYL[c3]; i += 3; continue; }
    if (SYL[c2]) { out += SYL[c2]; i += 2; continue; }
    if (SYL[c1]) { out += SYL[c1]; i += 1; continue; }
    return null; // unrecognized input
  }
  return out;
}

// katakana → hiragana
function kataToHira(s) {
  return s.replace(/[\u30A1-\u30F6]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// ---------- kana → romaji (display what was heard as romaji) ----------
const KANA_TO_ROMA = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'di', 'づ': 'du', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ゔ': 'vu',
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo'
};

function kanaToRomaji(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], next = s[i + 1] || '';
    if (ch === 'っ') {                 // geminate: double next consonant
      const r = kanaToRomaji(next);
      out += r ? r[0] : '';
      continue;
    }
    if (next && 'ゃゅょ'.includes(next) && KANA_TO_ROMA[ch]) {  // digraph: き+ゃ → kya
      let base = KANA_TO_ROMA[ch];
      let tail = KANA_TO_ROMA[next];              // ya / yu / yo
      if (ch === 'し' || ch === 'ち' || ch === 'じ') {
        base = base.slice(0, -1);                 // shi→sh, chi→ch, ji→j
        tail = tail.slice(1);                     // ya→a, yu→u, yo→o
      } else {
        base = base.slice(0, -1);                 // ki→k, ri→r …
      }
      out += base + tail;
      i++;
      continue;
    }
    out += KANA_TO_ROMA[ch] || '';
  }
  return out;
}

// ---------- kanji readings for ASR transcripts ----------
// The recognizer returns natural Japanese orthography — often kanji (猫, not ねこ).
// Map the most common outputs for our word bank before matching.
const KANJI_READINGS = {
  '子猫': 'こねこ', '猫': 'ねこ', '犬': 'いぬ', '雨': 'あめ', '海': 'うみ',
  '山': 'やま', '花': 'はな', '星': 'ほし', '月': 'つき', '鳥': 'とり',
  '本': 'ほん', '手': 'て', '目': 'め', '口': 'くち', '耳': 'みみ',
  '石': 'いし', '雪': 'ゆき', '春': 'はる', '夏': 'なつ', '秋': 'あき',
  '人': 'ひと', '男': 'おとこ', '女': 'おんな', '私': 'わたし', '水': 'みず',
  '風': 'かぜ', '魚': 'さかな', '卵': 'たまご', '窓': 'まど', '鏡': 'かがみ',
  '薬': 'くすり', '紙': 'かみ', '神': 'かみ', '道': 'みち', '家': 'いえ',
  '椅子': 'いす', '箱': 'はこ', '船': 'ふね', '骨': 'ほね', '金': 'かね',
  '鐘': 'かね', '布': 'ぬの', '庭': 'にわ', '肉': 'にく', '傘': 'かさ',
  '柿': 'かき', '西瓜': 'すいか', '蛸': 'たこ', '部屋': 'へや', '公園': 'こうえん',
  '学校': 'がっこう', '先生': 'せんせい', '日本': 'にほん', '東京': 'とうきょう',
  '京都': 'きょうと', '病院': 'びょういん', '郵便局': 'ゆうびんきょく',
  '友達': 'ともだち', '林檎': 'りんご', '電話': 'でんわ', '電車': 'でんしゃ',
  '電気': 'でんき', '自動車': 'じどうしゃ', '大学': 'だいがく', '時計': 'とけい',
  '果物': 'くだもの', '野菜': 'やさい', '新聞': 'しんぶん', 'お茶': 'おちゃ',
  'お金': 'おかね', '値段': 'ねだん', '問題': 'もんだい', '歴史': 'れきし',
  '氷': 'こおり', '昼': 'ひる', '夜': 'よる', '六': 'ろく', '空手': 'からて',
  '侍': 'さむらい', '赤': 'あか', '青': 'あお', '朝': 'あさ', '飛行機': 'ひこうき',
  '凧': 'たこ', '木': 'き', '丘': 'おか', '駅': 'えき', '牛': 'うし',
  '虫': 'むし', '村': 'むら', '豆': 'まめ', '物': 'もの', '橋': 'はし',
  '箸': 'はし', '顔': 'かお', '声': 'こえ', '鯉': 'こい', '何': 'なに',
  '愛': 'あい', '絵': 'え', '上': 'うえ'
};

// Replace known kanji (longest first) with their kana readings
function replaceKanjiReadings(s) {
  let out = s;
  const entries = Object.entries(KANJI_READINGS).sort((a, b) => b[0].length - a[0].length);
  for (const [kanji, kana] of entries) {
    out = out.split(kanji).join(kana);
  }
  return out;
}

// normalize a raw typed answer / speech transcript for comparison
function normalizeInput(raw) {
  return kataToHira(raw)
    .replace(/[\s\u3000]/g, '')
    .replace(/[。、！？\.,!?\-ー〜・「」『』]/g, '')
    .trim();
}

// Check a typed answer against a word ({k, r})
function checkTypedAnswer(raw, word) {
  const t = (raw || '').trim().toLowerCase();
  if (!t) return false;
  if (t === word.r) return true;                      // exact romaji match
  const norm = normalizeInput(t);
  if (norm === word.k) return true;                   // direct kana input
  const kana = romajiToKana(t);
  return !!(kana && kana === word.k);                 // romaji → kana conversion
}

// Check a speech recognition result against a word
// ASR often returns kanji (猫 not ねこ) — resolve readings first
function checkSpeechResult(transcript, word) {
  const withReadings = replaceKanjiReadings(transcript || '');
  const norm = normalizeInput(withReadings);
  if (!norm) return false;
  if (norm === word.k) return true;                   // exact kana
  if (norm.includes(word.k)) return true;             // word contained in longer phrase
  const kana = romajiToKana(norm);
  return !!(kana && kana === word.k);                 // ASR sometimes returns romaji
}

// ---------- meaning answer checking (意味 mode) ----------
// normalize an English answer: lowercase, strip punctuation, collapse spaces
function normalizeEnglish(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[.,!?;:'"()\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Check a typed English meaning against a word.
// Accepts: exact meaning, any "/" alternative (e.g. "rice" for "rice / meal"),
// optional leading article ("a", "an", "the"), and simple plural/singular forms.
function checkMeaningAnswer(raw, word) {
  const typed = normalizeEnglish(raw);
  if (!typed) return false;
  const stripped = typed.replace(/^(the|a|an) /, '');
  const alts = (word.en || '').split('/').map(normalizeEnglish);
  for (const alt of alts) {
    if (!alt) continue;
    if (typed === alt || stripped === alt) return true;
    // simple plural tolerance (vegetables ↔ vegetable, shoes ↔ shoe)
    if (alt.endsWith('s') && stripped === alt.slice(0, -1)) return true;
    if (stripped === alt + 's') return true;
  }
  return false;
}
