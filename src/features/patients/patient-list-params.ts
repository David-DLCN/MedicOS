import type { PatientSegment, PatientSort } from "@/lib/domain/patients";
import type { PatientListParams } from "./get-patients-data";

type RawParams = Record<string, string | string[] | undefined>;

const SEGMENTS: PatientSegment[] = ["all", "active", "new", "inactive"];
const SORTS: PatientSort[] = ["name", "recent", "visits"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Parse and validate the URL search params of the patient list. */
export function parsePatientListParams(raw: RawParams): PatientListParams {
  const segment = first(raw.segment) as PatientSegment | undefined;
  const sort = first(raw.sort) as PatientSort | undefined;
  const page = Number.parseInt(first(raw.page) ?? "1", 10);
  return {
    query: (first(raw.q) ?? "").slice(0, 100),
    segment: segment && SEGMENTS.includes(segment) ? segment : "all",
    sort: sort && SORTS.includes(sort) ? sort : "name",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Build a list URL, keeping current params and dropping defaults. */
export function patientListHref(current: PatientListParams, changes: Partial<PatientListParams>) {
  const next = { ...current, page: 1, ...changes };
  const search = new URLSearchParams();
  if (next.query) search.set("q", next.query);
  if (next.segment !== "all") search.set("segment", next.segment);
  if (next.sort !== "name") search.set("sort", next.sort);
  if (next.page > 1) search.set("page", String(next.page));
  const qs = search.toString();
  return qs ? `/patients?${qs}` : "/patients";
}

export const SEGMENT_LABEL: Record<PatientSegment, string> = {
  all: "Todos",
  active: "Activos",
  new: "Nuevos este mes",
  inactive: "Inactivos",
};

export const SORT_LABEL: Record<PatientSort, string> = {
  name: "Apellido (A–Z)",
  recent: "Última consulta",
  visits: "Más consultas",
};
