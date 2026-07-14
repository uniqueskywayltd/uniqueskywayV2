import Link from "next/link";
import type { ReactNode } from "react";

import { BrandMark } from "@/components/layout/brand-mark";

export interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-background text-foreground outline-none">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="mb-10">
          <BrandMark />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
      </section>
    </main>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
