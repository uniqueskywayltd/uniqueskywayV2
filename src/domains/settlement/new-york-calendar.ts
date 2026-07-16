const NEW_YORK_TIME_ZONE = "America/New_York";

const newYorkDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: NEW_YORK_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export type NewYorkDate = `${number}-${number}-${number}`;

export function toNewYorkDate(date: Date): NewYorkDate {
  const parts = newYorkDateFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format New York date.");
  }

  return `${year}-${month}-${day}` as NewYorkDate;
}

export function addNewYorkDays(date: string, days: number): NewYorkDate {
  const { year, month, day } = parseDate(date);
  const utcDate = new Date(Date.UTC(year, month - 1, day + days));

  return utcDate.toISOString().slice(0, 10) as NewYorkDate;
}

export function compareNewYorkDates(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function firstSettlementDate(activatedAt: Date): NewYorkDate {
  return addNewYorkDays(toNewYorkDate(activatedAt), 1);
}

export function maturityDate(firstEligibleSettlementDate: string, termDays: number): NewYorkDate {
  if (!Number.isInteger(termDays) || termDays <= 0) {
    throw new Error("Term days must be a positive integer.");
  }

  return addNewYorkDays(firstEligibleSettlementDate, termDays - 1);
}

export function isCompletedSettlementDate(settlementDate: string, currentDate: Date): boolean {
  return compareNewYorkDates(settlementDate, toNewYorkDate(currentDate)) < 0;
}

export function enumerateNewYorkDatesInclusive(startDate: string, endDate: string): NewYorkDate[] {
  if (compareNewYorkDates(startDate, endDate) > 0) return [];

  const dates: NewYorkDate[] = [];
  let cursor = startDate as NewYorkDate;

  while (compareNewYorkDates(cursor, endDate) <= 0) {
    dates.push(cursor);
    cursor = addNewYorkDays(cursor, 1);
  }

  return dates;
}

export function maxNewYorkDate(left: string, right: string): NewYorkDate {
  return (compareNewYorkDates(left, right) >= 0 ? left : right) as NewYorkDate;
}

export function minNewYorkDate(left: string, right: string): NewYorkDate {
  return (compareNewYorkDates(left, right) <= 0 ? left : right) as NewYorkDate;
}

const newYorkHourFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: NEW_YORK_TIME_ZONE,
  hour: "2-digit",
  hourCycle: "h23",
});

/** UTC instant of 00:00:00 America/New_York on the given NY calendar date. */
export function newYorkDateAtMidnightUtc(nyDate: string): Date {
  const { year, month, day } = parseDate(nyDate);

  for (const utcHour of [4, 5] as const) {
    const candidate = new Date(Date.UTC(year, month - 1, day, utcHour, 0, 0, 0));
    if (toNewYorkDate(candidate) !== nyDate) continue;
    const hour = newYorkHourFormatter
      .formatToParts(candidate)
      .find((part) => part.type === "hour")?.value;
    if (hour === "00") return candidate;
  }

  throw new Error(`Unable to resolve New York midnight for ${nyDate}.`);
}

/** Next New York midnight strictly after `from`. */
export function nextNewYorkMidnightUtc(from: Date): Date {
  const nextDate = addNewYorkDays(toNewYorkDate(from), 1);
  return newYorkDateAtMidnightUtc(nextDate);
}

export function secondsUntilNextNewYorkMidnight(from: Date): number {
  const next = nextNewYorkMidnightUtc(from);
  return Math.max(0, Math.floor((next.getTime() - from.getTime()) / 1000));
}

function parseDate(date: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    throw new Error(`Invalid New York date: ${date}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}
