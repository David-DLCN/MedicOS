/**
 * Daily cash close ("cierre de caja"): what was collected on a given day, by
 * payment method, reconciled against the consultations performed that day.
 */
import { addDays, isWithin, startOfDay } from "./dates";
import type { Appointment, PaymentMethod, Transaction } from "./types";

export const METHOD_ORDER: PaymentMethod[] = ["cash", "card", "transfer", "apple_pay"];

export interface CashClose {
  day: Date;
  /** Paid transactions settled that day, oldest first. */
  collected: Transaction[];
  byMethod: Record<PaymentMethod, { amount: number; count: number }>;
  totalCollected: number;
  /** Cash that should physically be in the drawer. */
  expectedCash: number;
  refunds: { amount: number; count: number };
  completedAppointments: number;
  /** Consultations performed that day that had been prepaid online on an earlier day. */
  prepaidEarlier: number;
  /** Consultations performed that day that are still unpaid. */
  pendingFromDay: Transaction[];
}

export function cashClose(day: Date, transactions: Transaction[], appointments: Appointment[]): CashClose {
  const from = startOfDay(day);
  const to = addDays(from, 1);

  const collected = transactions
    .filter((txn) => txn.status === "paid" && isWithin(txn.settledAt, from, to))
    .sort((a, b) => (a.settledAt ?? "").localeCompare(b.settledAt ?? ""));

  const byMethod = Object.fromEntries(METHOD_ORDER.map((method) => [method, { amount: 0, count: 0 }])) as CashClose["byMethod"];
  for (const txn of collected) {
    byMethod[txn.method].amount += txn.amount.amount;
    byMethod[txn.method].count += 1;
  }

  const refunded = transactions.filter((txn) => txn.status === "refunded" && isWithin(txn.settledAt, from, to));

  const dayAppointmentIds = new Set(
    appointments.filter((apt) => apt.status === "completed" && isWithin(apt.startsAt, from, to)).map((apt) => apt.id),
  );

  const prepaidEarlier = transactions.filter(
    (txn) =>
      txn.status === "paid" &&
      dayAppointmentIds.has(txn.appointmentId) &&
      txn.settledAt !== null &&
      Date.parse(txn.settledAt) < from.getTime(),
  ).length;

  return {
    day: from,
    prepaidEarlier,
    collected,
    byMethod,
    totalCollected: collected.reduce((sum, txn) => sum + txn.amount.amount, 0),
    expectedCash: byMethod.cash.amount,
    refunds: {
      amount: refunded.reduce((sum, txn) => sum + txn.amount.amount, 0),
      count: refunded.length,
    },
    completedAppointments: dayAppointmentIds.size,
    pendingFromDay: transactions.filter((txn) => txn.status === "pending" && dayAppointmentIds.has(txn.appointmentId)),
  };
}
