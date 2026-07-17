/** Message keys for local-time salutations on authenticated dashboard surfaces. */
export type TimeGreetingKey = "greeting.morning" | "greeting.afternoon" | "greeting.evening";

/** Returns a message catalog key — translate with `t(getTimeGreetingKey())`. */
export function getTimeGreetingKey(date = new Date()): TimeGreetingKey {
  const hour = date.getHours();
  if (hour < 12) return "greeting.morning";
  if (hour < 17) return "greeting.afternoon";
  return "greeting.evening";
}
