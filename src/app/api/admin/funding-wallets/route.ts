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

function serializeWallet(row: {
  id: string;
  asset: string;
  network: string;
  address: string;
  qrCodeUrl: string | null;
  instructions: string | null;
  status: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    asset: row.asset,
    network: row.network,
    address: row.address,
    qrCodeUrl: row.qrCodeUrl,
    instructions: row.instructions,
    status: row.status,
    displayOrder: row.displayOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    const deps = await createDeps();
    await requireAdminActor(deps, "deposits.read");
    const wallets = await deps.paymentRepository.listFundingWallets();
    return jsonOk({ wallets: wallets.map(serializeWallet) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const deps = await createDeps();
    const admin = await requireAdminActor(deps, "system.manage");
    const input = await parseJson(request, upsertFundingWalletInputSchema);
    const wallet = await deps.paymentRepository.createFundingWallet({
      asset: input.asset,
      network: input.network,
      address: input.address,
      qrCodeUrl: input.qrCodeUrl ?? null,
      instructions: input.instructions ?? null,
      status: input.status,
      displayOrder: input.displayOrder,
      updatedBy: admin.appUser.id,
    });
    return jsonOk({ wallet: serializeWallet(wallet) }, context.requestId);
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
