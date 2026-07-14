import Link from "next/link";
import { MonitorSmartphone } from "lucide-react";

import { Button } from "@/components/ui";
import { AccountReveal } from "@/features/customer/account/account-motion";
import { AccountSurfaceNav } from "@/features/customer/account/account-surface-nav";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { SessionsClient } from "@/features/auth/components/security-management";

export default function SessionsPage() {
  return (
    <div className="space-y-8 sm:space-y-9">
      <AccountReveal>
        <AccountWelcomeHero
          title="Sessions"
          description="What do I control about my account? Active authentication sessions — revoke when needed."
          icon={MonitorSmartphone}
          accentClassName="bg-amber-500/10 text-amber-800 ring-amber-500/20 dark:text-amber-400"
          barClassName="via-amber-500/70"
          ariaLabel="Sessions header"
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
        <SessionsClient />
      </AccountReveal>
    </div>
  );
}
