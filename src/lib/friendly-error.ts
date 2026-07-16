/** User-facing error copy — never expose stacks, SQL, or internal jargon. */

export const FRIENDLY_REQUEST_ERROR =
  "We couldn't complete your request. Please try again. If the problem continues, contact support.";

export function friendlyClientError(message: string | null | undefined): string {
  const raw = (message ?? "").trim();
  if (!raw) return FRIENDLY_REQUEST_ERROR;

  const lower = raw.toLowerCase();
  if (
    lower.includes("unexpected") ||
    lower.includes("internal") ||
    lower.includes("stack") ||
    lower.includes("sql") ||
    lower.includes("prisma") ||
    lower.includes("drizzle") ||
    lower.includes("econn") ||
    lower.includes("timeout") ||
    lower.includes("unable to complete this request") ||
    lower === "request failed." ||
    lower === "request failed"
  ) {
    return FRIENDLY_REQUEST_ERROR;
  }

  return raw;
}
