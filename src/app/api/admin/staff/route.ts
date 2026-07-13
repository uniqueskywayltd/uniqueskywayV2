import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";

import {
  createAdminSystemAuditContext,
  createAdminSystemService,
} from "../_shared/system-service";

export const runtime = "nodejs";

const inviteSchema = z.object({
  email: z.string().email(),
  roleIds: z.array(z.string().uuid()).min(1),
});

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const query: { q?: string; status?: string } = {};
    const q = request.nextUrl.searchParams.get("q");
    const status = request.nextUrl.searchParams.get("status");
    if (q) query.q = q;
    if (status) query.status = status;
    const service = await createAdminSystemService();
    const staff = await service.searchStaff(query);
    return jsonOk({ staff }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const input = await parseJson(request, inviteSchema);
    const service = await createAdminSystemService();
    const result = await service.inviteStaff(input, createAdminSystemAuditContext(context));
    return jsonOk(
      {
        invite: {
          id: result.invite.id,
          email: result.invite.email,
          status: result.invite.status,
          expiresAt: result.invite.expiresAt.toISOString(),
        },
      },
      context.requestId,
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
