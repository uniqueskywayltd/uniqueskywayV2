import { createHmac } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

import { PaystackPaymentProvider } from "./paystack-payment-provider";

describe("PaystackPaymentProvider", () => {
  it("initializes deposit transactions with the approved request shape", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: "https://checkout.paystack.com/abc",
          access_code: "access_code",
          reference: "USWDEP-123",
        },
      }),
    ) as unknown as typeof fetch;
    const provider = new PaystackPaymentProvider({
      secretKey: "sk_test_secret",
      baseUrl: "https://api.paystack.test",
      fetchImpl,
    });

    const result = await provider.initializeDeposit({
      amountMinor: 25_000n,
      currency: "USD",
      customerEmail: "customer@example.com",
      reference: "USWDEP-123",
      metadata: { depositIntentId: "deposit_1" },
    });

    expect(result.authorizationUrl).toBe("https://checkout.paystack.com/abc");
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.paystack.test/transaction/initialize",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_secret",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          amount: 25_000,
          email: "customer@example.com",
          currency: "USD",
          reference: "USWDEP-123",
          metadata: { depositIntentId: "deposit_1" },
        }),
      }),
    );
  });

  it("verifies webhook signatures with HMAC SHA512", () => {
    const provider = new PaystackPaymentProvider({ secretKey: "sk_test_secret" });
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "USWDEP-123" } });
    const signature = createHmac("sha512", "sk_test_secret").update(rawBody).digest("hex");

    expect(provider.verifyWebhookSignature({ rawBody, signature })).toBe(true);
    expect(provider.verifyWebhookSignature({ rawBody, signature: "invalid" })).toBe(false);
  });
});
