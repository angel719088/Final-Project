from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import str_enum, utcnow
from app.models.enums import ProjectStatus

if TYPE_CHECKING:
    from app.models.task import Task


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[ProjectStatus] = mapped_column(str_enum(ProjectStatus), default=ProjectStatus.PLANNING)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    # 刪除專案時一併刪除其任務（ORM cascade + DB 層 ON DELETE CASCADE）
    tasks: Mapped[list[Task]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
