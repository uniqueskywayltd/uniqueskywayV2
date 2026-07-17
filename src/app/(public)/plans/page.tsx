import type { Metadata } from "next";

import { PlansPageView } from "@/features/public/components/conversion/plans-page-view";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const PLANS_DESCRIPTION =
  "From entry-level Silver to premium Master plans — each designed with clear terms, transparent returns, and professional management.";

export const metadata: Metadata = buildPageMetadata({
  title: "Investment Plans",
  description: PLANS_DESCRIPTION,
  path: "/plans",
});

export default function PlansPage() {
  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Investment Plans",
          description: PLANS_DESCRIPTION,
          path: "/plans",
        })}
      />
      <PlansPageView />
    </article>
  );
}
