import Link from "next/link";
import { ChevronRight, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS } from "@/features/finance/labels";
import { formatMoney, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AppointmentRow } from "./get-appointments-data";
import { APPOINTMENT_STATUS, CHANNEL_LABEL, MODALITY_LABEL } from "./labels";

/** Full-width list of appointments for a single day. */
export function AppointmentList({ rows, now }: { rows: AppointmentRow[]; now: Date }) {
  return (
    <ul className="divide-y divide-border">
      {rows.map((row) => (
        <li key={row.appointment.id}>
          <AppointmentListItem row={row} now={now} />
        </li>
      ))}
    </ul>
  );
}

function AppointmentListItem({ row, now }: { row: AppointmentRow; now: Date }) {
  const { appointment, consultation, payment } = row;
  const status = APPOINTMENT_STATUS[appointment.status];
  const isPast = Date.parse(appointment.endsAt) <= now.getTime();
  const muted = appointment.status === "cancelled";

  return (
    <Link
      href={`/appointments/${appointment.id}`}
      className="group -mx-5 flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-muted"
    >
      <div className="w-14 shrink-0">
        <p className={cn("tabular text-sm font-semibold", isPast && "text-muted")}>
          {formatTime(appointment.startsAt)}
        </p>
        <p className="tabular text-xs text-subtle">{formatTime(appointment.endsAt)}</p>
      </div>

      <span
        aria-hidden
        className={cn(
          "w-1 self-stretch rounded-full",
          appointment.modality === "video" ? "bg-info/60" : "bg-primary/60",
          muted && "bg-border-strong",
        )}
      />

      <Avatar name={row.patientName} className="hidden sm:inline-flex" />

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", muted && "text-muted line-through")}>{row.patientName}</p>
        <p className="truncate text-xs text-muted">
          {appointment.modality === "video" ? (
            <Video className="mr-1 inline size-3.5 align-[-3px]" aria-hidden />
          ) : null}
          {consultation?.name ?? "Consulta"} · {MODALITY_LABEL[appointment.modality]}
          {/* Doctoralia origin stays visible on mobile: it tells the doctor where the booking lives. */}
          <span className={appointment.channel === "doctoralia" ? "" : "hidden md:inline"}>
            {" "}
            · {CHANNEL_LABEL[appointment.channel]}
          </span>
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        {consultation ? (
          <p className="tabular text-sm font-medium">{formatMoney(consultation.price)}</p>
        ) : null}
        {payment ? (
          <p className="text-xs text-muted">{PAYMENT_STATUS[payment.status].label}</p>
        ) : (
          <p className="text-xs text-subtle">Sin cobro</p>
        )}
      </div>

      <Badge tone={status.tone} dot className="shrink-0">
        {status.label}
      </Badge>
      <ChevronRight className="hidden size-4 shrink-0 text-subtle group-hover:text-foreground sm:block" aria-hidden />
    </Link>
  );
}
