import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { z } from "zod";

import { AppError } from "@/application/errors";
import type {
  DepositInitializationResult,
  InitializeDepositInput,
  InitiatePayoutInput,
  PaymentProvider,
  PayoutInitializationResult,
  VerifiedDepositResult,
  VerifiedPayoutResult,
  VerifyDepositInput,
  VerifyPayoutInput,
  VerifyWebhookSignatureInput,
} from "@/application/payments";
import { getServerEnv } from "@/config/server-env";

const paystackInitializeResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    authorization_url: z.string().url(),
    access_code: z.string(),
    reference: z.string(),
  }),
});

const paystackVerifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.union([z.number().int(), z.string().regex(/^\d+$/)]),
    currency: z.string(),
  }),
});

export interface PaystackPaymentProviderOptions {
  secretKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

const paystackTransferResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    transfer_code: z.string().optional(),
    status: z.string(),
  }),
});

const paystackTransferVerifyResponseSchema = z.object({
  status: z.boolean(),
  message: z.string(),
  data: z.object({
    reference: z.string(),
    status: z.string(),
    amount: z.union([z.number().int(), z.string().regex(/^\d+$/)]),
    currency: z.string(),
  }),
});

export class PaystackPaymentProvider implements PaymentProvider {
  readonly provider = "paystack" as const;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: PaystackPaymentProviderOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.paystack.co";
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async initializeDeposit(input: InitializeDepositInput): Promise<DepositInitializationResult> {
    const amount = toProviderAmount(input.amountMinor);
    const response = await this.fetchImpl(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        email: input.customerEmail,
        currency: input.currency,
        reference: input.reference,
        ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
        metadata: input.metadata,
      }),
    });

    const parsed = paystackInitializeResponseSchema.safeParse(
      await response.json().catch(() => null),
    );
    if (!response.ok || !parsed.success || !parsed.data.status) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Paystack deposit initialization failed.",
        details: { status: response.status },
      });
    }

    return {
      provider: this.provider,
      providerReference: parsed.data.data.reference,
      authorizationUrl: parsed.data.data.authorization_url,
      accessCode: parsed.data.data.access_code,
      metadata: {
        providerMessage: parsed.data.message,
      },
    };
  }

  async verifyDeposit(input: VerifyDepositInput): Promise<VerifiedDepositResult> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/transaction/verify/${encodeURIComponent(input.reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.options.secretKey}`,
        },
      },
    );

    const parsed = paystackVerifyResponseSchema.safeParse(await response.json().catch(() => null));
    if (!response.ok || !parsed.success || !parsed.data.status) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Paystack deposit verification failed.",
        details: { status: response.status },
      });
    }

    return {
      provider: this.provider,
      providerReference: parsed.data.data.reference,
      status: normalizePaystackTransactionStatus(parsed.data.data.status),
      amountMinor: BigInt(parsed.data.data.amount),
      currency: parsed.data.data.currency.toUpperCase(),
      metadata: {
        providerStatus: parsed.data.data.status,
        providerMessage: parsed.data.message,
      },
    };
  }

  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean {
    if (!input.signature) return false;

    const expected = createHmac("sha512", this.options.secretKey)
      .update(input.rawBody)
      .digest("hex");
    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(input.signature, "utf8");

    return (
      expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }

  async initiatePayout(input: InitiatePayoutInput): Promise<PayoutInitializationResult> {
    const amount = toProviderAmount(input.amountMinor);
    const response = await this.fetchImpl(`${this.baseUrl}/transfer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.options.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount,
        recipient: input.recipientCode,
        reference: input.reference,
        reason: input.reason,
        currency: input.currency,
        metadata: input.metadata,
      }),
    });

    const parsed = paystackTransferResponseSchema.safeParse(await response.json().catch(() => null));
    if (!response.ok || !parsed.success || !parsed.data.status) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Paystack payout initialization failed.",
        details: { status: response.status },
      });
    }

    return {
      provider: this.provider,
      providerPayoutReference: parsed.data.data.reference,
      status: normalizePaystackPayoutStatus(parsed.data.data.status),
      metadata: {
        providerMessage: parsed.data.message,
        transferCode: parsed.data.data.transfer_code,
        providerStatus: parsed.data.data.status,
      },
    };
  }

  async verifyPayout(input: VerifyPayoutInput): Promise<VerifiedPayoutResult> {
    const response = await this.fetchImpl(
      `${this.baseUrl}/transfer/verify/${encodeURIComponent(input.reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.options.secretKey}`,
        },
      },
    );

    const parsed = paystackTransferVerifyResponseSchema.safeParse(
      await response.json().catch(() => null),
    );
    if (!response.ok || !parsed.success || !parsed.data.status) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Paystack payout verification failed.",
        details: { status: response.status },
      });
    }

    return {
      provider: this.provider,
      providerPayoutReference: parsed.data.data.reference,
      status: normalizePaystackPayoutStatus(parsed.data.data.status),
      amountMinor: BigInt(parsed.data.data.amount),
      currency: parsed.data.data.currency.toUpperCase(),
      metadata: {
        providerStatus: parsed.data.data.status,
        providerMessage: parsed.data.message,
      },
    };
  }
}

export function createPaystackPaymentProvider() {
  const env = getServerEnv();
  if (!env.PAYSTACK_SECRET_KEY) {
    return new DisabledPaystackPaymentProvider();
  }

  return new PaystackPaymentProvider({
    secretKey: env.PAYSTACK_SECRET_KEY,
    baseUrl: env.PAYSTACK_BASE_URL,
  });
}

class DisabledPaystackPaymentProvider implements PaymentProvider {
  readonly provider = "paystack" as const;

  async initializeDeposit(): Promise<DepositInitializationResult> {
    throw missingPaystackSecretError();
  }

  async verifyDeposit(): Promise<VerifiedDepositResult> {
    throw missingPaystackSecretError();
  }

  async initiatePayout(): Promise<PayoutInitializationResult> {
    throw missingPaystackSecretError();
  }

  async verifyPayout(): Promise<VerifiedPayoutResult> {
    throw missingPaystackSecretError();
  }

  verifyWebhookSignature(): boolean {
    return false;
  }
}

function toProviderAmount(amountMinor: bigint) {
  if (amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Deposit amount exceeds the provider initialization limit.",
    });
  }
  return Number(amountMinor);
}

function normalizePaystackTransactionStatus(status: string): VerifiedDepositResult["status"] {
  if (status === "success") return "success";
  if (status === "failed" || status === "abandoned") return "failed";
  return "pending";
}

function normalizePaystackPayoutStatus(status: string): VerifiedPayoutResult["status"] {
  if (status === "success") return "success";
  if (status === "failed" || status === "reversed" || status === "abandoned") return "failed";
  return "pending";
}

function missingPaystackSecretError() {
  return new AppError({
    code: "PROVIDER_ERROR",
    message: "PAYSTACK_SECRET_KEY is required for Paystack payment operations.",
  });
}
