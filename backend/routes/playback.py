"""
Playback progress endpoints.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from services.auth import get_current_user, AuthenticatedUser
from services.database import get_supabase_client
from models.requests import UpdateProgressRequest
from models.responses import PlaybackProgressResponse

router = APIRouter(prefix="/clips", tags=["playback"])


@router.get("/{clip_id}/progress", response_model=PlaybackProgressResponse)
async def get_progress(
    clip_id: str,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """Get playback progress for a clip."""
    supabase = get_supabase_client()
    
    # Verify clip exists and belongs to user
    clip = supabase.table("audio_clips")\
        .select("id")\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not clip.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clip not found"
        )
    
    # Get progress (may not exist yet)
    try:
        result = supabase.table("playback_progress")\
            .select("*")\
            .eq("clip_id", clip_id)\
            .eq("user_id", user.id)\
            .maybe_single()\
            .execute()
        
        if result and result.data:
            return PlaybackProgressResponse(
                clip_id=clip_id,
                position_seconds=result.data["position_seconds"],
                has_completed=result.data["has_completed"],
                last_played_at=result.data["last_played_at"]
            )
    except Exception as e:
        # Log error and return defaults if progress can't be fetched
        print(f"[ERROR] Failed to fetch playback progress: {e}")
    
    # No progress yet or error occurred, return defaults
    return PlaybackProgressResponse(clip_id=clip_id)


@router.put("/{clip_id}/progress", response_model=PlaybackProgressResponse)
async def update_progress(
    clip_id: str,
    request: UpdateProgressRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)]
):
    """
    Update playback progress (upsert).
    Creates record if doesn't exist, updates if it does.
    """
    supabase = get_supabase_client()
    
    # Verify clip exists and belongs to user
    clip = supabase.table("audio_clips")\
        .select("id")\
        .eq("id", clip_id)\
        .eq("user_id", user.id)\
        .single()\
        .execute()
    
    if not clip.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Clip not found"
        )
    
    # Upsert progress record
    result = supabase.table("playback_progress")\
        .upsert({
            "user_id": user.id,
            "clip_id": clip_id,
            "position_seconds": request.position_seconds,
            "has_completed": request.has_completed
        }, on_conflict="user_id,clip_id")\
        .execute()
    
    if not result or not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update playback progress"
        )
    
    return PlaybackProgressResponse(
        clip_id=clip_id,
        position_seconds=result.data[0]["position_seconds"],
        has_completed=result.data[0]["has_completed"],
        last_played_at=result.data[0].get("last_played_at")
    )


