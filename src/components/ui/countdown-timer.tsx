"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface CountdownTimerProps {
  target: Date | string | number;
  label?: string;
  className?: string;
}

function formatRemaining(ms: number) {
  if (ms <= 0) {
    return "00:00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

export function CountdownTimer({
  target,
  label = "Time remaining",
  className,
}: CountdownTimerProps) {
  const targetTime = React.useMemo(() => new Date(target).getTime(), [target]);
  const [remaining, setRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    const updateRemaining = () => {
      setRemaining(targetTime - Date.now());
    };

    updateRemaining();
    const intervalId = window.setInterval(() => {
      updateRemaining();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [targetTime]);

  return (
    <span
      className={cn("font-mono text-sm tabular-nums", className)}
      role="timer"
      aria-label={label}
    >
      {remaining === null ? "--:--:--" : formatRemaining(remaining)}
    </span>
  );
}
