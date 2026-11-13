from fastapi import APIRouter

from app.core.config import get_settings
from app.services.ai import get_llm_provider

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict:
    settings = get_settings()
    return {
        "status": "ok",
        "app": settings.app_name,
        "env": settings.app_env,
        "ai_provider": get_llm_provider(settings).name,
    }
