/** UTC calendar helpers (the prototype renders everything in UTC, see APP_CONFIG). */

export function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isWithin(value: string | null, from: Date, to: Date) {
  if (!value) return false;
  const time = Date.parse(value);
  return time >= from.getTime() && time < to.getTime();
}

/** Monday-based week start (UTC). */
export function startOfWeek(date: Date) {
  const day = startOfDay(date);
  const offset = (day.getUTCDay() + 6) % 7; // Monday = 0
  return addDays(day, -offset);
}

/** "2026-11-09" for a UTC date. */
export function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Parse a strict "YYYY-MM-DD" string; returns null for anything invalid. */
export function parseISODate(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || toISODate(date) !== value ? null : date;
}

/** Full years between a "YYYY-MM-DD" birth date and `on`. */
export function ageOn(dateOfBirth: string, on: Date) {
  const [year, month, day] = dateOfBirth.split("-").map(Number) as [number, number, number];
  let age = on.getUTCFullYear() - year;
  const beforeBirthday =
    on.getUTCMonth() + 1 < month || (on.getUTCMonth() + 1 === month && on.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}
