import {
  addNewYorkDays,
  compareNewYorkDates,
  enumerateNewYorkDatesInclusive,
  minNewYorkDate,
  toNewYorkDate,
} from "@/domains/settlement/new-york-calendar";

export const ROI_CALCULATION_VERSION = "roi-v1";
export const MICRO_MINOR_UNITS_PER_MINOR = 1_000_000n;
export const BASIS_POINTS_DIVISOR = 10_000n;

export interface DailyRoiInput {
  principalMinor: bigint;
  dailyRoiBps: number;
  previousResidualMicroMinor: bigint;
  remainingPromisedRoiMinor?: bigint | null;
  forceFinalRemainder?: boolean;
}

export interface DailyRoiResult {
  calculationVersion: typeof ROI_CALCULATION_VERSION;
  grossRoiMicroMinor: bigint;
  availableRoiMicroMinor: bigint;
  postedRoiMinor: bigint;
  nextResidualMicroMinor: bigint;
  capped: boolean;
}

export interface PromisedRoiInput {
  principalMinor: bigint;
  totalRoiBps: number | null;
}

export interface RoiScheduleItemInput {
  investmentId: string;
  principalMinor: bigint;
  dailyRoiBps: number;
  firstSettlementDate: string;
  termDays: number;
}

export interface GeneratedRoiScheduleItem {
  investmentId: string;
  sequenceNumber: number;
  earningDate: string;
  settlementDate: string;
  expectedRoiMicroMinor: bigint;
  status: "scheduled";
}

export interface LiveEarningsInput {
  principalMinor: bigint;
  dailyRoiBps: number;
  firstSettlementDate: string;
  maturityDate: string;
  now: Date;
  settledThroughDate?: string | null;
}

export interface LiveEarningsResult {
  calculationVersion: typeof ROI_CALCULATION_VERSION;
  currentNewYorkDate: string;
  previewStartDate: string | null;
  previewEndDate: string | null;
  previewedDays: number;
  liveRoiMicroMinor: bigint;
  liveRoiMinorFloor: bigint;
  visualOnly: true;
}

export function calculateDailyRoi(input: DailyRoiInput): DailyRoiResult {
  assertNonNegativeBigint(input.principalMinor, "principalMinor");
  assertNonNegativeBigint(input.previousResidualMicroMinor, "previousResidualMicroMinor");
  assertNonNegativeInteger(input.dailyRoiBps, "dailyRoiBps");

  const grossRoiMicroMinor =
    (input.principalMinor * MICRO_MINOR_UNITS_PER_MINOR * BigInt(input.dailyRoiBps)) /
    BASIS_POINTS_DIVISOR;
  const availableRoiMicroMinor = grossRoiMicroMinor + input.previousResidualMicroMinor;
  let postedRoiMinor = availableRoiMicroMinor / MICRO_MINOR_UNITS_PER_MINOR;
  let nextResidualMicroMinor =
    availableRoiMicroMinor - postedRoiMinor * MICRO_MINOR_UNITS_PER_MINOR;
  let capped = false;

  if (input.remainingPromisedRoiMinor !== undefined && input.remainingPromisedRoiMinor !== null) {
    assertNonNegativeBigint(input.remainingPromisedRoiMinor, "remainingPromisedRoiMinor");

    if (input.forceFinalRemainder) {
      postedRoiMinor = input.remainingPromisedRoiMinor;
      nextResidualMicroMinor = 0n;
      capped = true;
    } else if (postedRoiMinor > input.remainingPromisedRoiMinor) {
      postedRoiMinor = input.remainingPromisedRoiMinor;
      nextResidualMicroMinor = 0n;
      capped = true;
    }
  }

  return {
    calculationVersion: ROI_CALCULATION_VERSION,
    grossRoiMicroMinor,
    availableRoiMicroMinor,
    postedRoiMinor,
    nextResidualMicroMinor,
    capped,
  };
}

