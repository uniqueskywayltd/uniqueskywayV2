import "server-only";

import { redirect } from "next/navigation";

import { requireAdminActor } from "@/application/admin/require-admin";
import { AppError, isAppError } from "@/application/errors";
import { IdentityRepository, getDatabaseConnection } from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

/**
 * Gate /admin pages with the existing RBAC actor check.
 * Customers and unauthenticated users are redirected — APIs already enforce the same rules.
 */
export async function requireAdminPageAccess() {
  const { db } = getDatabaseConnection();
  const identityProvider = new SupabaseIdentityProvider(
    createSupabaseAdminAuthClient(),
    await createSupabaseRouteClient(),
  );
  const identityRepository = new IdentityRepository(db);

  try {
    await requireAdminActor({ identityProvider, identityRepository }, "overview.read");
  } catch (error) {
    if (isAppError(error) && error.code === "AUTHENTICATION_ERROR") {
      redirect("/auth/login");
    }
    if (isAppError(error) && error.code === "AUTHORIZATION_ERROR") {
      redirect("/dashboard");
    }
    if (error instanceof AppError) {
      redirect("/auth/login");
    }
    throw error;
  }
}
