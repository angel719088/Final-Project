# 系統架構與資料模型

## 1. 整體架構

```
┌────────────────────────────┐        HTTP / JSON         ┌──────────────────────────────┐
│  Frontend (React + Vite)   │  ───────────────────────▶  │  Backend (FastAPI)           │
│  - Pages / Components      │   /api/*     (dev: proxy)  │  - API Routers               │
│  - API Client (fetch)      │  ◀───────────────────────  │  - Services (業務邏輯)        │
│  - Tailwind CSS            │                            │  - AI Service (Provider 抽象) │
└────────────────────────────┘                            │  - SQLAlchemy ORM            │
                                                          └──────┬──────────────┬────────┘
                                                                 │              │
                                                         ┌───────▼─────┐  ┌─────▼──────────────┐
                                                         │ SQLite      │  │ LLM Provider       │
                                                         │ (app.db)    │  │ OpenAI / Anthropic │
                                                         └─────────────┘  │ / Mock             │
                                                                          └────────────────────┘
```

- 前端開發時透過 Vite proxy 將 `/api` 轉發至 `http://localhost:8000`，避免 CORS 問題。
- **API Key 只存在後端**，前端永遠不直接呼叫 LLM。

## 2. 後端分層

```
backend/app/
├── main.py              # FastAPI app 建立、CORS、掛載 router、啟動時建表
├── core/config.py       # 讀取 .env（pydantic-settings）
├── db/session.py        # SQLAlchemy engine、SessionLocal、Base、get_db
├── models/              # ORM 模型（資料表）
├── schemas/             # Pydantic 請求 / 回應模型
├── api/
│   ├── router.py        # 匯總 v1 routers
│   └── routes/          # 各資源路由（health, projects, tasks, meetings, risks, ai）
├── services/            # 業務邏輯（不依賴 HTTP）
│   └── ai/              # AI Provider 抽象層
│       ├── base.py      # LLMProvider 介面
│       ├── mock.py      # 無 Key 時使用
│       ├── openai_provider.py / anthropic_provider.py  # 待實作
│       └── factory.py   # 依 AI_PROVIDER 選擇實作
└── tests/
```

**原則**：Route 只處理 HTTP（驗證、狀態碼）；Service 處理業務規則；AI 呼叫一律經過 `services/ai`，業務層不直接 import SDK。

### AI Provider 抽象

```python
class LLMProvider(ABC):
    name: str
    async def complete(self, system: str, prompt: str) -> str: ...
```

上層的 `ai_service`（待實作）負責組 Prompt、要求 JSON 輸出、解析並驗證為 Pydantic 模型（如 `MeetingSummary`、`RiskSuggestion[]`）。

## 3. 前端結構

```
frontend/src/
├── main.tsx / App.tsx   # 進入點與版面
├── index.css            # Tailwind 引入
├── lib/api.ts           # fetch 包裝（baseURL、錯誤處理）
├── types/               # 與後端 schema 對應的 TS 型別
├── components/          # 共用 UI 元件
└── pages/               # 頁面：Projects、ProjectDetail、Meetings、Risks、Dashboard
```

路由（待加入 `react-router-dom`）：
| 路徑 | 頁面 |
|---|---|
| `/` | 專案列表 |
| `/projects/:id` | 專案儀表板（Tabs：任務 / 會議 / 風險） |
| `/projects/:id/meetings/:meetingId` | 會議詳情與 AI 摘要 |

## 4. 資料模型（SQLite）

```
Project 1───* Task
Project 1───* Meeting 1───* Task (source_meeting_id, 可為空)
Project 1───* Risk
```

### projects
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | |
| name | VARCHAR(200) NOT NULL | |
| description | TEXT | |
| status | VARCHAR(20) | `planning` / `active` / `on_hold` / `completed` / `archived` |
| start_date | DATE | |
| end_date | DATE | |
| created_at / updated_at | DATETIME | |

### tasks
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | |
| project_id | FK → projects.id | ON DELETE CASCADE |
| title | VARCHAR(300) NOT NULL | |
| description | TEXT | |
| status | VARCHAR(20) | `todo` / `in_progress` / `done` |
| priority | VARCHAR(10) | `low` / `medium` / `high` / `urgent` |
| assignee | VARCHAR(100) | MVP 以文字儲存，未來改為 users FK |
| due_date | DATE | |
| source_meeting_id | FK → meetings.id NULL | 由會議 Action Item 轉換而來 |
| created_at / updated_at | DATETIME | |

