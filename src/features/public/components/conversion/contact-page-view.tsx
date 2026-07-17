"use client";

import { ContactForm } from "@/features/public/components/conversion/contact-form";
import {
  TrustCtaBand,
  TrustPageHero,
  TrustSection,
} from "@/features/public/components/trust/trust-page";
import { useI18n } from "@/features/i18n/i18n-provider";

export function ContactPageView() {
  const { t } = useI18n();

  return (
    <>
      <TrustPageHero
        purpose={t("contact.purpose")}
        eyebrow={t("contact.hero.eyebrow")}
        title={t("contact.hero.title")}
        lead={t("contact.hero.lead")}
        image="/brand/contact.webp"
        imageAlt={t("contact.image_alt")}
        align="center"
      />

      <TrustSection title={t("contact.form.title")}>
        <ContactForm />
      </TrustSection>

      <TrustSection title={t("contact.expectations.title")} className="bg-muted/30">
        <p className="text-muted-foreground">{t("contact.expectations.hours")}</p>
        <p className="text-muted-foreground">{t("contact.expectations.response")}</p>
        <p className="text-muted-foreground">{t("contact.expectations.topics")}</p>
      </TrustSection>

      <TrustCtaBand
        title={t("contact.cta.title")}
        support={t("contact.cta.support")}
        primary={{ label: t("contact.cta.faq"), href: "/faq" }}
        secondary={{ label: t("contact.cta.get_started"), href: "/auth/register" }}
      />
    </>
  );
}
