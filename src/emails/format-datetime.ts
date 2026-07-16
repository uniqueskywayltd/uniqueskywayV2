/**
 * American standard date/time for transactional emails: MM/DD/YYYY with clock time.
 * Defaults to UTC so all regions see a consistent timestamp.
 */
export function formatEmailDateTime(value: string | Date, timeZone = "UTC"): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
    timeZoneName: "short",
  }).format(date);
}
