from app.core.config import Settings, get_settings
from app.services.ai.base import LLMProvider
from app.services.ai.mock import MockProvider


def get_llm_provider(settings: Settings | None = None) -> LLMProvider:
    """依 AI_PROVIDER 回傳對應 Provider；缺少 Key 或尚未實作時退回 Mock。

    TODO(Phase 4)：實作 OpenAIProvider / AnthropicProvider 並在此註冊。
    """
    settings = settings or get_settings()
    provider = settings.ai_provider.lower()

    if provider == "openai" and settings.openai_api_key:
        pass  # return OpenAIProvider(settings)
    if provider == "anthropic" and settings.anthropic_api_key:
        pass  # return AnthropicProvider(settings)

    return MockProvider()
