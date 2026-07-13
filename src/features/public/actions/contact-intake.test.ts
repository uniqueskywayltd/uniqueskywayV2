import { describe, expect, it } from "vitest";

import { submitContactIntake } from "@/features/public/actions/contact-intake";

describe("contact intake", () => {
  it("accepts a valid message", async () => {
    const result = await submitContactIntake({
      name: "Alex Investor",
      email: `alex-${Date.now()}@example.com`,
      topic: "Plans",
      message: "I would like clarity on when plans are published.",
      companyWebsite: "",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects honeypot submissions", async () => {
    const result = await submitContactIntake({
      name: "Bot",
      email: "bot@example.com",
      topic: "Spam",
      message: "This is a spam message that should not pass.",
      companyWebsite: "https://spam.example",
    });
    expect(result).toEqual({ ok: false, error: "honeypot" });
  });

  it("rejects invalid payloads", async () => {
    const result = await submitContactIntake({
      name: "A",
      email: "not-an-email",
      topic: "x",
      message: "short",
    });
    expect(result).toEqual({ ok: false, error: "validation" });
  });
});
