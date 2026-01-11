"""
Conversation CRUD endpoints and message handling.

Supports both streaming (SSE) and non-streaming response modes.
"""
import json
from typing import Annotated, AsyncGenerator, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from services.auth import get_current_user, AuthenticatedUser
from services.database import get_supabase_client
from services.conversation_service import (
    generate_response,
    generate_response_stream,
    get_greeting_message,
)
from models.requests import (
    CreateConversationRequest,
    UpdateConversationRequest,
    SendMessageRequest,
)
from models.responses import (
    ConversationResponse,
    ConversationsListResponse,
    ConversationMessageResponse,
    MessagesListResponse,
    MessageResponse,
)

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    request: CreateConversationRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Create a new conversation.
    
    Creates an empty conversation and adds an AI greeting message.
    """
    supabase = get_supabase_client()
    
    # Create the conversation
    result = supabase.table("conversations").insert({
        "user_id": user.id,
        "title": request.title,  # None if not provided
    }).execute()
    
    if not result or not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create conversation"
        )
    
    conversation = result.data[0]
    
    # Add AI greeting message
    greeting = get_greeting_message()
    supabase.table("conversation_messages").insert({
        "conversation_id": conversation["id"],
        "role": "assistant",
        "content": greeting,
    }).execute()
    
    return ConversationResponse(**conversation)


@router.get("", response_model=ConversationsListResponse)
async def list_conversations(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    List all conversations for the current user.
    
    Returns conversations sorted by most recently updated first.
    """
    supabase = get_supabase_client()
    
    result = supabase.table("conversations")\
        .select("*")\
        .eq("user_id", user.id)\
        .order("updated_at", desc=True)\
        .execute()
    
    return ConversationsListResponse(
        conversations=[ConversationResponse(**conv) for conv in result.data]
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Get a single conversation by ID."""
    supabase = get_supabase_client()
    
    result = supabase.table("conversations")\
        .select("*")\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse(**result.data)


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Update a conversation (rename)."""
    supabase = get_supabase_client()
    
    # Verify ownership first
    existing = supabase.table("conversations")\
        .select("id")\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Update the title
    result = supabase.table("conversations")\
        .update({"title": request.title})\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .execute()
    
    return ConversationResponse(**result.data[0])


@router.delete("/{conversation_id}", response_model=MessageResponse)
async def delete_conversation(
    conversation_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Delete a conversation and all its messages.
    
    Messages are deleted via CASCADE constraint in the database.
    """
    supabase = get_supabase_client()
    
    # Verify ownership
    existing = supabase.table("conversations")\
        .select("id")\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Delete (messages deleted via CASCADE)
    supabase.table("conversations")\
        .delete()\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .execute()
    
    return MessageResponse(message="Conversation deleted successfully")


@router.get("/{conversation_id}/messages", response_model=MessagesListResponse)
async def get_messages(
    conversation_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Get all messages in a conversation.
    
    Returns messages in chronological order (oldest first).
    """
    supabase = get_supabase_client()
    
    # Verify conversation ownership
    conv = supabase.table("conversations")\
        .select("id")\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not conv.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Fetch messages
    result = supabase.table("conversation_messages")\
        .select("*")\
        .eq("conversation_id", conversation_id)\
        .order("created_at", desc=False)\
        .execute()
    
    return MessagesListResponse(
        messages=[ConversationMessageResponse(**msg) for msg in result.data]
    )


@router.post("/{conversation_id}/messages", response_model=MessagesListResponse)
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    stream: bool = Query(default=False, description="Enable SSE streaming for AI response")
) -> Union[MessagesListResponse, StreamingResponse]:
    """
    Send a message and get an AI response.
    
    Saves the user message, generates an AI response, saves it,
    and returns both messages. Updates conversation's updated_at timestamp.
    
    When stream=true, returns a StreamingResponse with SSE format:
    - {"type": "user_message", "message": {...}} - The saved user message
    - {"type": "token", "content": "..."} - Each token as it's generated
    - {"type": "done", "message": {...}} - The final saved AI message
    - {"type": "error", "message": "..."} - If an error occurs
    """
    supabase = get_supabase_client()
    
    # Verify conversation ownership
    conv = supabase.table("conversations")\
        .select("id, title")\
        .eq("id", conversation_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not conv.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    # Save user message
    user_msg_result = supabase.table("conversation_messages").insert({
        "conversation_id": conversation_id,
        "role": "user",
        "content": request.content,
    }).execute()
    
    if not user_msg_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save message"
        )
    
    user_message = user_msg_result.data[0]
    
    # Handle streaming mode
    if stream:
        return StreamingResponse(
            _stream_response(
                conversation_id=conversation_id,
                user_content=request.content,
                user_message=user_message,
                conv_title=conv.data.get("title"),
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",  # Disable nginx buffering
            }
        )
    
    # Non-streaming mode (original behavior)
    try:
        ai_response_text = await generate_response(conversation_id, request.content)
    except Exception as e:
        print(f"[ERROR] Failed to generate AI response: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate response. Please try again."
        )
    
    # Save AI response
    ai_msg_result = supabase.table("conversation_messages").insert({
        "conversation_id": conversation_id,
        "role": "assistant",
        "content": ai_response_text,
    }).execute()
    
    if not ai_msg_result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save AI response"
        )
    
    ai_message = ai_msg_result.data[0]
    
    # Update conversation's updated_at timestamp
    supabase.table("conversations")\
        .update({"updated_at": "now()"})\
        .eq("id", conversation_id)\
        .execute()
    
    # Auto-generate title from first user message if no title set
    if not conv.data.get("title"):
        auto_title = request.content[:50] + ("..." if len(request.content) > 50 else "")
        supabase.table("conversations")\
            .update({"title": auto_title})\
            .eq("id", conversation_id)\
            .execute()
    
    # Return both messages
    return MessagesListResponse(messages=[
        ConversationMessageResponse(**user_message),
        ConversationMessageResponse(**ai_message),
    ])


