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
from typing import Optional, Union
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from config import get_settings

# those are the default values for the LLM, can be overridden if needed
def get_llm(
    model: Optional[str] = None, 
    temperature: float = 0.7,
    provider: Optional[str] = None
) -> Union[ChatOpenAI, ChatGoogleGenerativeAI]:
    """
    Get configured LLM instance based on provider.
    
    Args:
        model: Model name (overrides DEFAULT_LLM_MODEL if provided)
        temperature: Sampling temperature (0-1)
        provider: Provider name ('openai' or 'google') (overrides DEFAULT_LLM_PROVIDER if provided)
        
    Returns:
        Configured LLM instance (ChatOpenAI or ChatGoogleGenerativeAI)
    """
    settings = get_settings()
    
    # Use defaults if not provided
    provider = provider or settings.DEFAULT_LLM_PROVIDER
    model = model or settings.DEFAULT_LLM_MODEL
    
    if provider.lower() == "google":
        return ChatGoogleGenerativeAI(
            model=model,
            temperature=temperature,
            google_api_key=settings.GOOGLE_API_KEY
        )
    
    # Default to OpenAI
    return ChatOpenAI(
        model=model,
        temperature=temperature,
        api_key=settings.OPENAI_API_KEY
    )