export function calculatePromisedRoiMinor(input: PromisedRoiInput): bigint | null {
  assertNonNegativeBigint(input.principalMinor, "principalMinor");

  if (input.totalRoiBps === null) return null;
  assertNonNegativeInteger(input.totalRoiBps, "totalRoiBps");

  return (input.principalMinor * BigInt(input.totalRoiBps)) / BASIS_POINTS_DIVISOR;
}

export function generateRoiSchedule(input: RoiScheduleItemInput): GeneratedRoiScheduleItem[] {
  assertNonNegativeBigint(input.principalMinor, "principalMinor");
  assertNonNegativeInteger(input.dailyRoiBps, "dailyRoiBps");

  if (!Number.isInteger(input.termDays) || input.termDays <= 0) {
    throw new Error("termDays must be a positive integer.");
  }

  const expectedRoiMicroMinor =
    (input.principalMinor * MICRO_MINOR_UNITS_PER_MINOR * BigInt(input.dailyRoiBps)) /
    BASIS_POINTS_DIVISOR;

  return Array.from({ length: input.termDays }, (_, index) => {
    const earningDate = addNewYorkDays(input.firstSettlementDate, index);

    return {
      investmentId: input.investmentId,
      sequenceNumber: index + 1,
      earningDate,
      settlementDate: earningDate,
      expectedRoiMicroMinor,
      status: "scheduled",
    };
  });
}

export function calculateLiveEarnings(input: LiveEarningsInput): LiveEarningsResult {
  assertNonNegativeBigint(input.principalMinor, "principalMinor");
  assertNonNegativeInteger(input.dailyRoiBps, "dailyRoiBps");

  const currentNewYorkDate = toNewYorkDate(input.now);
  const firstPreviewDate = input.settledThroughDate
    ? addNewYorkDays(input.settledThroughDate, 1)
    : input.firstSettlementDate;
  const lastCompletedDate = addNewYorkDays(currentNewYorkDate, -1);
  const previewStartDate =
    compareNewYorkDates(firstPreviewDate, input.maturityDate) <= 0 ? firstPreviewDate : null;
  const previewEndDate =
    previewStartDate && compareNewYorkDates(lastCompletedDate, previewStartDate) >= 0
      ? minNewYorkDate(lastCompletedDate, input.maturityDate)
      : null;

  if (!previewStartDate || !previewEndDate) {
    return {
      calculationVersion: ROI_CALCULATION_VERSION,
      currentNewYorkDate,
      previewStartDate,
      previewEndDate,
      previewedDays: 0,
      liveRoiMicroMinor: 0n,
      liveRoiMinorFloor: 0n,
      visualOnly: true,
    };
  }

  const dates = enumerateNewYorkDatesInclusive(previewStartDate, previewEndDate);
  const grossDailyMicroMinor =
    (input.principalMinor * MICRO_MINOR_UNITS_PER_MINOR * BigInt(input.dailyRoiBps)) /
    BASIS_POINTS_DIVISOR;
  const liveRoiMicroMinor = grossDailyMicroMinor * BigInt(dates.length);

  return {
    calculationVersion: ROI_CALCULATION_VERSION,
    currentNewYorkDate,
    previewStartDate,
    previewEndDate,
    previewedDays: dates.length,
    liveRoiMicroMinor,
    liveRoiMinorFloor: liveRoiMicroMinor / MICRO_MINOR_UNITS_PER_MINOR,
    visualOnly: true,
  };
}

/** Wall-clock seconds in a nominal day — used only for continuous live display / early-exit accrual. */
export const SECONDS_PER_DAY = 86_400n;

export interface ContinuousLiveAccrualInput {
  principalMinor: bigint;
  dailyRoiBps: number;
  activatedAt: Date;
  termDays: number;
  postedRoiMinor: bigint;
  promisedRoiMinor?: bigint | null;
  now: Date;
}

export interface ContinuousLiveAccrualResult {
  calculationVersion: typeof ROI_CALCULATION_VERSION;
  dailyRoiMinorFloor: bigint;
  elapsedSeconds: number;
  accruedRoiMinor: bigint;
  todayEarningsMinor: bigint;
  totalLiveEarningsMinor: bigint;
  currentValueMinor: bigint;
  unpostedAccruedMinor: bigint;
  visualOnly: true;
}

