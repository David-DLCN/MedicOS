/**
 * Patient-level aggregates, computed from appointments and transactions.
 * Pure functions: no hard-coded figures (see AGENTS.md).
 */
import { addDays, isWithin, startOfMonth } from "./dates";
import type { Appointment, ID, Patient, Transaction } from "./types";

/** A patient counts as active with a completed consultation in the last 90 days. */
export const ACTIVE_WINDOW_DAYS = 90;

export type PatientSegment = "all" | "active" | "new" | "inactive";

export interface PatientSummary {
  patient: Patient;
  completedVisits: number;
  noShows: number;
  lastVisit: string | null;
  nextAppointment: Appointment | null;
  /** Net paid amount (minor units). */
  totalPaid: number;
  /** Pending charges (minor units). */
  pendingAmount: number;
  isActive: boolean;
  isNew: boolean;
}

export function summarizePatients(input: {
  now: Date;
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}): PatientSummary[] {
  const { now, patients, appointments, transactions } = input;
  const nowMs = now.getTime();
  const activeSince = addDays(now, -ACTIVE_WINDOW_DAYS);
  const monthStart = startOfMonth(now);

  const appointmentsByPatient = new Map<ID, Appointment[]>();
  for (const apt of appointments) {
    const list = appointmentsByPatient.get(apt.patientId) ?? [];
    list.push(apt);
    appointmentsByPatient.set(apt.patientId, list);
  }
  const transactionsByPatient = new Map<ID, Transaction[]>();
  for (const txn of transactions) {
    const list = transactionsByPatient.get(txn.patientId) ?? [];
    list.push(txn);
    transactionsByPatient.set(txn.patientId, list);
  }

  return patients.map((patient) => {
    const apts = appointmentsByPatient.get(patient.id) ?? [];
    const txns = transactionsByPatient.get(patient.id) ?? [];

    let completedVisits = 0;
    let noShows = 0;
    let lastVisit: string | null = null;
    let nextAppointment: Appointment | null = null;

    for (const apt of apts) {
      if (apt.status === "completed") {
        completedVisits += 1;
        if (!lastVisit || apt.startsAt > lastVisit) lastVisit = apt.startsAt;
      } else if (apt.status === "no_show") {
        noShows += 1;
      } else if (
        (apt.status === "scheduled" || apt.status === "confirmed") &&
        Date.parse(apt.startsAt) >= nowMs &&
        (!nextAppointment || apt.startsAt < nextAppointment.startsAt)
      ) {
        nextAppointment = apt;
      }
    }

    return {
      patient,
      completedVisits,
      noShows,
      lastVisit,
      nextAppointment,
      totalPaid: txns.filter((t) => t.status === "paid").reduce((sum, t) => sum + t.amount.amount, 0),
      pendingAmount: txns.filter((t) => t.status === "pending").reduce((sum, t) => sum + t.amount.amount, 0),
      isActive: lastVisit !== null && isWithin(lastVisit, activeSince, now),
      isNew: isWithin(patient.createdAt, monthStart, now),
    };
  });
}

export function matchesSegment(summary: PatientSummary, segment: PatientSegment) {
  switch (segment) {
    case "active":
      return summary.isActive;
    case "new":
      return summary.isNew;
    case "inactive":
      return !summary.isActive;
    default:
      return true;
  }
}

/** Lowercase, accent-insensitive text for search ("García" matches "garcia"). */
export function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesQuery(patient: Patient, query: string) {
  const q = normalizeSearch(query);
  if (!q) return true;
  const haystack = normalizeSearch(
    `${patient.firstName} ${patient.lastName} ${patient.email} ${patient.phone.replace(/\s/g, "")}`,
  );
  return q.split(/\s+/).every((term) => haystack.includes(term));
}

export type PatientSort = "name" | "recent" | "visits";

export function sortSummaries(summaries: PatientSummary[], sort: PatientSort) {
  const byName = (a: PatientSummary, b: PatientSummary) =>
    `${a.patient.lastName} ${a.patient.firstName}`.localeCompare(
      `${b.patient.lastName} ${b.patient.firstName}`,
      "es",
    );
  return [...summaries].sort((a, b) => {
    if (sort === "recent") return (b.lastVisit ?? "").localeCompare(a.lastVisit ?? "") || byName(a, b);
    if (sort === "visits") return b.completedVisits - a.completedVisits || byName(a, b);
    return byName(a, b);
  });
}
