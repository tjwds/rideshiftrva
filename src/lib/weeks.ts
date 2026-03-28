import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, parseISO } from "date-fns";

export function getCurrentWeekKey(): string {
  const now = new Date();
  const week = getISOWeek(now);
  const year = getISOWeekYear(now);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function getWeekDateRange(weekKey: string): { monday: Date; sunday: Date } {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Create a date in the target ISO week by using Jan 4 (always in week 1)
  // then adding the appropriate number of weeks
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const startOfWeek1 = startOfISOWeek(jan4);
  const monday = new Date(startOfWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
  const sunday = endOfISOWeek(monday);

  return { monday, sunday };
}

export function getModeLabel(mode: string): string {
  const labels: Record<string, string> = {
    carpool: "Carpool",
    bike: "Bike",
    bus: "Bus",
    walk: "Walk",
  };
  return labels[mode] || mode;
}
