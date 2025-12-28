"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { ClipResponse } from "@/lib/api";

interface AudioContextType {
  currentClip: ClipResponse | null;
  isPlaying: boolean;
  playClip: (clip: ClipResponse) => void;
  stopPlayback: () => void;
  setIsPlaying: (playing: boolean) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentClip, setCurrentClip] = useState<ClipResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playClip = useCallback((clip: ClipResponse) => {
    if (clip.status === "completed" && clip.audio_url) {
      setCurrentClip(clip);
      setIsPlaying(true);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    setCurrentClip(null);
    setIsPlaying(false);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentClip,
        isPlaying,
        playClip,
        stopPlayback,
        setIsPlaying,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}

