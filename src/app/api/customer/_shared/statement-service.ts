import { CustomerStatementService } from "@/application/customer/statement-service";
import {
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  OperationsRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createCustomerStatementService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerStatementService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    identityRepository: new IdentityRepository(db),
    ledgerRepository: new LedgerRepository(db),
    operationsRepository: new OperationsRepository(db),
    transactionManager: new DrizzleTransactionManager(db),
  });
}
