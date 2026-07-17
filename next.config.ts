import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import type { NextConfig } from "next";

import { buildContentSecurityPolicy } from "./src/config/content-security-policy";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";

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
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive, nosnippet, noimageindex",
  },
  ...(isProduction
    ? [
        {
          key: "Content-Security-Policy",
          value: buildContentSecurityPolicy(),
        },
      ]
    : [
        {
          key: "Content-Security-Policy-Report-Only",
          value: buildContentSecurityPolicy({ allowLocalhost: true }),
        },
      ]),
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
  async redirects() {
    const canonical = "https://uniqueskyway.com";
    const legacyHosts = [
      "uniqueskyway-v2.vercel.app",
      "uniqueskyway-v2-unique-sky-way.vercel.app",
      "www.uniqueskyway.com",
    ];
    return legacyHosts.map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${canonical}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
