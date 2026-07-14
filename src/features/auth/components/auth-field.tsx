import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthField({
  label,
  htmlFor,
  hint,
  action,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
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
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
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
