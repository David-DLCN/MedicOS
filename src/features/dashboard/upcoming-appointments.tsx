import Link from "next/link";
import { Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { APPOINTMENT_STATUS, MODALITY_LABEL } from "@/features/appointments/labels";
import type { Appointment } from "@/lib/domain/types";
import { capitalize, formatDate, formatTime } from "@/lib/format";

export interface UpcomingAppointmentRow {
  appointment: Appointment;
  patientName: string;
  consultationName: string;
  isToday: boolean;
}

export function UpcomingAppointments({ rows }: { rows: UpcomingAppointmentRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Próximas citas"
        description="Tu agenda inmediata."
        action={
          <ButtonLink href="/appointments" variant="ghost" size="sm">
            Ver agenda
          </ButtonLink>
        }
      />
      <CardContent className="pt-2">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No hay citas próximas.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map(({ appointment, patientName, consultationName, isToday }) => {
              const status = APPOINTMENT_STATUS[appointment.status];
              return (
                <li key={appointment.id}>
                  <Link
                    href={`/appointments/${appointment.id}`}
                    className="-mx-5 flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                  >
                  <div className="w-16 shrink-0">
                    <p className="tabular text-sm font-semibold">{formatTime(appointment.startsAt)}</p>
                    <p className="text-xs text-subtle">
                      {isToday ? "Hoy" : capitalize(formatDate(appointment.startsAt, "short"))}
                    </p>
                  </div>
                  <Avatar name={patientName} className="hidden sm:inline-flex" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{patientName}</p>
                    <p className="truncate text-xs text-muted">
                      {appointment.modality === "video" ? (
                        <Video
                          className="mr-1 inline size-3.5 align-[-3px]"
                          aria-label={MODALITY_LABEL.video}
                        />
                      ) : null}
                      {consultationName}
                    </p>
                  </div>
                  <Badge tone={status.tone} dot>
                    {status.label}
                  </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
