def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["ai_provider"] == "mock"


def test_swagger_docs_available(client):
    assert client.get("/docs").status_code == 200

    spec = client.get("/openapi.json").json()
    paths = spec["paths"]
    assert set(paths["/api/projects"]) == {"get", "post"}
    assert set(paths["/api/projects/{project_id}"]) == {"get", "put", "delete"}
    assert set(paths["/api/tasks"]) == {"get", "post"}
    assert set(paths["/api/tasks/{task_id}"]) == {"get", "put", "delete"}
    # 404 回應格式有記錄在文件中
    assert "404" in paths["/api/tasks/{task_id}"]["put"]["responses"]
