from typing import Annotated

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Project, Task

DbSession = Annotated[Session, Depends(get_db)]
ResourceId = Annotated[int, Path(gt=0, description="資源 ID（正整數）")]


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Project {project_id} not found")
    return project


def get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.get(Task, task_id)
    if task is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Task {task_id} not found")
    return task


def ensure_project_exists(db: Session, project_id: int) -> None:
    """請求內容引用不存在的專案時回傳 422（格式與 FastAPI 驗證錯誤一致），而非 404。"""
    if db.get(Project, project_id) is None:
        raise HTTPException(
            422,
            [
                {
                    "type": "project_not_found",
                    "loc": ["body", "project_id"],
                    "msg": f"Project {project_id} does not exist",
                    "input": project_id,
                }
            ],
        )
