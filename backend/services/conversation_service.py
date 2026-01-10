"""
Conversation service for managing AI conversations.

Handles context building, LLM integration, and message generation.
"""
from typing import List, Dict, Any
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from services.llm_service import get_llm
from services.database import get_supabase_client

# System prompt defining the AI's personality and behavior
SYSTEM_PROMPT = """You are a helpful, professional AI assistant. 
Be concise and direct in your responses. Answer questions clearly 
and provide relevant information without unnecessary elaboration."""

# Greeting message for new conversation
GREETING_MESSAGE = "Hey there! I'm ready to chat. What's on your mind?"

# Maximum number of recent messages to include in context
MAX_CONTEXT_MESSAGES = 20


def build_context(messages: List[Dict[str, Any]]) -> List[Any]:
    """
    Build LLM context from conversation messages.
    
    Assembles the system prompt and recent messages into a format
    ready for the LLM. Messages are ordered chronologically.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        
    Returns:
        List of LangChain message objects ready for LLM
    """
    context = []
    
    # Start with system prompt
    context.append(SystemMessage(content=SYSTEM_PROMPT))
    
    # Add recent messages (limit to prevent context overflow)
    recent_messages = messages[-MAX_CONTEXT_MESSAGES:] if len(messages) > MAX_CONTEXT_MESSAGES else messages
    
    for msg in recent_messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        if role == "user":
            context.append(HumanMessage(content=content))
        elif role == "assistant":
            context.append(AIMessage(content=content))
        # Skip system messages in context (we use our own system prompt)
    
    return context


async def generate_response(conversation_id: str, user_message: str) -> str:
    """
    Generate an AI response for a user message.
    
    Fetches conversation history, builds context, calls the LLM,
    and returns the generated response text.
    
    Args:
        conversation_id: UUID of the conversation
        user_message: The user's message content
        
    Returns:
        The AI's response text
    """
    supabase = get_supabase_client()
    
    # Fetch existing messages for context
    result = supabase.table("conversation_messages")\
        .select("role, content")\
        .eq("conversation_id", conversation_id)\
        .order("created_at", desc=False)\
        .execute()
    
    existing_messages = result.data or []
    
    # Add the new user message to context (it's already saved, but include it)
    all_messages = existing_messages + [{"role": "user", "content": user_message}]
    
    # Build context for LLM
    context = build_context(all_messages)
    
    # Get LLM instance with conversational temperature
    llm = get_llm(temperature=0.8)
    
    # Generate response (non-streaming for Phase 1)
    response = await llm.ainvoke(context)
    
    return response.content


def get_greeting_message() -> str:
    """
    Get the AI greeting message for new conversations.
    
    Returns:
        The greeting message string
    """
    return GREETING_MESSAGE
