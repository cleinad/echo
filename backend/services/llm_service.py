"""
LLM service configuration and utilities.

Centralizes LLM client setup and common utilities for working with language models.
Currently using OpenAI, but can be extended to support other providers.

TODO: Consider adding
- Prompt templates library
- Token counting utilities
- Retry logic for API failures
- Cost tracking
"""
from langchain_openai import ChatOpenAI
from config import get_settings


def get_llm(model: str = "gpt-4o-mini", temperature: float = 0.7) -> ChatOpenAI:
    """
    Get configured LLM instance.
    
    Args:
        model: Model name (default: gpt-4o-mini for cost efficiency)
        temperature: Sampling temperature (0-1)
        
    Returns:
        Configured ChatOpenAI instance
    """
    settings = get_settings()
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=settings.OPENAI_API_KEY
    )


