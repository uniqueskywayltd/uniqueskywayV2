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
        actionLink: "https://uniqueskyway.com/auth/verify-email",
      },
    });

    expect(rendered.previewId).toBe("verify-email");
    expect(rendered.subject).toContain("verification code");
    expect(rendered.html).toContain("https://uniqueskyway.com/brand/dark-logo.webp");
    expect(rendered.html).toContain("48291367");
    expect(rendered.html).toContain("Action required");
    expect(rendered.html).toContain("verification window");
    expect(rendered.html).toContain("Reply to this email if you need help or have questions.");
    expect(rendered.html).not.toContain("Need help? Contact");
    expect(rendered.html).not.toContain("Questions? Contact our investor support team");
    expect(rendered.html).not.toContain("localhost");
    expect(rendered.text).toContain("48291367");
    expect(rendered.text).toContain("signup window");
  });

  it("renders delayed signup welcome (not OTP verify)", async () => {
    const rendered = await renderProductionEmail({
      templateKey: AUTH_EMAIL_TEMPLATES.welcome,
      metadata: {
        name: "Alex Morgan",
        actionLink: "https://uniqueskyway.com/auth/callback?token=example",
        signupWelcome: true,
      },
    });

    expect(rendered.previewId).toBe("welcome");
    expect(rendered.subject).toContain("Welcome");
    expect(rendered.html).toContain("New account");
    expect(rendered.html).toContain("Welcome, Alex Morgan");
    expect(rendered.html).toContain("glad to have you on board");
    expect(rendered.html).toContain("Please verify your email address");
    expect(rendered.html).not.toContain("Verify email address");
    expect(rendered.html).not.toContain("48291367");
    expect(rendered.html).not.toContain("Your verification code");
  });

  it("renders password-reset with OTP and security badge", async () => {
    const rendered = await renderProductionEmail({
      templateKey: AUTH_EMAIL_TEMPLATES.passwordReset,
      metadata: {
        name: "Alex Morgan",
        otp: "48291367",
        actionLink: "https://uniqueskyway.com/auth/reset-password",
      },
    });

    expect(rendered.previewId).toBe("password-reset");
    expect(rendered.html).toContain("Security");
    expect(rendered.html).toContain("Reset your password");
    expect(rendered.html).toContain("48291367");
    expect(rendered.html).toContain("Choose new password");
    expect(rendered.html).toContain("password reset window");
  });

  it("renders a single new-device sign-in alert with sign-in details", async () => {
    const rendered = await renderProductionEmail({
      templateKey: AUTH_EMAIL_TEMPLATES.newDeviceSignIn,
      metadata: {
        name: "Alex Morgan",
        deviceLabel: "Safari on iOS",
        browser: "Safari",
        os: "iOS",
        ipAddressMasked: "192.168.1.42",
        signedInAt: "2026-07-06T15:42:00.000Z",
        approximateLocation: "Fayetteville, Arkansas, US",
      },
    });

    expect(rendered.previewId).toBe("new-device-login");
    expect(rendered.subject).toBe("New device sign-in");
    expect(rendered.html).toContain("New device sign-in");
    expect(rendered.html).toContain("Sign-in details");
    expect(rendered.html).toContain("Date / time");
    expect(rendered.html).toMatch(/07\/06\/2026/);
    expect(rendered.html).not.toContain("Transaction details");
    expect(rendered.html).not.toContain("New sign-in detected");
    expect(rendered.html).toContain("Reply to this email if you need help or have questions.");
    expect(rendered.html).not.toContain("Need help? Contact");
    expect(rendered.html).not.toContain("Questions? Contact our investor support team");
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

  it("renders admin.deposit_submitted for finance notification", async () => {
    const rendered = await renderProductionEmail({
      templateKey: "admin.deposit_submitted",
      metadata: {
        name: "Alex Morgan",
        customerEmail: "alex@example.com",
        amountMinor: "250000",
        currency: "USD",
        providerIntentId: "USWDEP-TEST",
        fundingNetwork: "TRC20",
        adminDashboardUrl: "https://uniqueskyway.com/admin/deposits/dep_1",
        status: "Awaiting Review",
      },
    });

    expect(rendered.subject).toContain("New Deposit Awaiting Review");
    expect(rendered.html).toContain("New Deposit Awaiting Review");
    expect(rendered.html).toContain("alex@example.com");
    expect(rendered.html).toContain("TRC20");
    expect(rendered.html).toContain("Review Deposit");
  });

  it("renders admin.registration for administrator notification", async () => {
    const rendered = await renderProductionEmail({
      templateKey: "admin.registration",
      metadata: {
        customerName: "Alex Morgan",
        username: "alex",
        customerEmail: "alex@example.com",
        country: "US",
        accountNumber: "USW-1001",
        verificationStatus: "Unverified",
        adminDashboardUrl: "https://uniqueskyway.com/admin/customers/1",
      },
    });
    expect(rendered.subject).toContain("New Customer Registration");
    expect(rendered.html).toContain("View Customer");
  });

  it("renders admin.withdrawal_requested without raw JSON", async () => {
    const rendered = await renderProductionEmail({
      templateKey: "admin.withdrawal_requested",
      metadata: {
        customerName: "Alex",
        amountMinor: "250000",
        currency: "USD",
        destination: "Bitcoin (BTC) · e43tgb...gtfred",
        providerPayoutReference: "USWWTH-1",
        adminDashboardUrl: "https://uniqueskyway.com/admin/withdrawals/1",
      },
    });
    expect(rendered.subject).toContain("New Withdrawal Request");
    expect(rendered.html).toContain("Review Withdrawal");
    expect(rendered.html).not.toContain('{"asset"');
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
