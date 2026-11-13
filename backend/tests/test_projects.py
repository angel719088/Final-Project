from datetime import datetime

import pytest


# ---------- 建立 ----------


def test_list_projects_initially_empty(client):
    res = client.get("/api/projects")
    assert res.status_code == 200
    assert res.json() == []


def test_create_project(client):
    res = client.post("/api/projects", json={"name": "  行動 App v2.0  ", "description": "推播與離線模式", "status": "active"})
    assert res.status_code == 201
    body = res.json()
    assert body["id"] > 0
    assert body["name"] == "行動 App v2.0"  # 去除前後空白
    assert body["description"] == "推播與離線模式"
    assert body["status"] == "active"
    created = datetime.fromisoformat(body["created_at"])
    assert created.tzinfo is not None  # 時間帶有時區（UTC）


def test_create_project_defaults(client):
    body = client.post("/api/projects", json={"name": "內部 CRM"}).json()
    assert body["status"] == "planning"
    assert body["description"] == ""


@pytest.mark.parametrize(
    ("payload", "field"),
    [
        ({}, "name"),
        ({"name": ""}, "name"),
        ({"name": "   "}, "name"),
        ({"name": "x" * 201}, "name"),
        ({"name": "OK", "status": "unknown"}, "status"),
        ({"name": "OK", "description": "x" * 2001}, "description"),
        ({"name": "OK", "owner": "Alice"}, "owner"),  # 不允許未定義欄位
        ({"name": 123}, "name"),
    ],
)
def test_create_project_validation_errors(client, payload, field):
    res = client.post("/api/projects", json=payload)
    assert res.status_code == 422
    assert any(err["loc"][-1] == field for err in res.json()["detail"]), res.json()


def test_create_project_rejects_invalid_json(client):
    res = client.post("/api/projects", content="{not json", headers={"Content-Type": "application/json"})
    assert res.status_code == 422


# ---------- 讀取 ----------


def test_list_projects_ordered_and_filtered(client):
    for name, status in [("A", "active"), ("B", "planning"), ("C", "active")]:
        client.post("/api/projects", json={"name": name, "status": status})

    assert [p["name"] for p in client.get("/api/projects").json()] == ["A", "B", "C"]
    assert [p["name"] for p in client.get("/api/projects", params={"status": "active"}).json()] == ["A", "C"]
    assert client.get("/api/projects", params={"status": "bogus"}).status_code == 422


def test_get_project(client, project):
    res = client.get(f"/api/projects/{project['id']}")
    assert res.status_code == 200
    assert res.json() == project


@pytest.mark.parametrize(("path", "code"), [("/api/projects/999", 404), ("/api/projects/abc", 422), ("/api/projects/0", 422)])
def test_get_project_errors(client, path, code):
    res = client.get(path)
    assert res.status_code == code
    if code == 404:
        assert res.json() == {"detail": "Project 999 not found"}


# ---------- 更新 ----------


def test_update_project(client, project):
    res = client.put(
        f"/api/projects/{project['id']}",
        json={"name": "電商平台改版 Phase 2", "description": "新增會員功能", "status": "on_hold"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "電商平台改版 Phase 2"
    assert body["status"] == "on_hold"
    assert body["created_at"] == project["created_at"]  # 建立時間不變
    assert client.get(f"/api/projects/{project['id']}").json() == body


def test_update_project_is_full_replacement(client, project):
    # PUT 未提供的選填欄位會回到預設值
    body = client.put(f"/api/projects/{project['id']}", json={"name": "只改名稱"}).json()
    assert body["description"] == ""
    assert body["status"] == "planning"


def test_update_project_not_found(client):
    res = client.put("/api/projects/999", json={"name": "X"})
    assert res.status_code == 404


def test_update_project_validation_error(client, project):
    res = client.put(f"/api/projects/{project['id']}", json={"name": ""})
    assert res.status_code == 422
    # 驗證失敗不應修改資料
    assert client.get(f"/api/projects/{project['id']}").json()["name"] == project["name"]


# ---------- 刪除 ----------


def test_delete_project(client, project):
    res = client.delete(f"/api/projects/{project['id']}")
    assert res.status_code == 204
    assert res.content == b""
    assert client.get(f"/api/projects/{project['id']}").status_code == 404
    assert client.delete(f"/api/projects/{project['id']}").status_code == 404


def test_delete_project_cascades_to_tasks(client, project, make_task):
    other = client.post("/api/projects", json={"name": "Other"}).json()
    t1 = make_task()
    t2 = make_task(title="第二個任務")
    t_other = make_task(project_id=other["id"])

    assert client.delete(f"/api/projects/{project['id']}").status_code == 204

    assert client.get(f"/api/tasks/{t1['id']}").status_code == 404
    assert client.get(f"/api/tasks/{t2['id']}").status_code == 404
    assert [t["id"] for t in client.get("/api/tasks").json()] == [t_other["id"]]
