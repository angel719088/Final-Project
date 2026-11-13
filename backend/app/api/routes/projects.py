from fastapi import APIRouter, Response, status
from sqlalchemy import select

from app.api.deps import DbSession, ResourceId, get_project_or_404
from app.models import Project, ProjectStatus
from app.schemas.common import NOT_FOUND_RESPONSE
from app.schemas.project import ProjectIn, ProjectOut

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectOut], summary="列出專案")
def list_projects(db: DbSession, status: ProjectStatus | None = None):
    stmt = select(Project).order_by(Project.id)
    if status is not None:
        stmt = stmt.where(Project.status == status)
    return db.scalars(stmt).all()


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED, summary="建立專案")
def create_project(payload: ProjectIn, db: DbSession):
    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut, responses=NOT_FOUND_RESPONSE, summary="取得單一專案")
def get_project(project_id: ResourceId, db: DbSession):
    return get_project_or_404(db, project_id)


@router.put("/{project_id}", response_model=ProjectOut, responses=NOT_FOUND_RESPONSE, summary="更新專案（完整取代）")
def update_project(project_id: ResourceId, payload: ProjectIn, db: DbSession):
    project = get_project_or_404(db, project_id)
    for field, value in payload.model_dump().items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses=NOT_FOUND_RESPONSE,
    summary="刪除專案（連同其所有任務）",
)
def delete_project(project_id: ResourceId, db: DbSession) -> Response:
    db.delete(get_project_or_404(db, project_id))
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
