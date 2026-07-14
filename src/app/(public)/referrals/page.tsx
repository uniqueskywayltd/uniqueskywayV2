import type { Metadata } from "next";
import Link from "next/link";
import { Gift, Share2, Users } from "lucide-react";

import { Button } from "@/components/ui";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { buildPageMetadata, webPageJsonLd } from "@/lib/seo/metadata";
import { JsonLdScript } from "@/lib/seo/structured-data";

const DESCRIPTION =
  "Invite others responsibly and track referral status in your dashboard. Rewards follow certified platform rules — never invented rates.";

export const metadata: Metadata = buildPageMetadata({
  title: "Referral Program",
  description: DESCRIPTION,
  path: "/referrals",
});

const pillars = [
  {
    title: "Share your link",
    description:
      "After you register, your dashboard provides a personal invitation link and short code for people you know.",
    icon: Share2,
  },
  {
    title: "They join and invest",
    description:
      "When someone registers with your invitation and meets certified qualification rules, referral status updates in your account.",
    icon: Users,
  },
  {
    title: "Rewards when earned",
    description:
      "Referral rewards follow the certified ledger and investment rules — never browser math or promised clocks.",
    icon: Gift,
  },
] as const;

const steps = [
  "Create your account and open the Referral hub after email verification.",
  "Copy your invitation link or code and share it privately with people who want to learn more.",
  "Statuses move from registered to qualified to rewarded only when certified rules are met.",
  "Review privacy-safe referral rows and statements in your customer dashboard.",
] as const;

export default function ReferralsPage() {
  return (
    <article>
      <JsonLdScript
        data={webPageJsonLd({
          title: "Referral Program",
          description: DESCRIPTION,
          path: "/referrals",
        })}
      />

      <TrustPageHero
        purpose="Explain responsible referrals"
        eyebrow="Referral Program"
        title="Grow together with clear rules"
        lead="Invite others to Unique Sky Way and track privacy-safe referral status in your dashboard. Rewards only apply when certified conditions are met."
        image="/brand/meeting.webp"
        imageAlt="Referral program"
      />

      <TrustSection title="How referrals work">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-xl border border-border/80 bg-background p-6 text-center shadow-[var(--elevation-1)]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </TrustSection>

      <TrustSection title="Simple process" className="bg-muted/30">
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {index + 1}
              </span>
              <span className="text-foreground">{step}</span>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Button asChild>
            <Link href="/auth/register">Create free account</Link>
          </Button>
        </div>
      </TrustSection>

      <TrustCtaBand
        title="Ready to invite responsibly?"
        support="Register, verify your email, then open Referrals in your account to share your certified invitation link."
        primary={{ label: "Get started", href: "/auth/register" }}
        secondary={{ label: "Learn how it works", href: "/how-it-works" }}
      />
    </article>
  );
}
