from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.common import UTCDateTime, text


class TaskIn(BaseModel):
    """建立（POST）與更新（PUT，完整取代）共用的輸入格式；限制與前端表單驗證一致"""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [
                {
                    "project_id": 1,
                    "title": "串接新金流 API",
                    "description": "金流商沙箱環境不穩定",
                    "assignee": "George Tsai",
                    "priority": "urgent",
                    "status": "in_progress",
                    "due_date": "2026-11-30",
                }
            ]
        },
    )

    project_id: int = Field(gt=0)
    title: text(1, 100)
    description: text(0, 500) | None = None
    assignee: text(1, 50)
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    due_date: date

    @field_validator("description")
    @classmethod
    def _blank_description_to_none(cls, value: str | None) -> str | None:
        return value or None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    title: str
    description: str | None
    assignee: str
    priority: TaskPriority
    status: TaskStatus
    due_date: date
    created_at: UTCDateTime
