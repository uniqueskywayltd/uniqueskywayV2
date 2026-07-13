import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getServerEnv } from "@/config/server-env";

export interface SupabaseRouteClientOptions {
  rememberSession?: boolean;
}

export async function createSupabaseRouteClient(options: SupabaseRouteClientOptions = {}) {
  const env = getServerEnv();
  const cookieStore = await cookies();
  const secure = env.NODE_ENV === "production";
  const maxAge = options.rememberSession ? 60 * 60 * 24 * 30 : undefined;

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      persistSession: true,
    },
    cookieOptions: {
      path: "/",
      sameSite: "lax",
      secure,
      httpOnly: true,
      ...(maxAge === undefined ? {} : { maxAge }),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          cookieStore.set(cookie.name, cookie.value, {
            ...cookie.options,
            path: cookie.options.path ?? "/",
            sameSite: "lax",
            secure,
            httpOnly: true,
            ...(maxAge === undefined ? {} : { maxAge }),
          });
        }
      },
    },
  });
}
