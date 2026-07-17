import { SEO_DEFAULTS, getSiteUrl } from "@/lib/seo/metadata";

/** Structured data disabled — avoids search-engine discovery signals. */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  void data;
  return null;
}

export function DefaultStructuredData() {
  return null;
}

export { SEO_DEFAULTS, getSiteUrl };
