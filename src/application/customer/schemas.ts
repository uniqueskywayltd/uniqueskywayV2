import { z } from "zod";

import { APP_LANGUAGE_CODES } from "@/i18n";

export const customerAppearanceSchema = z.enum(["system", "light", "dark"]);

export const customerLanguageSchema = z.enum(APP_LANGUAGE_CODES);

export const updateCustomerProfileInputSchema = z.object({
  legalName: z.string().trim().max(200).optional().nullable(),
  displayName: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  country: z
    .string()
    .trim()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .nullable(),
  stateRegion: z.string().trim().max(80).optional().nullable(),
  dateOfBirth: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const updateCustomerPreferencesInputSchema = z.object({
  appearance: customerAppearanceSchema.optional(),
  language: customerLanguageSchema.optional(),
  timeZone: z.string().trim().min(3).max(80).optional(),
  inAppNotificationsEnabled: z.boolean().optional(),
  securityEmailsEnabled: z.boolean().optional(),
  productEmailsEnabled: z.boolean().optional(),
  marketingEmailsEnabled: z.boolean().optional(),
});

export const listNotificationsInputSchema = z.object({
  query: z.string().trim().max(120).optional(),
  unreadOnly: z.boolean().optional(),
  category: z.enum(["all", "financial", "security", "system"]).optional(),
});

export const markNotificationReadInputSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().optional(),
}).refine((value) => Boolean(value.markAll) || Boolean(value.notificationId), {
  message: "Provide notificationId or markAll.",
});

export type UpdateCustomerProfileInput = z.infer<typeof updateCustomerProfileInputSchema>;
export type UpdateCustomerPreferencesInput = z.infer<typeof updateCustomerPreferencesInputSchema>;
export type ListNotificationsInput = z.infer<typeof listNotificationsInputSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadInputSchema>;