async def _stream_response(
    conversation_id: str,
    user_content: str,
    user_message: dict,
    conv_title: str | None,
) -> AsyncGenerator[str, None]:
    """
    Generate SSE stream for AI response.
    
    Yields SSE-formatted events containing:
    1. The saved user message
    2. Each token from the LLM
    3. The final saved AI message (or error)
    
    Args:
        conversation_id: UUID of the conversation
        user_content: The user's message content
        user_message: The saved user message dict
        conv_title: Current conversation title (or None)
    """
    supabase = get_supabase_client()
    
    # Helper to format SSE event
    def sse_event(data: dict) -> str:
        return f"data: {json.dumps(data)}\n\n"
    
    # Send user message first so frontend can display it immediately
    yield sse_event({
        "type": "user_message",
        "message": user_message,
    })
    
    # Accumulate full response for saving to database
    full_response = ""
    
    try:
        # Stream tokens from LLM
        async for token in generate_response_stream(conversation_id, user_content):
            full_response += token
            yield sse_event({
                "type": "token",
                "content": token,
            })
        
        # Save complete AI response to database
        ai_msg_result = supabase.table("conversation_messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": full_response,
        }).execute()
        
        if not ai_msg_result.data:
            yield sse_event({
                "type": "error",
                "message": "Failed to save AI response",
            })
            return
        
        ai_message = ai_msg_result.data[0]
        
        # Update conversation's updated_at timestamp
        supabase.table("conversations")\
            .update({"updated_at": "now()"})\
            .eq("id", conversation_id)\
            .execute()
        
        # Auto-generate title from first user message if no title set
        if not conv_title:
            auto_title = user_content[:50] + ("..." if len(user_content) > 50 else "")
            supabase.table("conversations")\
                .update({"title": auto_title})\
                .eq("id", conversation_id)\
                .execute()
        
        # Send done event with the saved message
        yield sse_event({
            "type": "done",
            "message": ai_message,
        })
        
    except Exception as e:
        print(f"[ERROR] Streaming failed: {e}")
        yield sse_event({
            "type": "error",
            "message": "Failed to generate response. Please try again.",
        })
