from datetime import date

from app.db.session import SessionLocal
from app.seed import SAMPLE, seed


def test_seed_populates_empty_database(client):
    with SessionLocal() as db:
        assert seed(db, today=date(2026, 11, 13)) is True

    projects = client.get("/api/projects").json()
    tasks = client.get("/api/tasks").json()
    assert len(projects) == len(SAMPLE)
    assert len(tasks) == sum(len(t) for *_, t in SAMPLE)
    assert {t["status"] for t in tasks} == {"todo", "in_progress", "done"}


def test_seed_never_overwrites_existing_data(client, project):
    with SessionLocal() as db:
        assert seed(db) is False
    assert [p["name"] for p in client.get("/api/projects").json()] == [project["name"]]


def test_cors_preflight_allows_dev_origin(client):
    res = client.options(
        "/api/tasks/1",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "PUT",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert "PUT" in res.headers["access-control-allow-methods"]


def test_cors_rejects_unknown_origin(client):
    res = client.get("/api/projects", headers={"Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in res.headers
