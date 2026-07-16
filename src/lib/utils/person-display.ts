import type { CustomerSummary } from "@/features/customer/types";

/**
 * Customer display name: legal/full name first.
 * `customer_profiles.display_name` stores the username (registration uniqueness),
 * not the person's real name — never prefer it over legalName for greetings.
 */
export function getPersonFullName(summary: CustomerSummary): string {
  const legalName = summary.profile?.legalName?.trim();
  if (legalName) return legalName;

  const displayName = summary.profile?.displayName?.trim();
  if (displayName) return displayName;

  return summary.user.email;
}

/**
 * Public @username handle from `customer_profiles.display_name`.
 * Never use account numbers / customer IDs as the username.
 */
export function getPersonHandle(summary: CustomerSummary): string {
  const username = summary.profile?.displayName?.trim();
  if (username) {
    return username.startsWith("@") ? username.slice(1) : username;
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
