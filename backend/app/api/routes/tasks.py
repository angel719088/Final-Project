from typing import Annotated

from fastapi import APIRouter, Query, Response, status
from sqlalchemy import or_, select

from app.api.deps import DbSession, ResourceId, ensure_project_exists, get_task_or_404
from app.models import Task, TaskPriority, TaskStatus
from app.schemas.common import NOT_FOUND_RESPONSE
from app.schemas.task import TaskIn, TaskOut

router = APIRouter(prefix="/tasks", tags=["tasks"])

UNKNOWN_PROJECT_RESPONSE = {422: {"description": "驗證失敗，或 project_id 指向不存在的專案"}}


@router.get("", response_model=list[TaskOut], summary="列出任務（可篩選）")
def list_tasks(
    db: DbSession,
    project_id: Annotated[int | None, Query(gt=0, description="依專案篩選")] = None,
    status: Annotated[TaskStatus | None, Query(description="依狀態篩選")] = None,
    priority: Annotated[TaskPriority | None, Query(description="依優先級篩選")] = None,
    q: Annotated[
        str | None, Query(min_length=1, max_length=100, description="搜尋標題、描述、負責人（不分大小寫）")
    ] = None,
):
    stmt = select(Task).order_by(Task.id)
    if project_id is not None:
        stmt = stmt.where(Task.project_id == project_id)
    if status is not None:
        stmt = stmt.where(Task.status == status)
    if priority is not None:
        stmt = stmt.where(Task.priority == priority)
    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(Task.title.ilike(pattern), Task.description.ilike(pattern), Task.assignee.ilike(pattern))
        )
    return db.scalars(stmt).all()


@router.post(
    "",
    response_model=TaskOut,
    status_code=status.HTTP_201_CREATED,
    responses=UNKNOWN_PROJECT_RESPONSE,
    summary="建立任務",
)
def create_task(payload: TaskIn, db: DbSession):
    ensure_project_exists(db, payload.project_id)
    task = Task(**payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskOut, responses=NOT_FOUND_RESPONSE, summary="取得單一任務")
def get_task(task_id: ResourceId, db: DbSession):
    return get_task_or_404(db, task_id)


@router.put(
    "/{task_id}",
    response_model=TaskOut,
    responses={**NOT_FOUND_RESPONSE, **UNKNOWN_PROJECT_RESPONSE},
    summary="更新任務（完整取代）",
)
def update_task(task_id: ResourceId, payload: TaskIn, db: DbSession):
    task = get_task_or_404(db, task_id)
    ensure_project_exists(db, payload.project_id)
    for field, value in payload.model_dump().items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT, responses=NOT_FOUND_RESPONSE, summary="刪除任務")
def delete_task(task_id: ResourceId, db: DbSession) -> Response:
    db.delete(get_task_or_404(db, task_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
