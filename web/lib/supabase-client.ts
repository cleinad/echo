import { createClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// wrapper for supabase client

// Lazy singleton - only create client when accessed (not at module load time)
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase === null) {
    _supabase = createClient();
  }
  // Non-null assertion is safe here - we just assigned it above if it was null
  return _supabase as SupabaseClient;
}
