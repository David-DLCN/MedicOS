import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { APPOINTMENT_STATUS } from "@/features/appointments/labels";
import type { AppointmentStatus } from "@/lib/domain/types";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const ORDER: AppointmentStatus[] = ["completed", "confirmed", "scheduled", "cancelled", "no_show"];

const BAR_COLOR: Record<AppointmentStatus, string> = {
  completed: "bg-primary",
  confirmed: "bg-info",
  scheduled: "bg-info/35",
  cancelled: "bg-border-strong",
  no_show: "bg-danger",
};

export function AppointmentStatusSummary({
  counts,
  periodLabel,
}: {
  counts: Record<AppointmentStatus, number>;
  periodLabel: string;
}) {
  const total = ORDER.reduce((sum, status) => sum + counts[status], 0);

  return (
    <Card>
      <CardHeader title="Citas del mes" description={periodLabel} />
      <CardContent>
        <p className="tabular text-2xl font-semibold tracking-tight">
          {formatNumber(total)} <span className="text-sm font-normal text-muted">citas en total</span>
        </p>
        {total > 0 ? (
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            {ORDER.map((status) =>
              counts[status] > 0 ? (
                <span
                  key={status}
                  className={cn("h-full", BAR_COLOR[status])}
                  style={{ width: `${(counts[status] / total) * 100}%` }}
                />
              ) : null,
            )}
          </div>
        ) : null}
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          {ORDER.map((status) => (
            <div key={status} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-muted">
                <span aria-hidden className={cn("size-2 rounded-full", BAR_COLOR[status])} />
                {APPOINTMENT_STATUS[status].label}
              </dt>
              <dd className="tabular font-medium">{formatNumber(counts[status])}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
