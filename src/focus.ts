const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function weekStartFor(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  const day = date.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - diffToMonday);
  return date.toISOString().slice(0, 10);
}

export function weekEndFor(weekStart: string): string {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
}

export function computeFocusVirtueId(dateStr: string, cycleStart: string): number {
  const weekStart = weekStartFor(dateStr);
  const start = new Date(`${cycleStart}T00:00:00Z`).getTime();
  const current = new Date(`${weekStart}T00:00:00Z`).getTime();
  const weekIndex = Math.floor((current - start) / (7 * MS_PER_DAY));
  const order = ((weekIndex % 13) + 13) % 13;
  return order + 1;
}
