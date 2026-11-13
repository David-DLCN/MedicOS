import Link from "next/link";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th } from "@/components/ui/table";
import { activityDate } from "@/lib/domain/finance";
import { canIssueReceipt, receiptHref } from "@/lib/domain/receipts";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { type FinanceParams, financeHref } from "./finance-params";
import { TRANSACTIONS_PAGE_SIZE, type TransactionView } from "./get-finance-data";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "./labels";

const selectClass =
  "h-9 rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20";

export function TransactionsTable({
  params,
  rows,
  total,
  page,
  pageCount,
}: {
  params: FinanceParams;
  rows: TransactionView[];
  total: number;
  page: number;
  pageCount: number;
}) {
  return (
    <Card id="movimientos" className="scroll-mt-20">
      <CardHeader
        title="Movimientos"
        description={`${formatNumber(total)} en el periodo seleccionado.`}
        action={
          <form action="/finance#movimientos" method="get" className="flex flex-wrap gap-2">
            {params.period !== "month" ? <input type="hidden" name="period" value={params.period} /> : null}
            <label>
              <span className="sr-only">Estado</span>
              <select name="status" defaultValue={params.status} className={selectClass}>
                <option value="all">Todos los estados</option>
                {Object.entries(PAYMENT_STATUS).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Método</span>
              <select name="method" defaultValue={params.method} className={selectClass}>
                <option value="all">Todos los métodos</option>
                {Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        }
        className="flex-col sm:flex-row"
      />
      <CardContent className="pt-2">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No hay movimientos con estos filtros.</p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {rows.map(({ transaction, patientName, consultationName }) => {
                const status = PAYMENT_STATUS[transaction.status];
                return (
                  <li key={transaction.id}>
                    <Link
                      href={`/appointments/${transaction.appointmentId}`}
                      className="-mx-5 flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{patientName}</p>
                        <p className="truncate text-xs text-muted">
                          {formatDate(activityDate(transaction), "short")} · {PAYMENT_METHOD_LABEL[transaction.method]} ·{" "}
                          {consultationName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={cn(
                            "tabular text-sm font-semibold",
                            transaction.status === "refunded" && "text-muted line-through",
                          )}
                        >
                          {formatMoney(transaction.amount)}
                        </p>
                        <Badge tone={status.tone} className="mt-0.5">
                          {status.label}
                        </Badge>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="hidden md:block">
              <Table>
                <thead>
                  <tr>
                    <Th>Fecha</Th>
                    <Th>Paciente</Th>
                    <Th>Método</Th>
                    <Th>Estado</Th>
                    <Th className="text-right">Importe</Th>
                    <Th className="w-px">
                      <span className="sr-only">Recibo</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ transaction, patientId, patientName, consultationName, invoiceFolio }) => {
                    const status = PAYMENT_STATUS[transaction.status];
                    return (
                      <tr key={transaction.id}>
                        <Td className="tabular whitespace-nowrap text-muted">
                          <Link href={`/appointments/${transaction.appointmentId}`} className="hover:underline">
                            {formatDate(activityDate(transaction))}
                          </Link>
                        </Td>
                        <Td>
                          <Link href={`/patients/${patientId}`} className="font-medium hover:underline">
                            {patientName}
                          </Link>
                          <span className="block text-xs text-muted">{consultationName}</span>
                        </Td>
                        <Td className="text-muted">{PAYMENT_METHOD_LABEL[transaction.method]}</Td>
                        <Td>
                          <Badge tone={status.tone}>{status.label}</Badge>
                          {invoiceFolio ? (
                            <span className="mt-1 block text-xs text-muted" title="Factura CFDI emitida">
                              CFDI {invoiceFolio}
                            </span>
                          ) : null}
                        </Td>
                        <Td
                          className={cn(
                            "tabular text-right font-medium",
                            transaction.status === "refunded" && "text-muted line-through",
                          )}
                        >
                          {formatMoney(transaction.amount)}
                        </Td>
                        <Td className="pl-4 text-right">
                          {canIssueReceipt(transaction) ? (
                            <Link
                              href={receiptHref(transaction)}
                              className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap text-primary hover:underline"
                            >
                              <FileText className="size-3.5" aria-hidden /> Recibo
                            </Link>
                          ) : null}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
            <Pagination
              page={page}
              pageCount={pageCount}
              total={total}
              pageSize={TRANSACTIONS_PAGE_SIZE}
              itemLabel="movimientos"
              hrefFor={(p) => financeHref(params, { page: p }, "#movimientos")}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
