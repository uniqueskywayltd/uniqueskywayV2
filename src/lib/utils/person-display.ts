import type { CustomerSummary } from "@/features/customer/types";

export function getPersonFullName(summary: CustomerSummary): string {
  return (
    summary.profile?.displayName ??
    summary.profile?.legalName ??
    summary.user.email
  );
}

/** Platform shows @username; V3 uses account number or email local-part. */
export function getPersonHandle(summary: CustomerSummary): string {
  if (summary.account?.accountNumber) {
    return summary.account.accountNumber;
  }

  const email = summary.user.email;
  const local = email.split("@")[0];
  return local || email;
}

export function getPersonInitials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
