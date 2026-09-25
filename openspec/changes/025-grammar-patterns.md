---
title: 句型區（先學句型結構，再做情境練習）
type: feature
status: completed
created: 2026-09-25
---

# 句型區（先學句型結構，再做情境練習）

## 變更內容

Part 5 目前 80 題，答完只看得到一段英文解析（`backend/data/question_bank/part5.json` 的 `explanation`），寫正解為什麼對、錯的選項為什麼錯。缺三樣：句子結構拆解、中英對照、答完後的延伸練習。答錯同一類文法時，每題各讀一次類似的解釋，沒有地方把規則一次講清楚。

這次新增獨立的「句型」區，照「先學結構，再練反應」的順序，以 12 個文法分類為單位（跟題目的 `grammar_category` 一致）：

1. 句型公式：這一類的核心結構，例如「主詞 + 過去式動詞 + that 子句（子句用過去完成式）」
2. 結構拆解：一句範例標出主詞、動詞、受詞、補語、修飾語
3. 中英對照表：關鍵用法的中文意思與英文變化規則
4. 同句型例句：兩句，結構不變，只換名詞和動詞
5. 情境練習：三到四句的短文，用的就是這個句型，接著三題是非題或選擇題，每題倒數 3 秒，答錯顯示一句修正

不花錢：內容用訂閱額度一次產好，存成靜態資料隨前端出貨。練習題的答案事先寫好，不呼叫任何 API，不新增雲端服務與環境變數，後端不動。

## 範圍外

- 逐題的結構標記（每題句子不同，之後放在答題解析區另案處理）
- 依分類抽 Part 5 題目（要改 dashai-go 的抽題 API，另案）
- Part 6、7 的文章拆解
- 自由輸入加 AI 批改（會產生 API 費用）

## 資料格式

`web/data/grammar/<slug>.json`，一個分類一檔：

```json
{
  "slug": "verb-tense",
  "category": "verb tense",
  "title": "動詞時態",
  "point": "時態題先找時間線索。線索說出動作發生在哪個時間點，動詞形態就跟著決定。",
  "formula": "主詞 + 過去式動詞 + that + 主詞 + had + 過去分詞",
  "breakdown": {
    "parts": [
      { "text": "The annual report", "role": "S" },
      { "text": "indicated", "role": "V" },
      { "text": "that profits had increased", "role": "O" },
      { "text": "over the previous year", "role": "M" }
    ]
  },
  "table": [
    { "en": "had increased", "zh": "（在那之前）已經增加", "rule": "比過去某時間點更早發生，用 had + 過去分詞" }
  ],
  "examples": ["...", "..."],
  "story": ["...", "...", "..."],
  "drills": [
    { "prompt": "...", "choices": ["Yes", "No"], "answer": "Yes", "fix": "..." }
  ]
}
```

`point` 是整類的一句重點，顯示在標題下方。`role` 只收 `S` `V` `O` `C` `M`。12 個分類與網址：

| category | slug | 中文 |
|---|---|---|
| verb tense | verb-tense | 動詞時態 |
| word form | word-form | 詞性 |
| preposition | preposition | 介系詞 |
| gerund/infinitive | gerund-infinitive | 動名詞與不定詞 |
| subjunctive | subjunctive | 假設語氣 |
| comparison | comparison | 比較級 |
| relative clause | relative-clause | 關係子句 |
| passive voice | passive-voice | 被動語態 |
| conjunction | conjunction | 連接詞 |
| pronoun | pronoun | 代名詞 |
| quantifier | quantifier | 數量詞 |
| vocabulary | vocabulary | 字義辨析 |

## 影響範圍

