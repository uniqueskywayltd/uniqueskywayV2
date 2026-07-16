import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthField({
  label,
  htmlFor,
  hint,
  error,
  action,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm leading-none font-medium text-foreground">
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {!error && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AuthInputIcon({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <div className="[&_input]:h-11 [&_input]:border-input [&_input]:bg-background [&_input]:pl-10 [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground [&_input]:focus-visible:border-primary/40 [&_input]:focus-visible:ring-primary/20">
        {children}
      </div>
    </div>
  );
}

export const authCalloutClass =
  "rounded-xl border border-border bg-muted/50 px-4 py-3 dark:border-border/80 dark:bg-muted/60";

export const authCheckboxClass =
  "border-border bg-background shadow-sm dark:border-muted-foreground/50 dark:bg-background data-checked:border-primary";
