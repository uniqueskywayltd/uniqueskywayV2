import { z } from "zod";

export const reportDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const reportFilterQuerySchema = z.object({
  from: reportDateSchema.optional(),
  to: reportDateSchema.optional(),
  status: z.string().min(1).max(80).optional(),
  customerId: z.string().uuid().optional(),
  investmentId: z.string().uuid().optional(),
  reference: z.string().min(1).max(180).optional(),
  q: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(10_000).optional(),
  granularity: z.enum(["day", "week", "month", "year"]).optional(),
});

export const customerReportKindSchema = z.enum([
  "growth",
  "verification",
  "active_users",
  "login_activity",
  "geography",
  "referrals",
  "export",
]);

export const financialReportKindSchema = z.enum([
  "deposits",
  "withdrawals",
  "investments",
  "settlements",
  "roi",
  "ledger",
  "period",
]);

export const operationalReportKindSchema = z.enum([
  "jobs",
  "email",
  "notifications",
  "webhooks",
  "security",
  "audit",
]);

export const exportReportInputSchema = z.object({
  reportKey: z.string().min(3).max(120),
  format: z.enum(["csv", "xlsx"]),
  filters: reportFilterQuerySchema.optional(),
});

export type ReportFilterQuery = z.infer<typeof reportFilterQuerySchema>;
export type ExportReportInput = z.infer<typeof exportReportInputSchema>;
