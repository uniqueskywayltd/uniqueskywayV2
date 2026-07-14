import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** Subdirectory deploy at https://uniqueskyway.com/v2 — omit locally. */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const staticAssetCacheHeaders = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {
    root: projectRoot,
  },
  ...(basePath ? { basePath } : {}),
  /** cPanel / self-hosted Node — set NEXT_OUTPUT_STANDALONE=1 for deploy builds. */
  ...(process.env.NEXT_OUTPUT_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  /** Shared hosting: avoid sharp/image optimizer memory spikes. */
  ...(process.env.NEXT_CPANEL === "1" ? { images: { unoptimized: true } } : {}),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/brand/:path*",
        headers: staticAssetCacheHeaders,
      },
      {
        source: "/_next/static/:path*",
        headers: staticAssetCacheHeaders,
      },
    ];
  },
};

export default nextConfig;
