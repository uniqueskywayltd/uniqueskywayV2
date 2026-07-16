import { z } from "zod";

import {
  FUNDING_ASSETS,
  MANUAL_DEPOSIT_PROVIDER,
  WITHDRAWAL_DESTINATION_TYPES,
} from "./funding-constants";

export const supportedDepositProviderSchema = z.literal(MANUAL_DEPOSIT_PROVIDER);
export const supportedDepositCurrencySchema = z.literal("USD");
export const fundingAssetSchema = z.enum(FUNDING_ASSETS);

const minorUnitAmountInputSchema = z
  .union([
    z.bigint(),
    z.number().int().positive(),
    z.string().regex(/^[1-9]\d*$/, "Amount must be a positive integer minor-unit value."),
  ])
  .transform((value) => BigInt(value));

export const createDepositIntentInputSchema = z.object({
  amountMinor: minorUnitAmountInputSchema.refine((value) => value > 0n, {
    message: "Deposit amount must be greater than zero.",
  }),
  currency: supportedDepositCurrencySchema.default("USD"),
  provider: supportedDepositProviderSchema.default(MANUAL_DEPOSIT_PROVIDER),
  asset: fundingAssetSchema,
  fundingWalletId: z.string().uuid(),
  transactionHash: z.string().trim().min(6, "Transaction hash is required.").max(200),
  customerNote: z.string().trim().max(2000).optional(),
});

export type CreateDepositIntentInput = z.infer<typeof createDepositIntentInputSchema>;

export const supportedWithdrawalCurrencySchema = z.literal("USD");
export const supportedWithdrawalDestinationTypeSchema = z.enum(WITHDRAWAL_DESTINATION_TYPES);

export const createWithdrawalRequestInputSchema = z.object({
  amountMinor: minorUnitAmountInputSchema.refine((value) => value > 0n, {
    message: "Withdrawal amount must be greater than zero.",
  }),
  currency: supportedWithdrawalCurrencySchema.default("USD"),
  destinationType: supportedWithdrawalDestinationTypeSchema,
  destinationReference: z.string().trim().min(1, "Destination details are required.").max(500),
  asset: fundingAssetSchema.optional(),
  network: z.string().trim().max(80).optional(),
});

export type CreateWithdrawalRequestInput = z.infer<typeof createWithdrawalRequestInputSchema>;

export const adminWithdrawalReviewInputSchema = z.object({
  reason: z.string().trim().min(1, "A review reason is required."),
});

export type AdminWithdrawalReviewInput = z.infer<typeof adminWithdrawalReviewInputSchema>;

export const adminDepositReviewInputSchema = z.object({
  reason: z.string().trim().min(1, "A review reason is required."),
});

export type AdminDepositReviewInput = z.infer<typeof adminDepositReviewInputSchema>;

export const upsertFundingWalletInputSchema = z.object({
  asset: fundingAssetSchema,
  network: z.string().trim().min(1).max(80),
  address: z.string().trim().min(8).max(500),
  qrCodeUrl: z.string().url().optional().nullable(),
  instructions: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(["active", "disabled"]).default("active"),
  displayOrder: z.number().int().min(0).max(10_000).default(0),
});

export type UpsertFundingWalletInput = z.infer<typeof upsertFundingWalletInputSchema>;
