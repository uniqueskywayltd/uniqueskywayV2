"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { formatRelativeTime, shuffleInPlace } from "@/application/public/social-proof-privacy";
import { appPath } from "@/lib/app-path";
import { cn } from "@/lib/utils";

type SocialProofEventType = "registration" | "investment" | "withdrawal";

type SocialProofEvent = {
  id: string;
  type: SocialProofEventType;
  firstName: string;
  location: string;
  amountLabel: string | null;
  occurredAt: string;
};

const ALLOWED_PATHS = new Set(["/", "/auth/login", "/auth/register", "/contact"]);
const INTERVAL_MS = 90_000;
const VISIBLE_MS = 6_000;
const INITIAL_DELAY_MS = 4_000;
const MAX_NOTIFICATIONS = 12;

const COPY: Record<SocialProofEventType, { emoji: string; action: string; showAmount: boolean }> = {
  registration: { emoji: "🎉", action: "created an account", showAmount: false },
  investment: { emoji: "📈", action: "invested", showAmount: true },
  withdrawal: { emoji: "💸", action: "withdrew", showAmount: true },
};

/**
 * Lightweight social-proof toasts for selected public pages only.
 * Fetches once per page load; never polls the API on the 90s display cadence.
 */
export function SocialProofToasts() {
  const pathname = usePathname();
  const enabled = ALLOWED_PATHS.has(normalizePath(pathname));

  if (!enabled) return null;
  return <SocialProofToastsRuntime />;
}

function SocialProofToastsRuntime() {
  const [queue, setQueue] = useState<SocialProofEvent[] | null>(null);
  const [active, setActive] = useState<SocialProofEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const shownCountRef = useRef(0);
  const cursorRef = useRef(0);
  const hideTimerRef = useRef<number | null>(null);
  const scheduleTimerRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(appPath("/api/public/social-proof"), {
          method: "GET",
          credentials: "omit",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { events?: SocialProofEvent[] };
        if (cancelled) return;
        const events = Array.isArray(payload.events) ? payload.events.filter(isValidEvent) : [];
        if (events.length === 0) {
          setQueue([]);
          return;
        }
        setQueue(shuffleInPlace([...events]));
      } catch {
        if (!cancelled) setQueue([]);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!queue || queue.length === 0) return;

    const clearTimers = () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (scheduleTimerRef.current !== null) {
        window.clearTimeout(scheduleTimerRef.current);
        scheduleTimerRef.current = null;
      }
    };

    const showNext = () => {
      if (pausedRef.current) return;
      if (shownCountRef.current >= MAX_NOTIFICATIONS) return;
      if (!queue.length) return;

      const index = cursorRef.current % queue.length;
      cursorRef.current += 1;
      const event = queue[index]!;
      shownCountRef.current += 1;
      setActive(event);
      setVisible(true);

      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
        if (shownCountRef.current >= MAX_NOTIFICATIONS) return;
        const waitMs = Math.max(0, INTERVAL_MS - VISIBLE_MS);
        scheduleTimerRef.current = window.setTimeout(() => {
          scheduleTimerRef.current = null;
          showNext();
        }, waitMs);
      }, VISIBLE_MS);
    };

    const onVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        clearTimers();
        setVisible(false);
        return;
      }
      pausedRef.current = false;
      if (shownCountRef.current >= MAX_NOTIFICATIONS) return;
      const delay = shownCountRef.current === 0 ? INITIAL_DELAY_MS : INTERVAL_MS;
      scheduleTimerRef.current = window.setTimeout(() => {
        scheduleTimerRef.current = null;
        showNext();
      }, delay);
    };

    document.addEventListener("visibilitychange", onVisibility);

    if (!document.hidden) {
      scheduleTimerRef.current = window.setTimeout(() => {
        scheduleTimerRef.current = null;
        showNext();
      }, INITIAL_DELAY_MS);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimers();
    };
  }, [queue]);

  if (!active) return null;

  const copy = COPY[active.type];
  const amount = copy.showAmount && active.amountLabel ? active.amountLabel : null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 left-4 z-[var(--z-toast)] w-[min(calc(100vw-2rem),20rem)] sm:bottom-6 sm:left-6",
        "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-3 opacity-0 motion-reduce:translate-y-0",
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-social-proof={active.type}
    >
      <div className="rounded-xl border border-border/80 bg-card/95 px-3.5 py-3 text-card-foreground shadow-[var(--elevation-2)] backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-lg leading-none" aria-hidden="true">
            {copy.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">{active.firstName}</p>
            <p className="truncate text-xs text-muted-foreground">from {active.location}</p>
            <p className="mt-1 text-sm text-foreground/90">
              {copy.action}
              {amount ? (
                <>
                  {" "}
                  <span className="font-semibold tabular-nums text-foreground">{amount}</span>
                </>
              ) : null}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {formatRelativeTime(active.occurredAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizePath(pathname: string | null): string {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

function isValidEvent(value: unknown): value is SocialProofEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as SocialProofEvent;
  return (
    (event.type === "registration" || event.type === "investment" || event.type === "withdrawal") &&
    typeof event.id === "string" &&
    typeof event.firstName === "string" &&
    typeof event.location === "string" &&
    typeof event.occurredAt === "string" &&
    (event.amountLabel === null || typeof event.amountLabel === "string")
  );
}
