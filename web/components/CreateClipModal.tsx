"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { createClip } from "@/lib/api";

type InputType = "url" | "note";
type Duration = 2 | 5 | 10;

interface CreateClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateClipModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateClipModalProps) {
  const { getAccessToken } = useAuth();

  const [inputType, setInputType] = useState<InputType>("url");
  const [inputContent, setInputContent] = useState("");
  const [targetDuration, setTargetDuration] = useState<Duration>(5);
  const [contextInstruction, setContextInstruction] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputType("url");
      setInputContent("");
      setTargetDuration(5);
      setContextInstruction("");
      setError(null);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!inputContent.trim()) {
      setError("Please enter a URL or note");
      return;
    }

    if (inputType === "url") {
      try {
        new URL(inputContent);
      } catch {
        setError("Please enter a valid URL");
        return;
      }
    }

    setLoading(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        setError("Not authenticated. Please sign in again.");
        return;
      }

      await createClip(
        {
          input_type: inputType,
          input_content: inputContent.trim(),
          target_duration: targetDuration,
          context_instruction: contextInstruction.trim() || undefined,
        },
        token
      );

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clip");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Create New Clip
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-50"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Input Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputType("url")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                inputType === "url"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setInputType("note")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                inputType === "note"
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              Note
            </button>
          </div>

          {/* Input Content */}
          <div>
            <label
              htmlFor="modal-content"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {inputType === "url" ? "URL" : "Your thought or idea"}
            </label>
            {inputType === "url" ? (
              <input
                id="modal-content"
                type="url"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="https://example.com/article"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            ) : (
              <textarea
                id="modal-content"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Explain the concept of entropy to me like I'm 5..."
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Duration
            </label>
            <div className="mt-2 flex gap-2">
              {([2, 5, 10] as Duration[]).map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setTargetDuration(duration)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    targetDuration === duration
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <div>{duration} min</div>
                  <div className="mt-0.5 text-xs opacity-70">
                    {duration === 2
                      ? "Brief"
                      : duration === 5
                        ? "Overview"
                        : "Deep dive"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Context Instruction (Optional) */}
          <div>
            <label
              htmlFor="modal-context"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Additional context{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="modal-context"
              type="text"
              value={contextInstruction}
              onChange={(e) => setContextInstruction(e.target.value)}
              placeholder="Focus on the financial implications..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-black px-5 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              "Generate Audio"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

