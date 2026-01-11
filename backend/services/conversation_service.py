"""
Conversation service for managing AI conversations.

Handles context building, LLM integration, and message generation.
Supports both streaming and non-streaming response modes.
Supports "type" mode (markdown) and "talk" mode (conversational).
"""
from typing import List, Dict, Any, AsyncGenerator, Literal
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from services.llm_service import get_llm
from services.database import get_supabase_client

# Type mode: System prompt for structured, markdown-formatted responses
TYPE_MODE_SYSTEM_PROMPT = """You are a helpful, professional AI assistant. 
Be concise and direct in your responses. Answer questions clearly 
and provide relevant information without unnecessary elaboration.
You may use markdown formatting when helpful for readability."""

# Talk mode: System prompt for natural, conversational responses (no markdown)
TALK_MODE_SYSTEM_PROMPT = """You are having a natural, friendly conversation. 
Speak as you would in person - use natural language, contractions, and a warm conversational tone.

Important guidelines:
- Do NOT use any markdown formatting (no asterisks, bullet points, numbered lists, headers, or code blocks)
- Write in flowing, natural paragraphs as if speaking out loud
- Use conversational transitions like "So...", "Well...", "You know...", "Actually..."
- Keep responses concise but personable
- It's okay to use casual expressions and show personality
- Respond as if you're chatting with a friend, not writing a document
- adjust your tone and response to the user's message, it may be more serious and direct, or casual

Remember: Your response will be spoken aloud, so write for the ear, not the eye."""

# Greeting message for new conversation
GREETING_MESSAGE = "Hey, what's on your mind?"

# Maximum number of recent messages to include in context
MAX_CONTEXT_MESSAGES = 20

# Type alias for mode parameter
MessageMode = Literal["type", "talk"]


def build_context(messages: List[Dict[str, Any]], mode: MessageMode = "type") -> List[Any]:
    """
    Build LLM context from conversation messages.
    
    Assembles the appropriate system prompt based on mode and recent messages
    into a format ready for the LLM. Messages are ordered chronologically.
    
    Args:
        messages: List of message dicts with 'role' and 'content' keys
        mode: Response mode - "type" for markdown, "talk" for conversational
        
    Returns:
        List of LangChain message objects ready for LLM
    """
    context = []
    
    # Select system prompt based on mode
    system_prompt = TALK_MODE_SYSTEM_PROMPT if mode == "talk" else TYPE_MODE_SYSTEM_PROMPT
    context.append(SystemMessage(content=system_prompt))
    
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


async def generate_response(
    conversation_id: str, 
    user_message: str, 
    mode: MessageMode = "type"
) -> str:
    """
    Generate an AI response for a user message (non-streaming).
    
    Fetches conversation history, builds context, calls the LLM,
    and returns the generated response text.
    
    Args:
        conversation_id: UUID of the conversation
        user_message: The user's message content
        mode: Response mode - "type" for markdown, "talk" for conversational
        
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
    
    # Build context for LLM with appropriate mode
    context = build_context(all_messages, mode=mode)
    
    # Get LLM instance with conversational temperature
    llm = get_llm(temperature=0.8)
    
    # Generate response (non-streaming)
    response = await llm.ainvoke(context)
    
    return response.content


async def generate_response_stream(
    conversation_id: str, 
    user_message: str,
    mode: MessageMode = "type"
) -> AsyncGenerator[str, None]:
    """
    Generate an AI response for a user message with streaming.
    
    Fetches conversation history, builds context, and streams tokens
    from the LLM as they are generated.
    
    Args:
        conversation_id: UUID of the conversation
        user_message: The user's message content
        mode: Response mode - "type" for markdown, "talk" for conversational
        
    Yields:
        Individual tokens as they are generated by the LLM
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
    
    # Build context for LLM with appropriate mode
    context = build_context(all_messages, mode=mode)
    
    # Get LLM instance with conversational temperature
    llm = get_llm(temperature=0.8)
    
    # Stream tokens from the LLM using astream()
    async for chunk in llm.astream(context):
        # Extract the content from the chunk (AIMessageChunk has .content)
        if chunk.content:
            yield chunk.content


def get_greeting_message() -> str:
    """
    Get the AI greeting message for new conversations.
    
    Returns:
        The greeting message string
    """
    return GREETING_MESSAGE
