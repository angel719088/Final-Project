from datetime import datetime

import pytest

# ---------- 建立 ----------


def test_create_task(client, project):
    payload = {
        "project_id": project["id"],
        "title": "  串接新金流 API ",
        "description": "金流商沙箱環境不穩定",
        "assignee": "George Tsai",
        "priority": "urgent",
        "status": "in_progress",
        "due_date": "2026-11-30",
    }
    res = client.post("/api/tasks", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["id"] > 0
    assert body["title"] == "串接新金流 API"
    assert body["priority"] == "urgent"
    assert body["status"] == "in_progress"
    assert body["due_date"] == "2026-11-30"
    assert datetime.fromisoformat(body["created_at"]).tzinfo is not None


def test_create_task_defaults(make_task):
    body = make_task()
    assert body["priority"] == "medium"
    assert body["status"] == "todo"
    assert body["description"] is None


def test_blank_description_stored_as_null(make_task):
    assert make_task(description="   ")["description"] is None


def test_create_task_with_unknown_project(client):
    res = client.post(
        "/api/tasks",
        json={"project_id": 999, "title": "T", "assignee": "A", "due_date": "2026-11-30"},
    )
    assert res.status_code == 422
    [err] = res.json()["detail"]
    assert err["loc"] == ["body", "project_id"]
    assert err["type"] == "project_not_found"


@pytest.mark.parametrize(
    ("overrides", "field"),
    [
        ({"title": ""}, "title"),
        ({"title": "   "}, "title"),
        ({"title": "x" * 101}, "title"),
        ({"assignee": ""}, "assignee"),
        ({"assignee": "x" * 51}, "assignee"),
        ({"description": "x" * 501}, "description"),
        ({"priority": "critical"}, "priority"),
        ({"status": "blocked"}, "status"),  # 前端已移除 blocked 狀態
        ({"due_date": "2026-13-40"}, "due_date"),
        ({"due_date": "next friday"}, "due_date"),
        ({"due_date": None}, "due_date"),
        ({"project_id": 0}, "project_id"),
        ({"project_id": "abc"}, "project_id"),
        ({"id": 5}, "id"),  # 不允許未定義欄位
    ],
)
def test_create_task_validation_errors(client, project, overrides, field):
    payload = {"project_id": project["id"], "title": "T", "assignee": "A", "due_date": "2026-11-30", **overrides}
    res = client.post("/api/tasks", json=payload)
    assert res.status_code == 422
    assert any(err["loc"][-1] == field for err in res.json()["detail"]), res.json()


@pytest.mark.parametrize("missing", ["project_id", "title", "assignee", "due_date"])
def test_create_task_missing_required_field(client, project, missing):
    payload = {"project_id": project["id"], "title": "T", "assignee": "A", "due_date": "2026-11-30"}
    del payload[missing]
    res = client.post("/api/tasks", json=payload)
    assert res.status_code == 422
    assert res.json()["detail"][0]["loc"] == ["body", missing]


# ---------- 讀取與篩選 ----------


def test_get_task(client, make_task):
    task = make_task()
    res = client.get(f"/api/tasks/{task['id']}")
    assert res.status_code == 200
    assert res.json() == task


def test_get_task_not_found(client):
    res = client.get("/api/tasks/999")
    assert res.status_code == 404
    assert res.json() == {"detail": "Task 999 not found"}


@pytest.fixture
def seeded(client, project, make_task):
    other = client.post("/api/projects", json={"name": "行動 App"}).json()
    tasks = [
        make_task(title="結帳流程 UX 研究", priority="high", status="done", assignee="Alice Chen"),
        make_task(title="串接新金流 API", priority="urgent", status="in_progress", description="沙箱不穩定"),
        make_task(title="A/B 測試設定", priority="medium", status="todo", assignee="Alice Chen"),
        make_task(project_id=other["id"], title="推播通知整合", priority="high", status="todo", assignee="Helen Kuo"),
    ]
    return {"project": project, "other": other, "tasks": tasks}


def titles(res) -> list[str]:
    assert res.status_code == 200, res.text
    return [t["title"] for t in res.json()]


def test_list_tasks(client, seeded):
    assert titles(client.get("/api/tasks")) == [t["title"] for t in seeded["tasks"]]


@pytest.mark.parametrize(
    ("params", "expected"),
    [
        ({"status": "todo"}, ["A/B 測試設定", "推播通知整合"]),
        ({"priority": "high"}, ["結帳流程 UX 研究", "推播通知整合"]),
        ({"q": "alice"}, ["結帳流程 UX 研究", "A/B 測試設定"]),  # 負責人、不分大小寫
        ({"q": "沙箱"}, ["串接新金流 API"]),  # 描述
        ({"q": "金流"}, ["串接新金流 API"]),  # 標題
        ({"status": "todo", "priority": "high"}, ["推播通知整合"]),
        ({"q": "不存在的關鍵字"}, []),
    ],
)
def test_list_tasks_filters(client, seeded, params, expected):
    assert titles(client.get("/api/tasks", params=params)) == expected


def test_list_tasks_filter_by_project(client, seeded):
    res = client.get("/api/tasks", params={"project_id": seeded["other"]["id"]})
    assert titles(res) == ["推播通知整合"]


@pytest.mark.parametrize("params", [{"status": "blocked"}, {"priority": "x"}, {"project_id": "abc"}, {"q": ""}])
def test_list_tasks_invalid_filters(client, params):
    assert client.get("/api/tasks", params=params).status_code == 422


# ---------- 更新 ----------


def test_update_task(client, make_task):
    task = make_task()
    payload = {
        "project_id": task["project_id"],
        "title": "串接新金流 API（已修改）",
        "description": "改用正式環境",
        "assignee": "Ivy Chang",
        "priority": "low",
        "status": "done",
        "due_date": "2026-12-15",
    }
    res = client.put(f"/api/tasks/{task['id']}", json=payload)
    assert res.status_code == 200
    body = res.json()
    assert {k: body[k] for k in payload} == payload
    assert body["created_at"] == task["created_at"]
    assert client.get(f"/api/tasks/{task['id']}").json() == body


def test_update_task_move_to_other_project(client, make_task):
    task = make_task()
    other = client.post("/api/projects", json={"name": "Other"}).json()
    payload = {**task, "project_id": other["id"]}
    for key in ("id", "created_at"):
        payload.pop(key)
    res = client.put(f"/api/tasks/{task['id']}", json=payload)
    assert res.status_code == 200
    assert res.json()["project_id"] == other["id"]


def test_update_task_not_found(client, project):
    payload = {"project_id": project["id"], "title": "T", "assignee": "A", "due_date": "2026-11-30"}
    assert client.put("/api/tasks/999", json=payload).status_code == 404


def test_update_task_unknown_project(client, make_task):
    task = make_task()
    payload = {"project_id": 999, "title": "T", "assignee": "A", "due_date": "2026-11-30"}
    res = client.put(f"/api/tasks/{task['id']}", json=payload)
    assert res.status_code == 422
    assert client.get(f"/api/tasks/{task['id']}").json()["project_id"] == task["project_id"]


def test_update_task_validation_error_leaves_data_unchanged(client, make_task):
    task = make_task()
    res = client.put(f"/api/tasks/{task['id']}", json={"title": ""})
    assert res.status_code == 422
    assert client.get(f"/api/tasks/{task['id']}").json() == task


# ---------- 刪除 ----------


def test_delete_task(client, make_task):
    keep = make_task(title="保留")
    task = make_task(title="刪除")
    res = client.delete(f"/api/tasks/{task['id']}")
    assert res.status_code == 204
    assert res.content == b""
    assert client.get(f"/api/tasks/{task['id']}").status_code == 404
    assert titles(client.get("/api/tasks")) == [keep["title"]]


def test_delete_task_not_found(client):
    assert client.delete("/api/tasks/999").status_code == 404
    assert client.delete("/api/tasks/abc").status_code == 422
