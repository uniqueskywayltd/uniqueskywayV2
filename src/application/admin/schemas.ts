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

export const adminCreateCustomerInputSchema = z
  .object({
    email: z.string().trim().email().max(320),
    password: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
    displayName: z.string().trim().min(1).max(120).optional(),
    legalName: z.string().trim().min(1).max(160),
    username: z
      .string()
      .trim()
      .min(3)
      .max(24)
      .regex(/^[a-zA-Z0-9_]+$/, "Username must be letters, numbers, or underscore."),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export type AdminCreateCustomerInput = z.infer<typeof adminCreateCustomerInputSchema>;

export const updateCustomerProfileInputSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  legalName: z.string().trim().min(1).max(160).nullable().optional(),
  phone: z.string().trim().min(5).max(40).nullable().optional(),
  country: z.string().trim().min(2).max(80).nullable().optional(),
  stateRegion: z.string().trim().min(1).max(80).nullable().optional(),
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileInputSchema>;

export const adminWalletAdjustmentInputSchema = z.object({
  amountMinor: z.string().regex(/^\d+$/, "Amount must be a positive integer string."),
  currency: z.string().trim().length(3).optional(),
  reason: z.string().trim().min(1).max(500),
});

export type AdminWalletAdjustmentInput = z.infer<typeof adminWalletAdjustmentInputSchema>;

export const deleteCustomerInputSchema = z.object({
  confirmation: z.string().trim().min(1).max(20),
});

export type DeleteCustomerInput = z.infer<typeof deleteCustomerInputSchema>;

export const bulkCustomerActionInputSchema = z
  .object({
    action: z.enum(["suspend", "reactivate", "lock", "unlock", "delete"]),
    userIds: z.array(z.string().uuid()).min(1).max(100),
    reason: z.string().trim().min(1).max(500).optional(),
    confirmation: z.string().trim().min(1).max(20).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "delete" && value.confirmation?.trim().toUpperCase() !== "DELETE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Type DELETE to confirm bulk customer deletion.",
        path: ["confirmation"],
      });
    }
  });

export type BulkCustomerActionInput = z.infer<typeof bulkCustomerActionInputSchema>;

export const listCustomerNotesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListCustomerNotesQuery = z.infer<typeof listCustomerNotesQuerySchema>;

export const listCustomerAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListCustomerAuditQuery = z.infer<typeof listCustomerAuditQuerySchema>;
