const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * When the newest recipe was saved, phrased for the cookbook header:
 * "today", "yesterday", a weekday within the past week, otherwise a date.
 * A bare weekday stops being meaningful past six days.
 */
export function lastSavedLabel(saved: Date, now: Date = new Date()): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(saved)) / DAY_MS);

  if (daysAgo <= 0) return "today";
  if (daysAgo === 1) return "yesterday";
  if (daysAgo < 7) return saved.toLocaleDateString("en-GB", { weekday: "long" });
  return saved.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(saved.getFullYear() !== now.getFullYear() && { year: "numeric" }),
  });
}
