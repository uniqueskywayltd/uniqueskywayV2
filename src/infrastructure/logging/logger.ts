import "server-only";

import pino, { type Logger } from "pino";

import { APP_METADATA } from "@/config/constants";

export interface LoggerBindings {
  requestId?: string;
  actorId?: string;
  module?: string;
}

const redactPaths = [
  "DATABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "PAYSTACK_SECRET_KEY",
  "INTERNAL_JOB_TOKEN",
  "password",
  "token",
  "authorization",
] as const;

export function createLogger(bindings: LoggerBindings = {}): Logger {
  return pino({
    level: process.env.LOG_LEVEL ?? "info",
    base: {
      service: APP_METADATA.packageName,
      version: APP_METADATA.version,
    },
    redact: {
      paths: [...redactPaths],
      censor: "[redacted]",
    },
  }).child(bindings);
}

export const logger = createLogger();
