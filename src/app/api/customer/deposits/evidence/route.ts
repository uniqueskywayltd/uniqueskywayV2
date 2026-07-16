import type { NextRequest } from "next/server";

import {
  createRequestContext,
  jsonError,
  jsonOk,
  requireCsrf,
  requireSameOrigin,
} from "@/app/api/_shared/http";
import { AppError } from "@/application/errors";
import { IdentityRepository, getDatabaseConnection } from "@/infrastructure/database";
import {
  SupabaseIdentityProvider,
  createSupabaseAdminAuthClient,
  createSupabaseRouteClient,
} from "@/infrastructure/auth";
import { SupabaseObjectStorage } from "@/infrastructure/storage";

export const runtime = "nodejs";

const EVIDENCE_BUCKET = "deposit-evidence";
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  try {
    requireSameOrigin(request);
    await requireCsrf(request);

    const adminClient = createSupabaseAdminAuthClient();
    const identityProvider = new SupabaseIdentityProvider(
      adminClient,
      await createSupabaseRouteClient(),
    );
    const current = await identityProvider.getCurrentUser();
    if (!current) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "Authentication required." });
    }

    const { db } = getDatabaseConnection();
    const appUser = await new IdentityRepository(db).findUserByAuthUserId(current.authUserId);
    if (!appUser) {
      throw new AppError({ code: "AUTHENTICATION_ERROR", message: "User profile was not found." });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Screenshot file is required.",
      });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Screenshot must be PNG, JPEG, WebP, or GIF.",
      });
    }
    if (file.size > 3_000_000) {
      throw new AppError({
        code: "VALIDATION_ERROR",
        message: "Screenshot must be 3MB or smaller.",
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
    const path = `deposits/${appUser.id}/${crypto.randomUUID()}.${extension}`;
    const stored = await new SupabaseObjectStorage(adminClient).upload({
      bucket: EVIDENCE_BUCKET,
      path,
      body: await file.arrayBuffer(),
      contentType: file.type,
      upsert: true,
    });

    if (!stored.publicUrl) {
      throw new AppError({
        code: "PROVIDER_ERROR",
        message: "Screenshot upload succeeded but public URL was not returned.",
      });
    }

    return jsonOk({ url: stored.publicUrl }, context.requestId, { status: 201 });
  } catch (error) {
    return jsonError(error, context.requestId);
  }
}
