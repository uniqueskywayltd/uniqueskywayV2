import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";

import {
  createAdminFinancialOpsService,
  serializeAdminFinancialAuditLog,
} from "../_shared/financial-ops-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const service = await createAdminFinancialOpsService();
    const metrics = await service.getOverviewMetrics();

    return jsonOk(
      {
        pendingDeposits: metrics.pendingDeposits,
        pendingWithdrawals: metrics.pendingWithdrawals,
        underReviewWithdrawals: metrics.underReviewWithdrawals,
        depositsToday: metrics.depositsToday,
        withdrawalsToday: metrics.withdrawalsToday,
        pendingReviews: metrics.pendingReviews,
        failedJobs: metrics.failedJobs,
        failedWebhooks: metrics.failedWebhooks,
        deadLetteredWebhooks: metrics.deadLetteredWebhooks,
        recentActivity: metrics.recentActivity.map(serializeAdminFinancialAuditLog),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
