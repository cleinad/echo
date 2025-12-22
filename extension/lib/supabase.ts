import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Get Supabase credentials from environment variables
// Plasmo uses PLASMO_PUBLIC_ prefix and process.env for environment variables
const supabaseUrl = process.env.PLASMO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || "";

export function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set PLASMO_PUBLIC_SUPABASE_URL and PLASMO_PUBLIC_SUPABASE_ANON_KEY in your .env file."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

