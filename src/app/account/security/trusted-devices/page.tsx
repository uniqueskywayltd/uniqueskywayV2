import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { TrustedDevicesClient } from "@/features/auth/components/security-management";

export default function TrustedDevicesPage() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Trusted devices"
          description="What do I control about my account? Browsers trusted for this account — revoke any you do not recognize."
          icon={MonitorSmartphone}
          accentClassName="bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400"
          barClassName="via-amber-500/70"
          ariaLabel="Trusted devices header"
        />
      </AccountReveal>
      <AccountReveal delayMs={40}>
        <AccountSurfaceNav />
      </AccountReveal>
      <AccountReveal delayMs={80}>
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/account/security">Back to security</Link>
          </Button>
        </div>
        <TrustedDevicesClient />
      </AccountReveal>
    </div>
  );
}
