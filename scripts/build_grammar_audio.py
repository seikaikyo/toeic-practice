#!/usr/bin/env python3
"""產生句型區例句與短文的朗讀，存進 web/public/audio/grammar/，隨前端出貨。

12 個分類共 72 句、約 5 千字元。兩種聲音：

    standard  en-US-Standard-F，標準音每月前 400 萬字元免費。9 月的 Neural2
              額度已經用完，先用這個上線
    neural2   en-US-Neural2-F，跟背單字例句同一個聲音。Neural2 每月前 100 萬
              字元免費，Google 帳單月份以太平洋時間切換，10 月 1 日太平洋時間
              01:00（台灣 16:00）以前一律拒絕，沒有 --force

用法：
    python3 scripts/build_grammar_audio.py --voice standard
    python3 scripts/build_grammar_audio.py --voice neural2   # 10 月換成 Neural2

對照表記在 web/data/grammar-audio.json：每句的文字與聲音。句子改過或換了
聲音才重產，其餘跳過，重跑是安全的。前端只在文字對得上時才顯示播放鍵，
所以句子改了但還沒重產，不會播出舊的句子。
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import sys
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))
from build_listening_audio import VOICES, gcloud_token, synthesize  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "web" / "data" / "grammar"
OUT = ROOT / "web" / "public" / "audio" / "grammar"
MANIFEST = ROOT / "web" / "data" / "grammar-audio.json"

VOICES["us-f-standard"] = ("en-US", "en-US-Standard-F")
VOICE_KEYS = {"standard": "us-f-standard", "neural2": "us-f"}

PACIFIC = ZoneInfo("America/Los_Angeles")
NEURAL2_FROM = dt.datetime(2026, 10, 1, 1, 0, tzinfo=PACIFIC)


def sentences() -> list[tuple[str, str]]:
    """回傳 (key, 句子)。key 是 <slug>/example-<n> 或 <slug>/story-<n>，n 從 1 起。"""
    rows: list[tuple[str, str]] = []
    for path in sorted(DATA.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        for kind, field in (("example", "examples"), ("story", "story")):
            for n, text in enumerate(data[field], start=1):
                rows.append((f"{data['slug']}/{kind}-{n}", text))
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description="產生句型區朗讀")
    parser.add_argument("--voice", choices=sorted(VOICE_KEYS), required=True)
    args = parser.parse_args()

    if args.voice == "neural2" and dt.datetime.now(PACIFIC) < NEURAL2_FROM:
        taipei = NEURAL2_FROM.astimezone(ZoneInfo("Asia/Taipei"))
        print(f"Neural2 本月額度已用完，{taipei:%m/%d %H:%M}（台灣時間）以後才能跑")
        return 1

    voice_id = VOICE_KEYS[args.voice]
    voice_name = VOICES[voice_id][1]
    manifest: dict[str, dict[str, str]] = (
        json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {}
    )
    rows = sentences()
    todo = [
        (key, text)
        for key, text in rows
        if manifest.get(key) != {"text": text, "voice": voice_name}
        or not (OUT / f"{key}.mp3").exists()
    ]
    chars = sum(len(text) for _, text in todo)
    print(f"共 {len(rows)} 句，要產 {len(todo)} 句、{chars} 字元，聲音 {voice_name}")

    token = gcloud_token()
    for key, text in todo:
        path = OUT / f"{key}.mp3"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(synthesize(text, voice_id, token))
        manifest[key] = {"text": text, "voice": voice_name}
        # 每句寫回一次，中斷之後接著跑不會重產已完成的
        MANIFEST.write_text(
            json.dumps(dict(sorted(manifest.items())), ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    keys = {key for key, _ in rows}
    stale = sorted(set(manifest) - keys)
    if stale:
        print(f"對照表有 {len(stale)} 句已不在內容裡：{', '.join(stale)}")
    print("完成")
    return 0


if __name__ == "__main__":
    sys.exit(main())
