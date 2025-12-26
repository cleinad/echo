"""
State schema for the audio processing graph.

Defines the data structure that flows through the graph nodes.
Each node reads from and writes to this state.
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field


class ProcessingState(BaseModel):
    """State object passed between graph nodes."""
    
    # Input data (from database)
    clip_id: str = Field(description="Database ID of the clip")
    input_type: Literal["url", "note"] = Field(description="Type of input")
    input_content: str = Field(description="Raw input (URL or text note)")
    target_duration: int = Field(description="Target duration in minutes (2, 5, or 10)")
    context_instruction: Optional[str] = Field(default=None, description="Optional user instruction")
    
    # Intermediate data (populated by nodes)
    extracted_content: Optional[str] = Field(default=None, description="Extracted text from URL or note")
    page_title: Optional[str] = Field(default=None, description="Title extracted from URL")
    script: Optional[str] = Field(default=None, description="Generated spoken-word script")
    audio_data: Optional[bytes] = Field(default=None, description="Generated audio file bytes")
    audio_filename: Optional[str] = Field(default=None, description="Storage filename for audio")
    audio_url: Optional[str] = Field(default=None, description="Public URL to stored audio")
    actual_duration: Optional[int] = Field(default=None, description="Actual audio duration in seconds")
    
    # Error handling
    error: Optional[str] = Field(default=None, description="Error message if processing fails")
    
    class Config:
        arbitrary_types_allowed = True


