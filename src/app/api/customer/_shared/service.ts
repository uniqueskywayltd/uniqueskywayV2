import { CustomerExperienceService, type RequestAuditContext } from "@/application/customer";
import {
  hashIpAddress,
  hashUserAgent,
  type RequestSecurityContext,
} from "@/application/auth/security";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  NotificationRepository,
  OperationsRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { SupabaseObjectStorage } from "@/infrastructure/storage";

export async function createCustomerExperienceService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerExperienceService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    notificationRepository: new NotificationRepository(db),
    operationsRepository: new OperationsRepository(db),
    objectStorage: new SupabaseObjectStorage(adminClient),
  });
}

export function createAuditContext(context: RequestSecurityContext): RequestAuditContext {
  return {
    requestId: context.requestId,
    ipAddressHash: hashIpAddress(context.ipAddress),
    userAgentHash: hashUserAgent(context.userAgent),
  };
}
