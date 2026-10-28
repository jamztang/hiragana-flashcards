#!/usr/bin/env python3
"""
generate_word_audio_voicevox.py — regenerate word recordings with VOICEVOX

Replaces the Apple-`say`-generated clips (not redistributable, see LICENSING.md)
with VOICEVOX audio. Requires the VOICEVOX engine running locally:

    http://127.0.0.1:50021   (default port)

Voice: 四国めたん (ノーマル) — found dynamically from /speakers.
Per VOICEVOX terms, public use of this voice requires credit:
    "VOICEVOX:四国めたん"

Usage:  python3 scripts/generate_word_audio_voicevox.py
Output: prototype/audio/words/<kana>.m4a  (audio/ is gitignored)
"""

import json
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

ENGINE = 'http://127.0.0.1:50021'
SPEAKER_NAME = '四国めたん'
STYLE_NAME = 'ノーマル'

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'prototype' / 'data.js'
OUT = ROOT / 'prototype' / 'audio' / 'words'


def get_json(url):
    with urllib.request.urlopen(url) as r:
        return json.loads(r.read())


def post_json(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else b''
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return r.read()


def extract_words():
    src = DATA.read_text(encoding='utf-8')
    return re.findall(r"k:\s*'([^']+)'", src)


def pick_style_id(speakers):
    for sp in speakers:
        if sp['name'] == SPEAKER_NAME:
            for st in sp['styles']:
                if st['name'] == STYLE_NAME:
                    return st['id']
            return sp['styles'][0]['id']
    raise SystemExit(f'speaker {SPEAKER_NAME} not found in engine')


def synthesize(word, style_id, retries=3):
    # both endpoints are POST in the VOICEVOX engine API
    q = post_json(f"{ENGINE}/audio_query?speaker={style_id}&text={urllib.parse.quote(word + '。')}")
    q = json.loads(q)
    for attempt in range(retries):
        try:
            return post_json(f'{ENGINE}/synthesis?speaker={style_id}', q)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(1)


def main():
    words = extract_words()
    print(f'{len(words)} words from data.js')

    try:
        speakers = get_json(f'{ENGINE}/speakers')
    except Exception:
        sys.exit('VOICEVOX engine not reachable — is it running on :50021?')

    style_id = pick_style_id(speakers)
    print(f'using speaker {SPEAKER_NAME} ({STYLE_NAME}) style id {style_id}')

    OUT.mkdir(parents=True, exist_ok=True)
    tmp = Path('/tmp/voicevox_word.wav')
    ok = 0
    for i, word in enumerate(words, 1):
        try:
            wav = synthesize(word, style_id)
            tmp.write_bytes(wav)
            m4a = OUT / f'{word}.m4a'
            subprocess.run(
                ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp),
                 '-c:a', 'aac', '-b:a', '64k', str(m4a)],
                check=True)
            ok += 1
            if i % 10 == 0 or i == len(words):
                print(f'{i}/{len(words)} done')
        except Exception as e:
            print(f'FAILED: {word}: {e}')
    print(f'\n{ok}/{len(words)} clips written to {OUT}')
    print('Remember the VOICEVOX credit for public use: VOICEVOX:' + SPEAKER_NAME)


if __name__ == '__main__':
    main()
