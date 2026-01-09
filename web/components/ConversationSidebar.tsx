"use client";

import { ConversationResponse } from "@/lib/api";

interface ConversationSidebarProps {
  conversations: ConversationResponse[];
  currentConversationId: string | null;
  loading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

// Sidebar component displaying conversation list and controls
// Collapsible on smaller screens
export function ConversationSidebar({
  conversations,
  currentConversationId,
  loading,
  isOpen,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <aside
      className={`flex flex-col border-r border-zinc-200 bg-zinc-100 transition-all duration-300 dark:border-zinc-800 dark:bg-zinc-900 ${
        isOpen ? "w-72" : "w-0 overflow-hidden"
      }`}
    >
      {/* New conversation button */}
      <div className="p-3">
        <button
          onClick={onNewConversation}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-2.5 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        >
          <svg
            className="h-4 w-4"
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
          New Conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            Loading...
          </div>
        ) : conversations.length === 0 ? (
          <div className="px-3 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No conversations yet.
            <br />
            Start a new one!
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={`group flex w-full items-start justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-zinc-200 dark:bg-zinc-800"
                      : "hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    {/* Conversation title or placeholder */}
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {conv.title || "New conversation"}
                    </p>
                    {/* Last updated time */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>

                  {/* Delete button (visible on hover) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="ml-2 rounded p-1 text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-300 hover:text-zinc-600 group-hover:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                    aria-label="Delete conversation"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Link back to library */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <a
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Library
        </a>
      </div>
    </aside>
  );
}
