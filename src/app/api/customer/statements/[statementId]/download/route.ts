import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk, requireCsrf } from "@/app/api/_shared/http";
import { createAuditContext } from "@/app/api/customer/_shared/service";

import { createCustomerStatementService } from "../../../_shared/statement-service";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ statementId: string }> },
) {
  const requestContext = createRequestContext(request);

  try {
    await requireCsrf(request);
    const { statementId } = await context.params;
    const service = await createCustomerStatementService();
    const payload = await service.recordDownload(
      decodeURIComponent(statementId),
      createAuditContext(requestContext),
    );
    return jsonOk(payload, requestContext.requestId);
  } catch (error) {
    return jsonError(error, requestContext.requestId);
  }
}