/**
 * Continuous per-second accrual for dashboard display and early-exit settlement.
 * Visual-only until posted via ledger (daily settlement or stop/maturity).
 * Formula: floor(principal × dailyRoiBps × elapsedSeconds / (10_000 × 86_400)).
 */
export function calculateContinuousLiveAccrual(
  input: ContinuousLiveAccrualInput,
): ContinuousLiveAccrualResult {
  assertNonNegativeBigint(input.principalMinor, "principalMinor");
  assertNonNegativeBigint(input.postedRoiMinor, "postedRoiMinor");
  assertNonNegativeInteger(input.dailyRoiBps, "dailyRoiBps");

  if (!Number.isInteger(input.termDays) || input.termDays <= 0) {
    throw new Error("termDays must be a positive integer.");
  }

  const dailyRoiMinorFloor =
    (input.principalMinor * BigInt(input.dailyRoiBps)) / BASIS_POINTS_DIVISOR;

  const rawElapsedMs = input.now.getTime() - input.activatedAt.getTime();
  const cappedElapsedMs = Math.max(
    0,
    Math.min(rawElapsedMs, Number(BigInt(input.termDays) * SECONDS_PER_DAY * 1000n)),
  );
  const elapsedSeconds = Math.floor(cappedElapsedMs / 1000);

  let accruedRoiMinor =
    (input.principalMinor * BigInt(input.dailyRoiBps) * BigInt(elapsedSeconds)) /
    (BASIS_POINTS_DIVISOR * SECONDS_PER_DAY);

  if (input.promisedRoiMinor !== undefined && input.promisedRoiMinor !== null) {
    assertNonNegativeBigint(input.promisedRoiMinor, "promisedRoiMinor");
    if (accruedRoiMinor > input.promisedRoiMinor) {
      accruedRoiMinor = input.promisedRoiMinor;
    }
  }

  const unpostedAccruedMinor =
    accruedRoiMinor > input.postedRoiMinor ? accruedRoiMinor - input.postedRoiMinor : 0n;
  const todayEarningsMinor = unpostedAccruedMinor;
  const totalLiveEarningsMinor = input.postedRoiMinor + unpostedAccruedMinor;

  return {
    calculationVersion: ROI_CALCULATION_VERSION,
    dailyRoiMinorFloor,
    elapsedSeconds,
    accruedRoiMinor,
    todayEarningsMinor,
    totalLiveEarningsMinor,
    currentValueMinor: input.principalMinor + totalLiveEarningsMinor,
    unpostedAccruedMinor,
    visualOnly: true,
  };
}

export function proveTermRoi(input: {
  principalMinor: bigint;
  dailyRoiBps: number;
  termDays: number;
  promisedRoiMinor?: bigint | null;
}): { totalPostedRoiMinor: bigint; finalResidualMicroMinor: bigint } {
  let previousResidualMicroMinor = 0n;
  let totalPostedRoiMinor = 0n;

  for (let day = 1; day <= input.termDays; day += 1) {
    const remainingPromisedRoiMinor =
      input.promisedRoiMinor === undefined || input.promisedRoiMinor === null
        ? null
        : input.promisedRoiMinor - totalPostedRoiMinor;
    const result = calculateDailyRoi({
      principalMinor: input.principalMinor,
      dailyRoiBps: input.dailyRoiBps,
      previousResidualMicroMinor,
      remainingPromisedRoiMinor,
      forceFinalRemainder: remainingPromisedRoiMinor !== null && day === input.termDays,
    });

    totalPostedRoiMinor += result.postedRoiMinor;
    previousResidualMicroMinor = result.nextResidualMicroMinor;
  }

  return { totalPostedRoiMinor, finalResidualMicroMinor: previousResidualMicroMinor };
}

function assertNonNegativeBigint(value: bigint, name: string) {
  if (value < 0n) {
    throw new Error(`${name} must be non-negative.`);
  }
}

function assertNonNegativeInteger(value: number, name: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }
}