- `web/data/grammar/*.json`：12 份內容
- `web/lib/grammar.ts`：讀資料、分類與 slug 對照、型別
- `web/app/grammar/page.tsx`：12 個分類的列表
- `web/app/grammar/[slug]/page.tsx`：分類頁，建置時預先產生 12 頁
- `web/components/grammar/`：結構拆解、對照表、情境練習（倒數與作答）
- `web/components/site-nav.tsx`：導覽列加「句型」，放在「背單字」後面
- `web/components/quiz/feedback-panel.tsx`：解析下方加「看這個句型」，連到該分類頁；沒有分類或分類不在清單內就不顯示
- 例句與短文的單字可點，沿用 `example-sentence.tsx` 的 `ExampleSentence` 與 `lookupTokens`，點了用 `setStudyWord` 跳到背單字頁第一張
- `scripts/check_grammar.py`：內容檢查腳本
- 點字小卡的發音鍵沿用背單字已產好的單字音檔（`audioUrlFor`），口音與聲音讀背單字頁存在瀏覽器的設定。整句朗讀：例句與短文 72 句（4,994 字元）由 `scripts/build_grammar_audio.py` 產生，放 `web/public/audio/grammar/<slug>/<example|story>-<n>.mp3` 隨前端出貨，對照表 `web/data/grammar-audio.json` 記每句的文字與聲音，文字對不上就不出播放鍵。9 月 Neural2 額度已用完，先用 en-US-Standard-F（標準音每月 400 萬字元免費）；10 月 1 日台灣 16:00 後跑 `--voice neural2` 換成跟背單字例句同一個聲音，腳本時間未到會拒絕

## 內容檢查（`scripts/check_grammar.py`）

- 12 個分類齊全，slug 與 category 跟上表一致
- `breakdown` 至少有 S 與 V，role 只收五種
- `examples` 剛好兩句，`story` 三到四句，`drills` 剛好三題
- 每題 `answer` 在 `choices` 內，`fix` 非空
- 英文欄位（breakdown、examples、story、drills 的題目與選項）不得混入中文
- 例句與短文不得跟現有題庫句子重複

## 產出流程

先產「動詞時態」一份，連同畫面給使用者抽看格式與品質，確認後再產其餘 11 份。全部跑過檢查腳本，使用者抽驗後才 push。

## UI 規格

- 沿用紙本色票與襯線字，不另加顏色
- 結構拆解：每段文字下方標小字角色（主詞 / 動詞 / 受詞 / 補語 / 修飾語），用既有色票區分，同時有文字標籤，不只靠顏色
- 對照表：英文、中文、規則三欄；手機寬度改成上下堆疊
- 情境練習：先顯示短文，按「開始」才出題；倒數條 3 秒，時間到算未答並顯示正解；提供「關閉倒數」切換（計時可調整的無障礙要求），選擇存在瀏覽器
- 答完三題顯示答對幾題與每題修正，可以重來

## 測試計畫

1. `scripts/check_grammar.py` 對 12 份內容跑得過；故意放一題答案不在選項內、一份只有一句例句、英文欄位混中文，三種都擋下
2. `/grammar` 列出 12 個分類，各自連得到分類頁；`next build` 輸出 12 頁預先產生
3. 分類頁五個區塊依序出現；結構拆解每段都有角色文字
4. 情境練習：3 秒不答算未答並顯示正解；關閉倒數後可以慢慢答；重新整理後倒數設定保留
5. 短文與例句的字點了跳到背單字頁，第一張是那個字；小卡的發音鍵播的是單字音檔，不是瀏覽器語音；每句例句與短文前有播放鍵，播的是對應的 mp3
6. 練習題答完，解析下方的「看這個句型」連到對應分類；模擬考作答途中不出現
7. 手機 375 寬：導覽列不折行、對照表不橫向捲動
8. 鍵盤可以完成整個情境練習

## Checklist

- [x] 資料格式與檢查腳本
- [x] 動詞時態內容與畫面，給使用者抽看
- [x] 其餘 11 份內容
- [x] 導覽列與解析連結
- [x] 使用者抽驗
- [x] 線上驗證
