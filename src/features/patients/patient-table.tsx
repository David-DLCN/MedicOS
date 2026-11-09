import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { ageOn } from "@/lib/domain/dates";
import { patientName } from "@/lib/domain/lookup";
import type { PatientSummary } from "@/lib/domain/patients";
import { formatAmount, formatDate, formatNumber, formatTime } from "@/lib/format";

export function PatientTable({ rows, now }: { rows: PatientSummary[]; now: Date }) {
  return (
    <Table className="min-w-[44rem]">
      <thead>
        <tr>
          <Th>Paciente</Th>
          <Th className="hidden lg:table-cell">Contacto</Th>
          <Th>Última consulta</Th>
          <Th>Próxima cita</Th>
          <Th className="text-right">Consultas</Th>
          <Th className="text-right">Pendiente</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const name = patientName(row.patient);
          return (
            <tr key={row.patient.id} className="group">
              <Td>
                <Link href={`/patients/${row.patient.id}`} className="flex items-center gap-3">
                  <Avatar name={name} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium group-hover:underline">{name}</span>
                      {row.isNew ? <Badge tone="info">Nuevo</Badge> : null}
                    </span>
                    <span className="block text-xs text-muted">
                      {formatNumber(ageOn(row.patient.dateOfBirth, now))} años
                    </span>
                  </span>
                </Link>
              </Td>
              <Td className="hidden text-muted lg:table-cell">
                <span className="block max-w-[16rem] truncate">{row.patient.email}</span>
                <span className="block text-xs">{row.patient.phone}</span>
              </Td>
              <Td className="tabular text-muted">
                {row.lastVisit ? formatDate(row.lastVisit) : <span className="text-subtle">Sin consultas</span>}
              </Td>
              <Td className="tabular">
                {row.nextAppointment ? (
                  <Link href={`/appointments/${row.nextAppointment.id}`} className="hover:underline">
                    {formatDate(row.nextAppointment.startsAt, "short")} ·{" "}
                    {formatTime(row.nextAppointment.startsAt)}
                  </Link>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Td>
              <Td className="tabular text-right">{formatNumber(row.completedVisits)}</Td>
              <Td className="tabular text-right">
                {row.pendingAmount > 0 ? (
                  <span className="font-medium">{formatAmount(row.pendingAmount)}</span>
                ) : (
                  <span className="text-subtle">—</span>
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}
