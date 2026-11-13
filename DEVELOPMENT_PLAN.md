# 開發計畫（Development Plan）

以「每個 Phase 都可獨立執行、測試、Demo」為原則，適合 Vibe Coding 逐步推進。每個 Phase 完成後請 commit。

## Phase 0：專案初始化 ✅（本次完成）
- [x] PRD、架構、資料模型文件
- [x] Frontend：Vite + React + TS + Tailwind 骨架、API client、健康檢查畫面
- [x] Backend：FastAPI 骨架、設定、DB session、`/api/health`、AI Provider 介面 + Mock
- [x] README、.gitignore、.env.example

## Phase 1：專案管理（F1）
- [x] Backend：`Project` model、schemas、CRUD routes、pytest
- [x] Frontend：加入 `react-router-dom`、版面（Sidebar / Header）、專案卡片列表
- [x] Frontend：專案新增 / 編輯 / 刪除表單
- [x] Frontend：`DataContext` 改為呼叫後端 API（取代 Mock Data 與 localStorage）
- **完成標準**：可在 UI 建立、編輯、封存專案

## Phase 2：任務管理（F2、F3）
- [x] Backend：`Task` model、CRUD、依專案 / 狀態 / 優先級 / 關鍵字篩選
- [x] Frontend：任務表單、Kanban 看板（To Do / In Progress / Done）、拖曳、搜尋與篩選（資料存於後端 SQLite）
- **完成標準**：任務可建立並在看板上切換狀態

## Phase 3：會議紀錄（F4）
- [ ] Backend：`Meeting` model、CRUD
- [ ] Frontend：會議列表、新增會議（貼上逐字稿）、會議詳情頁

## Phase 4：AI 整合基礎（F10）
- [ ] 實作 `OpenAIProvider`、`AnthropicProvider`（官方 SDK）
- [ ] `ai_service`：Prompt 模板、JSON 輸出解析、Pydantic 驗證、錯誤與逾時處理
- [ ] `GET /api/ai/status`：回傳目前 Provider 與是否可用
- **完成標準**：切換 `AI_PROVIDER` 可得到真實 LLM 回應；無 Key 時退回 Mock

## Phase 5：AI 會議摘要（F5、F6）
- [ ] `POST /meetings/{id}/summarize` → summary / decisions / action_items
- [ ] Frontend：摘要按鈕、Loading、可編輯結果
- [ ] Action Items 勾選後轉為任務（帶 `source_meeting_id`）

## Phase 6：風險管理（F7、F8）
- [ ] Backend：`Risk` model、CRUD、分數計算
- [ ] `POST /projects/{id}/risks/analyze`：彙整逾期 / Blocked 任務與近期會議 → AI 建議風險（status=`suggested`）
- [ ] Frontend：風險列表、機率×影響矩陣、接受 / 忽略 AI 建議

## Phase 7：儀表板（F9）
- [ ] `GET /projects/{id}/dashboard`
- [ ] Frontend：完成率、逾期任務、Top 風險卡片

## Phase 8：品質與交付
- [ ] 導入 Alembic migration
- [ ] 前端 ESLint / 後端 Ruff
- [ ] 錯誤處理與空狀態 UI
- [ ] Demo 種子資料（`scripts/seed.py`）
- [ ] 部署文件（Docker Compose，選配）

## 建議的 Vibe Coding 提示方式
每次只給 AI 一個 Phase 的一個子項目，例如：
> 「請依 ARCHITECTURE.md 的 projects 資料表，實作 Phase 1 的 Backend 部分（model、schema、CRUD routes、pytest），不要動前端。」
