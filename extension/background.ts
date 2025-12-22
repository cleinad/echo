// Background service worker for Echo extension
import { getSupabase } from "./lib/supabase-client";

// Allowed origins for external messages (must match manifest)
const ALLOWED_ORIGINS = ["http://localhost:3000", "https://*.vercel.app"];

// Verify sender origin matches allowed domains
function isAllowedOrigin(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const origin = new URL(url).origin;
    return origin === "http://localhost:3000" || origin.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Listen for external messages from web app
chrome.runtime.onMessageExternal.addListener(async (message, sender, sendResponse) => {
  try {
    // Security: Verify sender origin
    if (!isAllowedOrigin(sender.url)) {
      sendResponse({ success: false, error: "Unauthorized origin" });
      return true;
    }

    if (message.type === "SYNC_AUTH") {
      const supabase = getSupabase();

      if (message.session) {
        // Validate session structure
        if (!message.session.access_token || !message.session.refresh_token) {
          sendResponse({ success: false, error: "Invalid session structure" });
          return true;
        }

        // Set session in Supabase client
        const { data, error } = await supabase.auth.setSession({
          access_token: message.session.access_token,
          refresh_token: message.session.refresh_token,
        });

        if (error || !data.session || !data.user) {
          sendResponse({ success: false, error: error?.message || "Invalid session" });
          return true;
        }

        // Store in chrome.storage and notify side panel
        chrome.storage.local.set({
          supabase_session: JSON.stringify({
            access_token: message.session.access_token,
            refresh_token: message.session.refresh_token,
          }),
          session_synced: Date.now(),
        });

        chrome.runtime.sendMessage({
          type: "SESSION_UPDATED",
          session: {
            access_token: message.session.access_token,
            refresh_token: message.session.refresh_token,
          },
        }).catch(() => {}); // Side panel might not be open

        sendResponse({ success: true });
      } else {
        // Sign out
        await supabase.auth.signOut();
        chrome.storage.local.remove("supabase_session");
        chrome.storage.local.set({ session_synced: Date.now() });

        chrome.runtime.sendMessage({ type: "SESSION_UPDATED", session: null }).catch(() => {});
        sendResponse({ success: true });
      }

      return true;
    }

    sendResponse({ success: false, error: "Unknown message type" });
    return true;
  } catch (error) {
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return true;
  }
});

// Listen for internal messages (from side panel)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SESSION") {
    chrome.storage.local.get("supabase_session", (result) => {
      sendResponse({ session: result.supabase_session || null });
    });
    return true;
  }
  sendResponse({ success: false, error: "Unknown message type" });
  return false;
});

// Set up side panel to open on icon click
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

export {};

