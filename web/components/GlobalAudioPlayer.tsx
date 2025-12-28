"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/lib/audio-context";
import {
  getPlaybackProgress,
  updatePlaybackProgress,
  ClipResponse,
} from "@/lib/api";

interface GlobalAudioPlayerProps {
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function GlobalAudioPlayer({ onClose }: GlobalAudioPlayerProps) {
  const { getAccessToken } = useAuth();
  const { currentClip: clip, isPlaying, setIsPlaying, stopPlayback } = useAudio();
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = useRef<number>(0);
  const initialSeekDoneRef = useRef<string | null>(null); // Track if initial seek for a clip ID is done

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title =
    clip?.page_title ||
    (clip?.input_type === "url"
      ? clip?.input_content
      : clip?.input_content?.slice(0, 60) || "");

  // Save progress to backend
  const saveProgress = useCallback(
    async (position: number, completed: boolean = false) => {
      if (!clip) return;

      // Don't save if position hasn't changed significantly (more than 1 second)
      if (Math.abs(position - lastSavedPositionRef.current) < 1 && !completed) {
        return;
      }

      try {
        const token = await getAccessToken();
        if (!token) return;

        await updatePlaybackProgress(
          clip.id,
          Math.floor(position),
          completed,
          token
        );
        lastSavedPositionRef.current = position;
      } catch (err) {
        console.error("Failed to save progress:", err);
      }
    },
    [clip, getAccessToken]
  );

  // Load saved progress when clip changes
  useEffect(() => {
    if (!clip?.audio_url) {
      initialSeekDoneRef.current = null;
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) return;

        const progress = await getPlaybackProgress(clip.id, token);
        
        // Only seek if we haven't done it for this clip ID yet
        if (audioRef.current && progress.position_seconds > 0 && initialSeekDoneRef.current !== clip.id) {
          const seekTo = progress.position_seconds;
          
          // Function to perform the actual seek
          const performSeek = () => {
            if (audioRef.current && initialSeekDoneRef.current !== clip.id) {
              audioRef.current.currentTime = seekTo;
              initialSeekDoneRef.current = clip.id;
              console.log(`Initial seek to ${seekTo} for clip ${clip.id}`);
            }
          };

          // Try seeking immediately if metadata is already loaded
          if (audioRef.current.readyState >= 1) {
            performSeek();
          } else {
            // Otherwise wait for metadata
            const handleMetadata = () => {
              performSeek();
              audioRef.current?.removeEventListener("loadedmetadata", handleMetadata);
            };
            audioRef.current.addEventListener("loadedmetadata", handleMetadata);
          }
        } else {
          initialSeekDoneRef.current = clip.id;
        }

        lastSavedPositionRef.current = progress.position_seconds;
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
    };

    loadProgress();
  }, [clip?.id, clip?.audio_url, getAccessToken]);

  // Synchronize playing state
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error("Playback failed:", err);
          // Auto-play might be blocked, update UI to show paused
          setIsPlaying(false);
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, setIsPlaying]);

  // Set up periodic progress saving
  useEffect(() => {
    if (isPlaying && clip) {
      progressSaveRef.current = setInterval(() => {
        if (audioRef.current) {
          saveProgress(audioRef.current.currentTime);
        }
      }, 5000);
    }

    return () => {
      if (progressSaveRef.current) {
        clearInterval(progressSaveRef.current);
      }
    };
  }, [isPlaying, clip, saveProgress]);

  // Save progress on unmount or clip change
  useEffect(() => {
    return () => {
      if (audioRef.current && clip) {
        saveProgress(audioRef.current.currentTime);
      }
    };
  }, [clip, saveProgress]);

  // Audio element event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    saveProgress(duration, true);
  };

  const handleError = () => {
    setError("Failed to load audio");
    setIsLoading(false);
    setIsPlaying(false);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      saveProgress(audioRef.current.currentTime);
    }
  };

  const handleWaiting = () => setIsLoading(true);
  const handlePlaying = () => setIsLoading(false);

  // Controls
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSeekEnd = () => {
    if (audioRef.current) {
      saveProgress(audioRef.current.currentTime);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        duration,
        audioRef.current.currentTime + 15
      );
    }
  };

  if (!clip) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 border-t border-zinc-800 shadow-2xl">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src={clip.audio_url || undefined}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
      />

      {/* Progress Bar (clickable) */}
      <div className="relative h-1 bg-zinc-800 cursor-pointer group">
        <div
          className="absolute left-0 top-0 h-full bg-white transition-all"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          onMouseUp={handleSeekEnd}
          onTouchEnd={handleSeekEnd}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Hover indicator */}
        <div className="absolute left-0 top-0 h-full w-full opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            className="absolute top-0 h-full w-1 bg-white rounded-full transform -translate-x-1/2"
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      {/* Player Content */}
      <div className="px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{title}</h4>
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-xs text-zinc-400">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Skip Back 15s */}
            <button
              onClick={skipBackward}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Skip back 15 seconds"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              disabled={isLoading && !isPlaying}
              className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {isLoading && !isPlaying ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip Forward 15s */}
            <button
              onClick={skipForward}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
              title="Skip forward 15 seconds"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.pause();
                saveProgress(audioRef.current.currentTime);
              }
              stopPlayback();
              onClose();
            }}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Close player"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
