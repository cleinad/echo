"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

interface ConversationHeaderProps {
  onToggleSidebar: () => void;
}

// Header for the conversation page
// Includes navigation back to library and user controls
export function ConversationHeader({ onToggleSidebar }: ConversationHeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 backdrop-blur-lg dark:border-zinc-800 dark:bg-black/80">
      <div className="flex items-center gap-3">
        {/* Sidebar toggle button */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Toggle sidebar"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Title with link to library */}
        <div>
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-black hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            echo
          </Link>
          <span className="mx-2 text-zinc-300 dark:text-zinc-600">|</span>
          <span className="text-lg text-zinc-600 dark:text-zinc-400">
            Conversation
          </span>
        </div>
      </div>

      {/* User controls */}
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:block">
          {user?.email}
        </span>
        <button
          onClick={signOut}
          className="text-sm text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
