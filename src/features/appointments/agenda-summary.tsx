import { Card } from "@/components/ui/card";
import { formatAmount, formatNumber } from "@/lib/format";
import type { AgendaSummary as Summary } from "./get-appointments-data";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function AgendaSummary({ summary }: { summary: Summary }) {
  const { byStatus } = summary;
  return (
    // gap-px over a border-coloured background draws hairline dividers at every breakpoint.
    <Card className="grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4">
      <Stat
        label="Citas"
        value={formatNumber(summary.active)}
        hint={byStatus.cancelled > 0 ? `${formatNumber(byStatus.cancelled)} canceladas` : "Sin cancelaciones"}
      />
      <Stat
        label="Confirmadas"
        value={formatNumber(byStatus.confirmed)}
        hint={`${formatNumber(byStatus.scheduled)} por confirmar`}
      />
      <Stat
        label="Realizadas"
        value={formatNumber(byStatus.completed)}
        hint={byStatus.no_show > 0 ? `${formatNumber(byStatus.no_show)} no asistieron` : "Sin inasistencias"}
      />
      <Stat
        label="Ingresos previstos"
        value={formatAmount(summary.expectedRevenue)}
        hint={`${formatAmount(summary.collected)} ya cobrados`}
      />
    </Card>
  );
}
