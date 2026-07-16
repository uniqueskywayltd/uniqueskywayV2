import { describe, expect, it } from "vitest";

import { AUTH_EMAIL_TEMPLATES } from "@/application/auth/constants";

import { renderProductionEmail } from "./production-email-renderer";

describe("renderProductionEmail", () => {
  it("renders verify-email with OTP using production branding", async () => {
    const rendered = await renderProductionEmail({
      templateKey: AUTH_EMAIL_TEMPLATES.verifyEmail,
      metadata: {
        name: "Alex Morgan",
        otp: "48291367",
        actionLink: "https://uniqueskyway-v2.vercel.app/auth/verify-email",
      },
    });

    expect(rendered.previewId).toBe("verify-email");
    expect(rendered.subject).toContain("Verify");
    expect(rendered.html).toContain("https://uniqueskyway.com/brand/dark-logo.webp");
    expect(rendered.html).toContain("48291367");
    expect(rendered.html).toContain("info@uniqueskyway.com");
    expect(rendered.html).not.toContain("localhost");
    expect(rendered.text).toContain("48291367");
  });

  it("renders deposit.confirmed with amount from minor units", async () => {
    const rendered = await renderProductionEmail({
      templateKey: "deposit.confirmed",
      metadata: {
        name: "Alex Morgan",
        amountMinor: "500000",
        currency: "USD",
        depositIntentId: "dep_123",
        status: "confirmed",
      },
    });

    expect(rendered.previewId).toBe("deposit-approved");
    expect(rendered.html).toContain("$5,000.00");
    expect(rendered.html).toContain("Deposit approved");
  });

  it("renders daily ROI template", async () => {
    const rendered = await renderProductionEmail({
      templateKey: "investment.roi_credited",
      metadata: {
        name: "Alex Morgan",
        postedRoiMinor: "1250",
        currency: "USD",
        investmentId: "inv_1",
      },
    });

    expect(rendered.previewId).toBe("daily-roi");
    expect(rendered.subject).toContain("Daily ROI");
    expect(rendered.html).toContain("$12.50");
  });
});
