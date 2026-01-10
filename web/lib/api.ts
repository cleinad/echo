const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

// This file contains the API endpoints for the application.
// It is used to create and list clips.
// API client for the backend

export interface CreateClipRequest {
  input_type: "url" | "note";
  input_content: string;
  target_duration: 2 | 5 | 10;
  context_instruction?: string;
}

export interface ClipResponse {
  id: string;
  input_type: "url" | "note";
  input_content: string;
  context_instruction: string | null;
  page_title: string | null;
  target_duration: number;
  status: "pending" | "processing" | "completed" | "failed";
  generated_script: string | null;
  audio_url: string | null;
  actual_duration: number | null;
  error_message: string | null;
  is_favorited: boolean;
  created_at: string;
  started_processing_at: string | null;
  completed_at: string | null;
}

export interface ApiError {
  detail: string;
}

export interface PlaybackProgressResponse {
  clip_id: string;
  position_seconds: number;
  has_completed: boolean;
  last_played_at: string | null;
}

export interface MessageResponse {
  message: string;
}

// ============================================================================
// Conversation Types
// ============================================================================

export interface ConversationResponse {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessageResponse {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  audio_url: string | null;
  created_at: string;
}

export async function createClip(
  data: CreateClipRequest,
  token: string
): Promise<ClipResponse> {
  const response = await fetch(`${API_BASE_URL}/clips`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "An unexpected error occurred",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function listClips(token: string): Promise<{
  clips: ClipResponse[];
  total: number;
}> {
  const response = await fetch(`${API_BASE_URL}/clips`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to fetch clips",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getClip(
  clipId: string,
  token: string
): Promise<ClipResponse> {
  const response = await fetch(`${API_BASE_URL}/clips/${clipId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to fetch clip",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function deleteClip(
  clipId: string,
  token: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/clips/${clipId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to delete clip",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function toggleFavorite(
  clipId: string,
  token: string
): Promise<ClipResponse> {
  const response = await fetch(`${API_BASE_URL}/clips/${clipId}/favorite`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to toggle favorite",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getPlaybackProgress(
  clipId: string,
  token: string
): Promise<PlaybackProgressResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/clips/${clipId}/progress`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    throw new Error(
      `Failed to reach API for playback progress. Check that the backend is running and NEXT_PUBLIC_API_BASE_URL is correct (currently "${API_BASE_URL}"). Underlying error: ${message}`
    );
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to get playback progress",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function updatePlaybackProgress(
  clipId: string,
  positionSeconds: number,
  hasCompleted: boolean,
  token: string
): Promise<PlaybackProgressResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/clips/${clipId}/progress`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        position_seconds: positionSeconds,
        has_completed: hasCompleted,
      }),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown network error";
    throw new Error(
      `Failed to reach API to update playback progress. Check that the backend is running and NEXT_PUBLIC_API_BASE_URL is correct (currently "${API_BASE_URL}"). Underlying error: ${message}`
    );
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to update playback progress",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

// ============================================================================
// Conversation API Functions
// ============================================================================

export async function createConversation(
  token: string,
  title?: string
): Promise<ConversationResponse> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: title ?? null }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to create conversation",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function listConversations(
  token: string
): Promise<{ conversations: ConversationResponse[] }> {
  const response = await fetch(`${API_BASE_URL}/conversations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to fetch conversations",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getConversation(
  conversationId: string,
  token: string
): Promise<ConversationResponse> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to fetch conversation",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function updateConversation(
  conversationId: string,
  title: string,
  token: string
): Promise<ConversationResponse> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to update conversation",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function deleteConversation(
  conversationId: string,
  token: string
): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to delete conversation",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function getMessages(
  conversationId: string,
  token: string
): Promise<{ messages: ConversationMessageResponse[] }> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to fetch messages",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string
): Promise<{ messages: ConversationMessageResponse[] }> {
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    }
  );

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: "Failed to send message",
    }));
    throw new Error(error.detail);
  }

  return response.json();
}
