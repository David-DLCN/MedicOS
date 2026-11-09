"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatAmount, formatNumber } from "@/lib/format";

export interface RevenueChartPoint {
  label: string;
  /** Minor units. */
  revenue: number;
  appointments: number;
  partial: boolean;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: RevenueChartPoint }[];
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">
        {point.label}
        {point.partial ? " (en curso)" : ""}
      </p>
      <p className="tabular mt-1 text-foreground">{formatAmount(point.revenue)}</p>
      <p className="tabular text-muted">{formatNumber(point.appointments)} consultas realizadas</p>
    </div>
  );
}

export function RevenueChart({ data }: { data: RevenueChartPoint[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Ingresos netos por mes">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--subtle)", fontSize: 12 }}
            tickFormatter={(value: number) => formatAmount(value, { compact: true })}
          />
          <Tooltip cursor={{ fill: "var(--surface-muted)" }} content={<ChartTooltip />} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
            {data.map((point) => (
              <Cell key={point.label} fill={point.partial ? "var(--chart-2)" : "var(--chart-1)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
