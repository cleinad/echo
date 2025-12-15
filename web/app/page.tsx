"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/lib/auth-context";
import { createClip, ClipResponse } from "@/lib/api";

type InputType = "url" | "note";
type Duration = 2 | 5 | 10;

function ClipForm() {
  const { user, signOut, getAccessToken } = useAuth();

  const [inputType, setInputType] = useState<InputType>("url");
  const [inputContent, setInputContent] = useState("");
  const [targetDuration, setTargetDuration] = useState<Duration>(5);
  const [contextInstruction, setContextInstruction] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<ClipResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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

      const clip = await createClip(
        {
          input_type: inputType,
          input_content: inputContent.trim(),
          target_duration: targetDuration,
          context_instruction: contextInstruction.trim() || undefined,
        },
        token
      );

      setSuccess(clip);
      // Reset form
      setInputContent("");
      setContextInstruction("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create clip");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
              echo
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Convert content to audio
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
              htmlFor="content"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {inputType === "url" ? "URL" : "Your thought or idea"}
            </label>
            {inputType === "url" ? (
              <input
                id="content"
                type="url"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="https://example.com/article"
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            ) : (
              <textarea
                id="content"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Explain the concept of entropy to me like I'm 5..."
                rows={4}
                className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
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
                  className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    targetDuration === duration
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <div>{duration} min</div>
                  <div className="mt-1 text-xs opacity-70">
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
              htmlFor="context"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Additional context{" "}
              <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="context"
              type="text"
              value={contextInstruction}
              onChange={(e) => setContextInstruction(e.target.value)}
              placeholder="Focus on the financial implications..."
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Clip created successfully!
              </p>
              <p className="mt-1 text-xs text-green-600/80 dark:text-green-400/80">
                ID: {success.id} • Status: {success.status}
              </p>
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

export default function Home() {
  return (
    <AuthGuard>
      <ClipForm />
    </AuthGuard>
  );
}
