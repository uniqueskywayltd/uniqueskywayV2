import Link from "next/link";
import { Wrench } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button } from "@/components/ui";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function MaintenancePage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <BrandMark surface="theme" width={140} className="mb-8 [&_img]:max-h-9" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
        <Wrench className="h-7 w-7 text-foreground" aria-hidden />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">
        {t("system.maintenance_title")}
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t("system.maintenance_body")}</p>
      <Button asChild variant="outline" className="mt-8">
        <Link href="/auth/login">{t("chrome.sign_in")}</Link>
      </Button>
    </main>
  );
}
