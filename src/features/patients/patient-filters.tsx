import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PatientSegment } from "@/lib/domain/patients";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PatientListParams } from "./get-patients-data";
import { SEGMENT_LABEL, SORT_LABEL, patientListHref } from "./patient-list-params";

/**
 * Search, segment and sort controls. A plain GET form: works without
 * JavaScript and keeps every view shareable through the URL.
 */
export function PatientFilters({
  params,
  counts,
}: {
  params: PatientListParams;
  counts: Record<PatientSegment, number>;
}) {
  return (
    <div className="space-y-3">
      <form action="/patients" method="get" role="search" className="flex flex-col gap-2 sm:flex-row">
        {params.segment !== "all" ? <input type="hidden" name="segment" value={params.segment} /> : null}
        <label className="relative flex-1">
          <span className="sr-only">Buscar paciente</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={params.query}
            placeholder="Buscar por nombre, correo o teléfono"
            className="h-9 w-full rounded-lg border border-border bg-surface pr-3 pl-9 text-sm placeholder:text-subtle focus:border-primary focus:outline-2 focus:outline-primary/20"
          />
        </label>
        <div className="flex gap-2">
          <label className="flex-1 sm:flex-none">
            <span className="sr-only">Ordenar por</span>
            <select
              name="sort"
              defaultValue={params.sort}
              className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20"
            >
              {Object.entries(SORT_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary">
            Buscar
          </Button>
        </div>
      </form>

      <nav aria-label="Filtrar pacientes" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {(Object.keys(SEGMENT_LABEL) as PatientSegment[]).map((segment) => {
          const active = params.segment === segment;
          return (
            <Link
              key={segment}
              href={patientListHref(params, { segment })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              {SEGMENT_LABEL[segment]}
              <span className="tabular text-xs opacity-70">{formatNumber(counts[segment])}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
