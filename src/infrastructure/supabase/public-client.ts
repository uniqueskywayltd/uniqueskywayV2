import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabasePublicClientConfig {
  url: string;
  anonKey: string;
}

export function createSupabasePublicClient(config: SupabasePublicClientConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
