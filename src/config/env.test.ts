import { describe, expect, it } from "vitest";

import { parseClientEnv, parseServerEnv } from "@/config/env";

const validSource = {
  NODE_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
  DATABASE_URL: "postgres://postgres:postgres@localhost:5432/unique_sky_way_v2",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  RESEND_API_KEY: "resend-key",
  RESEND_FROM_EMAIL: "security@uniqueskyway.example",
  INTERNAL_JOB_TOKEN: "development-job-token",
  LOG_LEVEL: "info",
};

describe("environment parsing", () => {
  it("parses public client configuration", () => {
    expect(parseClientEnv(validSource)).toEqual({
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
    });
  });

  it("parses server configuration", () => {
    expect(parseServerEnv(validSource).NODE_ENV).toBe("test");
  });

  it("rejects missing server secrets", () => {
    expect(() => parseServerEnv({})).toThrow();
  });
});
