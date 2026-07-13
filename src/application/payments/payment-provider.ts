export type PaymentProviderName = "paystack";

export interface InitializeDepositInput {
  amountMinor: bigint;
  currency: string;
  customerEmail: string;
  reference: string;
  callbackUrl?: string;
  metadata: Record<string, unknown>;
}

export interface DepositInitializationResult {
  provider: PaymentProviderName;
  providerReference: string;
  authorizationUrl: string;
  accessCode: string;
  metadata: Record<string, unknown>;
}

export interface VerifyDepositInput {
  reference: string;
}

export interface VerifiedDepositResult {
  provider: PaymentProviderName;
  providerReference: string;
  status: "success" | "failed" | "pending";
  amountMinor: bigint;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface VerifyWebhookSignatureInput {
  rawBody: string;
  signature: string | null;
}

export interface InitiatePayoutInput {
  amountMinor: bigint;
  currency: string;
  recipientCode: string;
  reference: string;
  reason: string;
  metadata: Record<string, unknown>;
}

export interface PayoutInitializationResult {
  provider: PaymentProviderName;
  providerPayoutReference: string;
  status: "pending" | "success" | "failed";
  metadata: Record<string, unknown>;
}

export interface VerifyPayoutInput {
  reference: string;
}

export interface VerifiedPayoutResult {
  provider: PaymentProviderName;
  providerPayoutReference: string;
  status: "pending" | "success" | "failed";
  amountMinor: bigint;
  currency: string;
  metadata: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly provider: PaymentProviderName;
  initializeDeposit(input: InitializeDepositInput): Promise<DepositInitializationResult>;
  verifyDeposit(input: VerifyDepositInput): Promise<VerifiedDepositResult>;
  initiatePayout(input: InitiatePayoutInput): Promise<PayoutInitializationResult>;
  verifyPayout(input: VerifyPayoutInput): Promise<VerifiedPayoutResult>;
  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean;
}

/** @deprecated Use PaymentProvider */
export type DepositPaymentProvider = PaymentProvider;
