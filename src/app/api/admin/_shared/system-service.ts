import type { RequestSecurityContext } from "@/application/auth/security";
import {
  AdminSystemService,
  createAdminAuditContext,
} from "@/application/admin";
import {
  IdentityRepository,
  NotificationRepository,
  OperationsRepository,
  PaymentRepository,
  DrizzleTransactionManager,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { systemClock } from "@/infrastructure/time/system-clock";

export async function createAdminSystemService() {
  const { db } = getDatabaseConnection();
  const identityProvider = new SupabaseIdentityProvider(
    createSupabaseAdminAuthClient(),
    await createSupabaseRouteClient(),
  );

  return new AdminSystemService({
    identityProvider,
    clock: systemClock,
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    operationsRepository: new OperationsRepository(db),
    notificationRepository: new NotificationRepository(db),
    paymentRepository: new PaymentRepository(db),
  });
}

export function createAdminSystemAuditContext(context: RequestSecurityContext) {
  return createAdminAuditContext(context);
}
