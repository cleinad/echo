"""
Individual node functions for the processing graph.

Each node is a function that:
- Takes a ProcessingState dict
- Performs a specific operation
- Returns updated state dict

Nodes should be pure functions focused on a single responsibility.
"""
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from config import get_settings
from services.llm_service import get_llm


def process_note_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Process note input - simply passes text through.
    
    For note inputs, the content is already text, so we just
    copy it to extracted_content for the next node.
    """
    print(f"[NODE] Processing note input for clip {state['clip_id']}")
    state["extracted_content"] = state["input_content"]
    return state


def scrape_url_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract text content from URL.
    
    TODO: Implement web scraping logic
    - Fetch URL content
    - Extract main text (remove nav, ads, etc.)
    - Extract page title
    - Handle errors gracefully
    """
    print(f"[NODE] Scraping URL for clip {state['clip_id']}")
    # Placeholder - will implement with trafilatura or beautifulsoup4
    state["extracted_content"] = "TODO: Implement URL scraping"
    state["page_title"] = "TODO: Extract title"
    return state


def generate_script_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate spoken-word script using LLM.
    
    Takes extracted content and generates a conversational script
    targeting the specified duration. The script must be:
    - Written for ears, not eyes (no bullet points)
    - Conversational and engaging
    - Highly credible and informative
    - Appropriate length for target duration
    """
    print(f"[NODE] Generating script for clip {state['clip_id']}")
    
    settings = get_settings()
    
    # Calculate target word count based on duration
    # Average speaking rate: ~150 words per minute for podcast-style content
    target_duration_minutes = state["target_duration"]
    target_word_count = target_duration_minutes * 150
    
    # Build the prompt
    system_prompt = """You are an expert podcast script writer. Your job is to transform written content into engaging spoken-word scripts.

Key requirements:
- Write for EARS, not eyes - no bullet points, lists, or visual formatting
- Use a conversational, natural speaking style
- Be informative and credible - speak with authority
- Use smooth transitions between ideas
- Include natural pauses and breathing room in the narrative
- Make complex topics accessible without dumbing them down

Your scripts should sound like a knowledgeable friend explaining something interesting over coffee."""

    user_prompt = """Create a podcast-style audio script based on the following content.

TARGET DURATION: {target_duration} minutes (approximately {target_word_count} words)
{context_section}

CONTENT TO TRANSFORM:
{content}

INSTRUCTIONS:
1. Craft a natural, conversational script that flows smoothly when read aloud
2. Target approximately {target_word_count} words (for {target_duration} minutes of audio)
3. Open with a brief hook to engage the listener
4. Present information in a logical, easy-to-follow narrative
5. Use natural speech patterns - contractions, rhetorical questions, etc.
6. Close with a satisfying conclusion or key takeaway
7. NO bullet points, lists, or "wall of text" - just natural spoken narrative

Write ONLY the script - no meta-commentary, stage directions, or labels."""

    # Add context instruction if provided
    context_section = ""
    if state.get("context_instruction"):
        context_section = f"\nSPECIAL FOCUS: {state['context_instruction']}"
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", user_prompt)
    ])
    
    # Initialize LLM
    llm = get_llm(model="gpt-4o-mini", temperature=0.7)
    
    # Create chain
    chain = prompt | llm | StrOutputParser()
    
    # Generate script
    try:
        script = chain.invoke({
            "target_duration": target_duration_minutes,
            "target_word_count": target_word_count,
            "context_section": context_section,
            "content": state["extracted_content"]
        })
        
        state["script"] = script.strip()
        print(f"[NODE] Generated script: {len(script.split())} words (target: {target_word_count})")
        
    except Exception as e:
        print(f"[ERROR] Script generation failed: {e}")
        state["error"] = f"Script generation failed: {str(e)}"
    
    return state


def text_to_speech_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert script to audio using TTS API.
    
    Uses ElevenLabs TTS to generate high-quality audio from the script.
    """
    print(f"[NODE] Converting script to audio for clip {state['clip_id']}")
    
    from services.tts_service import text_to_speech
    
    # Get the script from state
    script = state.get("script", "")
    if not script:
        state["error"] = "No script available for TTS conversion"
        return state
    
    # Convert to audio
    result = text_to_speech(script)
    
    # Check for errors
    if result.get("error"):
        state["error"] = result["error"]
        return state
    
    # Update state with audio data
    state["audio_data"] = result["audio_data"]
    state["actual_duration"] = result["duration"]
    
    print(f"[NODE] Audio generated: {result['duration']:.2f} seconds")
    return state


def save_audio_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload audio to Supabase storage.
    
    Uploads the generated MP3 audio to Supabase storage bucket
    and stores the private URL in state.
    """
    print(f"[NODE] Saving audio for clip {state['clip_id']}")
    
    from services.database import get_supabase_client
    
    # Check if we have audio data
    audio_data = state.get("audio_data")
    if not audio_data:
        state["error"] = "No audio data available to save"
        return state
    
    try:
        supabase = get_supabase_client()
        
        # Generate filename
        filename = f"{state['clip_id']}.mp3"
        
        # Upload to Supabase storage
        print(f"[NODE] Uploading {len(audio_data)} bytes to storage as {filename}")
        
        result = supabase.storage.from_("audio-files").upload(
            path=filename,
            file=audio_data,
            file_options={
                "content-type": "audio/mpeg",
                "upsert": "true"  # Overwrite if exists
            }
        )
        
        # Generate signed URL (expires in 1 year for long-term access)
        # For private buckets, we need signed URLs that include authentication
        signed_url_response = supabase.storage.from_("audio-files").create_signed_url(
            filename, 
            expires_in=31536000  # 1 year in seconds
        )
        
        # Extract the signed URL from the response
        if isinstance(signed_url_response, dict) and "signedURL" in signed_url_response:
            audio_url = signed_url_response["signedURL"]
        else:
            audio_url = signed_url_response
        
        print(f"[NODE] Audio uploaded successfully: {audio_url}")
        
        # Update state
        state["audio_filename"] = filename
        state["audio_url"] = audio_url
        
    except Exception as e:
        error_msg = f"Failed to save audio: {str(e)}"
        print(f"[ERROR] {error_msg}")
        state["error"] = error_msg
    
    return state


def update_clip_status_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update database with completed clip information.
    
    Updates the audio_clips table with the final results:
    - Sets status to "completed"
    - Stores audio_url and actual_duration
    - Sets page_title (if available from URL scraping)
    - Records completed_at timestamp
    """
    print(f"[NODE] Updating clip status for {state['clip_id']}")
    
    from services.database import get_supabase_client
    from datetime import datetime
    
    try:
        supabase = get_supabase_client()
        
        # Prepare update data
        update_data = {
            "status": "completed",
            "generated_script": state.get("script"),  # Save the generated script
            "audio_url": state.get("audio_url"),
            "actual_duration": int(state.get("actual_duration", 0)) if state.get("actual_duration") else None,
            "completed_at": datetime.utcnow().isoformat()
        }
        
        # Add page_title if available (for URL inputs)
        if state.get("page_title"):
            update_data["page_title"] = state["page_title"]
        
        # Update the database
        result = supabase.table("audio_clips").update(update_data).eq("id", state["clip_id"]).execute()
        
        if not result.data:
            print(f"[WARNING] Database update returned no data for clip {state['clip_id']}")
        else:
            print(f"[NODE] Clip {state['clip_id']} marked as completed")
        
    except Exception as e:
        error_msg = f"Failed to update clip status: {str(e)}"
        print(f"[ERROR] {error_msg}")
        state["error"] = error_msg
    
    return state


