"""
Background worker - polls for pending clips and processes them.

This is the main entry point for background processing.
It continuously checks for pending clips and processes them.

TODO: Implement polling loop
- Check for pending clips
- Process them one at a time (or parallel with rate limiting)
- Handle graceful shutdown
- Add retry logic
- Add monitoring/logging

For MVP, this can be run manually or as a simple daemon.
Later, consider using Celery, RQ, or similar for production.
"""
import time
from services.database import get_supabase_client
from processor import process_clip


def run_worker(interval: int = 10):
    """
    Run the background worker loop.
    
    Args:
        interval: Seconds to wait between polling cycles
    """
    print("[WORKER] Starting background worker...")
    
    while True:
        try:
            supabase = get_supabase_client()
            
            # Fetch pending clips
            result = supabase.table("audio_clips")\
                .select("id")\
                .eq("status", "pending")\
                .order("created_at", desc=False)\
                .limit(5)\
                .execute()
            
            if result.data:
                print(f"[WORKER] Found {len(result.data)} pending clips")
                
                for clip in result.data:
                    clip_id = clip["id"]
                    print(f"[WORKER] Processing clip {clip_id}")
                    process_clip(clip_id)
            
            # Wait before next poll
            time.sleep(interval)
            
        except KeyboardInterrupt:
            print("[WORKER] Shutting down gracefully...")
            break
        except Exception as e:
            print(f"[ERROR] Worker error: {e}")
            time.sleep(interval)


if __name__ == "__main__":
    run_worker()


