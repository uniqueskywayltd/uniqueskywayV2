import type { NextRequest } from "next/server";

import { AppError } from "@/application/errors";
import { getServerEnv } from "@/config/server-env";

/** Authorize machine/internal job callers (Bearer INTERNAL_JOB_TOKEN or Vercel CRON_SECRET). */
export function authorizeInternalJob(request: NextRequest): void {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    ?.trim();
  if (!token) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Unauthorized internal job request.",
    });
  }

  const allowed = new Set<string>([getServerEnv().INTERNAL_JOB_TOKEN]);
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    allowed.add(cronSecret);
  }

  if (!allowed.has(token)) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Unauthorized internal job request.",
    });
  }
}
