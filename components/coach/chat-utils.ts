type MessageLike = {
  created_at: string;
};

export type DayGroup<T extends MessageLike> = {
  label: string;
  items: T[];
};

export const MAX_CONTEXT_TURNS = 24;

export function formatTime(iso: string): string {
  try {
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function dayLabel(date: Date): string {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function groupMessagesByDay<T extends MessageLike>(messages: T[]): DayGroup<T>[] {
  const byDay = new Map<string, T[]>();

  for (const message of messages) {
    const date = new Date(message.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(message);
  }

  return Array.from(byDay.entries())
    .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
    .map(([key, items]) => {
      const [year, month, day] = key.split("-").map(Number);
      return { label: dayLabel(new Date(year, month, day)), items };
    });
}
