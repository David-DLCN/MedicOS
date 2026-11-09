/**
 * Financial aggregates for the Finance module. Pure functions over
 * transactions; every figure on screen is derived here (see AGENTS.md).
 */
import { addDays, addMonths, isWithin, startOfDay, startOfMonth } from "./dates";
import { monthToDateRanges, type PeriodComparison } from "./metrics";
import type { ConsultationType, ID, PaymentMethod, PaymentStatus, Transaction } from "./types";

// ---------------------------------------------------------------------------
// Periods
// ---------------------------------------------------------------------------

export type FinancePeriod = "month" | "last_month" | "90d";

export interface DateWindow {
  from: Date;
  to: Date;
}

export interface PeriodRanges {
  current: DateWindow;
  previous: DateWindow;
}

/** Current window and the equivalent previous window to compare against. */
export function periodRanges(period: FinancePeriod, now: Date): PeriodRanges {
  if (period === "last_month") {
    const from = addMonths(startOfMonth(now), -1);
    return {
      current: { from, to: startOfMonth(now) },
      previous: { from: addMonths(from, -1), to: from },
    };
  }
  if (period === "90d") {
    const to = now;
    const from = addDays(startOfDay(now), -89);
    const length = to.getTime() - from.getTime();
    return {
      current: { from, to },
      previous: { from: new Date(from.getTime() - length), to: from },
    };
  }
  return monthToDateRanges(now);
}

/** Date that places a transaction in time: when money moved, or when it was registered. */
export function activityDate(txn: Transaction) {
  return txn.settledAt ?? txn.createdAt;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function sumWhere(transactions: Transaction[], status: PaymentStatus, window: DateWindow) {
  let amount = 0;
  let count = 0;
  for (const txn of transactions) {
    if (txn.status === status && isWithin(txn.settledAt, window.from, window.to)) {
      amount += txn.amount.amount;
      count += 1;
    }
  }
  return { amount, count };
}

function compare(current: number, previous: number): PeriodComparison {
  return { current, previous, change: previous === 0 ? null : (current - previous) / previous };
}

export interface FinanceSummary {
  revenue: PeriodComparison;
  paidCount: number;
  /** Net revenue / number of paid consultations (minor units). */
  averageTicket: number;
  refunds: { amount: number; count: number };
  /** Outstanding balance today, independent of the selected period. */
  pending: { amount: number; count: number; overdueCount: number };
}

export const OVERDUE_DAYS = 7;

export function financeSummary(transactions: Transaction[], ranges: PeriodRanges, now: Date): FinanceSummary {
  const paid = sumWhere(transactions, "paid", ranges.current);
  const previousPaid = sumWhere(transactions, "paid", ranges.previous);
  const pending = pendingPayments(transactions, now);

  return {
    revenue: compare(paid.amount, previousPaid.amount),
    paidCount: paid.count,
    averageTicket: paid.count === 0 ? 0 : Math.round(paid.amount / paid.count),
    refunds: sumWhere(transactions, "refunded", ranges.current),
    pending: {
      amount: pending.reduce((sum, item) => sum + item.transaction.amount.amount, 0),
      count: pending.length,
      overdueCount: pending.filter((item) => item.overdue).length,
    },
  };
}

// ---------------------------------------------------------------------------
// Breakdowns
// ---------------------------------------------------------------------------

export interface BreakdownItem<K extends string> {
  key: K;
  amount: number;
  count: number;
  /** Share of the total amount (0–1). */
  share: number;
}

function toBreakdown<K extends string>(totals: Map<K, { amount: number; count: number }>) {
  const total = [...totals.values()].reduce((sum, item) => sum + item.amount, 0);
  return [...totals.entries()]
    .map(([key, value]) => ({ key, ...value, share: total === 0 ? 0 : value.amount / total }))
    .sort((a, b) => b.amount - a.amount);
}

function paidInWindow(transactions: Transaction[], window: DateWindow) {
  return transactions.filter((txn) => txn.status === "paid" && isWithin(txn.settledAt, window.from, window.to));
}

export function revenueByMethod(transactions: Transaction[], window: DateWindow): BreakdownItem<PaymentMethod>[] {
  const totals = new Map<PaymentMethod, { amount: number; count: number }>();
  for (const txn of paidInWindow(transactions, window)) {
    const entry = totals.get(txn.method) ?? { amount: 0, count: 0 };
    entry.amount += txn.amount.amount;
    entry.count += 1;
    totals.set(txn.method, entry);
  }
  return toBreakdown(totals);
}

export function revenueByConsultation(
  transactions: Transaction[],
  window: DateWindow,
  consultationTypeOf: (appointmentId: ID) => ConsultationType | undefined,
): BreakdownItem<string>[] {
  const totals = new Map<string, { amount: number; count: number }>();
  for (const txn of paidInWindow(transactions, window)) {
    const name = consultationTypeOf(txn.appointmentId)?.name ?? "Otras";
    const entry = totals.get(name) ?? { amount: 0, count: 0 };
    entry.amount += txn.amount.amount;
    entry.count += 1;
    totals.set(name, entry);
  }
  return toBreakdown(totals);
}

// ---------------------------------------------------------------------------
// Pending payments
// ---------------------------------------------------------------------------

export interface PendingPayment {
  transaction: Transaction;
  ageDays: number;
  overdue: boolean;
}

/** All pending payments, oldest first. */
export function pendingPayments(transactions: Transaction[], now: Date): PendingPayment[] {
  return transactions
    .filter((txn) => txn.status === "pending")
    .map((transaction) => {
      const ageDays = Math.floor((now.getTime() - Date.parse(transaction.createdAt)) / 86_400_000);
      return { transaction, ageDays, overdue: ageDays > OVERDUE_DAYS };
    })
    .sort((a, b) => a.transaction.createdAt.localeCompare(b.transaction.createdAt));
}

// ---------------------------------------------------------------------------
// Transaction list
// ---------------------------------------------------------------------------

export function filterTransactions(
  transactions: Transaction[],
  filters: { window: DateWindow; status: PaymentStatus | "all"; method: PaymentMethod | "all" },
) {
  return transactions
    .filter(
      (txn) =>
        isWithin(activityDate(txn), filters.window.from, filters.window.to) &&
        (filters.status === "all" || txn.status === filters.status) &&
        (filters.method === "all" || txn.method === filters.method),
    )
    .sort((a, b) => activityDate(b).localeCompare(activityDate(a)));
}
