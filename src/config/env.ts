import { z } from "zod";

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const resendFromEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string" || value.trim() === "") {
      return "Unique Sky Way <info@uniqueskyway.com>";
    }
    return value.trim();
  },
  z
    .string()
    .min(3)
    .refine((value) => {
      const angled = value.trim().match(/^(.+?)\s*<([^>]+)>$/);
      const email = (angled?.[2] ?? value).trim();
      return z.string().email().safeParse(email).success;
    }, "RESEND_FROM_EMAIL must be an email or Name <email>"),
);

export const serverEnvSchema = clientEnvSchema.extend({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: resendFromEmailSchema,
  INTERNAL_JOB_TOKEN: z.string().min(16),
  LOG_LEVEL: logLevelSchema.default("info"),
  CONTACT_SUPPORT_EMAIL: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().email().optional(),
  ),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type EnvironmentSource = Record<string, string | undefined>;

export function parseClientEnv(source: EnvironmentSource): ClientEnv {
  return clientEnvSchema.parse(source);
}

export function parseServerEnv(source: EnvironmentSource): ServerEnv {
  return serverEnvSchema.parse(source);
}
