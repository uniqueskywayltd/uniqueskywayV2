import { z } from "zod";

export const customerStatusSchema = z.enum(["active", "restricted", "closed"]);
export const customerKycStatusSchema = z.enum([
  "not_started",
  "pending",
  "approved",
  "rejected",
  "expired",
]);
export const customerRiskStatusSchema = z.enum(["not_reviewed", "clear", "watch", "blocked"]);

export const searchCustomersInputSchema = z.object({
  q: z.string().trim().min(1).max(160).optional(),
  status: customerStatusSchema.optional(),
  kycStatus: customerKycStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().trim().min(1).optional(),
});

export type SearchCustomersInput = z.infer<typeof searchCustomersInputSchema>;

export const updateCustomerStatusInputSchema = z.object({
  status: customerStatusSchema,
  reason: z.string().trim().min(1).max(500).optional(),
});

export type UpdateCustomerStatusInput = z.infer<typeof updateCustomerStatusInputSchema>;

export const updateCustomerKycInputSchema = z.object({
  kycStatus: customerKycStatusSchema,
  riskStatus: customerRiskStatusSchema.optional(),
  reason: z.string().trim().min(1, "A review reason is required.").max(500),
});

export type UpdateCustomerKycInput = z.infer<typeof updateCustomerKycInputSchema>;

export const addCustomerNoteInputSchema = z.object({
  body: z.string().trim().min(1, "Note body is required.").max(5000),
});

export type AddCustomerNoteInput = z.infer<typeof addCustomerNoteInputSchema>;

export const listCustomerNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListCustomerNotesQuery = z.infer<typeof listCustomerNotesQuerySchema>;

export const listCustomerAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListCustomerAuditQuery = z.infer<typeof listCustomerAuditQuerySchema>;
