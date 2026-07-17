"use client";

import Link from "next/link";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import type { MessageKey } from "@/i18n/messages/en";

export function WalletBackLink({
  href = "/wallet",
  labelKey = "wallet.back_to_wallet",
}: {
  href?: string;
  labelKey?: MessageKey;
}) {
  const { t } = useI18n();
  return (
    <Button asChild variant="outline">
      <Link href={href}>{t(labelKey)}</Link>
    </Button>
  );
}
