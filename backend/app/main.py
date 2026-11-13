from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  確保 models 已註冊到 Base.metadata
from app.api.router import api_router
from app.core.config import get_settings
from app.db.session import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # MVP：啟動時自動建表；Schema 穩定後改用 Alembic
    Base.metadata.create_all(bind=engine)
    yield


DESCRIPTION = """
協助軟體 PM 管理專案與任務的 REST API。

- 更新採 **PUT 完整取代**：需送出全部欄位。
- **404**：資源不存在，回應格式為 `{"detail": "..."}`。
- **422**：輸入驗證失敗（含 `project_id` 指向不存在的專案），格式為 FastAPI 標準驗證錯誤。
- 刪除專案會一併刪除其所有任務。
"""

OPENAPI_TAGS = [
    {"name": "projects", "description": "專案 CRUD"},
    {"name": "tasks", "description": "任務 CRUD 與篩選"},
    {"name": "health", "description": "健康檢查"},
]

app = FastAPI(
    title=settings.app_name,
    version="0.2.0",
    description=DESCRIPTION,
    openapi_tags=OPENAPI_TAGS,
    lifespan=lifespan,
)

# 開發時前端經由 Vite proxy 呼叫（同源，不需 CORS）；
# 直接以 VITE_API_BASE_URL=http://localhost:8000/api 呼叫或部署到不同網域時才需要。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,  # 目前沒有 cookie / 驗證
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

app.include_router(api_router)
