"""
Text-to-speech service.

Converts text scripts to high-quality audio using ElevenLabs TTS API.
"""
import io
from elevenlabs.client import ElevenLabs
from mutagen.mp3 import MP3
from config import get_settings


def text_to_speech(script: str, voice: str = "JBFqnCBsd6RMkjVDRZzb") -> dict:
    """
    Convert text script to audio using ElevenLabs.
    
    Args:
        script: The text script to convert
        voice: Voice ID to use (default is George - a warm, engaging voice)
               Other options:
               - "21m00Tcm4TlvDq8ikWAM" (Rachel - calm, female)
               - "AZnzlk1XvdvUeBnXmlld" (Domi - strong, male)
               - "EXAVITQu4vr4xnSDxMaL" (Bella - soft, female)
               - "JBFqnCBsd6RMkjVDRZzb" (George - warm, male)
        
    Returns:
        dict with keys:
            - audio_data: Audio file bytes (MP3 format)
            - duration: Duration in seconds
            - error: Error message if conversion failed (None if successful)
    """
    try:
        settings = get_settings()
        
        # Initialize client
        client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        
        # Generate audio
        print(f"[TTS] Generating audio for {len(script)} characters...")
        audio_generator = client.text_to_speech.convert(
            text=script,
            voice_id=voice,
            model_id="eleven_turbo_v2_5",  # Fast, high-quality model
            output_format="mp3_44100_128"  # Standard MP3 quality
        )
        
        # Collect audio bytes from generator
        audio_chunks = []
        for chunk in audio_generator:
            audio_chunks.append(chunk)
        
        audio_data = b"".join(audio_chunks)
        print(f"[TTS] Generated {len(audio_data)} bytes of audio")
        
        # Calculate duration using mutagen
        try:
            audio_file = io.BytesIO(audio_data)
            audio = MP3(audio_file)
            duration = audio.info.length
            print(f"[TTS] Audio duration: {duration:.2f} seconds")
        except Exception as e:
            print(f"[TTS] Warning: Could not calculate duration: {e}")
            # Rough estimate: ~150 words per minute
            word_count = len(script.split())
            duration = (word_count / 150) * 60
            print(f"[TTS] Using estimated duration: {duration:.2f} seconds")
        
        return {
            "audio_data": audio_data,
            "duration": duration,
            "error": None
        }
        
    except Exception as e:
        error_msg = f"TTS conversion failed: {str(e)}"
        print(f"[ERROR] {error_msg}")
        return {
            "audio_data": b"",
            "duration": 0,
            "error": error_msg
        }


