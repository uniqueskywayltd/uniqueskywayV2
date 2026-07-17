import type { MetadataRoute } from "next";

/** Private platform — do not expose crawl targets to search engines. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
