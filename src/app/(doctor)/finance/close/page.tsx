import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Banknote, ChevronLeft, ChevronRight, CreditCard, Landmark, Smartphone, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PrintButton } from "@/components/ui/print-button";
import { Table, Td, Th } from "@/components/ui/table";
import { PAYMENT_METHOD_LABEL } from "@/features/finance/labels";
import { getNow, getPracticeContext, listAppointments, listPatients, listTransactions } from "@/lib/data/repository";
import { METHOD_ORDER, cashClose } from "@/lib/domain/cash-close";
import { addDays, isSameDay, parseISODate, startOfDay, toISODate } from "@/lib/domain/dates";
import { indexById, patientName } from "@/lib/domain/lookup";
import type { PaymentMethod } from "@/lib/domain/types";
import { capitalize, formatAmount, formatDate, formatMoney, formatNumber, formatTime, pluralize } from "@/lib/format";

export const metadata: Metadata = { title: "Cierre de caja" };

const METHOD_ICON: Record<PaymentMethod, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  transfer: Landmark,
  apple_pay: Smartphone,
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function closeHref(day: Date) {
  return `/finance/close?date=${toISODate(day)}`;
}

export default async function CashClosePage({ searchParams }: { searchParams: SearchParams }) {
  const raw = (await searchParams).date;
  const today = startOfDay(getNow());
  const day = parseISODate(Array.isArray(raw) ? raw[0] : raw) ?? today;

  const [context, patients, appointments, transactions] = await Promise.all([
    getPracticeContext(),
    listPatients(),
    listAppointments(),
    listTransactions(),
  ]);
  const close = cashClose(day, transactions, appointments);
  const patientsById = indexById(patients);
  const appointmentsById = indexById(appointments);
  const typesById = indexById(context.consultationTypes);
  const consultationOf = (appointmentId: string) =>
    typesById.get(appointmentsById.get(appointmentId)?.consultationTypeId ?? "")?.name ?? "Consulta";
  const isFuture = day.getTime() > today.getTime();

  return (
    <>
      <Link
        href="/finance"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden /> Finanzas
      </Link>
      <PageHeader
        title="Cierre de caja"
        description={`${capitalize(formatDate(day, "long"))} · ${context.clinic.name}`}
        actions={<PrintButton />}
      />

      <div className="mb-4 flex items-center gap-2 print:hidden">
        <Link href={closeHref(addDays(day, -1))} aria-label="Día anterior" className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2" })}>
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <Link href={closeHref(addDays(day, 1))} aria-label="Día siguiente" className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2" })}>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
        {!isSameDay(day, today) ? (
          <Link href={closeHref(today)} className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Hoy
          </Link>
        ) : (
          <Badge tone="info">Día en curso: el cierre puede cambiar</Badge>
        )}
      </div>

      {isFuture ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            Este día aún no ha llegado: no hay movimientos que cerrar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="grid grid-cols-1 gap-px overflow-hidden bg-border sm:grid-cols-3">
            <div className="bg-surface px-5 py-4">
              <p className="text-xs font-medium text-muted">Total cobrado</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight">{formatAmount(close.totalCollected)}</p>
              <p className="mt-0.5 text-xs text-subtle">{pluralize(close.collected.length, "cobro")}</p>
            </div>
            <div className="bg-surface px-5 py-4">
              <p className="text-xs font-medium text-muted">Efectivo que debe haber en caja</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight text-primary">
                {formatAmount(close.expectedCash)}
              </p>
              <p className="mt-0.5 text-xs text-subtle">Cuéntalo y compáralo antes de cerrar</p>
            </div>
            <div className="bg-surface px-5 py-4">
              <p className="text-xs font-medium text-muted">Consultas del día</p>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight">
                {formatNumber(close.completedAppointments)}
              </p>
              <p className="mt-0.5 text-xs text-subtle">
                {close.prepaidEarlier > 0 ? `${formatNumber(close.prepaidEarlier)} prepagadas en línea antes · ` : ""}
                <span className={close.pendingFromDay.length > 0 ? "font-medium text-danger" : ""}>
                  {close.pendingFromDay.length > 0
                    ? `${formatNumber(close.pendingFromDay.length)} sin cobrar`
                    : "ninguna sin cobrar"}
                </span>
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader title="Por método de pago" />
              <CardContent>
                <ul className="space-y-3">
                  {METHOD_ORDER.map((method) => {
                    const Icon = METHOD_ICON[method];
                    const { amount, count } = close.byMethod[method];
                    return (
                      <li key={method} className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted">
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="flex-1 text-sm">
                          {PAYMENT_METHOD_LABEL[method]}
                          <span className="block text-xs text-subtle">{pluralize(count, "cobro")}</span>
                        </span>
                        <span className="tabular text-sm font-semibold">{formatAmount(amount)}</span>
                      </li>
                    );
                  })}
                </ul>
                {close.refunds.count > 0 ? (
                  <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                    Reembolsos del día: {formatNumber(close.refunds.count)} · {formatAmount(close.refunds.amount)} (no
                    restan del efectivo: se devuelven por el mismo medio de pago).
                  </p>
                ) : null}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Cobros del día" description="En orden de registro." />
              <CardContent className="pt-2">
                {close.collected.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No hubo cobros este día.</p>
                ) : (
                  <Table>
                    <thead>
                      <tr>
                        <Th>Hora</Th>
                        <Th>Paciente</Th>
                        <Th>Método</Th>
                        <Th className="text-right">Importe</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {close.collected.map((txn) => (
                        <tr key={txn.id}>
                          <Td className="tabular text-muted">{formatTime(txn.settledAt ?? txn.createdAt)}</Td>
                          <Td>
                            <Link href={`/appointments/${txn.appointmentId}`} className="font-medium hover:underline">
                              {patientName(patientsById.get(txn.patientId))}
                            </Link>
                            <span className="block text-xs text-muted">
                              {consultationOf(txn.appointmentId)}
                              {(() => {
                                const apt = appointmentsById.get(txn.appointmentId);
                                return apt && !isSameDay(new Date(apt.startsAt), day)
                                  ? ` · prepago de la cita del ${formatDate(apt.startsAt, "short")}`
                                  : "";
                              })()}
                            </span>
                          </Td>
                          <Td className="text-muted">{PAYMENT_METHOD_LABEL[txn.method]}</Td>
                          <Td className="tabular text-right font-medium">{formatMoney(txn.amount)}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {close.pendingFromDay.length > 0 ? (
            <Card>
              <CardHeader
                title="Consultas del día sin cobrar"
                description="Cóbralas o regístralas antes de cerrar la caja."
              />
              <CardContent className="pt-2">
                <ul className="divide-y divide-border">
                  {close.pendingFromDay.map((txn) => (
                    <li key={txn.id}>
                      <Link
                        href={`/appointments/${txn.appointmentId}`}
                        className="-mx-5 flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-surface-muted"
                      >
                        <span className="text-sm">
                          <span className="font-medium">{patientName(patientsById.get(txn.patientId))}</span>
                          <span className="block text-xs text-muted">{consultationOf(txn.appointmentId)}</span>
                        </span>
                        <span className="tabular text-sm font-semibold">{formatMoney(txn.amount)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>
      )}
    </>
  );
}
