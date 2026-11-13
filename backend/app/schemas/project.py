from pydantic import BaseModel, ConfigDict

from app.models.enums import ProjectStatus
from app.schemas.common import UTCDateTime, text


class ProjectIn(BaseModel):
    """建立（POST）與更新（PUT，完整取代）共用的輸入格式"""

    model_config = ConfigDict(
        extra="forbid",
        json_schema_extra={
            "examples": [{"name": "電商平台改版", "description": "重新設計結帳流程與商品頁", "status": "active"}]
        },
    )

    name: text(1, 200)
    description: text(0, 2000) = ""
    status: ProjectStatus = ProjectStatus.PLANNING


class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    status: ProjectStatus
    created_at: UTCDateTime
