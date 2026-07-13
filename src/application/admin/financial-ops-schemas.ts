import { z } from "zod";

const isoDateInputSchema = z
  .string()
  .trim()
  .min(1)
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), { message: "Invalid date." });

const dateOnlyInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format.");

export const depositSearchStatusSchema = z.enum([
  "created",
  "pending",
  "confirmed",
  "failed",
  "cancelled",
  "reversed",
]);

export const withdrawalSearchStatusSchema = z.enum([
  "requested",
  "reserved",
  "under_review",
  "approved",
  "processing",
  "paid",
  "rejected",
  "failed",
  "cancelled",
]);

export const investmentSearchStatusSchema = z.enum([
  "pending",
  "active",
  "maturing",
  "matured",
  "cancelled",
  "failed",
]);

export const settlementRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const backgroundJobStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export const providerEventStatusSchema = z.enum([
  "received",
  "processing",
  "processed",
  "failed",
  "ignored",
]);

export const searchDepositsInputSchema = z.object({
  q: z.string().trim().min(1).max(160).optional(),
  status: depositSearchStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  from: isoDateInputSchema.optional(),
  to: isoDateInputSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type SearchDepositsInput = z.infer<typeof searchDepositsInputSchema>;

export const searchWithdrawalsInputSchema = z.object({
  q: z.string().trim().min(1).max(160).optional(),
  status: withdrawalSearchStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  from: isoDateInputSchema.optional(),
  to: isoDateInputSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type SearchWithdrawalsInput = z.infer<typeof searchWithdrawalsInputSchema>;

export const searchInvestmentsInputSchema = z.object({
  q: z.string().trim().min(1).max(160).optional(),
  status: investmentSearchStatusSchema.optional(),
  userId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type SearchInvestmentsInput = z.infer<typeof searchInvestmentsInputSchema>;

export const listSettlementRunsInputSchema = z.object({
  status: settlementRunStatusSchema.optional(),
  from: dateOnlyInputSchema.optional(),
  to: dateOnlyInputSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type ListSettlementRunsInput = z.infer<typeof listSettlementRunsInputSchema>;

export const listProviderEventsInputSchema = z.object({
  status: providerEventStatusSchema.optional(),
  deadLettered: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type ListProviderEventsInput = z.infer<typeof listProviderEventsInputSchema>;

export const listBackgroundJobsInputSchema = z.object({
  status: backgroundJobStatusSchema.optional(),
  jobType: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type ListBackgroundJobsInput = z.infer<typeof listBackgroundJobsInputSchema>;

export const addFinancialNoteInputSchema = z.object({
  body: z.string().trim().min(1, "Note body is required.").max(5000),
});

export type AddFinancialNoteInput = z.infer<typeof addFinancialNoteInputSchema>;

export const financialActionReasonInputSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required."),
});

export type FinancialActionReasonInput = z.infer<typeof financialActionReasonInputSchema>;

export const listFinancialNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListFinancialNotesQuery = z.infer<typeof listFinancialNotesQuerySchema>;

export const listFinancialTimelineQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListFinancialTimelineQuery = z.infer<typeof listFinancialTimelineQuerySchema>;
