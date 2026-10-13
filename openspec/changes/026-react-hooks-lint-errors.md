---
title: 修掉 web 的 8 個 react-hooks lint 錯誤，順帶修好沒有音檔時判斷不到語音引擎
type: fix
status: done
created: 2026-10-14
---

# 修掉 web 的 8 個 react-hooks lint 錯誤

## 背景

2026-10-13 沙盒第 3 批驗收，`web/` 跑 eslint 有 8 個錯誤（eslint-config-next 16 帶的 react-hooks 規則），使用者決定修。

## 變更內容

- `hooks/use-speech.ts`：「裝置有沒有語音引擎」原本存在 ref，在 effect 裡設成 true，渲染時讀 ref。設定 ref 不會觸發重新渲染，所以沒設音檔網址時 `supported` 會停在 false，直到別的狀態變動才更新。改用 `useSyncExternalStore` 讀 `"speechSynthesis" in window`，伺服器端當作沒有，hydration 後就是正確值。有設音檔網址時（線上現況）`supported` 一律是 true，行為不變。
- `app/vocabulary/page.tsx`：
  - 讀 localStorage 偏好的 effect：讀取照舊在 try 裡，三個 setState 改包 `queueMicrotask`。
  - 篩選條件的 `filterRef` 原本在渲染時賦值，改到每次渲染後的 effect 裡更新。這個 effect 宣告在首次抽卡的 effect 之前，執行順序不變；按鈕觸發的抽卡讀到的也是已提交的值。
  - 首次抽卡的 effect：四條分支的 `load()` 改包 `queueMicrotask`，帶條件的分支把 setState 和 `load()` 放在同一個 microtask。
- `app/stats/page.tsx`、`components/listening/part2-runner.tsx`、`components/listening/part3-runner.tsx`：mount 時的 `load()` 改包 `queueMicrotask`，與 repo 既有寫法相同。

## 影響範圍

只動前端這 5 個檔，API 與後端不變。載入請求晚一個 microtask 送出，畫面流程不變。

## UI 規格

畫面不變。

## 測試計畫

- `eslint .`：0 錯誤（剩 1 個既有警告 `app/listening/page.tsx` 未使用的 Button，不在本次範圍）。
- `tsc --noEmit`、`next build` 通過。
- 本機 `next start`（無後端，API 回 503）：/vocabulary 送出 bookmarks、activity、words 三個請求；/stats 送出 stats、history；/listening 切到 Part 2、Part 3 各送出題目請求；頁面無錯誤。
- 上線後 agent-browser 看 toeic.seikai.dev 的 /vocabulary、/stats、/listening 有資料，Sentry 無新錯誤。
