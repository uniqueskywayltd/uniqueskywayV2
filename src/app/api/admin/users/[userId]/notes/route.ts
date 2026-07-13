import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { addCustomerNoteInputSchema, listCustomerNotesQuerySchema } from "@/application/admin";

import {
  createAdminCustomerService,
  createAdminRouteAuditContext,
  serializeAdminCustomerNote,
} from "../../../_shared/customer-service";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    const { userId } = await routeContext.params;
    const { limit } = listCustomerNotesQuerySchema.parse({
      limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    });

    const service = await createAdminCustomerService();
    const notes = await service.listCustomerNotes(userId, limit);

    return jsonOk({ notes: notes.map(serializeAdminCustomerNote) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);

  try {
    requireSameOrigin(request);
    await requireCsrf(request);

    const { userId } = await routeContext.params;
    const input = await parseJson(request, addCustomerNoteInputSchema);
    const service = await createAdminCustomerService();
    const note = await service.addCustomerNote(userId, input, createAdminRouteAuditContext(context));

    return jsonOk({ note: serializeAdminCustomerNote(note) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
