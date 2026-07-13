import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { z } from "zod";

import { AppError, isAppError } from "@/application/errors";
import { AUTH_COOKIE_NAMES } from "@/application/auth";
import {
  createCsrfToken,
  createRequestId,
  safeCompare,
  type RequestSecurityContext,
} from "@/application/auth/security";
import { REQUEST_HEADERS } from "@/config/constants";
import { getServerEnv } from "@/config/server-env";

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

  return {
    requestId: request.headers.get(REQUEST_HEADERS.requestId) ?? createRequestId(),
    ipAddress: ipAddress ?? null,
    userAgent: request.headers.get("user-agent"),
    origin: request.headers.get("origin"),
  };
}

export async function createCsrfResponse(requestId: string) {
  const env = getServerEnv();
  const token = createCsrfToken();
  const response = jsonOk({ csrfToken: token }, requestId);

  response.cookies.set(AUTH_COOKIE_NAMES.csrf, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}

export async function requireCsrf(request: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(AUTH_COOKIE_NAMES.csrf)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken || !safeCompare(cookieToken, headerToken)) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Invalid CSRF token.",
    });
  }
}

export function requireSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return;

  const appOrigin = new URL(getServerEnv().NEXT_PUBLIC_APP_URL).origin;
  if (origin !== appOrigin) {
    throw new AppError({
      code: "AUTHORIZATION_ERROR",
      message: "Invalid request origin.",
    });
  }
}

function normalizeError(error: unknown): AppError {
  if (isAppError(error)) return error;

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
