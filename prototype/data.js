// data.js — hiragana rows, level presets, and the noun bank
// WORDS: k = hiragana, r = romaji (as typed to match), en = meaning, e = emoji
// A word is available for a selection when every char of k is within the selected rows.

const ROWS = [
  { id: 'a',  name: 'あ行', chars: 'あいうえお' },
  { id: 'ka', name: 'か行', chars: 'かきくけこ' },
  { id: 'sa', name: 'さ行', chars: 'さしすせそ' },
  { id: 'ta', name: 'た行', chars: 'たちつてと' },
  { id: 'na', name: 'な行', chars: 'なにぬねの' },
  { id: 'ha', name: 'は行', chars: 'はひふへほ' },
  { id: 'ma', name: 'ま行', chars: 'まみむめも' },
  { id: 'ya', name: 'や行', chars: 'やゆよ' },
  { id: 'ra', name: 'ら行', chars: 'らりるれろ' },
  { id: 'wa', name: 'わ行・ん', chars: 'わをん' },
  { id: 'dakuten', name: 'だくてん (が〜ぱ)', chars: 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ' },
  { id: 'small', name: '小さい字 (っゃゅょ)', chars: 'っゃゅょぁぃぅぇぉ' }
];

const LEVELS = [
  { n: 1,  label: 'Level 1 — あ行',              rows: ['a'] },
  { n: 2,  label: 'Level 2 — あ・か行',           rows: ['a', 'ka'] },
  { n: 3,  label: 'Level 3 — あ〜さ行',           rows: ['a', 'ka', 'sa'] },
  { n: 4,  label: 'Level 4 — あ〜た行',           rows: ['a', 'ka', 'sa', 'ta'] },
  { n: 5,  label: 'Level 5 — あ〜な行',           rows: ['a', 'ka', 'sa', 'ta', 'na'] },
  { n: 6,  label: 'Level 6 — あ〜は行',           rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha'] },
  { n: 7,  label: 'Level 7 — あ〜ら行',           rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra'] },
  { n: 8,  label: 'Level 8 — ひらがな全部',       rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa'] },
  { n: 9,  label: 'Level 9 — だくてん',           rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'dakuten'] },
  { n: 10, label: 'Level 10 — 小さい字も全部',   rows: ['a', 'ka', 'sa', 'ta', 'na', 'ha', 'ma', 'ya', 'ra', 'wa', 'dakuten', 'small'] }
];

const WORDS = [
  // Level 1 — あ行 only
  { k: 'あい',   r: 'ai',    en: 'love',        e: '❤️' },
  { k: 'あお',   r: 'ao',    en: 'blue',        e: '🟦' },
  { k: 'いえ',   r: 'ie',    en: 'house',       e: '🏠' },
  { k: 'うえ',   r: 'ue',    en: 'above / top', e: '⬆️' },
  { k: 'え',     r: 'e',     en: 'picture',     e: '🖼️' },
  { k: 'いいえ', r: 'iie',   en: 'no',          e: '🙅' },

  // Level 2 — +か行
  { k: 'あか',   r: 'aka',   en: 'red',         e: '🟥' },
  { k: 'あき',   r: 'aki',   en: 'autumn',      e: '🍂' },
  { k: 'あめ',   r: 'ame',   en: 'rain',        e: '🌧️' },
  { k: 'あさ',   r: 'asa',   en: 'morning',     e: '🌅' },
  { k: 'いし',   r: 'ishi',  en: 'stone',       e: '🪨' },
  { k: 'いか',   r: 'ika',   en: 'squid',       e: '🦑' },
  { k: 'いぬ',   r: 'inu',   en: 'dog',         e: '🐕' },
  { k: 'うみ',   r: 'umi',   en: 'sea',         e: '🌊' },
  { k: 'うし',   r: 'ushi',  en: 'cow',         e: '🐄' },
  { k: 'えき',   r: 'eki',   en: 'station',     e: '🚉' },
  { k: 'おか',   r: 'oka',   en: 'hill',        e: '⛰️' },
  { k: 'かお',   r: 'kao',   en: 'face',        e: '😀' },
  { k: 'かき',   r: 'kaki',  en: 'persimmon',   e: '🍊' },
  { k: 'き',     r: 'ki',    en: 'tree',        e: '🌳' },
  { k: 'こえ',   r: 'koe',   en: 'voice',       e: '🗣️' },
  { k: 'こい',   r: 'koi',   en: 'carp',        e: '🐟' },

  // Level 3 — +さ行
  { k: 'おかし', r: 'okashi', en: 'snack / sweets', e: '🍪' },
  { k: 'かさ',   r: 'kasa',   en: 'umbrella',       e: '☂️' },
  { k: 'しお',   r: 'shio',   en: 'salt',           e: '🧂' },
  { k: 'すいか', r: 'suika',  en: 'watermelon',     e: '🍉' },
  { k: 'すし',   r: 'sushi',  en: 'sushi',          e: '🍣' },
  { k: 'さくら', r: 'sakura', en: 'cherry blossom', e: '🌸' },
  { k: 'いす',   r: 'isu',    en: 'chair',          e: '🪑' },

  // Level 4 — +た行
  { k: 'たこ',   r: 'tako',   en: 'octopus', e: '🐙' },
  { k: 'つき',   r: 'tsuki',  en: 'moon',    e: '🌕' },
  { k: 'とり',   r: 'tori',   en: 'bird',    e: '🐦' },
  { k: 'くち',   r: 'kuchi',  en: 'mouth',   e: '👄' },
  { k: 'くつ',   r: 'kutsu',  en: 'shoes',   e: '👟' },
  { k: 'て',     r: 'te',     en: 'hand',    e: '✋' },
  { k: 'した',   r: 'shita',  en: 'under',   e: '⬇️' },
  { k: 'おとこ', r: 'otoko',  en: 'man',     e: '🧍' },
  { k: 'とけい', r: 'tokei',  en: 'clock',   e: '🕐' },
  { k: 'たいこ', r: 'taiko',  en: 'drum',    e: '🥁' },

  // Level 5 — +な行
  { k: 'さかな', r: 'sakana', en: 'fish',    e: '🐟' },
  { k: 'ねこ',   r: 'neko',   en: 'cat',       e: '🐈' },
  { k: 'にわ',   r: 'niwa',   en: 'garden',    e: '🌻' },
  { k: 'かね',   r: 'kane',   en: 'bell / money', e: '🔔' },
  { k: 'こねこ', r: 'koneko', en: 'kitten',    e: '🐱' },
  { k: 'ぬの',   r: 'nuno',   en: 'cloth',     e: '🧵' },
  { k: 'にく',   r: 'niku',   en: 'meat',      e: '🥩' },
  { k: 'なつ',   r: 'natsu',  en: 'summer',    e: '☀️' },
  { k: 'なに',   r: 'nani',   en: 'what',      e: '❓' },

  // Level 6 — +は行
  { k: 'はな',   r: 'hana',   en: 'flower',     e: '🌸' },
  { k: 'はこ',   r: 'hako',   en: 'box',        e: '📦' },
  { k: 'はし',   r: 'hashi',  en: 'chopsticks', e: '🥢' },
  { k: 'ふね',   r: 'fune',   en: 'boat',       e: '⛵' },
  { k: 'へや',   r: 'heya',   en: 'room',       e: '🚪' },
  { k: 'ほし',   r: 'hoshi',  en: 'star',       e: '⭐' },
  { k: 'ひと',   r: 'hito',   en: 'person',     e: '🧍' },
  { k: 'ほね',   r: 'hone',   en: 'bone',       e: '🦴' },
  { k: 'ひこうき', r: 'hikouki', en: 'airplane', e: '✈️' },

  // Level 7 — +ま行・や行・ら行
  { k: 'みみ',   r: 'mimi',    en: 'ears',       e: '👂' },
  { k: 'まめ',   r: 'mame',    en: 'beans',      e: '🫘' },
  { k: 'むし',   r: 'mushi',   en: 'insect',     e: '🐛' },
  { k: 'むら',   r: 'mura',    en: 'village',    e: '🏘️' },
  { k: 'め',     r: 'me',      en: 'eye',        e: '👁️' },
  { k: 'もの',   r: 'mono',    en: 'thing',      e: '📦' },
  { k: 'やさい', r: 'yasai',   en: 'vegetables', e: '🥬' },
  { k: 'やま',   r: 'yama',    en: 'mountain',   e: '⛰️' },
  { k: 'ゆき',   r: 'yuki',    en: 'snow',       e: '❄️' },
  { k: 'よる',   r: 'yoru',    en: 'night',      e: '🌙' },
  { k: 'みち',   r: 'michi',   en: 'road',       e: '🛣️' },
  { k: 'かみ',   r: 'kami',    en: 'paper / god', e: '📜' },
  { k: 'さむらい', r: 'samurai', en: 'samurai',  e: '⚔️' },
  { k: 'からて', r: 'karate',  en: 'karate',     e: '🥋' },
  { k: 'れきし', r: 'rekishi', en: 'history',    e: '📚' },
  { k: 'ろく',   r: 'roku',    en: 'six',        e: '6️⃣' },
  { k: 'こおり', r: 'koori',   en: 'ice',        e: '🧊' },
  { k: 'はる',   r: 'haru',    en: 'spring',     e: '🌱' },
  { k: 'ひる',   r: 'hiru',    en: 'daytime',    e: '🌞' },

  // Level 8 — +わ行・ん
  { k: 'わに',   r: 'wani',    en: 'crocodile',   e: '🐊' },
  { k: 'わたし', r: 'watashi', en: 'I / me',      e: '🙋' },
  { k: 'ほん',   r: 'hon',     en: 'book',        e: '📕' },
  { k: 'せんせい', r: 'sensei', en: 'teacher',    e: '🧑‍🏫' },
  { k: 'こうえん', r: 'kouen',  en: 'park',       e: '🏞️' },
  { k: 'ちから', r: 'chikara', en: 'strength',    e: '💪' },
  { k: 'くすり', r: 'kusuri',  en: 'medicine',    e: '💊' },
  { k: 'おふろ', r: 'ofuro',   en: 'bath',        e: '🛁' },
  { k: 'てんき', r: 'tenki',   en: 'weather',     e: '⛅' },
  { k: 'にほん', r: 'nihon',   en: 'Japan',       e: '🇯🇵' },
  { k: 'おんな', r: 'onna',    en: 'woman',       e: '👩' },

  // Level 9 — +だくてん
  { k: 'がっこう', r: 'gakkou',     en: 'school',      e: '🏫' },
  { k: 'でんわ',   r: 'denwa',      en: 'telephone',   e: '📞' },
  { k: 'だいがく', r: 'daigaku',    en: 'university',  e: '🎓' },
  { k: 'ともだち', r: 'tomodachi',  en: 'friend',      e: '🫂' },
  { k: 'りんご',   r: 'ringo',      en: 'apple',       e: '🍎' },
  { k: 'でんしゃ', r: 'densha',     en: 'train',       e: '🚆' },
  { k: 'かばん',   r: 'kaban',      en: 'bag',         e: '👜' },
  { k: 'ごはん',   r: 'gohan',      en: 'rice / meal', e: '🍚' },
  { k: 'おかね',   r: 'okane',      en: 'money',       e: '💴' },
  { k: 'かぜ',     r: 'kaze',       en: 'wind',        e: '💨' },
  { k: 'みず',     r: 'mizu',       en: 'water',       e: '💧' },
  { k: 'ねだん',   r: 'nedan',      en: 'price',       e: '💰' },
  { k: 'もんだい', r: 'mondai',     en: 'question / problem', e: '🧩' },
  { k: 'まど',     r: 'mado',       en: 'window',      e: '🪟' },
  { k: 'たまご',   r: 'tamago',     en: 'egg',         e: '🥚' },
  { k: 'くだもの', r: 'kudamono',   en: 'fruit',       e: '🍎' },
  { k: 'ひらがな', r: 'hiragana',   en: 'hiragana',    e: '📝' },
  { k: 'かたかな', r: 'katakana',   en: 'katakana',    e: '🖋️' },
  { k: 'でんき',   r: 'denki',      en: 'electricity / light', e: '💡' },
  { k: 'かがみ',   r: 'kagami',     en: 'mirror',      e: '🪞' },

  // Level 10 — +小さい字
  { k: 'おちゃ',         r: 'ocha',          en: 'tea',          e: '🍵' },
  { k: 'びょういん',     r: 'byouin',        en: 'hospital',     e: '🏥' },
  { k: 'ゆうびんきょく', r: 'yuubinkyoku',   en: 'post office',  e: '📮' },
  { k: 'きょうと',       r: 'kyouto',        en: 'Kyoto',        e: '🏯' },
  { k: 'とうきょう',     r: 'toukyou',       en: 'Tokyo',        e: '🗼' },
  { k: 'じどうしゃ',     r: 'jidousha',      en: 'car',          e: '🚗' },
  { k: 'ざっし',         r: 'zasshi',        en: 'magazine',     e: '📖' }
];
