import { describe, expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { AppError } from "@/application/errors";

import { requireSameOrigin } from "./http";

function requestWith(origin: string | null, host?: string) {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (host) headers.set("x-forwarded-host", host);
  return new NextRequest("https://uniqueskyway-v2.vercel.app/api/auth/register", {
    method: "POST",
    headers,
  });
}

describe("requireSameOrigin", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows the canonical APP_URL origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uniqueskyway-v2.vercel.app");
    expect(() =>
      requireSameOrigin(requestWith("https://uniqueskyway-v2.vercel.app")),
    ).not.toThrow();
  });

  it("allows the request host when it differs from APP_URL (Vercel alias)", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uniqueskyway-v2.vercel.app");
    expect(() =>
      requireSameOrigin(
        requestWith(
          "https://uniqueskyway-v2-unique-sky-way.vercel.app",
          "uniqueskyway-v2-unique-sky-way.vercel.app",
        ),
      ),
    ).not.toThrow();
  });

  it("rejects a foreign origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uniqueskyway-v2.vercel.app");
    expect(() => requireSameOrigin(requestWith("https://evil.example"))).toThrow(AppError);
  });
});
