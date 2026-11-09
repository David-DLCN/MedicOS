import type { Metadata } from "next";
import { CircleDollarSign, Clock4, Receipt, Undo2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { BreakdownCard } from "@/features/finance/breakdown-card";
import { PERIOD_LABEL, parseFinanceParams } from "@/features/finance/finance-params";
import { getFinanceData } from "@/features/finance/get-finance-data";
import { PAYMENT_METHOD_LABEL } from "@/features/finance/labels";
import { PendingPayments } from "@/features/finance/pending-payments";
import { PeriodTabs } from "@/features/finance/period-tabs";
import { TransactionsTable } from "@/features/finance/transactions-table";
import { addDays } from "@/lib/domain/dates";
import { OVERDUE_DAYS } from "@/lib/domain/finance";
import { formatAmount, formatDate, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Finanzas" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function FinancePage({ searchParams }: { searchParams: SearchParams }) {
  const params = parseFinanceParams(await searchParams);
  const data = await getFinanceData(params);
  const { summary, ranges } = data;

  // Ranges are half-open [from, to); show the last day actually included.
  const lastIncludedDay = params.period === "last_month" ? addDays(ranges.current.to, -1) : ranges.current.to;
  const rangeLabel = `${formatDate(ranges.current.from, "short")} – ${formatDate(lastIncludedDay, "medium")}`;

  return (
    <>
      <PageHeader title="Finanzas" description="Ingresos, cobros pendientes y movimientos de tu consulta." />

      <div className="space-y-4">
        <PeriodTabs params={params} rangeLabel={rangeLabel} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Ingresos netos"
            icon={CircleDollarSign}
            value={formatAmount(summary.revenue.current)}
            change={summary.revenue.change}
            changeLabel="vs. periodo anterior equivalente"
            hint="Sin datos del periodo anterior"
          />
          <MetricCard
            label="Ticket medio"
            icon={Receipt}
            value={formatAmount(summary.averageTicket)}
            hint={`${formatNumber(summary.paidCount)} consultas cobradas`}
          />
          <MetricCard
            label="Reembolsos"
            icon={Undo2}
            value={formatAmount(summary.refunds.amount)}
            hint={`${formatNumber(summary.refunds.count)} en ${PERIOD_LABEL[params.period].toLowerCase()}`}
          />
          <MetricCard
            label="Pendiente de cobro"
            icon={Clock4}
            value={formatAmount(summary.pending.amount)}
            hint={
              summary.pending.overdueCount > 0
                ? `Hoy · ${formatNumber(summary.pending.overdueCount)} con más de ${OVERDUE_DAYS} días`
                : `Hoy · ${formatNumber(summary.pending.count)} consultas`
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader
              title="Ingresos netos por mes"
              description={`${
                data.seriesMonths < 12 ? `Desde el inicio de tus registros (${data.seriesMonths} meses)` : "Últimos 12 meses"
              } · el mes en curso aparece en gris.`}
            />
            <CardContent>
              <RevenueChart data={data.series} />
            </CardContent>
          </Card>
          <PendingPayments items={data.pending} totalAmount={summary.pending.amount} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <BreakdownCard
            title="Por método de pago"
            description={`Ingresos netos · ${PERIOD_LABEL[params.period].toLowerCase()}`}
            items={data.byMethod}
            labelFor={(key) => PAYMENT_METHOD_LABEL[key]}
          />
          <BreakdownCard
            title="Por tipo de consulta"
            description={`Ingresos netos · ${PERIOD_LABEL[params.period].toLowerCase()}`}
            items={data.byConsultation}
            labelFor={(key) => key}
          />
        </div>

        <TransactionsTable params={params} {...data.transactions} />
      </div>
    </>
  );
}
