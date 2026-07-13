import { SEO_DEFAULTS, getSiteUrl, organizationJsonLd, websiteJsonLd } from "@/lib/seo/metadata";

export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function DefaultStructuredData() {
  return (
    <>
      <JsonLdScript data={organizationJsonLd()} />
      <JsonLdScript data={websiteJsonLd()} />
    </>
  );
}

export { SEO_DEFAULTS, getSiteUrl };
