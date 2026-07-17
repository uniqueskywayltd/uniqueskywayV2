/** Plain-English presentation helpers for admin UI (display only). */

export { formatUsdFromMinor } from "@/lib/money-format";

export function formatAdminDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function humanizeStatus(status: string | null | undefined): string {
  const value = (status ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    pending: "Awaiting Review",
    created: "Draft",
    confirmed: "Approved",
    failed: "Failed",
    cancelled: "Rejected",
    reversed: "Reversed",
    under_review: "Under Review",
    approved: "Approved",
    paid: "Completed",
    rejected: "Rejected",
    active: "Active",
    pending_activation: "Pending Activation",
    maturing: "Maturing",
    matured: "Matured",
    cancelled_early: "Stopped Early",
  };
  if (map[value]) return map[value];
  if (!value) return "Unknown";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function statusTone(
  status: string | null | undefined,
): "warning" | "success" | "danger" | "neutral" {
  const value = (status ?? "").trim().toLowerCase();
  if (["pending", "created", "under_review", "pending_activation", "maturing"].includes(value)) {
    return "warning";
  }
  if (["confirmed", "approved", "paid", "active", "matured"].includes(value)) {
    return "success";
  }
  if (["failed", "cancelled", "rejected", "reversed", "cancelled_early"].includes(value)) {
    return "danger";
  }
  return "neutral";
}

export function statusEmoji(status: string | null | undefined): string {
  const tone = statusTone(status);
  if (tone === "warning") return "🟡";
  if (tone === "success") return "🟢";
  if (tone === "danger") return "🔴";
  return "⚪";
}

export function fundingMethodLabel(provider: string | null | undefined): string {
  const value = (provider ?? "").toLowerCase();
  if (value === "manual") return "Manual Crypto Deposit";
  if (!value) return "Deposit";
  return value
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function readMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  key: string,
): string | null {
  if (!metadata) return null;
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export { friendlyClientError, FRIENDLY_REQUEST_ERROR } from "@/lib/friendly-error";
