"use client";

import { ConversationMessageResponse } from "@/lib/api";

interface MessageBubbleProps {
  message: ConversationMessageResponse;
}

// Individual message bubble component
// User messages are right-aligned, AI messages are left-aligned
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  // Format timestamp for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {/* Message content */}
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {message.content}
        </p>

        {/* Timestamp */}
        <p
          className={`mt-1 text-xs ${
            isUser
              ? "text-zinc-400 dark:text-zinc-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}
