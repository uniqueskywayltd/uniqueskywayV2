import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { serializeWithdrawalRequest } from "@/app/api/payments/_shared/service";

import {
  createAdminFinancialOpsService,
  serializeAdminEntityNote,
  serializeAdminProviderEvent,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ withdrawalId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { withdrawalId } = await routeContext.params;
    const service = await createAdminFinancialOpsService();
    const details = await service.getWithdrawalDetails(withdrawalId);

    return jsonOk(
      {
        withdrawal: serializeWithdrawalRequest(details.withdrawal),
        customer: details.customer,
        providerEvents: details.providerEvents.map(serializeAdminProviderEvent),
        notes: details.notes.map(serializeAdminEntityNote),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
