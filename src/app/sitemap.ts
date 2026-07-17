import type { MetadataRoute } from "next";

/** Sitemap intentionally empty — site is link-shared only, not search-indexed. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [];
}