### meetings
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | |
| project_id | FK → projects.id | |
| title | VARCHAR(200) NOT NULL | |
| meeting_date | DATE | |
| attendees | TEXT | 逗號分隔或 JSON |
| raw_notes | TEXT | 原始逐字稿 / 筆記 |
| summary | TEXT NULL | AI 摘要 |
| decisions | JSON NULL | `string[]` |
| action_items | JSON NULL | `[{title, assignee, due_date}]` |
| ai_provider | VARCHAR(30) NULL | 產生摘要的 Provider |
| created_at / updated_at | DATETIME | |

### risks
| 欄位 | 型別 | 說明 |
|---|---|---|
| id | INTEGER PK | |
| project_id | FK → projects.id | |
| title | VARCHAR(200) NOT NULL | |
| description | TEXT | |
| probability | INTEGER | 1–5 |
| impact | INTEGER | 1–5 |
| score | 計算欄位 | probability × impact（於 schema 計算，不存 DB） |
| status | VARCHAR(20) | `suggested` / `open` / `mitigating` / `closed` |
| mitigation | TEXT | 緩解措施 |
| source | VARCHAR(10) | `manual` / `ai` |
| created_at / updated_at | DATETIME | |

## 5. API

完整規格見 Swagger：http://localhost:8000/docs

### 已實作

| Method | Path | 說明 | 成功 | 錯誤 |
|---|---|---|---|---|
| GET | `/api/health` | 健康檢查 | 200 | |
| GET | `/api/projects` | 列表（`?status=`） | 200 | 422 |
| POST | `/api/projects` | 建立 | 201 | 422 |
| GET | `/api/projects/{id}` | 詳情 | 200 | 404 / 422 |
| PUT | `/api/projects/{id}` | 更新（完整取代） | 200 | 404 / 422 |
| DELETE | `/api/projects/{id}` | 刪除（連同任務） | 204 | 404 |
| GET | `/api/tasks` | 列表（`?project_id=&status=&priority=&q=`） | 200 | 422 |
| POST | `/api/tasks` | 建立 | 201 | 422 |
| GET | `/api/tasks/{id}` | 詳情 | 200 | 404 / 422 |
| PUT | `/api/tasks/{id}` | 更新（完整取代） | 200 | 404 / 422 |
| DELETE | `/api/tasks/{id}` | 刪除 | 204 | 404 |

錯誤格式：
- **404** `{"detail": "Task 5 not found"}`
- **422** FastAPI 標準驗證錯誤 `{"detail": [{"type", "loc", "msg", "input"}]}`；`project_id` 指向不存在的專案時同樣回 422（`type: "project_not_found"`, `loc: ["body", "project_id"]`），因為這是請求內容的錯誤，而非 URL 指向的資源不存在。

輸入限制與前端表單一致：任務標題 1–100 字、描述 ≤500、負責人 1–50；字串會去除前後空白；不接受未定義的欄位。

### 規劃中

| Method | Path | 說明 |
|---|---|---|
| GET | `/api/projects/{id}/dashboard` | 統計資料 |
| GET/POST | `/api/projects/{id}/meetings` | 會議列表 / 建立 |
| GET/PUT/DELETE | `/api/meetings/{id}` | 會議詳情 / 更新 / 刪除 |
| POST | `/api/meetings/{id}/summarize` | AI 摘要 |
| POST | `/api/meetings/{id}/action-items/convert` | Action Items → 任務 |
| GET/POST | `/api/projects/{id}/risks` | 風險列表 / 建立 |
| PUT/DELETE | `/api/risks/{id}` | 更新 / 刪除風險 |
| POST | `/api/projects/{id}/risks/analyze` | AI 風險建議 |

## 6. 技術決策

| 決策 | 理由 |
|---|---|
| SQLAlchemy 2.0 ORM | 型別友善，日後可換 PostgreSQL |
| MVP 用 `create_all` 建表 | 降低初期複雜度；Schema 穩定後導入 Alembic |
| Tailwind v4 + `@tailwindcss/vite` | 零設定檔，與 Vite 整合最簡單 |
| 單一 `.env`（根目錄） | 前後端共用；前端僅讀取 `VITE_` 前綴變數 |
| Mock AI Provider | 無 API Key 也能開發 / 測試 / Demo |
