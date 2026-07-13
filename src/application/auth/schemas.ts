import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(320)
  .transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(8).max(128);
const otpSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "Enter the 6-digit code.");

export const registerInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().trim().max(120).optional(),
  rememberMe: z.boolean().default(true),
});

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().default(false),
});

export const verifyEmailInputSchema = z.object({
  email: emailSchema,
  token: otpSchema,
  rememberMe: z.boolean().default(true),
});

export const forgotPasswordInputSchema = z.object({
  email: emailSchema,
});

export const resetPasswordInputSchema = z.object({
  email: emailSchema,
  token: otpSchema,
  password: passwordSchema,
});

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: passwordSchema,
});

export const revokeTrustedDeviceInputSchema = z.object({
  trustedDeviceId: z.string().uuid(),
});

export const revokeSessionInputSchema = z.object({
  mode: z.enum(["current", "others"]),
});

export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>;
export type RevokeTrustedDeviceInput = z.infer<typeof revokeTrustedDeviceInputSchema>;
export type RevokeSessionInput = z.infer<typeof revokeSessionInputSchema>;
