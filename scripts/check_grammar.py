#!/usr/bin/env python3
"""句型區內容檢查：push 之前先擋掉格式錯誤或混入中文的內容。

用法：
    python3 scripts/check_grammar.py            # 12 個分類都要齊
    python3 scripts/check_grammar.py --partial  # 產到一半時只檢查已有的檔案

檢查項目見 openspec/changes/025-grammar-patterns.md。
問題逐條列出，全部通過才回傳 0。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAMMAR_DIR = ROOT / "web" / "data" / "grammar"
GRAMMAR_TS = ROOT / "web" / "lib" / "grammar.ts"
QUESTION_BANK = ROOT / "backend" / "data" / "question_bank"

# 跟 web/lib/grammar.ts 的 GRAMMAR_CATEGORIES 一致
CATEGORIES = {
    "verb-tense": "verb tense",
    "word-form": "word form",
    "preposition": "preposition",
    "gerund-infinitive": "gerund/infinitive",
    "subjunctive": "subjunctive",
    "comparison": "comparison",
    "relative-clause": "relative clause",
    "passive-voice": "passive voice",
    "conjunction": "conjunction",
    "pronoun": "pronoun",
    "quantifier": "quantifier",
    "vocabulary": "vocabulary",
}
ROLES = {"S", "V", "O", "C", "M"}
CJK = re.compile(r"[　-〿㐀-鿿＀-￯]")


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()


def bank_sentences() -> list[str]:
    """題庫裡的句子與文章，正規化後拿來比對重複。"""
    texts: list[str] = []
    for path in sorted(QUESTION_BANK.glob("part*.json")):
        for item in json.loads(path.read_text(encoding="utf-8")):
            # Part 5 的空格填回正解再比，不然差一個字就比不出來
            sentence = item.get("sentence")
            if isinstance(sentence, str):
                texts.append(normalize(re.sub(r"_{3,}", str(item.get("answer", "")), sentence)))
            if isinstance(item.get("passage"), str):
                texts.append(normalize(item["passage"]))
    return texts


def check_file(path: Path, bank: list[str], imported: str) -> list[str]:
    problems: list[str] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [f"JSON 格式錯誤：{exc}"]

    slug = path.stem
    if data.get("slug") != slug:
        problems.append(f"slug 應為 {slug}，實際是 {data.get('slug')!r}")
    if slug not in CATEGORIES:
        problems.append(f"{slug} 不在 12 個分類內")
    elif data.get("category") != CATEGORIES[slug]:
        problems.append(f"category 應為 {CATEGORIES[slug]!r}，實際是 {data.get('category')!r}")
    if f'data/grammar/{slug}.json"' not in imported:
        problems.append("web/lib/grammar.ts 沒有 import 這份檔案，頁面不會出現")

    for key in ("title", "point", "formula"):
        if not isinstance(data.get(key), str) or not data[key].strip():
            problems.append(f"{key} 是空的")

    parts = (data.get("breakdown") or {}).get("parts") or []
    roles = [p.get("role") for p in parts]
    if not {"S", "V"} <= set(roles):
        problems.append("結構拆解至少要有主詞 S 與動詞 V")
    for p in parts:
        if p.get("role") not in ROLES:
            problems.append(f"結構拆解的角色 {p.get('role')!r} 不在 S V O C M 內")

    table = data.get("table") or []
    if not table:
        problems.append("中英對照表是空的")
    for row in table:
        if not all(isinstance(row.get(k), str) and row[k].strip() for k in ("en", "zh", "rule")):
            problems.append(f"對照表有欄位空白：{row}")

    examples = data.get("examples") or []
    story = data.get("story") or []
    drills = data.get("drills") or []
    if len(examples) != 2:
        problems.append(f"同句型例句要剛好兩句，現在 {len(examples)} 句")
    if not 3 <= len(story) <= 4:
        problems.append(f"短文要三到四句，現在 {len(story)} 句")
    if len(drills) != 3:
        problems.append(f"練習題要剛好三題，現在 {len(drills)} 題")

    for i, d in enumerate(drills, 1):
        choices = d.get("choices") or []
        if len(choices) < 2 or len(set(choices)) != len(choices):
            problems.append(f"第 {i} 題選項要兩個以上且不重複")
        if d.get("answer") not in choices:
            problems.append(f"第 {i} 題答案 {d.get('answer')!r} 不在選項內")
        if not (d.get("fix") or "").strip():
            problems.append(f"第 {i} 題沒有修正說明")

    english = [p.get("text", "") for p in parts] + examples + story
    for d in drills:
        english += [d.get("prompt", "")] + list(d.get("choices") or [])
    for text in english:
        if CJK.search(text):
            problems.append(f"英文欄位混入中文：{text}")

    # 以整字比對，而且太短的句子不比，免得 "Mina" 這種片段誤中 "terminal"
    for text in examples + story:
        norm = normalize(text)
        if len(norm.split()) < 5:
            continue
        if any(f" {norm} " in f" {b} " for b in bank):
            problems.append(f"跟題庫重複：{text}")

    return problems


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--partial", action="store_true", help="不要求 12 個分類齊全")
    args = parser.parse_args()

    files = sorted(GRAMMAR_DIR.glob("*.json"))
    imported = GRAMMAR_TS.read_text(encoding="utf-8")
    bank = bank_sentences()
    failed = False

    if not args.partial:
        missing = sorted(set(CATEGORIES) - {f.stem for f in files})
        if missing:
            failed = True
            print(f"缺少分類：{', '.join(missing)}")

    for path in files:
        problems = check_file(path, bank, imported)
        if problems:
            failed = True
            print(f"{path.name}")
            for p in problems:
                print(f"  {p}")

    if not failed:
        print(f"通過：{len(files)} 份")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
