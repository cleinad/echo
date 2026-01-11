"use client";

import { useState, useEffect, useRef } from "react";
import { ConversationMessageResponse } from "@/lib/api";
import { MessageBubble } from "@/components/MessageBubble";
import ReactMarkdown from "react-markdown";

interface ConversationViewProps {
  messages: ConversationMessageResponse[];
  loading: boolean;
  isSending: boolean;
  isStreaming: boolean;           // Whether AI is currently streaming a response
  streamingContent: string;       // Accumulated content from streaming tokens
  error: string | null;
  hasConversation: boolean;
  onSendMessage: (content: string) => void;
  onNewConversation: () => void;
  onDismissError: () => void;
}

// Main conversation view component
// Displays messages and input field for sending new messages
// Supports real-time streaming display of AI responses
export function ConversationView({
  messages,
  loading,
  isSending,
  isStreaming,
  streamingContent,
  error,
  hasConversation,
  onSendMessage,
  onNewConversation,
  onDismissError,
}: ConversationViewProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Focus input when conversation is selected
  useEffect(() => {
    if (hasConversation && !loading) {
      inputRef.current?.focus();
    }
  }, [hasConversation, loading]);

  // Handle form submission - disabled while sending or streaming
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isSending && !isStreaming) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Empty state - no conversation selected
  if (!hasConversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-medium text-zinc-900 dark:text-zinc-100">
            Welcome to Conversations
          </h2>
          <p className="mb-6 text-zinc-500 dark:text-zinc-400">
            Start a new conversation or select one from the sidebar.
          </p>
          <button
            onClick={onNewConversation}
            className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Conversation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      {/* Error toast */}
      {error && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <span>{error}</span>
          <button
            onClick={onDismissError}
            className="ml-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Messages area - scrollable container with scrollbar on right edge */}
      <div className="flex-1 min-h-0 overflow-y-auto py-6 pr-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            No messages yet. Say something!
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4 pl-6 pr-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Streaming AI response - shows tokens as they arrive */}
            {isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl bg-zinc-200 px-4 py-3 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                  {streamingContent ? (
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
                        {streamingContent}
                      </ReactMarkdown>
                      {/* Blinking cursor to indicate ongoing generation */}
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-zinc-500 dark:bg-zinc-400" />
                    </div>
                  ) : (
                    // Show dots while waiting for first token
                    <div className="flex items-center gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
                    </div>
                  )}
                  {/* Generating indicator label */}
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Generating...
                  </p>
                </div>
              </div>
            )}

            {/* Waiting indicator - shown before streaming starts */}
            {isSending && !isStreaming && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl bg-zinc-200 px-4 py-3 dark:bg-zinc-800">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]"></span>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"></span>
                  </div>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area - glassmorphic effect, no border */}
      <div className="bg-zinc-50/80 p-4 backdrop-blur-lg dark:bg-black/80">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-end gap-3"
        >
          <div className="relative flex-[2]">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              disabled={isSending || isStreaming}
              rows={1}
              className="w-full resize-none rounded-xl border border-zinc-300/50 bg-white/80 px-4 py-3 text-sm text-zinc-900 backdrop-blur-sm placeholder-zinc-400 focus:border-zinc-400/50 focus:bg-white focus:outline-none focus:ring-0 disabled:opacity-50 dark:border-zinc-700/50 dark:bg-zinc-900/80 dark:text-zinc-100 dark:placeholder-zinc-500 dark:focus:border-zinc-600/50 dark:focus:bg-zinc-900"
              style={{
                minHeight: "48px",
                maxHeight: "200px",
              }}
            />
          </div>

          {/* Send button - disabled while sending or streaming */}
          <button
            type="submit"
            disabled={!inputValue.trim() || isSending || isStreaming}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-black/80 text-white backdrop-blur-sm transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/80 dark:text-black dark:hover:bg-white/90"
            aria-label="Send message"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </form>

        {/* Hint text */}
        <p className="mx-auto mt-2 max-w-4xl text-center text-xs text-zinc-400 dark:text-zinc-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
