import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { getServerEnv } from "@/config/server-env";
import { createSupabaseServiceClient } from "@/infrastructure/supabase";

export function createSupabaseAdminAuthClient(): SupabaseClient {
  const env = getServerEnv();

  return createSupabaseServiceClient({
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  });
}
