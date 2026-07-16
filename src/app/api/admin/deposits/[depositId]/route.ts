import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { serializeDepositIntent } from "@/app/api/payments/_shared/service";

import {
  createAdminFinancialOpsService,
  serializeAdminEntityNote,
  serializeAdminProviderEvent,
} from "../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { depositId } = await routeContext.params;
    const service = await createAdminFinancialOpsService();
    const details = await service.getDepositDetails(depositId);

    return jsonOk(
      {
        deposit: serializeDepositIntent(details.deposit),
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
