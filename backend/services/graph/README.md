# Audio Processing Graph

This directory contains the LangGraph-based processing pipeline for audio clip generation.

## Architecture

The processing pipeline uses **LangGraph** (not just a simple chain) to handle branching logic:

```
START
  ↓
[Router] → input_type == "note" → [Process Note]
         → input_type == "url"  → [Scrape URL]
  ↓
[Generate Script] ← (both paths converge here)
  ↓
[Text-to-Speech]
  ↓
[Save Audio]
  ↓
[Update Status]
  ↓
END
```

## Files

- **`state.py`** - Defines `ProcessingState` (Pydantic model) that flows through the graph
- **`nodes.py`** - Individual node functions (process_note, scrape_url, generate_script, etc.)
- **`graph.py`** - Graph definition and compilation

## Current Status

### ✅ Implemented
- Graph structure with conditional routing
- `process_note_node` - passes note text through
- `generate_script_node` - LLM script generation with OpenAI
- `text_to_speech_node` - ElevenLabs TTS conversion
- `save_audio_node` - upload to Supabase storage
- `update_clip_status_node` - update database with results

### 🚧 TODO
- `scrape_url_node` - implement URL scraping with trafilatura

## Testing Script Generation

Use the test script to try out script generation with notes:

```bash
# Make sure you have OPENAI_API_KEY in your .env
cd backend
source venv/bin/activate
python test_script_generation.py
```

This will run 3 sample test cases with different durations (2, 5, 10 minutes).

## How to Add/Modify Nodes

Each node is a function that:
1. Takes a state dict (`Dict[str, Any]`)
2. Performs its operation
3. Returns the updated state dict

Example:
```python
def my_new_node(state: Dict[str, Any]) -> Dict[str, Any]:
    # Do something
    state["new_field"] = "some value"
    return state
```

Then add it to the graph in `graph.py`:
```python
workflow.add_node("my_node", my_new_node)
workflow.add_edge("previous_node", "my_node")
```

## State Flow

The state carries these fields through the pipeline:

**Input (from database):**
- `clip_id` - Database ID
- `input_type` - "url" or "note"
- `input_content` - Raw input
- `target_duration` - 2, 5, or 10 minutes
- `context_instruction` - Optional user instruction

**Intermediate (populated by nodes):**
- `extracted_content` - Text extracted from URL or note
- `page_title` - Title (for URLs)
- `script` - Generated script
- `audio_data` - Audio file bytes
- `audio_filename` - Storage filename
- `audio_url` - Public URL
- `actual_duration` - Actual audio length in seconds

**Error handling:**
- `error` - Error message if processing fails


