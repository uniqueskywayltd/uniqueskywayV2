export function extractFirstName(
  legalName: string | null | undefined,
  displayName: string | null | undefined,
): string | null {
  const source = (legalName ?? displayName ?? "").trim();
  if (!source) return null;
  const token = source.split(/\s+/)[0]?.replace(/[^A-Za-zÀ-ÿ'-]/g, "") ?? "";
  if (token.length < 2) return null;
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

export function formatLocation(
  stateRegion: string | null | undefined,
  countryCode: string | null | undefined,
): string | null {
  const region = stateRegion?.trim();
  const country = countryDisplayName(countryCode);
  if (region && country) return `${region}, ${country}`;
  if (country) return country;
  return null;
}

function countryDisplayName(countryCode: string | null | undefined): string | null {
  const code = countryCode?.trim().toUpperCase();
  if (!code || code.length !== 2) return null;
  try {
    const name = new Intl.DisplayNames(["en"], { type: "region" }).of(code);
    if (!name || name === code || name.toLowerCase().includes("unknown")) return null;
    return name;
  } catch {
    return null;
  }
}

export function formatRelativeTime(occurredAt: string, nowMs = Date.now()): string {
  const deltaMs = Math.max(0, nowMs - Date.parse(occurredAt));
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 48) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = items[i]!;
    items[i] = items[j]!;
    items[j] = current;
  }
  return items;
}
