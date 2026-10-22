# 鎖定 backend 的 Python 間接相依（requirements.in 加完整釘版的 requirements.txt）

- **type**: fix
- **建立日期**: 2026-10-22

## 背景

backend/requirements.txt 只釘頂層套件，間接相依沒釘版。2026-10-22 每日資安巡檢（osv-scanner 加上 -r 後）對這份檔案回報 23 筆，大多是 osv 拿版本範圍的最低版比對（anyio 4.9.0、h11 0.9.0、idna 3.9.0），不是實際安裝的版本。backend/ 已不部署，留作對照，鎖定後掃描結果才會反映真正會裝到的版本。

## 變更內容

1. `git mv backend/requirements.txt backend/requirements.in`，原有內容原封保留，開頭加一行重編指令說明。
2. 在 backend/ 用 `uv pip compile requirements.in --universal --python-version 3.12 --generate-hashes -o requirements.txt` 產出完整釘版、附 sha256 雜湊值的 requirements.txt，共 16 個套件。

## 影響範圍

| 對象 | 影響 |
| --- | --- |
| 執行期行為 | 無功能變更。鎖出來的版本跟目前不釘版安裝解出的版本相同。 |
| 依賴檔 | backend/requirements.in（新）、backend/requirements.txt（改為鎖定檔）。 |
| 部署 | 無。backend/ 不部署，線上後端是 dashai-go 的 /toeic 模組。 |

## 剩餘風險

starlette 鎖在 0.46.2，仍有 14 筆已知漏洞。fastapi 0.115.12 限制 starlette 低於 0.47.0，要消掉這些漏洞得升 fastapi 頂層版本，不在這次鎖定範圍內。

## UI 規格

無 UI 變更。

## 測試計畫

1. 鎖定檔核對：requirements.in 每個 `==` 釘版在 requirements.txt 版本相同（0 筆不符）。
2. 在 Python 3.12 新環境以 `--require-hashes` 安裝鎖定檔成功。
3. backend 沒有測試，改做冒煙測試：修補前後 `import app.main` 都成功，路由數都是 15。
重跑每日巡檢確認 osv-details 的筆數下降。
