---
title: TOEIC Practice 獨立刷題 App
type: feature
status: in-progress
created: 2026-02-27
---

# TOEIC Practice 獨立刷題 App

## 變更內容
從 ai-english-tutor 拆出 TOEIC 選擇題練習功能，建立獨立 App。
包含單元練習、模擬考、成績統計三大功能。

## 技術架構
- 前端: Vite + Vue 3 + TypeScript + PrimeVue (Aura)
- 後端: FastAPI + SQLModel + SQLite
- Port: 5173 (前端) / 8003 (後端)

## 影響範圍
- 新建 toeic-practice/ 整個專案
- 修改 ai-english-tutor/ 移除 TOEIC 相關程式碼

## 測試計畫
1. 前端 npm run dev 頁面載入正常
2. 後端 uvicorn app.main:app API 啟動正常
3. GET /api/quiz/questions?part=5&count=5 回傳 5 題
4. GET /api/quiz/mock-test 回傳完整模擬考
5. 前端練習可正常答題、顯示解析
6. 模擬考計時器運作、完成後顯示分數
7. 統計頁顯示歷次分數圖表
8. ai-english-tutor 移除 TOEIC 後功能正常

## Checklist
- [ ] 初始化前端 (Vite + PrimeVue + Router)
- [ ] 初始化後端 (FastAPI scaffold)
- [ ] 搬移 + 重構題庫資料
- [ ] 後端 API 實作
- [ ] 前端練習頁面
- [ ] 前端模擬考頁面
- [ ] 前端統計頁面
- [ ] 清理 ai-english-tutor
