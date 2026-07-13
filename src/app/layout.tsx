import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";

import { DefaultStructuredData } from "@/lib/seo/structured-data";
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
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/brand/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/icon.svg" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[var(--z-toast)] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:shadow-[var(--elevation-2)]"
        >
          Skip to main content
        </a>
        <DefaultStructuredData />
        {children}
      </body>
    </html>
  );
}
