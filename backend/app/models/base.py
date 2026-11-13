from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import Enum as SAEnum


def utcnow() -> datetime:
    return datetime.now(UTC)


def str_enum(enum_cls: type[StrEnum]) -> SAEnum:
    """以字串（enum 的 value）儲存，並在 DB 層加上 CHECK 限制。"""
    return SAEnum(
        enum_cls,
        native_enum=False,
        create_constraint=True,
        length=20,
        values_callable=lambda e: [m.value for m in e],
    )
