"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import {
  CERTIFIED_PUBLIC_PLANS,
  formatPlanMoney,
  type CertifiedPublicPlan,
} from "@/features/public/content/certified-plans";
import { cn } from "@/lib/utils";

type PlanSelectionFieldProps = {
  value: string;
  onChange: (planSlug: string) => void;
  plans?: readonly CertifiedPublicPlan[];
  disabled?: boolean;
  label?: string;
  placeholder?: string;
};

export function PlanSelectionField({
  value,
  onChange,
  plans = CERTIFIED_PUBLIC_PLANS,
  disabled,
  label = "Investment Package",
  placeholder = "Tap to select a package",
}: PlanSelectionFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = plans.find((plan) => plan.slug === value);

  function handleSelect(planSlug: string) {
    onChange(planSlug);
    setOpen(false);
  }

  if (!plans.length) {
    return <p className="text-sm text-muted-foreground">Packages unavailable.</p>;
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium text-foreground">{label}</legend>

      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]",
          selected
            ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30"
            : "border-border/70 bg-card hover:border-primary/35",
          open && "border-primary/50",
          disabled && "opacity-60",
        )}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected ? (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" aria-hidden />
            </span>
          ) : null}
          <span
            className={cn(
              "truncate text-sm",
              selected ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {selected ? selected.name : placeholder}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Investment packages"
          className="flex flex-col gap-1.5 overflow-hidden rounded-xl border border-border/70 bg-card p-1.5"
        >
          {plans.map((plan) => {
            const isSelected = value === plan.slug;
            return (
              <button
                key={plan.slug}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={disabled}
                onClick={() => handleSelect(plan.slug)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                  isSelected ? "bg-primary/[0.1] text-foreground" : "hover:bg-muted/60",
                  disabled && "opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/35",
                  )}
                  aria-hidden
                >
                  {isSelected ? <Check className="h-3 w-3 text-primary-foreground" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{plan.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {plan.dailyRoiPercent}% daily · {plan.durationDays} days · from{" "}
                    {formatPlanMoney(plan.minDeposit)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </fieldset>
  );
}
