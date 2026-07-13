import { describe, expect, it } from "vitest";

import { err, ok } from "@/lib/result";

describe("Result helpers", () => {
  it("creates success and failure results", () => {
    expect(ok("ready")).toEqual({ ok: true, value: "ready" });
    expect(err("failed")).toEqual({ ok: false, error: "failed" });
  });
});
