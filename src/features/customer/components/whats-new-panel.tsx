import Link from "next/link";

import { Button } from "@/components/ui";
import { WHATS_NEW_ITEMS } from "@/application/customer/communication-presentation";

export function WhatsNewPanel() {
  return (
    <div className="space-y-4">
      <p className="sr-only">Primary question: Did the platform improve recently?</p>
      <ul className="space-y-3">
        {WHATS_NEW_ITEMS.map((item) => (
          <li key={item.id} className="rounded-xl border border-border/80 p-5">
            <p className="text-xs text-muted-foreground">{item.date}</p>
            <h2 className="mt-1 text-base font-semibold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
            <Button asChild variant="link" className="mt-2 h-auto px-0">
              <Link href={item.href}>Open</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
