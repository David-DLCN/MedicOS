/**
 * Pure business metrics.
 *
 * Every number on the dashboard is computed here from the raw entities, never
 * hard-coded in a component. The same functions will work unchanged on data
 * coming from the real backend.
 */
import type { Appointment, AppointmentStatus, Patient, Transaction } from "./types";
import { addDays, addMonths, isSameDay, isWithin, startOfDay, startOfMonth } from "./dates";

export interface PeriodComparison {
  current: number;
  previous: number;
  /** Relative change (0.12 = +12 %), or null when there is no baseline. */
  change: number | null;
}

function compare(current: number, previous: number): PeriodComparison {
  return {
    current,
    previous,
    change: previous === 0 ? null : (current - previous) / previous,
  };
}

/** Net revenue = settled payments that were not refunded, by settlement date. */
export function revenueBetween(transactions: Transaction[], from: Date, to: Date) {
  return transactions
    .filter((txn) => txn.status === "paid" && isWithin(txn.settledAt, from, to))
    .reduce((sum, txn) => sum + txn.amount.amount, 0);
}

export function completedBetween(appointments: Appointment[], from: Date, to: Date) {
  return appointments.filter(
    (apt) => apt.status === "completed" && isWithin(apt.startsAt, from, to),
  ).length;
}

export function newPatientsBetween(patients: Patient[], from: Date, to: Date) {
  return patients.filter((patient) => isWithin(patient.createdAt, from, to)).length;
}

/**
 * Month-to-date vs. the same number of days of the previous month, so a
 * partial month is never compared with a full one.
 */
export function monthToDateRanges(now: Date) {
  const currentFrom = startOfMonth(now);
  const elapsed = now.getTime() - currentFrom.getTime();
  const previousFrom = addMonths(currentFrom, -1);
  return {
    current: { from: currentFrom, to: now },
    previous: { from: previousFrom, to: new Date(previousFrom.getTime() + elapsed) },
  };
}

export interface OverviewMetrics {
  revenue: PeriodComparison;
  completedAppointments: PeriodComparison;
  newPatients: PeriodComparison;
  activePatients: number;
  pending: { amount: number; count: number };
}

export function overviewMetrics(input: {
  now: Date;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}): OverviewMetrics {
  const { now, patients, appointments, transactions } = input;
  const { current, previous } = monthToDateRanges(now);

  const activeSince = addDays(now, -90);
  const activePatients = new Set(
    appointments
      .filter((apt) => apt.status === "completed" && isWithin(apt.startsAt, activeSince, now))
      .map((apt) => apt.patientId),
  ).size;

  const pendingTxns = transactions.filter((txn) => txn.status === "pending");

  return {
    revenue: compare(
      revenueBetween(transactions, current.from, current.to),
      revenueBetween(transactions, previous.from, previous.to),
    ),
    completedAppointments: compare(
      completedBetween(appointments, current.from, current.to),
      completedBetween(appointments, previous.from, previous.to),
    ),
    newPatients: compare(
      newPatientsBetween(patients, current.from, current.to),
      newPatientsBetween(patients, previous.from, previous.to),
    ),
    activePatients,
    pending: {
      amount: pendingTxns.reduce((sum, txn) => sum + txn.amount.amount, 0),
      count: pendingTxns.length,
    },
  };
}

export interface MonthlyPoint {
  /** First day of the month, ISO string. */
  month: string;
  revenue: number;
  completedAppointments: number;
  /** True for the month that contains `now` (partial data). */
  partial: boolean;
}

export function monthlySeries(
  input: { now: Date; appointments: Appointment[]; transactions: Transaction[] },
  months = 6,
): MonthlyPoint[] {
  const { now, appointments, transactions } = input;
  const thisMonth = startOfMonth(now);
  return Array.from({ length: months }, (_, index) => {
    const from = addMonths(thisMonth, index - (months - 1));
    const to = index === months - 1 ? now : addMonths(from, 1);
    return {
      month: from.toISOString(),
      revenue: revenueBetween(transactions, from, to),
      completedAppointments: completedBetween(appointments, from, to),
      partial: index === months - 1,
    };
  });
}

const OPEN_STATUSES: AppointmentStatus[] = ["scheduled", "confirmed"];

export function upcomingAppointments(appointments: Appointment[], now: Date, limit = 6) {
  return appointments
    .filter((apt) => OPEN_STATUSES.includes(apt.status) && Date.parse(apt.startsAt) >= now.getTime())
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .slice(0, limit);
}

export function appointmentsOnDay(appointments: Appointment[], day: Date) {
  return appointments
    .filter((apt) => isSameDay(new Date(apt.startsAt), day))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export function statusBreakdown(appointments: Appointment[], from: Date, to: Date) {
  const counts: Record<AppointmentStatus, number> = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
  for (const apt of appointments) {
    if (isWithin(apt.startsAt, from, to)) counts[apt.status] += 1;
  }
  return counts;
}

export function recentTransactions(transactions: Transaction[], limit = 6) {
  return [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Operational alerts — derived from data, never hard-coded.
// ---------------------------------------------------------------------------

/** "attention" = a problem that needs action (red); "info" = useful heads-up (blue). */
export type AlertSeverity = "info" | "attention";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  href: string;
}

export function operationalAlerts(input: {
  now: Date;
  appointments: Appointment[];
  transactions: Transaction[];
}): OperationalAlert[] {
  const { now, appointments, transactions } = input;
  const alerts: OperationalAlert[] = [];

  const unconfirmedSoon = appointments.filter(
    (apt) =>
      apt.status === "scheduled" && isWithin(apt.startsAt, now, addDays(startOfDay(now), 3)),
  ).length;
  if (unconfirmedSoon > 0) {
    alerts.push({
      id: "unconfirmed",
      severity: "info",
      title: `${unconfirmedSoon} citas sin confirmar`,
      description: "Programadas para hoy, mañana o pasado mañana.",
      href: "/appointments?view=week",
    });
  }

  const overdue = transactions.filter(
    (txn) => txn.status === "pending" && Date.parse(txn.createdAt) < addDays(now, -7).getTime(),
  );
  if (overdue.length > 0) {
    alerts.push({
      id: "overdue",
      severity: "attention",
      title: `${overdue.length} pagos pendientes con más de 7 días`,
      description: "Consultas realizadas que aún no se han cobrado.",
      href: "/finance#pendientes",
    });
  }

  const weekAgo = addDays(now, -7);
  const noShows = appointments.filter(
    (apt) => apt.status === "no_show" && isWithin(apt.startsAt, weekAgo, now),
  ).length;
  if (noShows > 0) {
    alerts.push({
      id: "no-shows",
      severity: "info",
      title: `${noShows} inasistencias en los últimos 7 días`,
      description: "Considera activar recordatorios automáticos.",
      href: "/settings/integrations",
    });
  }

  return alerts;
}
