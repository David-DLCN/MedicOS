import type { Metadata } from "next";
import { CalendarCheck2, CircleDollarSign, Clock4, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { AlertsPanel } from "@/features/dashboard/alerts-panel";
import { AppointmentStatusSummary } from "@/features/dashboard/appointment-status-summary";
import { getDashboardData } from "@/features/dashboard/get-dashboard-data";
import { MetricCard } from "@/components/ui/metric-card";
import { RecentTransactions } from "@/features/dashboard/recent-transactions";
import { UpcomingAppointments } from "@/features/dashboard/upcoming-appointments";
import { formatAmount, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Panel" };

function greeting(now: Date) {
  const hour = now.getUTCHours();
  if (hour < 12) return "Buenos días";
  if (hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { metrics } = data;
  const comparison = `vs. mismo periodo de ${data.previousMonthLabel}`;
  const firstName = data.doctor.fullName.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`${greeting(data.now)}, ${data.doctor.title} ${firstName}`}
        description="Este es el resumen de tu actividad profesional."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Ingresos del mes"
          icon={CircleDollarSign}
          value={formatAmount(metrics.revenue.current)}
          change={metrics.revenue.change}
          changeLabel={comparison}
        />
        <MetricCard
          label="Consultas realizadas"
          icon={CalendarCheck2}
          value={formatNumber(metrics.completedAppointments.current)}
          change={metrics.completedAppointments.change}
          changeLabel={comparison}
        />
        <MetricCard
          label="Pacientes nuevos"
          icon={UserPlus}
          value={formatNumber(metrics.newPatients.current)}
          change={metrics.newPatients.change}
          changeLabel={comparison}
          hint={`${formatNumber(metrics.activePatients)} pacientes activos (90 días)`}
        />
        <MetricCard
          label="Pendiente de cobro"
          icon={Clock4}
          value={formatAmount(metrics.pending.amount)}
          hint={`${formatNumber(metrics.pending.count)} consultas sin cobrar`}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ingresos netos"
            description="Últimos 6 meses · el mes en curso aparece en gris."
          />
          <CardContent>
            <RevenueChart data={data.revenueSeries} />
          </CardContent>
        </Card>
        <AlertsPanel alerts={data.alerts} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingAppointments rows={data.upcoming} />
        </div>
        <AppointmentStatusSummary counts={data.monthStatus} periodLabel={data.monthLabel} />
      </div>

      <div className="mt-4">
        <RecentTransactions rows={data.recent} />
      </div>
    </>
  );
}
