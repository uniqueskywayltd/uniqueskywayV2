"use client";

export interface ApiResult<TData> {
  data?: TData;
  error?: string;
  status?: number;
}

export async function getAdminJson<TData>(url: string): Promise<ApiResult<TData>> {
  try {
    const response = await fetch(url, { method: "GET", credentials: "include" });
    const payload = (await response.json()) as {
      data?: TData;
      error?: { message?: string };
    };
    if (!response.ok) {
      return {
        error: payload.error?.message ?? "Request failed.",
        status: response.status,
      };
    }
    return payload.data === undefined ? { status: response.status } : { data: payload.data, status: response.status };
  } catch {
    return { error: "Network unavailable. Check your connection and retry." };
  }
}

export async function mutateAdminJson<TData>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  url: string,
  body?: Record<string, unknown>,
): Promise<ApiResult<TData>> {
  const csrfToken = await getCsrfToken();
  if (!csrfToken) return { error: "Security token could not be created." };

  try {
    const init: RequestInit = {
      method,
      credentials: "include",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": csrfToken,
      },
    };
    if (body) init.body = JSON.stringify(body);
    const response = await fetch(url, init);
    const payload = (await response.json()) as {
      data?: TData;
      error?: { message?: string };
    };
    if (!response.ok) {
      return {
        error: payload.error?.message ?? "Request failed.",
        status: response.status,
      };
    }
    return payload.data === undefined ? { status: response.status } : { data: payload.data, status: response.status };
  } catch {
    return { error: "Network unavailable. Check your connection and retry." };
  }
}

async function getCsrfToken(): Promise<string | null> {
  const response = await fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "include",
  });
  const payload = (await response.json()) as { data?: { csrfToken?: string } };
  return payload.data?.csrfToken ?? null;
}
