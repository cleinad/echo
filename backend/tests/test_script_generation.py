"""
Test script for script generation node.

Use this to test and tweak the LLM prompt for script generation
without running the full pipeline.

Usage:
    python test_script_generation.py
"""
import sys
from pathlib import Path

# Add parent directory to path so we can import from services
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.graph.nodes import generate_script_node


def test_note_script_generation():
    """Test script generation with a sample note."""
    
    # Sample test cases
    test_cases = [
        {
            "name": "Entropy explanation (2 min)",
            "state": {
                "clip_id": "test-001",
                "input_type": "note",
                "input_content": "Explain the concept of entropy to me like I'm 5",
                "target_duration": 2,
                "context_instruction": None,
                "extracted_content": "Explain the concept of entropy to me like I'm 5"
            }
        },
        {
            "name": "Python async explanation (5 min)",
            "state": {
                "clip_id": "test-002",
                "input_type": "note",
                "input_content": "Explain how async/await works in Python and when to use it",
                "target_duration": 5,
                "context_instruction": "Focus on practical examples and common pitfalls",
                "extracted_content": "Explain how async/await works in Python and when to use it"
            }
        },
        {
            "name": "Investment strategy (10 min)",
            "state": {
                "clip_id": "test-003",
                "input_type": "note",
                "input_content": "What are the key principles of value investing and how do they differ from growth investing?",
                "target_duration": 10,
                "context_instruction": None,
                "extracted_content": "What are the key principles of value investing and how do they differ from growth investing?"
            }
        }
    ]
    
    # Run tests
    for test_case in test_cases:
        print("\n" + "="*80)
        print(f"TEST: {test_case['name']}")
        print("="*80)
        
        result = generate_script_node(test_case["state"])
        
        if result.get("error"):
            print(f"\n❌ ERROR: {result['error']}")
        else:
            script = result.get("script", "")
            word_count = len(script.split())
            print(f"\n✅ Generated script ({word_count} words):\n")
            print(script)
            print(f"\n{'─'*80}")
            print(f"Word count: {word_count}")
            print(f"Target: ~{test_case['state']['target_duration'] * 150} words")
            print(f"Character count: {len(script)}")


if __name__ == "__main__":
    test_note_script_generation()


