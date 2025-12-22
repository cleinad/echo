"use client";

import { createClient } from "@/lib/supabase";
import { useEffect } from "react";

// Extend Window interface for Chrome extension APIs
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (
          extensionId: string,
          message: any,
          responseCallback?: (response: any) => void
        ) => void;
        lastError?: { message: string };
      };
    };
  }
}

// Syncs Supabase auth state to Chrome extension via external messaging
export function SyncToExtension() {
  useEffect(() => {
    // Skip if Chrome extension APIs not available
    if (typeof window === "undefined" || !window.chrome?.runtime) {
      return;
    }

    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    if (!extensionId) {
      return; // Extension ID not configured
    }

    const supabase = createClient();

    // Send session to extension when auth state changes
    const sendSession = (session: any) => {
      if (!window.chrome?.runtime) return;

      window.chrome.runtime.sendMessage(
        extensionId,
        {
          type: "SYNC_AUTH",
          session: session
            ? {
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
                expires_in: session.expires_in,
                token_type: session.token_type,
                user: session.user,
              }
            : null,
        },
        () => {
          // Silently handle errors (extension might not be installed)
          if (window.chrome.runtime?.lastError) {
            // Extension not available - this is OK
          }
        }
      );
    };

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      sendSession(session);
    });

    // Sync current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sendSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null; // Invisible component
}
