import { Component } from "react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const styles = {
  colors: {
    bg: "#f4f4f5", // zinc-50
    text: "#18181b", // zinc-900
    textMuted: "#71717a", // zinc-500
    buttonActive: "#18181b", // zinc-900
    errorText: "#dc2626",
  },
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Extension error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
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
                color: styles.colors.errorText,
                marginBottom: "16px",
                fontSize: "24px",
                fontWeight: 600,
                letterSpacing: "-0.025em",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: styles.colors.textMuted,
                fontSize: "14px",
                marginBottom: "24px",
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
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
              }}
            >
              Reload Extension
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
