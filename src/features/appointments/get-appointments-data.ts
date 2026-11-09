import {
  getNow,
  getPracticeContext,
  listAppointments,
  listPatients,
  listTransactionsForAppointments,
} from "@/lib/data/repository";
import { addDays, isSameDay, startOfDay, startOfWeek } from "@/lib/domain/dates";
import { indexById, patientName } from "@/lib/domain/lookup";
import type { Appointment, AppointmentStatus, ConsultationType, Transaction } from "@/lib/domain/types";

export type AgendaView = "day" | "week";

export interface AppointmentRow {
  appointment: Appointment;
  patientName: string;
  consultation: ConsultationType | undefined;
  payment: Transaction | null;
}

export interface AgendaDay {
  date: Date;
  isToday: boolean;
  rows: AppointmentRow[];
}

export interface AgendaSummary {
  /** Appointments that are not cancelled. */
  active: number;
  byStatus: Record<AppointmentStatus, number>;
  /** Sum of consultation prices for non-cancelled, non-no-show appointments (minor units). */
  expectedRevenue: number;
  /** Paid transactions linked to the period's appointments (minor units). */
  collected: number;
}

const BILLABLE: AppointmentStatus[] = ["scheduled", "confirmed", "completed"];

export async function getAgendaData(anchor: Date, view: AgendaView) {
  const now = getNow();
  const from = view === "week" ? startOfWeek(anchor) : startOfDay(anchor);
  const to = addDays(from, view === "week" ? 7 : 1);

  const [context, patients, appointments] = await Promise.all([
    getPracticeContext(),
    listPatients(),
    listAppointments({ from, to }),
  ]);
  const transactions = await listTransactionsForAppointments(appointments.map((apt) => apt.id));

  const patientsById = indexById(patients);
  const typesById = indexById(context.consultationTypes);
  const paymentByAppointment = new Map(transactions.map((txn) => [txn.appointmentId, txn]));

  const rows: AppointmentRow[] = [...appointments]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((appointment) => ({
      appointment,
      patientName: patientName(patientsById.get(appointment.patientId)),
      consultation: typesById.get(appointment.consultationTypeId),
      payment: paymentByAppointment.get(appointment.id) ?? null,
    }));

  const byStatus: Record<AppointmentStatus, number> = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    no_show: 0,
  };
  let expectedRevenue = 0;
  for (const row of rows) {
    byStatus[row.appointment.status] += 1;
    if (BILLABLE.includes(row.appointment.status)) expectedRevenue += row.consultation?.price.amount ?? 0;
  }
  const collected = transactions
    .filter((txn) => txn.status === "paid")
    .reduce((sum, txn) => sum + txn.amount.amount, 0);

  const dayCount = view === "week" ? 7 : 1;
  const days: AgendaDay[] = Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(from, index);
    return {
      date,
      isToday: isSameDay(date, now),
      rows: rows.filter((row) => isSameDay(new Date(row.appointment.startsAt), date)),
    };
  });

  const summary: AgendaSummary = {
    active: rows.length - byStatus.cancelled,
    byStatus,
    expectedRevenue,
    collected,
  };

  return { now, from, to, days, summary };
}
