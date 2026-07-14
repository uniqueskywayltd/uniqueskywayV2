import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import {
  card,
  marketingOutlineBtn,
} from "@/features/public/components/marketing-ui";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Diversified investment services across banking, real estate, global markets, and advisory — with transparent processes.";

export const metadata: Metadata = buildPageMetadata({
  title: "Services",
  description: DESCRIPTION,
  path: "/services",
});

const services = [
  {
    image: "/brand/banking.webp",
    alt: "Banking and financial services",
    title: "Banking & Finance",
    description:
      "Clear financial reporting and structured investment products for informed decision-making.",
    tag: "Core",
  },
  {
    image: "/brand/real-estate.webp",
    alt: "Real estate investments",
    title: "Real Estate",
    description:
      "Diversified exposure to property and development projects with long-term growth potential.",
    tag: "Assets",
  },
  {
    image: "/brand/global-markets.webp",
    alt: "Global market access",
    title: "Global Markets",
    description:
      "Access to commodities and international opportunities through our global network.",
    tag: "Global",
  },
  {
    image: "/brand/advisory.webp",
    alt: "Financial advisory",
    title: "Advisory Services",
    description:
      "Personalized guidance to align your portfolio with your financial goals and risk tolerance.",
    tag: "Advisory",
  },
] as const;

export default function ServicesPage() {
  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Services",
          description: DESCRIPTION,
          path: "/services",
        })}
      />

      <TrustPageHero
        purpose="Explain investment service areas"
        eyebrow="Services"
        title="Diversified investment services"
        lead="We get to know you, build a custom plan, and put your capital to work across multiple asset classes — with transparency at every step."
        image="/brand/corporate.webp"
        imageAlt="Investment services"
      />

      <TrustSection title="What we offer" className="bg-muted/20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((item) => (
            <div key={item.title} className={cn(card.base, "flex flex-col overflow-hidden text-foreground")}>
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <span className="absolute top-3 left-3 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase">
                  {item.tag}
                </span>
              </div>
              <div className={card.padding}>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/plans">
              View investment plans
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Link href="/how-it-works" className={marketingOutlineBtn()}>
            How it works
          </Link>
        </div>
      </TrustSection>

      <TrustCtaBand
        title="Ready to explore structured investing?"
        support="Create an account to access your dashboard, wallet, and certified investment catalog when published."
        primary={{ label: "Create account", href: "/auth/register" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </article>
  );
}
