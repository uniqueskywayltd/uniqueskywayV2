import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface SupabaseServiceClientConfig {
  url: string;
  serviceRoleKey: string;
}

export function createSupabaseServiceClient(config: SupabaseServiceClientConfig): SupabaseClient {
  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
