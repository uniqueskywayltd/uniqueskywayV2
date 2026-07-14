import { CustomerLearningService } from "@/application/customer/learning-service";
import {
  DrizzleTransactionManager,
  IdentityRepository,
  OperationsRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createCustomerLearningService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerLearningService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    identityRepository: new IdentityRepository(db),
    operationsRepository: new OperationsRepository(db),
    transactionManager: new DrizzleTransactionManager(db),
  });
}
