import Link from "next/link";
import { LifeBuoy } from "lucide-react";

import { Button } from "@/components/ui";
import { AccountWelcomeHero } from "@/features/customer/account/account-welcome-hero";
import { CommunicationsReveal } from "@/features/customer/communications/communications-motion";
import { CommunicationsSurfaceNav } from "@/features/customer/communications/communications-surface-nav";
import { SupportRequestForm } from "@/features/customer/components/support-request-form";

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 sm:space-y-9">
      <CommunicationsReveal>
        <AccountWelcomeHero
          title="Support request"
          description="What do I need to know right now? Tell us what you need — status updates still appear in Notifications."
          icon={LifeBuoy}
          accentClassName="bg-emerald-500/10 text-emerald-800 ring-emerald-500/20 dark:text-emerald-400"
          barClassName="via-emerald-500/70"
          ariaLabel="Support request header"
        />
      </CommunicationsReveal>
      <CommunicationsReveal delayMs={40}>
        <CommunicationsSurfaceNav />
      </CommunicationsReveal>
      <CommunicationsReveal delayMs={60}>
        <Button asChild variant="outline" size="sm">
          <Link href="/account/help">Back to Help Center</Link>
        </Button>
      </CommunicationsReveal>
      <CommunicationsReveal delayMs={80}>
        <SupportRequestForm />
      </CommunicationsReveal>
    </div>
  );
}
