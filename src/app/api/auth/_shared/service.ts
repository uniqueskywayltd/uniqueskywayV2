import { cookies } from "next/headers";

import { IdentityAuthService, authenticationRateLimiter } from "@/application/auth";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  LedgerRepository,
  NotificationRepository,
  OperationsRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export interface CreateAuthServiceOptions {
  rememberSession?: boolean;
}

export async function createAuthService(options: CreateAuthServiceOptions = {}) {
  const cookieStore = await cookies();
  const routeClient = await createSupabaseRouteClient(
    options.rememberSession === undefined ? {} : { rememberSession: options.rememberSession },
  );
  const adminClient = createSupabaseAdminAuthClient();
  const { db } = getDatabaseConnection();

  return new IdentityAuthService({
    identityProvider: new SupabaseIdentityProvider(adminClient, routeClient),
    transactionManager: new DrizzleTransactionManager(db),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    ledgerRepository: new LedgerRepository(db),
    notificationRepository: new NotificationRepository(db),
    operationsRepository: new OperationsRepository(db),
    rateLimiter: authenticationRateLimiter,
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, cookieOptions) {
        cookieStore.set(name, value, cookieOptions);
      },
      delete(name) {
        cookieStore.delete(name);
      },
    },
  });
}
