# AI Project Manager Copilot

協助軟體 PM 管理專案、任務、會議紀錄及專案風險的 Web 應用。目前已完成**專案與任務管理**（含 Kanban 看板與 Dashboard），AI 功能（會議摘要、風險分析）為下一階段開發項目。

📘 **[操作說明 USER_GUIDE.md](./USER_GUIDE.md)** · [產品需求 PRD](./PRD.md) · [架構與資料模型](./ARCHITECTURE.md) · [開發計畫](./DEVELOPMENT_PLAN.md)

## 功能

| 模組 | 功能 | 狀態 |
|---|---|---|
| Dashboard | 專案數、任務數、逾期任務、完成率、各專案進度、任務狀態分布、逾期清單 | ✅ |
| Projects | 專案卡片、依狀態篩選、新增 / 編輯 / 刪除（刪除時一併刪除其任務） | ✅ |
| Tasks | Kanban（To Do / In Progress / Done）、拖曳變更狀態、新增 / 編輯 / 刪除、搜尋、依專案與優先級篩選 | ✅ |
| 資料儲存 | FastAPI + SQLite，重新整理後資料保留 | ✅ |
| 介面 | SaaS Dashboard 風格、桌面與手機響應式、表單驗證、刪除確認、Loading / Error / Empty 狀態 | ✅ |
| AI Assistant | 會議摘要、風險分析（OpenAI / Anthropic） | 🚧 規劃中 |

## 技術

| 層 | 技術 |
|---|---|
| Frontend | React 19、TypeScript、Vite 6、Tailwind CSS 4、React Router 7、lucide-react |
| Backend | Python 3.11+、FastAPI、SQLAlchemy 2、Pydantic 2 |
| Database | SQLite |
| 測試 | pytest（73 項 API 測試） |
| AI（預留） | OpenAI / Anthropic Provider 介面，預設 Mock，不需 API Key |

## 快速開始

需要 **Python 3.11+** 與 **Node.js 20+**。

```bash
git clone https://github.com/angel719088/Final-Project.git
cd Final-Project
```

**1. 後端**（終端機 A）

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # macOS / Linux：source .venv/bin/activate
pip install -r requirements.txt
python -m app.seed              # 選用：載入範例資料（5 個專案、21 項任務）
uvicorn app.main:app --reload --port 8000
```

**2. 前端**（終端機 B）

```bash
cd frontend
npm install
npm run dev
```

開啟 **http://localhost:5173**。詳細步驟與各頁面操作請見 [USER_GUIDE.md](./USER_GUIDE.md)。

> 不需要建立 `.env` 也能執行。需要調整設定時，將 `.env.example` 複製為 `.env`（放在專案根目錄）。

## API

Swagger 文件：http://localhost:8000/docs

| Method | Path | 說明 |
|---|---|---|
| GET | `/api/projects` | 列出專案（`?status=`） |
| POST | `/api/projects` | 建立專案 |
| GET / PUT / DELETE | `/api/projects/{id}` | 取得 / 更新（完整取代）/ 刪除（連同任務） |
| GET | `/api/tasks` | 列出任務（`?project_id=&status=&priority=&q=`） |
| POST | `/api/tasks` | 建立任務 |
| GET / PUT / DELETE | `/api/tasks/{id}` | 取得 / 更新（完整取代）/ 刪除 |
| GET | `/api/health` | 健康檢查 |

錯誤格式：404 為 `{"detail": "..."}`；422 為 FastAPI 標準驗證錯誤。詳見 [ARCHITECTURE.md](./ARCHITECTURE.md#5-api)。

## 專案結構

```
.
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI 進入點（CORS、Swagger）
│   │   ├── seed.py            # 範例資料（python -m app.seed）
│   │   ├── core/config.py     # 環境變數設定
│   │   ├── db/session.py      # SQLAlchemy engine / session
│   │   ├── models/            # ORM 模型：Project、Task
│   │   ├── schemas/           # Pydantic 輸入 / 輸出驗證
│   │   ├── api/               # REST 路由（/api）
│   │   └── services/ai/       # LLM Provider 抽象層（預留）
│   ├── tests/                 # pytest API 測試
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── lib/api.ts         # 集中管理的 API Client
│   │   ├── context/           # DataContext：資料載入與 CRUD
│   │   ├── components/        # ui / layout / dashboard / projects / tasks
│   │   ├── pages/             # Dashboard、Projects、Tasks、AI Assistant
│   │   └── types/             # 與後端 schema 對應的型別
│   └── vite.config.ts         # /api proxy → 後端
├── .env.example
├── USER_GUIDE.md              # 操作說明
└── PRD.md / ARCHITECTURE.md / DEVELOPMENT_PLAN.md
```

## 開發

```bash
# 後端測試（使用 in-memory SQLite，不會動到 app.db）
cd backend && pytest

# 前端型別檢查與正式建置
cd frontend && npm run build
```

開發時前端呼叫 `/api/*`，由 Vite proxy 轉發到 `API_PROXY_TARGET`（預設 `http://localhost:8000`），因此不需要 CORS。若改為讓瀏覽器直接呼叫後端，請設定 `VITE_API_BASE_URL` 並將前端網址加入 `CORS_ORIGINS`。

## 安全注意事項

- `.env` 已列入 `.gitignore`，**切勿提交真實 API Key**。
- API Key 只由後端讀取；前端只能讀到 `VITE_` 開頭的變數，請勿在其中放入任何機密。
