from app.services.ai.base import LLMProvider


class MockProvider(LLMProvider):
    """未設定 API Key 時使用，回傳固定內容，方便開發與測試。"""

    name = "mock"

    async def complete(self, system: str, prompt: str) -> str:
        return "[mock] AI provider 尚未設定，這是模擬回應。"
