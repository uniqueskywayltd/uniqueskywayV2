function parseOrigin(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

function joinDirective(name: string, sources: Array<string | null | undefined>): string {
  const values = sources.filter((source): source is string => Boolean(source));
  return `${name} ${values.join(" ")}`;
}

export type ContentSecurityPolicyOptions = {
  supabaseUrl?: string;
  /** Include localhost origins for `next dev`. */
  allowLocalhost?: boolean;
};

/**
 * Production CSP aligned with current client integrations:
 * Supabase Auth/API, Smartsupp chat, self-hosted Next assets, and first-party API routes.
 */
export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions = {}): string {
  const supabaseOrigin = parseOrigin(options.supabaseUrl ?? process.env.NEXT_PUBLIC_SUPABASE_URL);
  const localhostConnect = options.allowLocalhost
    ? ["http://localhost:*", "http://127.0.0.1:*", "ws://localhost:*", "ws://127.0.0.1:*"]
    : [];

  const directives = [
    joinDirective("default-src", ["'self'"]),
    joinDirective("base-uri", ["'self'"]),
    joinDirective("object-src", ["'none'"]),
    joinDirective("frame-ancestors", ["'self'"]),
    joinDirective("form-action", ["'self'"]),
    joinDirective("script-src", [
      "'self'",
      "'unsafe-inline'",
      "https://www.smartsuppchat.com",
      "https://*.smartsupp.com",
    ]),
    joinDirective("style-src", ["'self'", "'unsafe-inline'"]),
    joinDirective("font-src", ["'self'", "data:"]),
    joinDirective("img-src", [
      "'self'",
      "data:",
      "blob:",
      supabaseOrigin,
      "https://*.supabase.co",
      "https://uniqueskyway.com",
      "https://*.smartsupp.com",
    ]),
    joinDirective("connect-src", [
      "'self'",
      supabaseOrigin,
      "https://*.supabase.co",
      "wss://*.supabase.co",
      "https://www.smartsuppchat.com",
      "https://*.smartsupp.com",
      "wss://*.smartsupp.com",
      ...localhostConnect,
    ]),
    joinDirective("frame-src", [
      "'self'",
      "https://www.smartsuppchat.com",
      "https://*.smartsupp.com",
    ]),
    joinDirective("worker-src", ["'self'", "blob:"]),
    joinDirective("manifest-src", ["'self'"]),
    "upgrade-insecure-requests",
  ];

  return directives.join("; ");
}
