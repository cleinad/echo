import { createSupabaseClient } from "./supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

// Lazy singleton - only create client when accessed
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_supabase === null) {
    _supabase = createSupabaseClient();
  }
  return _supabase as SupabaseClient;
}

