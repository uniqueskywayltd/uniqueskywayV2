import type { NextRequest } from "next/server";
import { z } from "zod";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
import { addNewYorkDays, toNewYorkDate } from "@/domains/settlement";
import { systemClock } from "@/infrastructure/time/system-clock";
import { logger } from "@/infrastructure/logging/logger";

import { authorizeInternalJob } from "../../_shared/authorize-internal-job";
import { createSettlementEngineService } from "../../_shared/create-settlement-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z
  .object({
    asOf: z.string().datetime().optional(),
    settlementDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .optional();

async function runSettlementJob(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    authorizeInternalJob(request);

    let settlementDate: string | undefined;
    if (request.method === "POST") {
      const raw = await request.text();
      if (raw.trim()) {
        const parsed = bodySchema.parse(JSON.parse(raw));
        settlementDate = parsed?.settlementDate;
        if (!settlementDate && parsed?.asOf) {
          settlementDate = addNewYorkDays(toNewYorkDate(new Date(parsed.asOf)), -1);
        }
      }
    }

    if (!settlementDate) {
      settlementDate = addNewYorkDays(toNewYorkDate(systemClock.now()), -1);
    }

    const engine = createSettlementEngineService();
    const result = await engine.runSettlement({
      settlementDate,
      runType: "daily",
      lockedBy: "internal-job:run-settlement",
    });

    await dispatchQueuedEmails(50);

    logger.info(
      {
        event: "internal.jobs.run_settlement",
        settlementDate,
        settlementRunId: result.settlementRunId,
        processed: result.processed,
        posted: result.posted,
        skipped: result.skipped,
        idempotent: result.idempotent,
      },
      "Completed settlement job",
    );

    return jsonOk({ ...result, settlementDate }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

/** Vercel Cron invokes GET; machine callers may use POST with optional asOf/settlementDate. */
export async function GET(request: NextRequest) {
  return runSettlementJob(request);
}

export async function POST(request: NextRequest) {
  return runSettlementJob(request);
}
