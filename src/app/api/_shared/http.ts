import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

import { AppError, isAppError } from "@/application/errors";
import {
  createCsrfToken,
  createRequestId,
  safeCompare,
  type RequestSecurityContext,
} from "@/application/auth/security";
import { REQUEST_HEADERS } from "@/config/constants";
import { logger } from "@/infrastructure/logging/logger";

import { csrfCookieNames, resolveCsrfCookie } from "./csrf-cookie";

export interface ApiSuccess<TData> {
  data: TData;
  requestId: string;
}

export interface ApiFailure {
  error: {
    code: string;
    message: string;
    requestId: string;
    details: Record<string, unknown>;
  };
}

export function jsonOk<TData>(data: TData, requestId: string, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<TData>>(
    { data, requestId },
    {
      ...init,
      headers: {
        [REQUEST_HEADERS.requestId]: requestId,
        ...(init?.headers ?? {}),
      },
    },
  );
}

export function jsonError(error: unknown, requestId: string, init?: ResponseInit) {
  const appError = normalizeError(error);
  const status = statusForError(appError);

  return NextResponse.json<ApiFailure>(
    {
      error: {
        code: appError.code,
        message: appError.message,
        requestId,
        details: appError.details,
      },
    },
    {
      status,
      ...init,
      headers: {
        [REQUEST_HEADERS.requestId]: requestId,
        ...(appError.details.retryAfterSeconds
          ? { "Retry-After": String(appError.details.retryAfterSeconds) }
          : {}),
        ...(init?.headers ?? {}),
      },
    },
  );
}

export async function parseJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  const body = (await request.json().catch(() => null)) as unknown;
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new AppError({
      code: "VALIDATION_ERROR",
      message: "Request validation failed.",
      details: { issues: result.error.flatten() },
    });
  }

  return result.data;
}

export function createRequestContext(request: NextRequest): RequestSecurityContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const approximateLocation =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code");

  return {
    requestId: request.headers.get(REQUEST_HEADERS.requestId) ?? createRequestId(),
    ipAddress: ipAddress ?? null,
    userAgent: request.headers.get("user-agent"),
    origin: request.headers.get("origin"),
    approximateLocation:
      approximateLocation && approximateLocation !== "XX" ? approximateLocation : null,
  };
}

export async function createCsrfResponse(requestId: string) {
  const token = createCsrfToken();
  const response = jsonOk({ csrfToken: token }, requestId);
  const cookie = resolveCsrfCookie();

  // Cookie flags only — avoid full getServerEnv() so guest chrome (locale) keeps working
  // when optional service credentials are absent in local review.
  response.cookies.set(cookie.name, token, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
  });

  // Clear the alternate CSRF cookie name so double-cookie mismatches cannot linger.
  for (const name of csrfCookieNames()) {
    if (name !== cookie.name) {
      response.cookies.set(name, "", {
        httpOnly: true,
        secure: name.startsWith("__Host-"),
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
    }
  }

  return response;
}

export async function requireCsrf(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = csrfCookieNames()
    .map((name) => cookieStore.get(name)?.value)
    .find((value): value is string => Boolean(value));
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Invalid CSRF token.",
    });
  }
}

/**
 * Reject cross-site browser requests.
 *
 * Allows:
 * - NEXT_PUBLIC_APP_URL (canonical production origin)
 * - VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL (platform aliases)
 * - The Host/X-Forwarded-Host serving this request (true same-origin on Vercel aliases)
 * - ALLOWED_ORIGINS (comma-separated absolute URLs)
 */
export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const allowed = collectAllowedOrigins(request);
  if (allowed.size === 0) return;

  if (!allowed.has(origin)) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Invalid request origin.",
    });
  }
}

function collectAllowedOrigins(request: NextRequest): Set<string> {
  const allowed = new Set<string>();

  const add = (value?: string | null) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      allowed.add(new URL(trimmed).origin);
      return;
    } catch {
      // Host-only values (e.g. VERCEL_URL) need a scheme.
    }
    try {
      allowed.add(new URL(`https://${trimmed}`).origin);
    } catch {
      // Ignore malformed entries.
    }
  };

  add(process.env.NEXT_PUBLIC_APP_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host");
  if (host) {
    add(`https://${host}`);
  }

  for (const extra of (process.env.ALLOWED_ORIGINS ?? "").split(",")) {
    add(extra);
  }

  return allowed;
}

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

  logger.error(
    {
      event: "api.unexpected_error",
      cause: error instanceof Error ? error.message : String(error),
      err: error,
    },
    "Unhandled API error",
  );

  return new AppError({
    code: "INTERNAL_ERROR",
    message: "Unexpected server error.",
    cause: error,
  });
}

function statusForError(error: AppError) {
  switch (error.code) {
    case "VALIDATION_ERROR":
      return 400;
    case "AUTHENTICATION_ERROR":
      return 401;
    case "AUTHORIZATION_ERROR":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
    case "INVALID_STATE":
    case "IDEMPOTENCY_ERROR":
      return 409;
    case "RATE_LIMITED":
      return 429;
    default:
      return 500;
  }
}
