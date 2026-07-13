"use client";

export interface ApiResult<TData> {
  data?: TData;
  error?: string;
}

export async function postAuthJson<TData>(
  url: string,
  body: Record<string, unknown>,
): Promise<ApiResult<TData>> {
  const csrfResponse = await fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "include",
  });
  const csrfPayload = (await csrfResponse.json()) as { data?: { csrfToken?: string } };
  const csrfToken = csrfPayload.data?.csrfToken;

  if (!csrfToken) {
    return { error: "Security token could not be created." };
  }

  const response = await fetch(url, {
    method: "POST",
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

export async function getAuthJson<TData>(url: string): Promise<ApiResult<TData>> {
  const response = await fetch(url, {
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
