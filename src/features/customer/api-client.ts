"use client";

import { appPath } from "@/lib/app-path";

export interface ApiResult<TData> {
  data?: TData;
  error?: string;
}

export async function getCustomerJson<TData>(url: string): Promise<ApiResult<TData>> {
  const response = await fetch(appPath(url), {
    method: "GET",
    credentials: "include",
  });
  const payload = (await response.json()) as {
    data?: TData;
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: payload.error?.message ?? "Request failed." };
  }

  return payload.data === undefined ? {} : { data: payload.data };
}

export async function patchCustomerJson<TData>(
  url: string,
  body: Record<string, unknown>,
): Promise<ApiResult<TData>> {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return { error: "Security token could not be created." };

  const response = await fetch(appPath(url), {
    method: "PATCH",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    data?: TData;
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: payload.error?.message ?? "Request failed." };
  }

  return payload.data === undefined ? {} : { data: payload.data };
}

export async function postCustomerJson<TData>(
  url: string,
  body: Record<string, unknown>,
  options?: { idempotencyKey?: string },
): Promise<ApiResult<TData>> {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return { error: "Security token could not be created." };

  const response = await fetch(appPath(url), {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
      ...(options?.idempotencyKey ? { "idempotency-key": options.idempotencyKey } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as {
    data?: TData;
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: payload.error?.message ?? "Request failed." };
  }

  return payload.data === undefined ? {} : { data: payload.data };
}

export async function postCustomerForm<TData>(
  url: string,
  body: FormData,
): Promise<ApiResult<TData>> {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return { error: "Security token could not be created." };

  const response = await fetch(appPath(url), {
    method: "POST",
    credentials: "include",
    headers: {
      "x-csrf-token": csrfToken,
    },
    body,
  });
  const payload = (await response.json()) as {
    data?: TData;
    error?: { message?: string };
  };

  if (!response.ok) {
    return { error: payload.error?.message ?? "Request failed." };
  }

  return payload.data === undefined ? {} : { data: payload.data };
}

async function getCsrfToken(): Promise<string | null> {
  const response = await fetch(appPath("/api/auth/csrf"), {
    method: "GET",
    credentials: "include",
  });
  const payload = (await response.json()) as { data?: { csrfToken?: string } };
  return payload.data?.csrfToken ?? null;
}
