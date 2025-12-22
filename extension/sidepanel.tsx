import { useState } from "react";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { AuthGuard } from "./components/AuthGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { createClip } from "./lib/api";
import type { ClipResponse } from "./lib/api";

type InputType = "url" | "note";
type Duration = 2 | 5 | 10;

const styles = {
  // Base colors matching web app's zinc palette
  colors: {
    bg: "#f4f4f5", // zinc-50
    bgDark: "#09090b", // zinc-950
    text: "#18181b", // zinc-900
    textDark: "#fafafa", // zinc-50
    textMuted: "#71717a", // zinc-500
    textMutedDark: "#a1a1aa", // zinc-400
    border: "#d4d4d8", // zinc-300
    borderDark: "#3f3f46", // zinc-700
    inputBg: "#ffffff",
    inputBgDark: "#18181b", // zinc-900
    buttonActive: "#18181b", // zinc-900
    buttonActiveDark: "#fafafa", // zinc-50
    buttonInactive: "#f4f4f5", // zinc-100
    buttonInactiveDark: "#27272a", // zinc-800
    errorBg: "#fef2f2",
    errorBgDark: "rgba(127, 29, 29, 0.2)",
    errorText: "#dc2626",
    errorTextDark: "#f87171",
    successBg: "#f0fdf4",
    successBgDark: "rgba(20, 83, 45, 0.2)",
    successText: "#16a34a",
    successTextDark: "#4ade80",
  },
};

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
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: styles.colors.bg,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: styles.colors.text,
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 600,
                letterSpacing: "-0.025em",
                margin: 0,
                marginBottom: "4px",
                color: styles.colors.text,
              }}
            >
              echo
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: styles.colors.textMuted,
              }}
            >
              Convert content to audio
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: styles.colors.textMuted,
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user?.email}
            </span>
            <button
              onClick={signOut}
              style={{
                fontSize: "13px",
                color: styles.colors.textMuted,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = styles.colors.text;
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = styles.colors.textMuted;
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Input Type Toggle */}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => setInputType("url")}
              style={{
                flex: 1,
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: inputType === "url" ? styles.colors.buttonActive : styles.colors.buttonInactive,
                color: inputType === "url" ? "#fff" : styles.colors.textMuted,
              }}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setInputType("note")}
              style={{
                flex: 1,
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: inputType === "note" ? styles.colors.buttonActive : styles.colors.buttonInactive,
                color: inputType === "note" ? "#fff" : styles.colors.textMuted,
              }}
            >
              Note
            </button>
          </div>

          {/* Input Content */}
          <div>
            <label
              htmlFor="content"
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: styles.colors.text,
                marginBottom: "6px",
              }}
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
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  border: `1px solid ${styles.colors.border}`,
                  backgroundColor: styles.colors.inputBg,
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: styles.colors.text,
                  outline: "none",
                }}
              />
            ) : (
              <textarea
                id="content"
                value={inputContent}
                onChange={(e) => setInputContent(e.target.value)}
                placeholder="Explain the concept of entropy to me like I'm 5..."
                rows={4}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  border: `1px solid ${styles.colors.border}`,
                  backgroundColor: styles.colors.inputBg,
                  padding: "12px 16px",
                  fontSize: "14px",
                  color: styles.colors.text,
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            )}
          </div>

          {/* Duration Selection */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: styles.colors.text,
                marginBottom: "8px",
              }}
            >
              Duration
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {([2, 5, 10] as Duration[]).map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setTargetDuration(duration)}
                  style={{
                    flex: 1,
                    borderRadius: "8px",
                    padding: "12px 8px",
                    fontSize: "14px",
                    fontWeight: 500,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    backgroundColor: targetDuration === duration ? styles.colors.buttonActive : styles.colors.buttonInactive,
                    color: targetDuration === duration ? "#fff" : styles.colors.textMuted,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <div>{duration} min</div>
                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "11px",
                      opacity: 0.7,
                    }}
                  >
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
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: styles.colors.text,
                marginBottom: "6px",
              }}
            >
              Additional context{" "}
              <span style={{ fontWeight: 400, color: styles.colors.textMuted }}>(optional)</span>
            </label>
            <input
              id="context"
              type="text"
              value={contextInstruction}
              onChange={(e) => setContextInstruction(e.target.value)}
              placeholder="Focus on the financial implications..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: "8px",
                border: `1px solid ${styles.colors.border}`,
                backgroundColor: styles.colors.inputBg,
                padding: "12px 16px",
                fontSize: "14px",
                color: styles.colors.text,
                outline: "none",
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                borderRadius: "8px",
                backgroundColor: styles.colors.errorBg,
                padding: "16px",
                fontSize: "14px",
                color: styles.colors.errorText,
              }}
            >
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div
              style={{
                borderRadius: "8px",
                backgroundColor: styles.colors.successBg,
                padding: "16px",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: styles.colors.successText,
                  margin: 0,
                  marginBottom: "4px",
                }}
              >
                Clip created successfully!
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "12px",
                  color: styles.colors.successText,
                  opacity: 0.8,
                }}
              >
                ID: {success.id} • Status: {success.status}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              backgroundColor: styles.colors.buttonActive,
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#27272a";
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = styles.colors.buttonActive;
              }
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <svg
                  style={{
                    width: "16px",
                    height: "16px",
                    animation: "spin 1s linear infinite",
                  }}
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    style={{ opacity: 0.25 }}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    style={{ opacity: 0.75 }}
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
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
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

