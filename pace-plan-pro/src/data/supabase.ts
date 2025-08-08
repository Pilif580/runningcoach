import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "../config";

const config = getSupabaseConfig();

if (!config.url || !config.anonKey) {
  console.warn('Supabase configuration missing. Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(
  config.url,
  config.anonKey
);
