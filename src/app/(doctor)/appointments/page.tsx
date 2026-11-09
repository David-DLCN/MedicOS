import type { Metadata } from "next";
import { CalendarX2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaSummary } from "@/features/appointments/agenda-summary";
import { AgendaToolbar } from "@/features/appointments/agenda-toolbar";
import { AppointmentList } from "@/features/appointments/appointment-list";
import { getAgendaData, type AgendaView } from "@/features/appointments/get-appointments-data";
import { WeekView } from "@/features/appointments/week-view";
import { getNow } from "@/lib/data/repository";
import { addDays, parseISODate, startOfDay } from "@/lib/domain/dates";
import { capitalize, formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Citas" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AppointmentsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const today = startOfDay(getNow());
  const anchor = parseISODate(first(params.date)) ?? today;
  const view: AgendaView = first(params.view) === "week" ? "week" : "day";

  const { now, from, days, summary } = await getAgendaData(anchor, view);

  const label =
    view === "week"
      ? `${formatDate(from, "short")} – ${formatDate(addDays(from, 6), "medium")}`
      : capitalize(formatDate(anchor, "long"));

  return (
    <>
      <PageHeader title="Citas" description="Tu agenda de consultas y el estado de cada cita." />

      <div className="space-y-4">
        <AgendaToolbar anchor={anchor} view={view} today={today} label={label} />
        <AgendaSummary summary={summary} />

        {view === "week" ? (
          <WeekView days={days} />
        ) : days[0]!.rows.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="No hay citas este día"
            description="Cambia de fecha o consulta la vista semanal para ver tu agenda."
          />
        ) : (
          <Card>
            <CardContent className="py-1">
              <AppointmentList rows={days[0]!.rows} now={now} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
