"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useAudio } from "@/lib/audio-context";
import {
  listClips,
  toggleFavorite,
  deleteClip,
  getPlaybackProgress,
  ClipResponse,
  PlaybackProgressResponse,
} from "@/lib/api";

interface ClipListProps {
  refreshTrigger?: number;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function getStatusStyles(status: ClipResponse["status"]): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case "pending":
      return {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-700 dark:text-amber-400",
        label: "Pending",
      };
    case "processing":
      return {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-400",
        label: "Processing",
      };
    case "completed":
      return {
        bg: "bg-emerald-100 dark:bg-emerald-900/30",
        text: "text-emerald-700 dark:text-emerald-400",
        label: "Ready",
      };
    case "failed":
      return {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-700 dark:text-red-400",
        label: "Failed",
      };
  }
}

function ClipCard({
  clip,
  onToggleFavorite,
  onDelete,
  playbackProgress,
}: {
  clip: ClipResponse;
  onToggleFavorite: () => void;
  onDelete: () => void;
  playbackProgress?: PlaybackProgressResponse;
}) {
  const { currentClip, isPlaying, playClip, setIsPlaying } = useAudio();
  const isThisClipPlaying = currentClip?.id === clip.id;
  const isThisClipActiveAndPlaying = isThisClipPlaying && isPlaying;

  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const statusStyles = getStatusStyles(clip.status);

  const title =
    clip.page_title ||
    (clip.input_type === "url"
      ? clip.input_content
      : clip.input_content.slice(0, 60) + (clip.input_content.length > 60 ? "..." : ""));

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete();
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const isPlayable = clip.status === "completed" && clip.audio_url;

  const onPlay = () => {
    if (!isPlayable) return;
    if (isThisClipPlaying) {
      setIsPlaying(!isPlaying);
    } else {
      playClip(clip);
    }
  };

  const progressSeconds = playbackProgress?.position_seconds ?? 0;
  const hasCompleted = playbackProgress?.has_completed ?? false;
  const durationSeconds = clip.actual_duration ?? null;
  const progressPercent =
    durationSeconds && durationSeconds > 0
      ? Math.min(100, (progressSeconds / durationSeconds) * 100)
      : 0;
  const shouldShowProgress = clip.status === "completed";

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        isThisClipPlaying
          ? "border-black dark:border-white bg-zinc-50 dark:bg-zinc-800/50"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
      }`}
    >
      <div className="p-4 pb-6">
        <div className="flex items-start gap-4">
          {/* Play Button */}
          <button
            onClick={onPlay}
            disabled={!isPlayable}
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlayable
                ? isThisClipPlaying
                  ? "bg-black dark:bg-white text-white dark:text-black"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            {clip.status === "processing" ? (
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
            ) : isThisClipActiveAndPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {title}
                </h3>
                <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {/* Input Type Icon */}
                  <span className="flex items-center gap-1">
                    {clip.input_type === "url" ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    )}
                  </span>
                  {/* Duration */}
                  <span>{formatDuration(clip.actual_duration)}</span>
                  {/* Date */}
                  <span>{formatDate(clip.created_at)}</span>
                </div>
              </div>

              {/* Status Badge */}
              {/* <span
                className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}
              >
                {statusStyles.label}
              </span> */}
              {/* Actions */}
        <div className="mt-3 flex items-center justify-end gap-1">
          {/* Delete (hover-only unless confirming) */}
          <div
            className={`transition-opacity ${
              showDeleteConfirm ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? "..." : "Delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Delete clip"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
          {/* Favorite Button (always visible) */}
          <button
            onClick={onToggleFavorite}
            className="p-2 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={clip.is_favorited ? "Remove from favorites" : "Add to favorites"}
          >
            {clip.is_favorited ? (
              <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </button>
        </div>
            </div>

            {/* Error Message */}
            {clip.status === "failed" && clip.error_message && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 truncate">
                {clip.error_message}
              </p>
            )}

            {/* Playback Progress */}
            {shouldShowProgress && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    {hasCompleted
                      ? "Completed"
                      : `Resume at ${formatTime(progressSeconds)}`}
                  </span>
                  {durationSeconds ? (
                    <span>{Math.round(progressPercent)}%</span>
                  ) : null}
                </div>
                {durationSeconds ? (
                  <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        hasCompleted ? "bg-emerald-500" : "bg-zinc-900 dark:bg-zinc-100"
                      }`}
                      style={{ width: `${hasCompleted ? 100 : progressPercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
}

function ClipCardSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex-1">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
          <div className="mt-2 h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        </div>
        <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
    </div>
  );
}

export function ClipList({
  refreshTrigger = 0,
}: ClipListProps) {
  const { getAccessToken } = useAuth();
  const [clips, setClips] = useState<ClipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressById, setProgressById] = useState<
    Record<string, PlaybackProgressResponse>
  >({});

  const fetchClips = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }
      const response = await listClips(token);
      setClips(response.clips);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clips");
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  // Initial load and refresh trigger
  useEffect(() => {
    fetchClips();
  }, [fetchClips, refreshTrigger]);

  // Load playback progress for completed clips (used to render progress on ClipCard)
  useEffect(() => {
    const completedIdsToLoad = clips
      .filter((c) => c.status === "completed")
      .map((c) => c.id)
      .filter((id) => !progressById[id]);

    if (completedIdsToLoad.length === 0) return;

    const loadProgressForClips = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const results = await Promise.all(
          completedIdsToLoad.map(async (clipId) => {
            try {
              const progress = await getPlaybackProgress(clipId, token);
              return [clipId, progress] as const;
            } catch (err) {
              console.error("Failed to fetch playback progress:", err);
              const fallback: PlaybackProgressResponse = {
                clip_id: clipId,
                position_seconds: 0,
                has_completed: false,
                last_played_at: null,
              };
              return [clipId, fallback] as const;
            }
          })
        );

        setProgressById((prev) => {
          const next = { ...prev };
          for (const [clipId, progress] of results) {
            next[clipId] = progress;
          }
          return next;
        });
      } catch (err) {
        console.error("Failed to load playback progress:", err);
      }
    };

    loadProgressForClips();
  }, [clips, getAccessToken, progressById]);

  // Auto-refresh for pending/processing clips
  useEffect(() => {
    const hasPendingClips = clips.some(
      (clip) => clip.status === "pending" || clip.status === "processing"
    );

    if (hasPendingClips) {
      const interval = setInterval(fetchClips, 5000);
      return () => clearInterval(interval);
    }
  }, [clips, fetchClips]);

  const handleToggleFavorite = async (clipId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      // Optimistic update
      setClips((prev) =>
        prev.map((c) =>
          c.id === clipId ? { ...c, is_favorited: !c.is_favorited } : c
        )
      );

      const updated = await toggleFavorite(clipId, token);
      setClips((prev) =>
        prev.map((c) => (c.id === clipId ? updated : c))
      );
    } catch (err) {
      // Revert on error
      fetchClips();
      console.error("Failed to toggle favorite:", err);
    }
  };

  const handleDelete = async (clipId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      await deleteClip(clipId, token);
      setClips((prev) => prev.filter((c) => c.id !== clipId));
    } catch (err) {
      console.error("Failed to delete clip:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <ClipCardSkeleton />
        <ClipCardSkeleton />
        <ClipCardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 dark:text-red-400">{error}</p>
        <button
          onClick={fetchClips}
          className="mt-4 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Try again
        </button>
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          No clips yet
        </h3>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Create your first audio clip to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {clips.map((clip) => (
        <ClipCard
          key={clip.id}
          clip={clip}
          onToggleFavorite={() => handleToggleFavorite(clip.id)}
          onDelete={() => handleDelete(clip.id)}
          playbackProgress={progressById[clip.id]}
        />
      ))}
    </div>
  );
}

