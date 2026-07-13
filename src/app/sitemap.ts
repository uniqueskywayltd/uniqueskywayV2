import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/seo/metadata";

/**
 * Sitemap framework for Wave A.
 * Sprint A2+ pages are added as they ship — A1 only lists live public surfaces.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const paths = [
    "/",
    "/about",
    "/how-it-works",
    "/security",
    "/plans",
    "/faq",
    "/contact",
    "/legal/privacy",
    "/legal/terms",
    "/legal/risk",
    "/legal/aml",
    "/legal/kyc",
    "/legal/cookies",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/maintenance",
    "/offline",
  ];

  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
