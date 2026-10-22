# 升級 npm 相依套件修補已知漏洞

- **type**: fix
- **建立日期**: 2026-10-22

## 背景

2026-10-22 每日資安巡檢（osv-scanner）與 GitHub Dependabot 回報本 repo 有已知漏洞。修補前 `npm audit`：critical 1、high 11、moderate 1，共 13 筆（GitHub Dependabot 列 16 筆警示）。

## 變更內容

1. web/：next 16.3.5 → 16.3.8（精確釘版）
2. @modelcontextprotocol/sdk 1.30.0 → 1.32.1、hono 4.13.8 → 4.13.13、@hono/node-server 2.1.1 → 2.1.5、sharp 0.35.4 → 0.35.5、source-map-js 1.2.1 → 1.2.2、shadcn 4.21.0 → 4.22.1（範圍內，npm audit fix 連帶）

不升主版號、不加 overrides、不改程式碼，只動 package.json 與 lock 檔。

## 影響範圍

| 對象 | 影響 |
| --- | --- |
| 執行期行為 | 無功能變更，只升修補版。 |
| 依賴檔 | package.json 與 lock 檔。 |
| 部署 | Vercel 依 git push 自動部署。 |

## 剩餘風險

修補後 `npm audit`：high 9 筆，全部來自 braces 3.0.3。braces 3.0.3（GHSA-vfj7-8cjw-p6xm）官方沒有修補版，經 fast-glob → micromatch 引入，等上游發版。

## UI 規格

無 UI 變更。

## 測試計畫

1. build 修補前後都成功；lint 前後都是 0 error、1 warning。
2. Sentry thirdPartyErrorFilterIntegration 的記號仍在建構產物裡（19 個檔）。
推送後確認部署成功，並重跑每日巡檢確認 osv-details 的漏洞數下降。
