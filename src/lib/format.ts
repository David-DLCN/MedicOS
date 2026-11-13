import { APP_CONFIG } from "@/lib/config";
import type { Money } from "@/lib/domain/types";

const { locale, timeZone } = APP_CONFIG;

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const compactCurrencyFormatters = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: string, compact: boolean) {
  const cache = compact ? compactCurrencyFormatters : currencyFormatters;
  let formatter = cache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      ...(compact
        ? { notation: "compact", minimumFractionDigits: 0, maximumFractionDigits: 1 }
        : { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    });
    cache.set(currency, formatter);
  }
  return formatter;
}

/** Format an amount stored in minor units (cents). */
export function formatMoney(money: Money, options: { compact?: boolean } = {}) {
  return currencyFormatter(money.currency, options.compact ?? false).format(
    money.amount / 100,
  );
}

/** Format a raw minor-unit amount in the default currency. */
export function formatAmount(amountMinor: number, options: { compact?: boolean } = {}) {
  return formatMoney({ amount: amountMinor, currency: APP_CONFIG.currency }, options);
}

const integerFormatter = new Intl.NumberFormat(locale);
export function formatNumber(value: number) {
  return integerFormatter.format(value);
}

const percentFormatter = new Intl.NumberFormat(locale, {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});
/** Format a ratio (0.12 → "+12 %"). */
export function formatChange(ratio: number) {
  return percentFormatter.format(ratio);
}

const shareFormatter = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
/** Format a share of a whole (0.42 → "42 %"). */
export function formatShare(ratio: number) {
  return shareFormatter.format(ratio);
}

const dateFormatters = {
  short: new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone }),
  medium: new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone,
  }),
  long: new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone }),
  weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }),
  month: new Intl.DateTimeFormat(locale, { month: "short", timeZone }),
  monthYear: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone }),
  time: new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }),
};

export type DateFormat = keyof typeof dateFormatters;

export function formatDate(value: string | Date, format: DateFormat = "medium") {
  return dateFormatters[format].format(typeof value === "string" ? new Date(value) : value);
}

export function formatTime(value: string | Date) {
  return formatDate(value, "time");
}

/** Capitalise the first letter (Spanish month / weekday names are lowercase). */
export function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function initials(fullName: string) {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

const sizeFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
/** Human-readable file size (1 536 → "1,5 KB"). */
export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${sizeFormatter.format(bytes)} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

/** "1 cobro" / "3 cobros": count with a singular or plural noun. */
export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
