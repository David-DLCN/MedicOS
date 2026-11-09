import type { ID } from "./types";

/** Build an id → entity map for O(1) joins in the UI layer. */
export function indexById<T extends { id: ID }>(items: readonly T[]): Map<ID, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function patientName(patient: { firstName: string; lastName: string } | undefined) {
  return patient ? `${patient.firstName} ${patient.lastName}` : "Paciente desconocido";
}
