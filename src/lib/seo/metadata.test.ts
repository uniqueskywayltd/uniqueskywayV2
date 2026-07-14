import { describe, expect, it } from "vitest";

import {
  buildPageMetadata,
  faqPageJsonLd,
  getSiteUrl,
  organizationJsonLd,
  webPageJsonLd,
} from "@/lib/seo/metadata";

describe("seo metadata helpers", () => {
  it("preserves subdirectory site path for /v2 production deploys", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = "https://uniqueskyway.com/v2";
    expect(getSiteUrl()).toBe("https://uniqueskyway.com/v2");
    process.env.NEXT_PUBLIC_APP_URL = previous;
  });

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

  it("returns a web page json-ld document", () => {
    const jsonLd = webPageJsonLd({
      title: "About",
      description: "Company credibility.",
      path: "/about",
    });
    expect(jsonLd["@type"]).toBe("WebPage");
    expect(jsonLd.url).toContain("/about");
  });

  it("returns an FAQ page json-ld document", () => {
    const jsonLd = faqPageJsonLd([
      { question: "Are returns guaranteed?", answer: "No." },
    ]);
    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(1);
  });
});
