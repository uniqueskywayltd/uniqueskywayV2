import type { Metadata } from "next";

import { resolvePublicAppUrl } from "@/config/public-app-url";
import { brandAssets } from "@/features/brand";

const DEFAULT_SITE_NAME = "Unique Sky Way";
const DEFAULT_DESCRIPTION =
  "Structured investment with transparent processes, verified accounts, and clear money movement.";

export function getSiteUrl(): string {
  return resolvePublicAppUrl(process.env.NEXT_PUBLIC_APP_URL);
}

export type PageMetadataInput = {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
  imagePath?: string;
};

export function buildPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  noIndex = false,
  imagePath = brandAssets.ogImage,
}: PageMetadataInput): Metadata {
  const siteUrl = getSiteUrl();
  const url = new URL(path, siteUrl).toString();
  const imageUrl = new URL(imagePath, siteUrl).toString();
  const fullTitle = title === DEFAULT_SITE_NAME ? title : `${title} | ${DEFAULT_SITE_NAME}`;

  return {
    title: fullTitle,
    description,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: DEFAULT_SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: DEFAULT_SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}

export function organizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SITE_NAME,
    url: siteUrl,
    logo: new URL(brandAssets.icon, siteUrl).toString(),
  };
}

export function websiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SITE_NAME,
    url: siteUrl,
  };
}

export function webPageJsonLd({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: new URL(path, siteUrl).toString(),
    isPartOf: {
      "@type": "WebSite",
      name: DEFAULT_SITE_NAME,
      url: siteUrl,
    },
  };
}

export function faqPageJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export const SEO_DEFAULTS = {
  siteName: DEFAULT_SITE_NAME,
  description: DEFAULT_DESCRIPTION,
} as const;
