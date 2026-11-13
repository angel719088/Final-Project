from abc import ABC, abstractmethod


class LLMProvider(ABC):
    """所有 LLM Provider 的共同介面。業務邏輯只依賴此介面，不直接使用 SDK。"""

    name: str

    @abstractmethod
    async def complete(self, system: str, prompt: str) -> str:
        """送出 system + user prompt，回傳模型文字輸出。"""
