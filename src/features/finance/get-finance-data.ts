import type { RevenueChartPoint } from "@/components/charts/revenue-chart";
import {
  getNow,
  getPracticeContext,
  listAppointments,
  listInvoices,
  listPatients,
  listTransactions,
} from "@/lib/data/repository";
import {
  filterTransactions,
  financeSummary,
  pendingPayments,
  periodRanges,
  revenueByConsultation,
  revenueByMethod,
} from "@/lib/domain/finance";
import { indexById, patientName } from "@/lib/domain/lookup";
import { monthlySeries } from "@/lib/domain/metrics";
import type { Transaction } from "@/lib/domain/types";
import { capitalize, formatDate } from "@/lib/format";
import type { FinanceParams } from "./finance-params";

export const TRANSACTIONS_PAGE_SIZE = 20;

export interface TransactionView {
  transaction: Transaction;
  patientId: string;
  patientName: string;
  consultationName: string;
  /** CFDI folio when the payment has been invoiced. */
  invoiceFolio: string | null;
}

export async function getFinanceData(params: FinanceParams) {
  const now = getNow();
  const [context, patients, appointments, transactions, invoices] = await Promise.all([
    getPracticeContext(),
    listPatients(),
    listAppointments(),
    listTransactions(),
    listInvoices(),
  ]);
  const invoiceByTransaction = new Map(invoices.map((invoice) => [invoice.transactionId, invoice]));

  const patientsById = indexById(patients);
  const appointmentsById = indexById(appointments);
  const typesById = indexById(context.consultationTypes);
  const consultationTypeOf = (appointmentId: string) => {
    const appointment = appointmentsById.get(appointmentId);
    return appointment ? typesById.get(appointment.consultationTypeId) : undefined;
  };
  const toView = (transaction: Transaction): TransactionView => ({
    transaction,
    patientId: transaction.patientId,
    patientName: patientName(patientsById.get(transaction.patientId)),
    consultationName: consultationTypeOf(transaction.appointmentId)?.name ?? "Consulta",
    invoiceFolio: invoiceByTransaction.get(transaction.id)?.folio ?? null,
  });

  const ranges = periodRanges(params.period, now);

  const filtered = filterTransactions(transactions, {
    window: ranges.current,
    status: params.status,
    method: params.method,
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / TRANSACTIONS_PAGE_SIZE));
  const page = Math.min(params.page, pageCount);

  // Leading months before the first recorded activity are dropped: an empty
  // bar would wrongly read as "no income" instead of "no data yet".
  const months = monthlySeries({ now, appointments, transactions }, 12);
  const firstWithData = months.findIndex((point) => point.revenue > 0 || point.completedAppointments > 0);
  const series: RevenueChartPoint[] = months.slice(Math.max(0, firstWithData)).map((point) => ({
    label: capitalize(formatDate(point.month, "month").replace(".", "")),
    revenue: point.revenue,
    appointments: point.completedAppointments,
    partial: point.partial,
  }));

  return {
    now,
    ranges,
    seriesMonths: series.length,
    summary: financeSummary(transactions, ranges, now),
    series,
    byMethod: revenueByMethod(transactions, ranges.current),
    byConsultation: revenueByConsultation(transactions, ranges.current, consultationTypeOf),
    pending: pendingPayments(transactions, now).map((item) => ({ ...item, view: toView(item.transaction) })),
    transactions: {
      total: filtered.length,
      page,
      pageCount,
      rows: filtered.slice((page - 1) * TRANSACTIONS_PAGE_SIZE, page * TRANSACTIONS_PAGE_SIZE).map(toView),
    },
  };
}
