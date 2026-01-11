"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <Link
            href="/conversation"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-6 py-3 font-medium text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-100 dark:hover:bg-zinc-900"
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
                d="M8 10h8m-8 4h5m-7 6 4-4h6a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4z"
              />
            </svg>
            Conversations
          </Link>
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
