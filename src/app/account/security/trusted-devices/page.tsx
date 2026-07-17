import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { TrustedDevicesClient } from "@/features/auth/components/security-management";
import { getRequestLanguage } from "@/i18n/request-language";
import { createTranslator } from "@/i18n/translate";

export default async function TrustedDevicesPage() {
  const { language } = await getRequestLanguage();
  const t = createTranslator(language);

  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title={t("security.trusted_devices")}
          description={t("security.trusted_devices_page_description")}
          icon={MonitorSmartphone}
          accentClassName="bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400"
          barClassName="via-amber-500/70"
          ariaLabel={t("security.trusted_devices_header_aria")}
        />
      </AccountReveal>
      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>
      <AccountReveal delayMs={80}>
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/account/security">{t("security.sessions_back")}</Link>
          </Button>
        </div>
        <TrustedDevicesClient />
      </AccountReveal>
    </div>
  );
}
