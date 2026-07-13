import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { addFinancialNoteInputSchema, listFinancialNotesQuerySchema } from "@/application/admin";

import {
  createAdminFinancialOpsAuditContext,
  createAdminFinancialOpsService,
  serializeAdminEntityNote,
} from "../../../_shared/financial-ops-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ depositId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { depositId } = await routeContext.params;
    const { limit } = listFinancialNotesQuerySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminFinancialOpsService();
    const notes = await service.listDepositNotes(depositId, limit);

    return jsonOk({ notes: notes.map(serializeAdminEntityNote) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);

    const { depositId } = await routeContext.params;
    const input = await parseJson(request, addFinancialNoteInputSchema);
    const service = await createAdminFinancialOpsService();
    const note = await service.addDepositNote(
      depositId,
      input,
      createAdminFinancialOpsAuditContext(context),
    );

    return jsonOk({ note: serializeAdminEntityNote(note) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
