const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Unlike toISODate (which is UTC-based and used for the UTC-anchored dates
// throughout this file), this reflects the viewer's actual local calendar day.
export function localISODate(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function mondayOf(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const diffToMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return toISODate(date);
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function dayLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return DAY_NAMES[(date.getUTCDay() + 6) % 7];
}

export function dayNumber(dateStr: string): number {
  return Number(dateStr.slice(8, 10));
}

export function formatRange(weekStart: string, weekEnd: string): string {
  const startDate = new Date(`${weekStart}T00:00:00Z`);
  const endDate = new Date(`${weekEnd}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${startDate.toLocaleDateString(undefined, opts)} – ${endDate.toLocaleDateString(undefined, opts)}`;
}
