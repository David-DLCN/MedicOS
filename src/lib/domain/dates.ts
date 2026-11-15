/**
 * Calendar helpers in the clinic's time zone (see APP_CONFIG.utcOffsetMinutes).
 *
 * Instants are stored in UTC. To reason about the clinic's calendar (what
 * "today" or "this month" means), an instant is shifted by the clinic offset so
 * that its UTC fields read the clinic's wall-clock time, and shifted back after.
 */
import { APP_CONFIG } from "@/lib/config";

const DAY_MS = 24 * 60 * 60 * 1000;
const OFFSET_MS = APP_CONFIG.utcOffsetMinutes * 60 * 1000;

/** Instant → "wall clock" date whose UTC fields are the clinic's local fields. */
function toWall(date: Date) {
  return new Date(date.getTime() + OFFSET_MS);
}

/** "Wall clock" date → real instant. */
function fromWall(wall: Date) {
  return new Date(wall.getTime() - OFFSET_MS);
}

export function startOfDay(date: Date) {
  const wall = toWall(date);
  return fromWall(new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), wall.getUTCDate())));
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

export function startOfMonth(date: Date) {
  const wall = toWall(date);
  return fromWall(new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth(), 1)));
}

export function addMonths(date: Date, months: number) {
  const wall = toWall(date);
  return fromWall(new Date(Date.UTC(wall.getUTCFullYear(), wall.getUTCMonth() + months, 1)));
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isWithin(value: string | null, from: Date, to: Date) {
  if (!value) return false;
  const time = Date.parse(value);
  return time >= from.getTime() && time < to.getTime();
}

/** Monday-based week start in the clinic's calendar. */
export function startOfWeek(date: Date) {
  const day = startOfDay(date);
  const offset = (toWall(day).getUTCDay() + 6) % 7; // Monday = 0
  return addDays(day, -offset);
}

/** "2026-11-09": the clinic-calendar date of an instant. */
export function toISODate(date: Date) {
  return toWall(date).toISOString().slice(0, 10);
}

/** Parse a strict "YYYY-MM-DD" (clinic calendar) into the instant that day starts; null if invalid. */
export function parseISODate(value: string | undefined | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const wall = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(wall.getTime()) || wall.toISOString().slice(0, 10) !== value) return null;
  return fromWall(wall);
}

/** Hour of the day (0–23) on the clinic's clock. */
export function localHour(date: Date) {
  return toWall(date).getUTCHours();
}

/** Full years between a "YYYY-MM-DD" birth date and `on` (clinic calendar). */
export function ageOn(dateOfBirth: string, on: Date) {
  const [year, month, day] = dateOfBirth.split("-").map(Number) as [number, number, number];
  const wall = toWall(on);
  let age = wall.getUTCFullYear() - year;
  const beforeBirthday =
    wall.getUTCMonth() + 1 < month || (wall.getUTCMonth() + 1 === month && wall.getUTCDate() < day);
  if (beforeBirthday) age -= 1;
  return age;
}
