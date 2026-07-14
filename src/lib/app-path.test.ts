import { afterEach, describe, expect, it, vi } from "vitest";

import { appPath } from "./app-path";

describe("appPath", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the path unchanged when base path is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    expect(appPath("/api/auth/csrf")).toBe("/api/auth/csrf");
  });

  it("prefixes /v2 for subdirectory deploys", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/v2");
    expect(appPath("/api/auth/csrf")).toBe("/v2/api/auth/csrf");
  });
});
