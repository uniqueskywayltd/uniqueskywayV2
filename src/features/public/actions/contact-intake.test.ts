import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/server-env", () => ({
  getServerEnv: () => ({
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "info@uniqueskyway.com",
  }),
}));

const send = vi.fn(async () => ({ providerMessageId: "msg_1" }));

vi.mock("@/infrastructure/email", () => ({
  ResendEmailSender: {
    fromApiKey: () => ({ send }),
  },
}));

import { submitContactIntake } from "@/features/public/actions/contact-intake";

describe("contact intake", () => {
  beforeEach(() => {
    send.mockClear();
  });

  it("accepts a valid message", async () => {
    const result = await submitContactIntake({
      name: "Alex Investor",
      email: `alex-${Date.now()}@example.com`,
      topic: "Plans",
      message: "I would like clarity on when plans are published.",
      companyWebsite: "",
    });
    expect(result).toEqual({ ok: true });
    expect(send).toHaveBeenCalled();
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
    expect(send).not.toHaveBeenCalled();
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
