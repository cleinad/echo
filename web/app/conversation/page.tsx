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
  sendMessage,
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

  // Send a message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentConversationId || !content.trim()) return;

      setIsSending(true);
      setError(null);

      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await sendMessage(
          currentConversationId,
          content,
          token
        );

        // Add both user message and AI response to the messages
        setMessages((prev) => [...prev, ...response.messages]);

        // Update conversation in sidebar (it may have a new title now)
        const updatedConversations = await listConversations(token);
        setConversations(updatedConversations.conversations);
      } catch (err) {
        console.error("Failed to send message:", err);
        setError("Failed to send message. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [currentConversationId, getAccessToken]
  );

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
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
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <ConversationHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Chat view */}
        <ConversationView
          messages={messages}
          loading={loadingMessages}
          isSending={isSending}
          error={error}
          hasConversation={!!currentConversationId}
          onSendMessage={handleSendMessage}
          onNewConversation={handleNewConversation}
          onDismissError={() => setError(null)}
        />
      </div>
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
