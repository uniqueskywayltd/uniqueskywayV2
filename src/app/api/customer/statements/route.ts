import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import type { StatementType } from "@/application/customer/statement-service";

import { createCustomerStatementService } from "../_shared/statement-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const typeParam = request.nextUrl.searchParams.get("type") ?? "all";
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const type =
      typeParam === "monthly" || typeParam === "wallet" || typeParam === "investment"
        ? (typeParam as StatementType)
        : "all";

    const service = await createCustomerStatementService();
    const payload = await service.listStatements({
      type,
      ...(q ? { q } : {}),
    });
    return jsonOk(payload, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
