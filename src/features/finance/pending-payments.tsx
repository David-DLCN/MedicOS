import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { OVERDUE_DAYS, type PendingPayment } from "@/lib/domain/finance";
import { formatAmount, formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionView } from "./get-finance-data";

const VISIBLE = 8;

export function PendingPayments({
  items,
  totalAmount,
}: {
  items: (PendingPayment & { view: TransactionView })[];
  totalAmount: number;
}) {
  const overdue = items.filter((item) => item.overdue).length;

  return (
    <Card id="pendientes" className="scroll-mt-20">
      <CardHeader
        title="Cobros pendientes"
        description={
          items.length === 0
            ? "No hay consultas sin cobrar."
            : `${formatNumber(items.length)} consultas · ${formatAmount(totalAmount)}${
                overdue > 0 ? ` · ${formatNumber(overdue)} con más de ${OVERDUE_DAYS} días` : ""
              }`
        }
      />
      <CardContent className="pt-2">
        {items.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <CheckCircle2 className="size-4 text-primary" aria-hidden /> Todo cobrado.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border">
              {items.slice(0, VISIBLE).map(({ view, ageDays, overdue: isOverdue }) => (
                <li key={view.transaction.id}>
                  <Link
                    href={`/appointments/${view.transaction.appointmentId}`}
                    className="-mx-5 flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-surface-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{view.patientName}</p>
                      <p className="truncate text-xs text-muted">
                        {view.consultationName} · {formatDate(view.transaction.createdAt, "short")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="tabular text-sm font-semibold">{formatMoney(view.transaction.amount)}</p>
                      <p className={cn("tabular text-xs", isOverdue ? "font-medium text-danger" : "text-subtle")}>
                        {ageDays === 0 ? "Hoy" : `Hace ${formatNumber(ageDays)} ${ageDays === 1 ? "día" : "días"}`}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {items.length > VISIBLE ? (
              <p className="pt-3 text-xs text-muted">
                Y {formatNumber(items.length - VISIBLE)} más en la lista de movimientos (filtro «Pendiente»).
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
