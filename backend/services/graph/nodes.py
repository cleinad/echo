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
    llm = ChatOpenAI(
        model="gpt-4o-mini",  # Fast and cost-effective for script generation
        temperature=0.7,  # Creative but consistent
        api_key=settings.OPENAI_API_KEY
    )
    
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
    
    TODO: Implement TTS conversion
    - Call TTS API (OpenAI TTS, ElevenLabs, etc.)
    - Generate high-quality MP3
    - Calculate actual audio duration
    - Return audio bytes
    """
    print(f"[NODE] Converting script to audio for clip {state['clip_id']}")
    # Placeholder
    state["audio_data"] = b"TODO: Implement TTS"
    state["actual_duration"] = 0
    return state


def save_audio_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Upload audio to Supabase storage.
    
    TODO: Implement storage upload
    - Upload audio_data to Supabase storage bucket
    - Generate filename (e.g., {clip_id}.mp3)
    - Get public URL
    - Return URL and filename
    """
    print(f"[NODE] Saving audio for clip {state['clip_id']}")
    # Placeholder
    state["audio_filename"] = f"{state['clip_id']}.mp3"
    state["audio_url"] = "TODO: Implement storage"
    return state


def update_clip_status_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update database with completed clip information.
    
    TODO: Implement database update
    - Update audio_clips table
    - Set status to "completed"
    - Set audio_url, actual_duration, page_title
    - Set completed_at timestamp
    """
    print(f"[NODE] Updating clip status for {state['clip_id']}")
    # Placeholder - will implement with Supabase client
    return state


