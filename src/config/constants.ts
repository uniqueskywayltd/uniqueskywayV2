export const APP_METADATA = {
  displayName: "Unique Sky Way V2",
  packageName: "unique-sky-way-v2",
  version: "2.0.0",
} as const;

export const FINANCIAL_TIME_ZONE = "America/New_York" as const;

export const REQUEST_HEADERS = {
  requestId: "x-request-id",
  idempotencyKey: "idempotency-key",
} as const;

export const DEFAULT_PAGINATION = {
  limit: 25,
  maxLimit: 100,
} as const;
