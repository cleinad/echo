"""
Audio clips CRUD endpoints.
"""
from typing import Annotated, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from services.auth import get_current_user, AuthenticatedUser
from services.database import get_supabase_client
from models.requests import CreateClipRequest
from models.responses import ClipResponse, ClipsListResponse, MessageResponse

router = APIRouter(prefix="/clips", tags=["clips"])


@router.post("", response_model=ClipResponse, status_code=status.HTTP_201_CREATED)
async def create_clip(
    request: CreateClipRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Create a new audio clip.
    Sets status to 'pending' for background processing.
    """
    supabase = get_supabase_client()
    
    # Insert into audio_clips table
    result = supabase.table("audio_clips").insert({
        "user_id": user.id,
        "input_type": request.input_type,
        "input_content": request.input_content,
        "target_duration": request.target_duration,
        "context_instruction": request.context_instruction,
        "status": "pending"
    }).execute()
    
    if not result or not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create clip"
        )
    
    new_clip = result.data[0]
    
    # Initialize playback progress to 0 for the new clip
    # This ensures the frontend sees a 0% progress bar instead of null
    try:
        supabase.table("playback_progress").insert({
            "user_id": user.id,
            "clip_id": new_clip["id"],
            "position_seconds": 0,
            "has_completed": False
        }).execute()
    except Exception as e:
        # Log error but don't fail clip creation if progress initialization fails
        print(f"[ERROR] Failed to initialize playback progress for clip {new_clip['id']}: {e}")
    
    return ClipResponse(**new_clip)


@router.get("", response_model=ClipsListResponse)
async def list_clips(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    status_filter: Optional[Literal["pending", "processing", "completed", "failed"]] = Query(
        None, alias="status", description="Filter by status"
    ),
    favorited: Optional[bool] = Query(None, description="Filter by favorited"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    List user's audio clips with optional filtering.
    Returns newest first.
    """
    supabase = get_supabase_client()
    
    # Build query
    query = supabase.table("audio_clips")\
        .select("*", count="exact")\
        .eq("user_id", user.id)\
        .order("created_at", desc=True)\
        .range(offset, offset + limit - 1)
    
    # Apply filters
    if status_filter:
        query = query.eq("status", status_filter)
    if favorited is not None:
        query = query.eq("is_favorited", favorited)
    
    result = query.execute()
    
    return ClipsListResponse(
        clips=[ClipResponse(**clip) for clip in result.data],
        total=result.count or 0
    )


@router.get("/{clip_id}", response_model=ClipResponse)
async def get_clip(
    clip_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Get a single clip by ID."""
    supabase = get_supabase_client()
    
    result = supabase.table("audio_clips")\
        .select("*")\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clip not found"
        )
    
    return ClipResponse(**result.data)


@router.patch("/{clip_id}/favorite", response_model=ClipResponse)
async def toggle_favorite(
    clip_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Toggle the favorite status of a clip."""
    supabase = get_supabase_client()
    
    # First get current state
    current = supabase.table("audio_clips")\
        .select("is_favorited")\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not current.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clip not found"
        )
    
    # Toggle and update
    new_value = not current.data["is_favorited"]
    result = supabase.table("audio_clips")\
        .update({"is_favorited": new_value})\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .execute()
    
    return ClipResponse(**result.data[0])


@router.delete("/{clip_id}", response_model=MessageResponse)
async def delete_clip(
    clip_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Delete a clip and its associated audio file."""
    supabase = get_supabase_client()
    
    # Get clip to check ownership and get audio URL
    clip = supabase.table("audio_clips")\
        .select("audio_url")\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not clip.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clip not found"
        )
    
    # Delete from storage if audio exists
    if clip.data.get("audio_url"):
        try:
            # Extract filename from the clip_id (format: {clip_id}.mp3)
            filename = f"{clip_id}.mp3"
            supabase.storage.from_("audio-files").remove([filename])
        except Exception as e:
            print(f"[WARNING] Failed to delete audio file: {e}")
            pass  # Non-critical, continue with DB deletion
    
    # Delete from database (cascades to playback_progress via FK)
    supabase.table("audio_clips")\
        .delete()\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .execute()
    
    return MessageResponse(message="Clip deleted successfully")


