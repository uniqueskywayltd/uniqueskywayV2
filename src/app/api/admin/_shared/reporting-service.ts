import type { RequestSecurityContext } from "@/application/auth/security";
import {
  AdminReportingService,
  createAdminAuditContext,
} from "@/application/admin";
import {
  DrizzleTransactionManager,
  IdentityRepository,
  OperationsRepository,
  ReportingRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { systemClock } from "@/infrastructure/time/system-clock";

export async function createAdminReportingService() {
  const { db } = getDatabaseConnection();
  const identityProvider = new SupabaseIdentityProvider(
    createSupabaseAdminAuthClient(),
    await createSupabaseRouteClient(),
  );

  return new AdminReportingService({
    identityProvider,
    identityRepository: new IdentityRepository(db),
    clock: systemClock,
    transactionManager: new DrizzleTransactionManager(db),
    reportingRepository: new ReportingRepository(db),
    operationsRepository: new OperationsRepository(db),
  });
}

export function createAdminReportingAuditContext(context: RequestSecurityContext) {
  return createAdminAuditContext(context);
}
