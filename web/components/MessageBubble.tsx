"use client";

import { ConversationMessageResponse } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface MessageBubbleProps {
  message: ConversationMessageResponse;
}

// Individual message bubble component
// User messages are right-aligned, AI messages are left-aligned
// AI messages are rendered as markdown, user messages as plain text
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
        className={`max-w-[90%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
        }`}
      >
        {/* Message content - render as markdown for AI, plain text for user */}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>
        ) : (
          <div className="markdown-content text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                // Style paragraphs
                p: ({ children }) => (
                  <p className="my-2 first:mt-0 last:mb-0">{children}</p>
                ),
                // Style headings
                h1: ({ children }) => (
                  <h1 className="my-3 text-lg font-semibold">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="my-2 text-base font-semibold">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="my-2 text-sm font-semibold">{children}</h3>
                ),
                // Style lists
                ul: ({ children }) => (
                  <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
                ),
                li: ({ children }) => <li className="my-0">{children}</li>,
                // Style code blocks
                code: ({ className, children }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="rounded bg-zinc-300/50 px-1 py-0.5 text-xs dark:bg-zinc-700/50">
                      {children}
                    </code>
                  ) : (
                    <code className={className}>{children}</code>
                  );
                },
                pre: ({ children }) => (
                  <pre className="my-2 overflow-x-auto rounded-lg bg-zinc-300/50 p-3 dark:bg-zinc-700/50">
                    {children}
                  </pre>
                ),
                // Style links
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="my-2 border-l-4 border-zinc-400 pl-4 italic dark:border-zinc-600">
                    {children}
                  </blockquote>
                ),
                // Style horizontal rules
                hr: () => <hr className="my-4 border-zinc-300 dark:border-zinc-700" />,
                // Style strong/bold
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                // Style emphasis/italic
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

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
