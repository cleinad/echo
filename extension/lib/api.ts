const API_BASE_URL = process.env.PLASMO_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

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

