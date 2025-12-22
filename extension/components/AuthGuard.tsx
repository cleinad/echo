import type { ReactNode } from "react";
import { useAuth } from "../lib/auth-context";

const WEB_APP_URL = process.env.PLASMO_PUBLIC_WEB_APP_URL || "http://localhost:3000";

const styles = {
  colors: {
    bg: "#f4f4f5", // zinc-50
    text: "#18181b", // zinc-900
    textMuted: "#71717a", // zinc-500
    buttonActive: "#18181b", // zinc-900
    errorText: "#dc2626",
  },
};

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();

  // Check for missing environment variables before attempting to use Supabase
  const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY;

  const openAuthPage = () => {
    chrome.tabs.create({ url: `${WEB_APP_URL}/auth` });
  };

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: styles.colors.bg,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "400px" }}>
          <h2
            style={{
              marginBottom: "16px",
              fontSize: "24px",
              fontWeight: 600,
              color: styles.colors.errorText,
              letterSpacing: "-0.025em",
            }}
          >
            Configuration Error
          </h2>
          <p style={{ color: styles.colors.textMuted, fontSize: "14px", marginBottom: "12px", lineHeight: 1.5 }}>
            Missing Supabase environment variables.
          </p>
          <p style={{ color: styles.colors.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
            Please set{" "}
            <code
              style={{
                backgroundColor: "#e4e4e7",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              PLASMO_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code
              style={{
                backgroundColor: "#e4e4e7",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              PLASMO_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            in your{" "}
            <code
              style={{
                backgroundColor: "#e4e4e7",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              .env
            </code>{" "}
            file.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: styles.colors.bg,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              border: "3px solid #e4e4e7",
              borderTop: `3px solid ${styles.colors.text}`,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "12px",
            }}
          />
          <p style={{ color: styles.colors.textMuted, fontSize: "14px", margin: 0 }}>Loading...</p>
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

  if (!user) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          backgroundColor: styles.colors.bg,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ maxWidth: "400px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: 0,
              marginBottom: "8px",
              color: styles.colors.text,
            }}
          >
            echo
          </h1>
          <h2
            style={{
              marginBottom: "8px",
              marginTop: "24px",
              fontSize: "20px",
              fontWeight: 600,
              color: styles.colors.text,
            }}
          >
            Sign in required
          </h2>
          <p
            style={{
              color: styles.colors.textMuted,
              fontSize: "14px",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            Please sign in to use the extension.
          </p>
          <button
            onClick={openAuthPage}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              backgroundColor: styles.colors.buttonActive,
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#27272a";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = styles.colors.buttonActive;
            }}
          >
            Sign in to Echo
          </button>
          <p
            style={{
              color: styles.colors.textMuted,
              fontSize: "13px",
              marginTop: "16px",
              lineHeight: 1.5,
            }}
          >
            After signing in, the extension will automatically detect your session.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
