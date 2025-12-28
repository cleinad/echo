"use client";

import { useState, useCallback } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { CreateClipModal } from "@/components/CreateClipModal";
import { ClipList } from "@/components/ClipList";
import { GlobalAudioPlayer } from "@/components/GlobalAudioPlayer";
import { useAudio } from "@/lib/audio-context";
import { ClipResponse } from "@/lib/api";

function Library() {
  const { currentClip, stopPlayback } = useAudio();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleClipCreated = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleClosePlayer = useCallback(() => {
    stopPlayback();
  }, [stopPlayback]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Clip
          </button>
        </div>

        {/* Clip List */}
        <ClipList refreshTrigger={refreshTrigger} />
      </main>

      {/* Create Clip Modal */}
      <CreateClipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleClipCreated}
      />

      {/* Global Audio Player */}
      <GlobalAudioPlayer onClose={handleClosePlayer} />
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard>
      <Library />
    </AuthGuard>
  );
}
