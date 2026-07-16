import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { requireAdminActor } from "@/application/admin";
import { IdentityRepository, getDatabaseConnection } from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export const runtime = "nodejs";

/** Current admin session capabilities for the console chrome. */
export async function GET(request: NextRequest) {
  const context = createRequestContext(request);

  try {
    const { db } = getDatabaseConnection();
    const identityProvider = new SupabaseIdentityProvider(
      createSupabaseAdminAuthClient(),
      await createSupabaseRouteClient(),
    );
    const identityRepository = new IdentityRepository(db);
    const actor = await requireAdminActor(
      { identityProvider, identityRepository },
      "overview.read",
    );

    return jsonOk(
      {
        userId: actor.appUser.id,
        email: actor.appUser.email,
        roleKeys: actor.roleKeys,
        permissionKeys: actor.permissionKeys,
        isAbsoluteController: actor.isAbsoluteController,
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
