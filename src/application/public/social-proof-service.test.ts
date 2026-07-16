import { describe, expect, it } from "vitest";

import { extractFirstName, formatLocation, formatRelativeTime } from "./social-proof-privacy";

describe("extractFirstName", () => {
  it("returns only the first name from a legal name", () => {
    expect(extractFirstName("Milla Okonkwo", null)).toBe("Milla");
  });

  it("falls back to display name without exposing multi-token identity", () => {
    expect(extractFirstName(null, "David Chen")).toBe("David");
  });

  it("rejects empty or too-short names", () => {
    expect(extractFirstName("", "")).toBeNull();
    expect(extractFirstName("A", null)).toBeNull();
    expect(extractFirstName(null, null)).toBeNull();
  });
});

describe("formatLocation", () => {
  it("formats region and country without fabricating cities", () => {
    expect(formatLocation("Lagos", "NG")).toBe("Lagos, Nigeria");
    expect(formatLocation("London", "GB")).toBe("London, United Kingdom");
  });

  it("returns country alone when region is missing", () => {
    expect(formatLocation(null, "NG")).toBe("Nigeria");
  });

  it("returns null when location cannot be determined", () => {
    expect(formatLocation(null, null)).toBeNull();
    expect(formatLocation("Lagos", "ZZ")).toBeNull();
  });
});

describe("formatRelativeTime", () => {
  it("formats minute and hour deltas", () => {
    const now = Date.parse("2026-07-16T12:00:00.000Z");
    expect(formatRelativeTime("2026-07-16T11:58:00.000Z", now)).toBe("2 minutes ago");
    expect(formatRelativeTime("2026-07-16T11:55:00.000Z", now)).toBe("5 minutes ago");
    expect(formatRelativeTime("2026-07-16T11:48:00.000Z", now)).toBe("12 minutes ago");
  });
});
