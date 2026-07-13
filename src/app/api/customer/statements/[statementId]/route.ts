import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createCustomerStatementService } from "../../_shared/statement-service";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ statementId: string }> },
) {
  const requestContext = createRequestContext(request);

  try {
    const { statementId } = await context.params;
    const service = await createCustomerStatementService();
    const payload = await service.getStatement(decodeURIComponent(statementId));
    return jsonOk(payload, requestContext.requestId);
  } catch (error) {
    return jsonError(error, requestContext.requestId);
  }
}
