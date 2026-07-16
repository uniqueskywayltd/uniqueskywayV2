import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { requireAdminActor } from "@/application/admin/require-admin";
import { AppError } from "@/application/errors";
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
import { SupabaseObjectStorage } from "@/infrastructure/storage";

export const runtime = "nodejs";

const QR_BUCKET = "funding-wallet-qrs";
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

async function createDeps() {
  const { db } = getDatabaseConnection();
  const adminClient = createSupabaseAdminAuthClient();
  return {
    identityProvider: new SupabaseIdentityProvider(adminClient, await createSupabaseRouteClient()),
    identityRepository: new IdentityRepository(db),
    coreRepository: new CoreRepository(db),
    paymentRepository: new PaymentRepository(db),
    transactionManager: new DrizzleTransactionManager(db),
    objectStorage: new SupabaseObjectStorage(adminClient),
  };
}

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);
    const deps = await createDeps();
    const admin = await requireAdminActor(deps, "system.manage");

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError({ code: "VALIDATION_ERROR", message: "QR image file is required." });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "QR image must be PNG, JPEG, WebP, or GIF.",
      });
    }
    if (file.size > 2_000_000) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "QR image must be 2MB or smaller.",
      });
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const path = `wallets/${admin.appUser.id}/${crypto.randomUUID()}.${extension}`;
    const stored = await deps.objectStorage.upload({
      bucket: QR_BUCKET,
      path,
      body: await file.arrayBuffer(),
      contentType: file.type,
      upsert: true,
    });

    if (!stored.publicUrl) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "QR upload succeeded but public URL was not returned.",
      });
    }

    return jsonOk({ url: stored.publicUrl }, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
