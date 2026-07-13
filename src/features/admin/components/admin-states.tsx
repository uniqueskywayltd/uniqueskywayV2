"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, Lock, RefreshCw, WifiOff } from "lucide-react";

import { Alert, Button, EmptyState, LoadingState } from "@/components/ui";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function AdminLoadingBlock({ label = "Loading admin data" }: { label?: string }) {
  return <LoadingState label={label} className="rounded-lg border bg-card p-4" />;
}

export function AdminEmptyBlock({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <EmptyState
      title={title}
      {...(description ? { description } : {})}
      {...(action ? { action } : {})}
    />
  );
}

export function AdminErrorBlock({
  message,
  status,
  onRetry,
}: {
  message: string;
  status?: number;
  onRetry?: () => void;
}) {
  if (status === 401) {
    return (
      <EmptyState
        icon={Lock}
        title="Session expired"
        description="Sign in again to continue administering the platform."
        action={
          <Button asChild>
            <Link href="/auth/login?next=/admin">Sign in</Link>
          </Button>
        }
      />
    );
  }

  if (status === 403) {
    return (
      <EmptyState
        icon={Lock}
        title="Permission denied"
        description="Your account does not have permission for this administrative surface."
        action={
          <Button asChild variant="outline">
            <Link href="/admin">Return to overview</Link>
          </Button>
        }
      />
    );
  }

  if (status === 404) {
    return (
      <EmptyState
        title="Not found"
        description={message || "The requested administrative record was not found."}
        action={
          <Button asChild variant="outline">
            <Link href="/admin">Return to overview</Link>
          </Button>
        }
      />
    );
  }

  if (/network|offline|connection/i.test(message)) {
    return (
      <EmptyState
        icon={WifiOff}
        title="You appear offline"
        description={message}
        action={
          onRetry ? (
            <Button type="button" onClick={onRetry}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Retry
            </Button>
          ) : null
        }
      />
    );
  }

  return (
    <Alert variant="destructive" className="items-start">
      <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
      <div className="space-y-3">
        <div>
          <p className="font-medium">Something went wrong</p>
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {onRetry ? (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" aria-hidden="true" />
            Retry
          </Button>
        ) : null}
      </div>
    </Alert>
  );
}
