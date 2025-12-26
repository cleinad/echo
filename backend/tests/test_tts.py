#!/usr/bin/env python3
"""
Quick test script for TTS service.
Generates a 30-second test audio clip.
"""
import sys
import os
from pathlib import Path


# Add parent directory to path so we can import from services
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.tts_service import text_to_speech


def main():
    """Generate a test audio clip."""
    
    # Script for approximately 36 seconds (90 words @ 150 wpm)
    test_script = """
    Computational number theory is a subfield of mathematics and computer science 
    focused on the development and implementation of efficient algorithms for 
    solving problems in number theory. While classical number theory often deals 
    with existence proofs (e.g., "there exists a prime between $n$ and $2n$"), 
    computational number theory is concerned with the how: "How do we find a 
    500-digit prime?" or "How do we factor this 1024-bit integer?"A central topic 
    in modern research is the study of Zeta functions and L-polynomials, which 
    encode deep arithmetic information about geometric objects.
    """
    
    print("=" * 60)
    print("Testing ElevenLabs TTS Service")
    print("=" * 60)
    print(f"\nScript length: {len(test_script.split())} words")
    print("\nGenerating audio...")
    
    # Generate audio
    result = text_to_speech(test_script.strip())
    
    # Check for errors
    if result.get("error"):
        print(f"\n❌ ERROR: {result['error']}")
        return 1
    
    # Save to file
    output_dir = Path(__file__).parent / "test-audio"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "test_30sec.mp3"
    
    with open(output_file, "wb") as f:
        f.write(result["audio_data"])
    
    print(f"\n✅ Success!")
    print(f"   Duration: {result['duration']:.2f} seconds")
    print(f"   File size: {len(result['audio_data']):,} bytes")
    print(f"   Saved to: {output_file}")
    print("\nYou can now play the audio file to verify quality.")
    print("=" * 60)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

