"use client";

import { useEffect, useState } from "react";

import { calculateContinuousLiveAccrual } from "@/domains/investments/roi-math";
import { secondsUntilNextNewYorkMidnight } from "@/domains/settlement/new-york-calendar";

export type LiveAccrualSource = {
  principalMinor: string;
  dailyRoiBps: number;
  activatedAt: string | null;
  termDays: number;
  postedRoiMinor: string;
  promisedRoiMinor: string | null;
  status: string;
};

export type LiveAccrualView = {
  dailyRoiMinor: string;
  todayEarningsMinor: string;
  totalLiveEarningsMinor: string;
  currentValueMinor: string;
  unpostedAccruedMinor: string;
  elapsedSeconds: number;
  nextSettlementCountdownSeconds: number;
  visualOnly: true;
};

/** Client-side 1s timer — no API polling, no DB writes. */
export function useLiveAccrual(source: LiveAccrualSource | null): LiveAccrualView | null {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const active =
    Boolean(source?.activatedAt) && (source?.status === "active" || source?.status === "maturing");

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  if (!source?.activatedAt || !active) return null;

  const live = calculateContinuousLiveAccrual({
    principalMinor: BigInt(source.principalMinor),
    dailyRoiBps: source.dailyRoiBps,
    activatedAt: new Date(source.activatedAt),
    termDays: source.termDays,
    postedRoiMinor: BigInt(source.postedRoiMinor),
    promisedRoiMinor: source.promisedRoiMinor ? BigInt(source.promisedRoiMinor) : null,
    now: new Date(nowMs),
  });

  const dailyRoiMinor = (BigInt(source.principalMinor) * BigInt(source.dailyRoiBps)) / 10_000n;

  return {
    dailyRoiMinor: dailyRoiMinor.toString(),
    todayEarningsMinor: live.todayEarningsMinor.toString(),
    totalLiveEarningsMinor: live.totalLiveEarningsMinor.toString(),
    currentValueMinor: live.currentValueMinor.toString(),
    unpostedAccruedMinor: live.unpostedAccruedMinor.toString(),
    elapsedSeconds: live.elapsedSeconds,
    nextSettlementCountdownSeconds: secondsUntilNextNewYorkMidnight(new Date(nowMs)),
    visualOnly: true,
  };
}

export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function remainingDaysLabel(maturityDate: string | null, now = new Date()): string {
  if (!maturityDate) return "—";
  const end = Date.parse(`${maturityDate}T23:59:59.000Z`);
  if (!Number.isFinite(end)) return "—";
  const days = Math.max(0, Math.ceil((end - now.getTime()) / 86_400_000));
  return days === 1 ? "1 day" : `${days} days`;
}
