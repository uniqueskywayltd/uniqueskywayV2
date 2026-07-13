import type { Metadata } from "next";

import { HomepageView } from "@/features/public/components/homepage/homepage-view";
import { buildPageMetadata, SEO_DEFAULTS } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: SEO_DEFAULTS.siteName,
  description: SEO_DEFAULTS.description,
  path: "/",
});

/**
 * Sprint A2 — Homepage only (flagship public experience).
 * Full page routes for About / Plans / FAQ / etc. remain later sprints.
 */
export default function HomePage() {
  return <HomepageView />;
}
