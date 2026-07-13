import { describe, expect, it } from "vitest";

import { buildPageMetadata, getSiteUrl, organizationJsonLd } from "@/lib/seo/metadata";

describe("seo metadata helpers", () => {
  it("builds canonical open graph and twitter metadata", () => {
    const metadata = buildPageMetadata({
      title: "Plans",
      description: "Compare investment plans.",
      path: "/plans",
    });

    expect(metadata.alternates?.canonical).toContain("/plans");
    expect(metadata.openGraph?.url).toContain("/plans");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(String(metadata.title)).toContain("Unique Sky Way");
  });

  it("returns an organization json-ld document", () => {
    const jsonLd = organizationJsonLd();
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.url).toBe(getSiteUrl());
  });
});
