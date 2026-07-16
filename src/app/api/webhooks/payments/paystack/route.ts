import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { dispatchQueuedEmails } from "@/app/api/auth/_shared/dispatch-emails";
import {
  createDepositEngineService,
  createPaymentRouteAuditContext,
  createWithdrawalEngineService,
} from "@/app/api/payments/_shared/service";
import { peekPaystackWebhookEventType } from "@/application/payments";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const auditContext = createPaymentRouteAuditContext(context);

    // This is a routing-only peek and must never be trusted for
    // authorization or financial decisions; each engine independently
    // verifies the webhook signature before processing.
    const eventType = peekPaystackWebhookEventType(rawBody);

    if (eventType?.startsWith("transfer.")) {
      const withdrawalService = await createWithdrawalEngineService();
      const result = await withdrawalService.processPaystackTransferWebhook({
        rawBody,
        signature,
        context: auditContext,
      });
      await dispatchQueuedEmails(25);
      return jsonOk(result, context.requestId);
    }

    const depositService = await createDepositEngineService();
    const result = await depositService.processPaystackWebhook({
      rawBody,
      signature,
      context: auditContext,
    });

    await dispatchQueuedEmails(25);
    return jsonOk(result, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
