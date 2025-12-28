"use client";

import { useAuth } from "@/lib/auth-context";

// Header component for the main library page
// Displays the app title, user email, and sign out button
export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-zinc-50/80 backdrop-blur-lg dark:bg-black/80 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
              echo
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Your audio library
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

