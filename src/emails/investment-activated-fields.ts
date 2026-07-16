import { calculateDailyRoi } from "@/domains/investments/roi-math";
import { addNewYorkDays, newYorkDateAtMidnightUtc } from "@/domains/settlement/new-york-calendar";
import { formatEmailDateTime } from "@/emails/format-datetime";
import { formatMoneyMinorUnits } from "@/i18n/format";

export type InvestmentActivatedScheduleDay = {
  label: string;
  amount: string;
};

export type InvestmentActivatedEmailFields = {
  planName: string;
  principal: string;
  dailyRate: string;
  dailyEarnings: string;
  duration: string;
  startDateTime: string;
  maturityDateTime: string;
  expectedProfit: string;
  maturityValue: string;
  status: string;
  reference: string;
  nextSettlement: string;
  investmentUrl: string;
  dashboardUrl: string;
  schedule: InvestmentActivatedScheduleDay[];
  currentYear: string;
};

export function buildInvestmentActivatedEmailFields(input: {
  planName: string;
  investmentId: string;
  principalMinor: bigint;
  currency: string;
  dailyRoiBps: number;
  termDays: number;
  promisedRoiMinor: bigint | null;
  activatedAt: Date;
  firstSettlementDate: string;
  maturityDate: string;
  appBaseUrl: string;
  timeZone?: string | null;
}): InvestmentActivatedEmailFields {
  const timeZone = input.timeZone?.trim() || "America/New_York";
  const currency = input.currency || "USD";

  const scheduleMinor = buildProjectedRoiSchedule({
    principalMinor: input.principalMinor,
    dailyRoiBps: input.dailyRoiBps,
    termDays: input.termDays,
    promisedRoiMinor: input.promisedRoiMinor,
  });

  const expectedProfitMinor =
    input.promisedRoiMinor ?? scheduleMinor.reduce((sum, day) => sum + day.amountMinor, 0n);
  const dailyEarningsMinor =
    scheduleMinor[0]?.amountMinor ?? (input.principalMinor * BigInt(input.dailyRoiBps)) / 10_000n;
  const maturityValueMinor = input.principalMinor + expectedProfitMinor;

  const nextSettlementAt = newYorkDateAtMidnightUtc(input.firstSettlementDate);
  const maturityAt = newYorkDateAtMidnightUtc(addNewYorkDays(input.maturityDate, 1));

  return {
    planName: input.planName,
    principal: formatMoney(input.principalMinor, currency),
    dailyRate: formatDailyRatePercent(input.dailyRoiBps),
    dailyEarnings: formatMoney(dailyEarningsMinor, currency),
    duration: String(input.termDays),
    startDateTime: formatEmailDateTime(input.activatedAt, timeZone),
    maturityDateTime: formatEmailDateTime(maturityAt, timeZone),
    expectedProfit: formatMoney(expectedProfitMinor, currency),
    maturityValue: formatMoney(maturityValueMinor, currency),
    status: "Active",
    reference: input.investmentId,
    nextSettlement: formatEmailDateTime(nextSettlementAt, timeZone),
    investmentUrl: `${input.appBaseUrl}/portfolio/${input.investmentId}`,
    dashboardUrl: `${input.appBaseUrl}/dashboard`,
    schedule: compressScheduleForEmail(scheduleMinor, currency),
    currentYear: String(new Date().getFullYear()),
  };
}

function buildProjectedRoiSchedule(input: {
  principalMinor: bigint;
  dailyRoiBps: number;
  termDays: number;
  promisedRoiMinor: bigint | null;
}): Array<{ day: number; amountMinor: bigint }> {
  let residual = 0n;
  let posted = 0n;
  const days: Array<{ day: number; amountMinor: bigint }> = [];

  for (let day = 1; day <= input.termDays; day += 1) {
    const remaining = input.promisedRoiMinor === null ? null : input.promisedRoiMinor - posted;
    const result = calculateDailyRoi({
      principalMinor: input.principalMinor,
      dailyRoiBps: input.dailyRoiBps,
      previousResidualMicroMinor: residual,
      remainingPromisedRoiMinor: remaining,
      forceFinalRemainder: remaining !== null && day === input.termDays,
    });
    days.push({ day, amountMinor: result.postedRoiMinor });
    residual = result.nextResidualMicroMinor;
    posted += result.postedRoiMinor;
  }

  return days;
}

function compressScheduleForEmail(
  days: Array<{ day: number; amountMinor: bigint }>,
  currency: string,
): InvestmentActivatedScheduleDay[] {
  if (days.length === 0) return [];

  if (days.length <= 5) {
    return days.map((day) => ({
      label: day.day === days.length ? "Final Day" : `Day ${day.day}`,
      amount: formatMoney(day.amountMinor, currency),
    }));
  }

  const first = days.slice(0, 3);
  const last = days[days.length - 1]!;
  return [
    ...first.map((day) => ({
      label: `Day ${day.day}`,
      amount: formatMoney(day.amountMinor, currency),
    })),
    { label: "…", amount: "" },
    {
      label: "Final Day",
      amount: formatMoney(last.amountMinor, currency),
    },
  ];
}

function formatMoney(amountMinor: bigint, currency: string): string {
  return formatMoneyMinorUnits("en", Number(amountMinor), currency);
}

function formatDailyRatePercent(dailyRoiBps: number): string {
  return (dailyRoiBps / 100).toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}
