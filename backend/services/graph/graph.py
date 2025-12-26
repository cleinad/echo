"""
Graph definition and compilation.

Defines the structure of the processing graph including:
- Node connections
- Conditional routing (note vs URL)
- Error handling paths
"""
from typing import Literal
from langgraph.graph import StateGraph, END
from .state import ProcessingState
from .nodes import (
    process_note_node,
    scrape_url_node,
    generate_script_node,
    text_to_speech_node,
    save_audio_node,
    update_clip_status_node
)


def route_input(state: dict) -> Literal["process_note", "scrape_url"]:
    """
    Router function to determine which path to take based on input_type.
    
    Returns:
        "process_note" if input_type is "note"
        "scrape_url" if input_type is "url"
    """
    return "process_note" if state["input_type"] == "note" else "scrape_url"


def build_processing_graph():
    """
    Build and compile the audio processing graph.
    
    Graph structure:
        START → router → [process_note OR scrape_url] → generate_script
        → text_to_speech → save_audio → update_status → END
    """
    # Initialize graph with state schema
    workflow = StateGraph(ProcessingState)
    
    # Add nodes
    workflow.add_node("process_note", process_note_node)
    workflow.add_node("scrape_url", scrape_url_node)
    workflow.add_node("generate_script", generate_script_node)
    workflow.add_node("text_to_speech", text_to_speech_node)
    workflow.add_node("save_audio", save_audio_node)
    workflow.add_node("update_status", update_clip_status_node)
    
    # Set entry point with conditional routing
    workflow.set_conditional_entry_point(
        route_input,
        {
            "process_note": "process_note",
            "scrape_url": "scrape_url"
        }
    )
    
    # Connect nodes in sequence
    # Both note and URL paths converge at generate_script
    workflow.add_edge("process_note", "generate_script")
    workflow.add_edge("scrape_url", "generate_script")
    
    # Linear flow from script generation to completion
    workflow.add_edge("generate_script", "text_to_speech")
    workflow.add_edge("text_to_speech", "save_audio")
    workflow.add_edge("save_audio", "update_status")
    workflow.add_edge("update_status", END)
    
    # Compile the graph
    return workflow.compile()


# Create compiled graph instance
processing_graph = build_processing_graph()


