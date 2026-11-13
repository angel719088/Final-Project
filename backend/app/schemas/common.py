from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, StringConstraints


def _as_utc(value: datetime) -> datetime:
    # SQLite 不保存時區；資料庫中一律為 UTC，輸出時補上時區資訊
    return value if value.tzinfo else value.replace(tzinfo=UTC)


UTCDateTime = Annotated[datetime, AfterValidator(_as_utc)]


def text(min_length: int = 0, max_length: int | None = None):
    """去除前後空白後再檢查長度的字串型別。"""
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)]


class ErrorResponse(BaseModel):
    """404 等錯誤的回應格式（422 使用 FastAPI 預設的驗證錯誤格式）"""

    detail: str


NOT_FOUND_RESPONSE = {404: {"model": ErrorResponse, "description": "資源不存在"}}
