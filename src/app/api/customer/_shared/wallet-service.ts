import { CustomerWalletService } from "@/application/customer/wallet-service";
import {
  IdentityRepository,
  LedgerRepository,
  PaymentRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createCustomerWalletService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerWalletService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    identityRepository: new IdentityRepository(db),
    ledgerRepository: new LedgerRepository(db),
    paymentRepository: new PaymentRepository(db),
  });
}
