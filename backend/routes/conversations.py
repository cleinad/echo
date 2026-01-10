"""
Conversation CRUD endpoints and message handling.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from services.auth import get_current_user, AuthenticatedUser
from services.database import get_supabase_client
from services.conversation_service import generate_response, get_greeting_message
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
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Send a message and get an AI response.
    
    Saves the user message, generates an AI response, saves it,
    and returns both messages. Updates conversation's updated_at timestamp.
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
    
    # Generate AI response
    try:
        ai_response_text = await generate_response(conversation_id, request.content)
    except Exception as e:
        # Log error but still return user message
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
        # Use first 50 chars of user message as title
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
