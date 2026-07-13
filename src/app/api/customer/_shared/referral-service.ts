import { CustomerReferralService } from "@/application/customer/referral-service";
import {
  IdentityRepository,
  ReferralRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export async function createCustomerReferralService() {
  const routeClient = await createSupabaseRouteClient();
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new CustomerReferralService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    identityRepository: new IdentityRepository(db),
    referralRepository: new ReferralRepository(db),
  });
}
