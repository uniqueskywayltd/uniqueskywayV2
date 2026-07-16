"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { postAuthJson } from "@/features/auth/api-client";
import { appPath } from "@/lib/app-path";

const DEFAULT_TIMEOUT_MS = 30 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;

/**
 * Signs the customer out after idle timeout (V1 parity).
 * Does not change RBAC or session APIs — only calls existing logout.
 */
export function CustomerInactivityGuard({
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: {
  timeoutMs?: number;
}) {
  const router = useRouter();
  const lastActiveRef = useRef(0);
  const signingOutRef = useRef(false);

  useEffect(() => {
    lastActiveRef.current = Date.now();

    const markActive = () => {
      lastActiveRef.current = Date.now();
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActive, { passive: true });
    }

    const timer = window.setInterval(() => {
      if (signingOutRef.current) return;
      if (Date.now() - lastActiveRef.current < timeoutMs) return;
      signingOutRef.current = true;
      void postAuthJson("/api/auth/logout", {}).finally(() => {
        router.replace(appPath("/auth/login"));
        router.refresh();
      });
    }, 15_000);

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActive);
      }
      window.clearInterval(timer);
    };
  }, [router, timeoutMs]);

  return null;
}
