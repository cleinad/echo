import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { AuthGuard } from "./components/AuthGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { createClip } from "./lib/api";
import type { ClipResponse } from "./lib/api";
import "./style.css";

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
    <div className="w-full min-h-screen bg-zinc-100 text-zinc-900 p-6 font-sans box-border">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-[28px] font-semibold tracking-tight m-0 mb-1 text-zinc-900">
              echo
            </h1>
            <p className="m-0 text-sm text-zinc-500">
              Convert content to audio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-zinc-500 max-w-[150px] truncate">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-[13px] text-zinc-500 bg-transparent border-none cursor-pointer px-2 py-1 transition-colors hover:text-zinc-900"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Input Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setInputType("url")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border-none cursor-pointer transition-all ${
                inputType === "url"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setInputType("note")}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium border-none cursor-pointer transition-all ${
                inputType === "note"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500"
              }`}
            >
              Note
            </button>
          </div>

          {/* Input Content */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-zinc-900 mb-1.5"
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
                className="w-full box-border rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
              />
            ) : (
              <textarea
                id="content"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Explain the concept of entropy to me like I'm 5..."
                rows={4}
                className="w-full box-border rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 font-inherit resize-y outline-none"
              />
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Duration
            </label>
            <div className="flex gap-2">
              {([2, 5, 10] as Duration[]).map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setTargetDuration(duration)}
                  className={`flex-1 rounded-lg px-2 py-3 text-sm font-medium border-none cursor-pointer transition-all flex flex-col items-center ${
                    targetDuration === duration
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <div>{duration} min</div>
                  <div className="mt-1 text-[11px] opacity-70">
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
              className="block text-sm font-medium text-zinc-900 mb-1.5"
            >
              Additional context{" "}
              <span className="font-normal text-zinc-500">(optional)</span>
            </label>
            <input
              id="context"
              type="text"
              value={contextInstruction}
              onChange={(e) => setContextInstruction(e.target.value)}
              placeholder="Focus on the financial implications..."
              className="w-full box-border rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm font-medium text-green-600 m-0 mb-1">
                Clip created successfully!
              </p>
              <p className="m-0 text-xs text-green-600 opacity-80">
                ID: {success.id} • Status: {success.status}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white border-none transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
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

function SidePanel() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <ClipForm />
        </AuthGuard>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default SidePanel;

