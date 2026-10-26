# web 補上瀏覽器安全標頭

- **type**: fix
- **建立日期**: 2026-10-26

## 背景

2026-10-26 對 20 個前端做本機 ZAP 被動掃描並對照線上標頭，toeic.seikai.dev 只有 Vercel 平台給的 HSTS，CSP、X-Frame-Options、X-Content-Type-Options、Referrer-Policy、Permissions-Policy 全缺。`web/next.config.ts` 沒有 `headers()`，也沒有 vercel.json 或 middleware 補上。2026-09-08 全站補標頭時這個專案還沒建立。

## 變更內容

`web/next.config.ts` 加 `headers()`，對 `/:path*` 送六個標頭。CSP 依實際使用的來源：

| 指令 | 值 | 原因 |
| --- | --- | --- |
| script-src | 'self' 'unsafe-inline' 'unsafe-eval' | App Router hydration 需要，收緊要走 nonce，另案 |
| style-src | 'self' 'unsafe-inline' | Tailwind 與 radix 的 inline style |
| img-src | 'self' data: blob: | 題目照片在 public/photos |
| media-src | 'self' https://sp1vz5mua9vmz9jf.public.blob.vercel-storage.com | 單字、例句與聽力音檔在 Vercel Blob；part1 音檔在 /audio |
| connect-src | 'self' https://*.ingest.us.sentry.io | API 走同源 /api/backend/toeic，Sentry 走 tunnelRoute /monitoring；ingest 留著防 tunnel 失效 |
| font-src | 'self' data: | 沒有外部字型 |
| frame-ancestors / object-src / base-uri / form-action | 'none' / 'none' / 'self' / 'self' | |

另外：X-Frame-Options DENY、X-Content-Type-Options nosniff、Referrer-Policy strict-origin-when-cross-origin、Permissions-Policy camera=(), microphone=(), geolocation=()、`poweredByHeader: false`。

## 影響範圍

| 對象 | 影響 |
| --- | --- |
| 前端 | 全部頁面多六個回應標頭，不送 X-Powered-By |
| 後端 | 無 |
| 部署 | Vercel 依 git push 自動部署 |

## UI 規格

無 UI 變更。

## 測試計畫

1. `npm run build` 成功。
2. 本機 `next start`，agent-browser 用 securitypolicyviolation 事件收集器走首頁、單字、聽力 Part 1 到 Part 3、搜尋頁，先自測收集器（fetch 外部網址要回報 connect-src），再確認零違規；播放單字與聽力音檔確認有聲音載入。
3. 推送後線上 curl 首頁一次確認六個標頭都在、沒有 X-Powered-By，查 Sentry 無新錯誤。
