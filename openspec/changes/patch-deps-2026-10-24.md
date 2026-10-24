# 修補 web 的 next 遠端執行漏洞與 2026-10-23 公告的相依漏洞

- **type**: fix
- **建立日期**: 2026-10-24

## 背景

2026-10-24 osv-scanner 巡檢在 web/package-lock.json 掃到 2026-10-22 到 10-23 新公告的漏洞：

1. next 16.3.8：GHSA-2464-fhr4-w9xw（圖片最佳化 API 未驗證遠端執行）、GHSA-673q-mjm6-r5xr（`use cache` 遠端執行）、GHSA-p3m5-59mp-jv5r。16.4.1 起修好。
2. @sentry/nextjs 10.75.0：GHSA-mchm-gjx6-7h55，10.75.2 起修好。
3. 間接相依：fast-uri 3.1.8（4 筆）、body-parser 2.3.0（GHSA-27r3-jxmh-p828）、ip-address 10.7.2（GHSA-rxp7-6hxx-x8q5）、undici 7.29.1（GHSA-4qv8-2p9j-2685 等 3 筆）、zod 4.6.5（GHSA-mrhx-c7xc-m3w5）。

修補前 `npm audit --omit=dev`：critical 2、high 3、moderate 2，共 7 筆（含開發相依同為 7 筆）。

## 變更內容

1. web/package.json 的 next 維持釘死寫法：16.3.8 → 16.4.3（`npm install next@16.4.3 --save-exact`）。eslint-config-next 原本釘 16.3.5，不動。
2. 以 `npm update` 在 package.json 既有範圍內升級（package.json 不變）：
   - @sentry/nextjs 10.75.0 → 10.76.2（連帶 @sentry/* 同步到 10.76.2、@sentry/webpack-plugin 5.4.0 → 5.4.1、webpack 5.111.1 → 5.112.2、@opentelemetry/* 2.11.0 → 2.12.0 等同主版號更新）
   - fast-uri 3.1.8 → 3.1.9
   - body-parser 2.3.0 → 2.4.0
   - ip-address 10.7.2 → 10.7.4
   - undici 7.29.1 → 7.30.1
   - zod 4.6.5 → 4.6.7

不升主版號、不加 overrides、不跑 `npm audit fix`。

## 影響範圍

| 對象 | 影響 |
| --- | --- |
| 前端執行期 | next 升小版號（16.3 → 16.4），@sentry/nextjs 升小版號（10.75 → 10.76），其餘只升修補版，無功能變更。 |
| 依賴檔 | web/package.json（next 一行）、web/package-lock.json。 |
| 部署 | Vercel 依 git push 自動部署。 |

## 剩餘風險

1. 修補後 `npm audit --omit=dev` 為 0 筆（含開發相依也是 0 筆）。本次沒有留下已知未修的漏洞。

## UI 規格

無 UI 變更。

## 測試計畫

1. `npm ls next @sentry/nextjs fast-uri body-parser ip-address undici zod --all`：next 16.4.3、@sentry/nextjs 10.76.2、fast-uri 3.1.9、body-parser 2.4.0、ip-address 10.7.4、undici 7.30.1、zod 4.6.7，結果符合。
2. web 目錄 `npm ci` 後 `npm run build`（Next.js 16.4.3，Turbopack）：建構成功，23 個頁面靜態產生完成。
3. `npm audit --omit=dev`：修補前 7 筆（critical 2、high 3、moderate 2），修補後 0 筆。
4. 推送後確認 Vercel 建構成功，並重跑每日巡檢確認 osv 漏洞數下降。
