import type { NextRequest } from "next/server";
import { z } from "zod";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import { createAdminSystemService } from "../_shared/system-service";

export const runtime = "nodejs";

const statusSchema = z.enum(["pending", "running", "completed", "failed", "cancelled"]);

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const raw = request.nextUrl.searchParams.get("status");
    const query: { status?: "pending" | "running" | "completed" | "failed" | "cancelled" } = {};
    if (raw) query.status = statusSchema.parse(raw);
    const service = await createAdminSystemService();
    const jobs = await service.listJobs(query);
    return jsonOk(jobs, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
