import type { FinancePeriod } from "@/lib/domain/finance";
import type { PaymentMethod, PaymentStatus } from "@/lib/domain/types";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "./labels";

type RawParams = Record<string, string | string[] | undefined>;

export interface FinanceParams {
  period: FinancePeriod;
  status: PaymentStatus | "all";
  method: PaymentMethod | "all";
  page: number;
}

export const PERIOD_LABEL: Record<FinancePeriod, string> = {
  month: "Este mes",
  last_month: "Mes anterior",
  "90d": "Últimos 90 días",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function oneOf<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseFinanceParams(raw: RawParams): FinanceParams {
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  return {
    period: oneOf(first(raw.period), Object.keys(PERIOD_LABEL) as FinancePeriod[], "month"),
    status: oneOf(first(raw.status), ["all", ...(Object.keys(PAYMENT_STATUS) as PaymentStatus[])], "all"),
    method: oneOf(first(raw.method), ["all", ...(Object.keys(PAYMENT_METHOD_LABEL) as PaymentMethod[])], "all"),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Build a finance URL keeping current params; resets the page unless given. */
export function financeHref(current: FinanceParams, changes: Partial<FinanceParams>, hash = "") {
  const next = { ...current, page: 1, ...changes };
  const search = new URLSearchParams();
  if (next.period !== "month") search.set("period", next.period);
  if (next.status !== "all") search.set("status", next.status);
  if (next.method !== "all") search.set("method", next.method);
  if (next.page > 1) search.set("page", String(next.page));
  const qs = search.toString();
  return `/finance${qs ? `?${qs}` : ""}${hash}`;
}
