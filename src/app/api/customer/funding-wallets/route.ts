import type { NextRequest } from "next/server";

import { createRequestContext, jsonError, jsonOk } from "@/app/api/_shared/http";
import { AppError } from "@/application/errors";
import {
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

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const identityProvider = new SupabaseIdentityProvider(
      createSupabaseAdminAuthClient(),
      await createSupabaseRouteClient(),
    );
    const current = await identityProvider.getCurrentUser();
    if (!current) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication required." });
    }

    const { db } = getDatabaseConnection();
    const identityRepository = new IdentityRepository(db);
    const appUser = await identityRepository.findUserByAuthUserId(current.authUserId);
    if (!appUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "User profile was not found." });
    }

    const paymentRepository = new PaymentRepository(db);
    const asset = request.nextUrl.searchParams.get("asset") ?? undefined;
    const wallets = (await paymentRepository.listFundingWallets({ activeOnly: true })).filter(
      (wallet) => (asset ? wallet.asset === asset : true),
    );

    return jsonOk(
      {
        wallets: wallets.map((wallet) => ({
          id: wallet.id,
          asset: wallet.asset,
          network: wallet.network,
          address: wallet.address,
          qrCodeUrl: wallet.qrCodeUrl,
          instructions: wallet.instructions,
          displayOrder: wallet.displayOrder,
        })),
      },
      context.requestId,
    );
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
