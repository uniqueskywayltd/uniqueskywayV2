import Image from "next/image";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { brandAssets } from "@/features/brand";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  /** Brand empty-state illustration key from `public/brand/manifest.json`. */
  illustration?: keyof typeof brandAssets.emptyStates;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  illustration,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const imageSrc = illustration ? brandAssets.emptyStates[illustration] : null;

  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center",
        className,
      )}
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt=""
          width={160}
          height={120}
          className="mb-4 h-24 w-auto max-w-[160px] object-contain opacity-90"
        />
      ) : Icon ? (
        <div className="mb-4 rounded-full border bg-background p-3 text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
