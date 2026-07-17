import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { AppProviders } from "@/components/providers/app-providers";
import { themeInitScript } from "@/components/theme/theme-init-script";
import { brandAssets } from "@/features/brand";
import { legacyArimo } from "@/features/public/legacy/fonts";
import { translate } from "@/i18n";
import { getRequestLanguage } from "@/i18n/request-language";
import { buildPageMetadata } from "@/lib/seo/metadata";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: "Unique Sky Way",
    description:
      "Structured investment with transparent processes, verified accounts, and clear money movement.",
    path: "/",
  }),
  applicationName: "Unique Sky Way",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: brandAssets.favicon, type: "image/webp", sizes: "32x32" },
      { url: brandAssets.icon, type: "image/webp", sizes: "176x176" },
      { url: brandAssets.iconSvg, type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: brandAssets.icon }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const { language, direction } = await getRequestLanguage();

  return (
    <html
      lang={language}
      dir={direction}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${legacyArimo.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans antialiased">
        <AppProviders language={language}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--elevation-2)]"
          >
            {translate(language, "chrome.skip_to_content")}
          </a>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
