/**
 * Prefix absolute app paths for subdirectory deploys (`NEXT_PUBLIC_BASE_PATH=/v2`).
 * Next.js does not rewrite bare `fetch("/api/...")` URLs.
 */
export function appPath(path: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!base) return normalized;
  return `${base}${normalized}`;
}
