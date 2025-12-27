"""
Main processor - invokes the graph for a clip.

This module provides the high-level interface for processing a clip.
It's called by the background worker and handles:
- Fetching clip data from database
- Invoking the processing graph
- Error handling and status updates
"""
from datetime import datetime
from services.graph.graph import processing_graph
from services.graph.state import ProcessingState
from services.database import get_supabase_client


def process_clip(clip_id: str) -> dict:
    """
    Process a single clip through the entire pipeline.
    
    Args:
        clip_id: The database ID of the clip to process
        
    Returns:
        dict with processing results and status
    """
    supabase = get_supabase_client()
    
    try:
        # Fetch clip from database
        result = supabase.table("audio_clips").select("*").eq("id", clip_id).single().execute()
        
        if not result.data:
            return {"success": False, "error": "Clip not found"}
        
        clip = result.data
        
        # Update status to processing and set started_processing_at timestamp
        supabase.table("audio_clips").update({
            "status": "processing",
            "started_processing_at": datetime.utcnow().isoformat()
        }).eq("id", clip_id).execute()
        
        # Create initial state
        initial_state = ProcessingState(
            clip_id=clip_id,
            input_type=clip["input_type"],
            input_content=clip["input_content"],
            target_duration=clip["target_duration"],
            context_instruction=clip.get("context_instruction")
        )
        
        # Run the graph
        print(f"[PROCESSOR] Starting processing for clip {clip_id}")
        final_state = processing_graph.invoke(initial_state.dict())
        
        # Check for errors
        if final_state.get("error"):
            supabase.table("audio_clips").update({
                "status": "failed",
                "error_message": final_state["error"]
            }).eq("id", clip_id).execute()
            return {"success": False, "error": final_state["error"]}
        
        print(f"[PROCESSOR] Completed processing for clip {clip_id}")
        return {"success": True, "state": final_state}
        
    except Exception as e:
        print(f"[ERROR] Processing failed for clip {clip_id}: {e}")
        supabase.table("audio_clips").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", clip_id).execute()
        return {"success": False, "error": str(e)}


