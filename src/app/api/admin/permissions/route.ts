import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import {
  createAdminSystemService,
} from "../_shared/system-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const service = await createAdminSystemService();
    const permissions = await service.listPermissions();
    return jsonOk({ permissions }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
