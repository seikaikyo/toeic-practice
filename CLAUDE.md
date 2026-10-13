# toeic-practice：多益練習

線上 toeic.seikai.dev。原始碼是 proprietary（見 LICENSE），內附資料各自沿用開放授權（見 NOTICE）。功能與架構圖見 README.md。

## 結構

| 位置 | 內容 |
|------|------|
| `web/` | Next.js App Router + shadcn，部署在 Vercel 專案 toeic-practice（Root Directory 設 web，push 自動部署） |
| `backend/` | 舊版 FastAPI + SQLite，已不部署，留作對照；`backend/data/` 是腳本讀取的字表與題庫 |
| `scripts/` | 字庫、題庫、音檔的建置與匯入 Neon 腳本（Python） |
| `openspec/changes/` | 變更提案；結案改 frontmatter `status`，不搬檔 |

線上後端是 dashai-go 的 `/toeic` 模組（Render），資料庫是獨立的 Neon 專案。這個 repo 沒有線上後端程式碼。

## web/

- 瀏覽器不直接打後端：dashai-go 開著 origin lock，`app/api/backend/toeic/[...path]/route.ts` 在伺服器端補上 `X-Origin-Key` 轉送。不能改用 next.config 的 rewrite（加不了自訂標頭）。
- Sentry 專案 `dashai-jz/toeic-practice`，公開 DSN 預設值在 `lib/sentry-dsn.ts`。
- 指令：`npm run dev`、`npm run build`、`npm run lint`。

## 資料授權

`backend/data/vocabulary/words.json` 衍生自 CC BY-SA 4.0 字表，與本 repo 的 proprietary 授權不相容，不進版控（.gitignore 已排除），由 `scripts/build_vocabulary.py` 在本機產生。
