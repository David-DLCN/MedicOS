import { getNow, listAppointments, listPatients, listTransactions } from "@/lib/data/repository";
import {
  matchesQuery,
  matchesSegment,
  sortSummaries,
  summarizePatients,
  type PatientSegment,
  type PatientSort,
} from "@/lib/domain/patients";

export const PAGE_SIZE = 20;

export interface PatientListParams {
  query: string;
  segment: PatientSegment;
  sort: PatientSort;
  page: number;
}

export async function getPatientList(params: PatientListParams) {
  const now = getNow();
  const [patients, appointments, transactions] = await Promise.all([
    listPatients(),
    listAppointments(),
    listTransactions(),
  ]);

  const summaries = summarizePatients({ now, patients, appointments, transactions });

  const counts: Record<PatientSegment, number> = {
    all: summaries.length,
    active: summaries.filter((s) => s.isActive).length,
    new: summaries.filter((s) => s.isNew).length,
    inactive: summaries.filter((s) => !s.isActive).length,
  };

  const filtered = sortSummaries(
    summaries.filter((s) => matchesSegment(s, params.segment) && matchesQuery(s.patient, params.query)),
    params.sort,
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), pageCount);

  return {
    now,
    counts,
    total: filtered.length,
    page,
    pageCount,
    rows: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    withUpcoming: summaries.filter((s) => s.nextAppointment).length,
  };
}
