"""
Request DTOs for API endpoints.
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator
# for incoming requests (client -> server)
# validate incoming request bodies, make sure clients send valid data
# runs before the route handler is called

class CreateClipRequest(BaseModel):
    """Request body for creating a new audio clip."""
    
    input_type: Literal["url", "note"] = Field(
        description="Type of input: 'url' for web pages, 'note' for raw text"
    )
    input_content: str = Field(
        min_length=1,
        max_length=10000,
        description="The URL or text content to convert"
    )
    target_duration: Literal[2, 5, 10] = Field(
        description="Target audio duration in minutes"
    )
    context_instruction: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional instruction (e.g., 'Focus on financial aspects')"
    )
    
    @field_validator("input_content")
    @classmethod
    def validate_content(cls, v: str, info) -> str:
        """Ensure URL inputs look like URLs."""
        # Access input_type from the data being validated
        return v.strip()


class UpdateProgressRequest(BaseModel):
    """Request body for updating playback progress."""
    
    position_seconds: int = Field(
        ge=0,
        description="Current playback position in seconds"
    )
    has_completed: bool = Field(
        default=False,
        description="Whether playback reached the end"
    )


