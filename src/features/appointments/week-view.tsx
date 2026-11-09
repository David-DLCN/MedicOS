import Link from "next/link";
import { Card } from "@/components/ui/card";
import { capitalize, formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgendaDay } from "./get-appointments-data";
import { agendaHref } from "./agenda-toolbar";
import { APPOINTMENT_STATUS } from "./labels";

const STATUS_BORDER = {
  scheduled: "border-l-warning",
  confirmed: "border-l-info",
  completed: "border-l-success",
  cancelled: "border-l-border-strong",
  no_show: "border-l-danger",
} as const;

/** Seven columns on large screens, stacked days on small ones. */
export function WeekView({ days }: { days: AgendaDay[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7">
      {days.map((day) => (
        <Card key={day.date.toISOString()} className={cn("flex flex-col", day.isToday && "ring-2 ring-primary/40")}>
          <Link
            href={agendaHref(day.date, "day")}
            className="flex items-baseline justify-between border-b border-border px-3 py-2.5 hover:bg-surface-muted"
          >
            <span className="text-sm font-semibold">
              {capitalize(formatDate(day.date, "weekday").replace(".", ""))}{" "}
              <span className="tabular font-normal text-muted">{formatDate(day.date, "short")}</span>
            </span>
            <span className="tabular text-xs text-subtle">{day.rows.length}</span>
          </Link>
          <div className="flex-1 space-y-1.5 p-2">
            {day.rows.length === 0 ? (
              <p className="px-1 py-3 text-center text-xs text-subtle">Sin citas</p>
            ) : (
              day.rows.map(({ appointment, patientName, consultation }) => (
                <Link
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  title={`${patientName} · ${APPOINTMENT_STATUS[appointment.status].label}`}
                  className={cn(
                    "block rounded-md border border-l-[3px] border-border bg-surface px-2 py-1.5 transition-colors hover:bg-surface-muted",
                    STATUS_BORDER[appointment.status],
                    appointment.status === "cancelled" && "opacity-60",
                  )}
                >
                  <p className="tabular text-[11px] font-medium text-muted">{formatTime(appointment.startsAt)}</p>
                  <p
                    className={cn(
                      "truncate text-xs font-medium",
                      appointment.status === "cancelled" && "line-through",
                    )}
                  >
                    {patientName}
                  </p>
                  <p className="truncate text-[11px] text-subtle">{consultation?.name}</p>
                </Link>
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
