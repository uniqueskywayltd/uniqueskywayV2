import { CustomerPortfolioService } from "@/application/customer/portfolio-service";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  InvestmentRepository,
  LedgerRepository,
  SettlementRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createCustomerPortfolioService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerPortfolioService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    identityRepository: new IdentityRepository(db),
    investmentRepository: new InvestmentRepository(db),
    settlementRepository: new SettlementRepository(db),
    coreRepository: new CoreRepository(db),
    ledgerRepository: new LedgerRepository(db),
    transactionManager: new DrizzleTransactionManager(db),
    clock: { now: () => new Date() },
  });
}
