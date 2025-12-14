"""
Response DTOs for API endpoints.
"""
from typing import Optional, List, Literal
from datetime import datetime
from pydantic import BaseModel, Field
# for outgoing responses (server -> client)
# structure outgoing response bodies, ensure clientsreceive consistent, documented data
# runs after the route handler is called

class ClipResponse(BaseModel):
    """Single audio clip response."""
    
    id: str
    input_type: Literal["url", "note"]
    input_content: str
    context_instruction: Optional[str] = None
    page_title: Optional[str] = None
    target_duration: int
    status: Literal["pending", "processing", "completed", "failed"]
    audio_url: Optional[str] = None
    actual_duration: Optional[int] = None  # seconds
    error_message: Optional[str] = None
    is_favorited: bool = False
    created_at: datetime
    completed_at: Optional[datetime] = None


class ClipsListResponse(BaseModel):
    """Paginated list of clips."""
    
    clips: List[ClipResponse]
    total: int


class PlaybackProgressResponse(BaseModel):
    """Playback progress for a clip."""
    
    clip_id: str
    position_seconds: int = 0
    has_completed: bool = False
    last_played_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    
    detail: str


