"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { ConversationHeader } from "@/components/ConversationHeader";
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ConversationView } from "@/components/ConversationView";
import { useAuth } from "@/lib/auth-context";
import {
  ConversationResponse,
  ConversationMessageResponse,
  createConversation,
  listConversations,
  getMessages,
  sendMessageStreaming,
  deleteConversation,
} from "@/lib/api";

// Main conversation page component
// Manages conversation state and coordinates between sidebar and chat view
function ConversationPage() {
  const { getAccessToken } = useAuth();

  // Conversation list state
  const [conversations, setConversations] = useState<ConversationResponse[]>(
    []
  );
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Current conversation state
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ConversationMessageResponse[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // UI state
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Streaming state - tracks the AI response being generated
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Fetch all conversations on mount
  useEffect(() => {
    async function fetchConversations() {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const data = await listConversations(token);
        setConversations(data.conversations);
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
        setError("Failed to load conversations");
      } finally {
        setLoadingConversations(false);
      }
    }

    fetchConversations();
  }, [getAccessToken]);

  // Fetch messages when conversation changes
  useEffect(() => {
    async function fetchMessages() {
      if (!currentConversationId) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        const token = await getAccessToken();
        if (!token) return;

        const data = await getMessages(currentConversationId, token);
        setMessages(data.messages);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError("Failed to load messages");
      } finally {
        setLoadingMessages(false);
      }
    }

    fetchMessages();
  }, [currentConversationId, getAccessToken]);

  // Create a new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const newConv = await createConversation(token);
      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError("Failed to create conversation");
    }
  }, [getAccessToken]);

  // Select a conversation
  const handleSelectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    setError(null);
  }, []);

  // Delete a conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        await deleteConversation(id, token);
        setConversations((prev) => prev.filter((c) => c.id !== id));

        // If we deleted the current conversation, clear the view
        if (currentConversationId === id) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to delete conversation:", err);
        setError("Failed to delete conversation");
      }
    },
    [getAccessToken, currentConversationId]
  );

  // Send a message with streaming AI response
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentConversationId || !content.trim()) return;

      setIsSending(true);
      setError(null);
      setStreamingContent("");

      try {
        const token = await getAccessToken();
        if (!token) return;

        // Use streaming API to get token-by-token response
        const stream = sendMessageStreaming(
          currentConversationId,
          content,
          token
        );

        // Process each event from the stream
        for await (const event of stream) {
          switch (event.type) {
            case "user_message":
              // Add user message to the list immediately
              setMessages((prev) => [...prev, event.message]);
              // Start showing the streaming indicator
              setIsStreaming(true);
              break;

            case "token":
              // Accumulate tokens for the streaming display
              setStreamingContent((prev) => prev + event.content);
              break;

            case "done":
              // Streaming complete - add the final AI message
              setIsStreaming(false);
              setStreamingContent("");
              setMessages((prev) => [...prev, event.message]);
              break;

            case "error":
              // Handle streaming error
              setIsStreaming(false);
              setStreamingContent("");
              setError(event.message);
              break;
          }
        }

        // Update conversation in sidebar (it may have a new title now)
        const updatedConversations = await listConversations(token);
        setConversations(updatedConversations.conversations);
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message. Please try again.");
        setIsStreaming(false);
        setStreamingContent("");
      } finally {
        setIsSending(false);
      }
    },
    [currentConversationId, getAccessToken]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black" data-conversation-page>
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        loading={loadingConversations}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewConversation={handleNewConversation}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header */}
        <ConversationHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Chat view */}
        <ConversationView
          messages={messages}
          loading={loadingMessages}
          isSending={isSending}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
          error={error}
          hasConversation={!!currentConversationId}
          onSendMessage={handleSendMessage}
          onNewConversation={handleNewConversation}
          onDismissError={() => setError(null)}
        />
      </div>
      <style jsx global>{`
        [data-conversation-page] ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        [data-conversation-page] ::-webkit-scrollbar-track {
          background: transparent;
        }

        [data-conversation-page] ::-webkit-scrollbar-thumb {
          background-color: #2f2f2f;
          border-radius: 999px;
          border: 3px solid transparent;
          background-clip: content-box;
        }

        [data-conversation-page] ::-webkit-scrollbar-thumb:hover {
          background-color: #3a3a3a;
        }

        [data-conversation-page] * {
          scrollbar-width: thin;
          scrollbar-color: #2f2f2f transparent;
        }
      `}</style>
    </div>
  );
}

export default function Conversation() {
  return (
    <AuthGuard>
      <ConversationPage />
    </AuthGuard>
  );
}
