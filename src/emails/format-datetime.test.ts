import { describe, expect, it } from "vitest";

import { formatEmailDateTime } from "@/emails/format-datetime";

describe("formatEmailDateTime", () => {
  it("formats ISO timestamps as American MM/DD/YYYY with time", () => {
    expect(formatEmailDateTime("2026-07-06T15:42:00.000Z")).toMatch(/^07\/06\/2026/);
    expect(formatEmailDateTime("2026-07-06T15:42:00.000Z")).toMatch(/3:42\s*PM/i);
  });

  it("returns the original string when the value is not a valid date", () => {
    expect(formatEmailDateTime("not-a-date")).toBe("not-a-date");
  });
});
