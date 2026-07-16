import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  parseJson,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { requireAdminActor } from "@/application/admin/require-admin";
import { AppError } from "@/application/errors";
import { upsertFundingWalletInputSchema } from "@/application/payments";
import {
  CoreRepository,
  DrizzleTransactionManager,
  IdentityRepository,
  PaymentRepository,
  getDatabaseConnection,
} from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ walletId: string }>;
}

async function createDeps() {
  const { db } = getDatabaseConnection();
  return {
    identityProvider: new SupabaseIdentityProvider(
      createSupabaseAdminAuthClient(),
      await createSupabaseRouteClient(),
    ),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    paymentRepository: new PaymentRepository(db),
    transactionManager: new DrizzleTransactionManager(db),
  };
}

export async function PATCH(request: NextRequest, routeContext: RouteContext) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const deps = await createDeps();
    const admin = await requireAdminActor(deps, "system.manage");
    const { walletId } = await routeContext.params;
    const existing = await deps.paymentRepository.findFundingWalletById(walletId);
    if (!existing) {
      throw new AppError({ code: "NOT_FOUND", message: "Funding wallet was not found." });
    }
    const input = await parseJson(request, upsertFundingWalletInputSchema);
    const wallet = await deps.paymentRepository.updateFundingWallet(walletId, {
      asset: input.asset,
      network: input.network,
      address: input.address,
      qrCodeUrl: input.qrCodeUrl ?? null,
      instructions: input.instructions ?? null,
      status: input.status,
      displayOrder: input.displayOrder,
      updatedBy: admin.appUser.id,
    });
    return jsonOk(
      {
        wallet: {
          id: wallet.id,
          asset: wallet.asset,
          network: wallet.network,
          address: wallet.address,
          qrCodeUrl: wallet.qrCodeUrl,
          instructions: wallet.instructions,
          status: wallet.status,
          displayOrder: wallet.displayOrder,
          createdAt: wallet.createdAt.toISOString(),
          updatedAt: wallet.updatedAt.toISOString(),
        },
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
