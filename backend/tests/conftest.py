import os

# 必須在 import app 之前設定：測試使用 in-memory SQLite，不會動到 app.db
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["AI_PROVIDER"] = "mock"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.db.session import Base, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(autouse=True)
def _fresh_database():
    """每個測試都使用全新的資料表"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def project(client) -> dict:
    res = client.post("/api/projects", json={"name": "電商平台改版", "description": "結帳流程改版", "status": "active"})
    assert res.status_code == 201
    return res.json()


@pytest.fixture
def make_task(client, project):
    """建立任務的 factory；未指定的欄位使用合法預設值"""

    def _make(**overrides) -> dict:
        payload = {
            "project_id": project["id"],
            "title": "串接新金流 API",
            "assignee": "George Tsai",
            "due_date": "2026-11-30",
            **overrides,
        }
        res = client.post("/api/tasks", json=payload)
        assert res.status_code == 201, res.text
        return res.json()

    return _make
