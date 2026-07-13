import { z } from "zod";

export const supportedDepositProviderSchema = z.literal("paystack");
export const supportedDepositCurrencySchema = z.literal("USD");

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
  provider: supportedDepositProviderSchema.default("paystack"),
});

export type CreateDepositIntentInput = z.infer<typeof createDepositIntentInputSchema>;

export const supportedWithdrawalCurrencySchema = z.literal("USD");
export const supportedWithdrawalDestinationTypeSchema = z.literal("paystack_recipient");

export const createWithdrawalRequestInputSchema = z.object({
  amountMinor: minorUnitAmountInputSchema.refine((value) => value > 0n, {
    message: "Withdrawal amount must be greater than zero.",
  }),
  currency: supportedWithdrawalCurrencySchema.default("USD"),
  destinationType: supportedWithdrawalDestinationTypeSchema.default("paystack_recipient"),
  destinationReference: z.string().trim().min(1, "Destination reference is required."),
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
