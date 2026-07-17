"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { postAuthJson } from "@/features/auth/api-client";
import { useI18n } from "@/features/i18n/i18n-provider";
import { appPath } from "@/lib/app-path";

const INACTIVITY_MS = 15 * 60 * 1000;
const WARNING_MS = 13 * 60 * 1000;
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
  "wheel",
  "pointerdown",
] as const;

type SessionInactivityGuardProps = {
  /** Login redirect after forced logout. */
  loginPath?: string;
};

/**
 * Client-side inactivity watchdog for authenticated shells.
 * Warns at 13 minutes; signs out at 15 minutes with no activity.
 */
export function SessionInactivityGuard({ loginPath = "/auth/login" }: SessionInactivityGuardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [warningOpen, setWarningOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const lastActivityRef = useRef(0);
  const warningShownRef = useRef(false);
  const loggingOutRef = useRef(false);

  const performLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    setSigningOut(true);
    try {
      await postAuthJson("/api/auth/logout", {});
    } catch {
      /* still clear local session UX */
    }
    const next = encodeURIComponent(pathname || "/");
    router.replace(appPath(`${loginPath}?next=${next}&reason=inactivity`));
  }, [loginPath, pathname, router]);

  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningShownRef.current) {
      warningShownRef.current = false;
      setWarningOpen(false);
    }
  }, []);

  const staySignedIn = useCallback(() => {
    markActivity();
  }, [markActivity]);

  useEffect(() => {
    lastActivityRef.current = Date.now();
    const onActivity = () => markActivity();
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onActivity);

    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args: Parameters<typeof fetch>) => {
      const input = args[0];
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      // Treat user-initiated API traffic (not auth csrf/heartbeat noise) as activity.
      if (
        url.includes("/api/") &&
        !url.includes("/api/auth/csrf") &&
        !url.includes("/api/market-ticker")
      ) {
        markActivity();
      }
      return originalFetch(...args);
    };

    const tick = window.setInterval(() => {
      if (loggingOutRef.current) return;
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= INACTIVITY_MS) {
        void performLogout();
        return;
      }
      if (idle >= WARNING_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        setWarningOpen(true);
      }
    }, 1000);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener("visibilitychange", onActivity);
      window.fetch = originalFetch;
      window.clearInterval(tick);
    };
  }, [markActivity, performLogout]);

  // Route changes count as activity.
  useEffect(() => {
    markActivity();
  }, [pathname, markActivity]);

  return (
    <Dialog
      open={warningOpen}
      onOpenChange={(open) => {
        if (!open) staySignedIn();
      }}
    >
      <DialogContent className="sm:max-w-md" aria-describedby="session-timeout-desc">
        <DialogHeader>
          <DialogTitle>{t("auth.session_expiring_title")}</DialogTitle>
          <DialogDescription id="session-timeout-desc">
            {t("auth.session_expiring_body")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={signingOut}
            onClick={() => void performLogout()}
          >
            {t("chrome.sign_out")}
          </Button>
          <Button type="button" disabled={signingOut} onClick={staySignedIn}>
            {t("auth.session_stay_signed_in")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
