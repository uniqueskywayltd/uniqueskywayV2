"use client";

import Link from "next/link";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui";
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
                  Deposit Submitted Successfully
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
                  Thank you, {summary.firstName}.
                  <br />
                  Your deposit request has been received successfully and is now awaiting review by
                  our Finance Team.
                </DialogPrimitive.Description>
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Deposit Summary
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <SummaryRow label="Amount" value={summary.amountLabel} emphasize />
                  <SummaryRow label="Currency" value={summary.currency} />
                  <SummaryRow label="Network" value={summary.network} />
                  <SummaryRow label="Reference" value={summary.reference} mono />
                  <SummaryRow label="Submitted" value={summary.submittedAtLabel} />
                </dl>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">What Happens Next?</p>
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-muted-foreground">
                  <li>Your Account Officer will review your deposit submission.</li>
                  <li>Your blockchain transaction will be verified.</li>
                  <li>Once confirmed, your wallet will be credited automatically.</li>
                  <li>
                    If additional information is required, our team will contact you using your
                    registered email address.
                  </li>
                  <li>
                    You will also receive an email notification once your deposit has been approved
                    or rejected.
                  </li>
                </ul>
              </div>

              <div className="flex justify-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  <span aria-hidden="true">🟡</span>
                  Awaiting Review
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
                  OK
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Need assistance?{" "}
                  <Link
                    href="/account/help/support"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Contact Support
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
