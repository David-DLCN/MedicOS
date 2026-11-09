import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ageOn } from "@/lib/domain/dates";
import { patientName } from "@/lib/domain/lookup";
import type { PatientSummary } from "@/lib/domain/patients";
import { formatAmount, formatDate, formatNumber, formatTime } from "@/lib/format";

/** Compact patient list for small screens: only what matters at a glance. */
export function PatientCards({ rows, now }: { rows: PatientSummary[]; now: Date }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => {
        const name = patientName(row.patient);
        return (
          <li key={row.patient.id}>
            <Link
              href={`/patients/${row.patient.id}`}
              className="-mx-5 flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
            >
              <Avatar name={name} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium">{name}</span>
                  {row.isNew ? <Badge tone="info">Nuevo</Badge> : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {formatNumber(ageOn(row.patient.dateOfBirth, now))} años ·{" "}
                  {formatNumber(row.completedVisits)} consultas
                  {row.nextAppointment
                    ? ` · Próxima: ${formatDate(row.nextAppointment.startsAt, "short")} ${formatTime(row.nextAppointment.startsAt)}`
                    : ""}
                </p>
              </div>
              {row.pendingAmount > 0 ? (
                <span className="tabular shrink-0 text-sm font-medium">{formatAmount(row.pendingAmount)}</span>
              ) : null}
              <ChevronRight className="size-4 shrink-0 text-subtle" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
