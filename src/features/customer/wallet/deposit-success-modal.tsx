"use client";

import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";
import { useI18n } from "@/features/i18n/i18n-provider";
import { cn } from "@/lib/utils";

export type DepositSuccessSummary = {
  firstName: string;
  amountLabel: string;
  currency: string;
  network: string;
  reference: string;
  submittedAtLabel: string;
};

type DepositSuccessModalProps = {
  open: boolean;
  summary: DepositSuccessSummary | null;
  onConfirm: () => void;
};

export function DepositSuccessModal({ open, summary, onConfirm }: DepositSuccessModalProps) {
  const { t } = useI18n();
  const okButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      okButtonRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onConfirm();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[var(--z-overlay)] bg-black/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "motion-reduce:animate-none",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-[var(--z-modal)] max-h-[min(90vh,40rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            "rounded-2xl border border-border/80 bg-card p-6 text-card-foreground shadow-[var(--elevation-3)] ring-1 ring-foreground/10",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "motion-reduce:animate-none motion-reduce:data-[state=open]:zoom-in-100 motion-reduce:data-[state=closed]:zoom-out-100",
          )}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            okButtonRef.current?.focus();
          }}
          aria-describedby={undefined}
        >
          {summary ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl"
                  aria-hidden="true"
                >
                  ✅
                </div>
                <DialogPrimitive.Title className="text-xl font-semibold tracking-tight text-foreground">
                  {t("wallet.deposit_success_title")}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                  {t("wallet.deposit_success_thanks", { name: summary.firstName })}
                  <br />
                  {t("wallet.deposit_success_body")}
                </DialogPrimitive.Description>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {t("wallet.deposit_summary")}
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <SummaryRow label={t("wallet.amount")} value={summary.amountLabel} emphasize />
                  <SummaryRow label={t("ui.currency")} value={summary.currency} />
                  <SummaryRow label={t("wallet.network")} value={summary.network} />
                  <SummaryRow label={t("wallet.reference")} value={summary.reference} mono />
                  <SummaryRow label={t("wallet.submitted")} value={summary.submittedAtLabel} />
                </dl>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {t("wallet.what_happens_next")}
                </p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>{t("wallet.deposit_success_next_1")}</li>
                  <li>{t("wallet.deposit_success_next_2")}</li>
                  <li>{t("wallet.deposit_success_next_3")}</li>
                  <li>{t("wallet.deposit_success_next_4")}</li>
                  <li>{t("wallet.deposit_success_next_5")}</li>
                </ul>
              </div>

              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <span aria-hidden="true">🟡</span>
                  {t("wallet.awaiting_review")}
                </span>
              </div>

              <div className="space-y-3 pt-1">
                <Button
                  ref={okButtonRef}
                  type="button"
                  className="w-full"
                  onClick={onConfirm}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onConfirm();
                    }
                  }}
                >
                  {t("ui.ok")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {t("wallet.need_assistance")}{" "}
                  <Link
                    href="/account/help/support"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    {t("wallet.contact_support")}
                  </Link>
                </p>
              </div>
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function SummaryRow({
  label,
  value,
  emphasize = false,
  mono = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-foreground",
          emphasize && "font-semibold tabular-nums",
          mono && "break-all font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
