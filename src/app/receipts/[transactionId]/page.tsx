import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { MODALITY_LABEL } from "@/features/appointments/labels";
import { PAYMENT_METHOD_LABEL } from "@/features/finance/labels";
import { PrintButton } from "@/features/receipts/print-button";
import { IS_DEMO_DATA } from "@/lib/config";
import {
  getAppointment,
  getPatient,
  getPracticeContext,
  getTransaction,
} from "@/lib/data/repository";
import { patientName } from "@/lib/domain/lookup";
import { canIssueReceipt, receiptNumber } from "@/lib/domain/receipts";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

type Params = Promise<{ transactionId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const transaction = await getTransaction((await params).transactionId);
  return { title: transaction ? `Recibo ${receiptNumber(transaction)}` : "Recibo" };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function ReceiptPage({ params }: { params: Params }) {
  const transaction = await getTransaction((await params).transactionId);
  if (!transaction || !canIssueReceipt(transaction)) notFound();

  const [context, appointment, patient] = await Promise.all([
    getPracticeContext(),
    getAppointment(transaction.appointmentId),
    getPatient(transaction.patientId),
  ]);
  if (!appointment || !patient) notFound();

  const { doctor, clinic, consultationTypes } = context;
  const consultation = consultationTypes.find((type) => type.id === appointment.consultationTypeId);
  const issuedAt = transaction.settledAt ?? transaction.createdAt;

  return (
    <div className="min-h-dvh bg-background py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 px-4 print:hidden">
        <Link
          href={`/appointments/${appointment.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden /> Volver a la cita
        </Link>
        <PrintButton />
      </div>

      <article className="mx-auto max-w-3xl border-border bg-surface px-6 py-8 sm:rounded-xl sm:border sm:px-10 print:max-w-none print:border-0 print:px-0">
        <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:justify-between">
          <div>
            <p className="text-lg font-semibold">
              {doctor.title} {doctor.fullName}
            </p>
            <p className="text-sm text-muted">{doctor.specialty}</p>
            <dl className="mt-3 space-y-0.5 text-sm">
              <div>
                <dt className="inline text-muted">Cédula profesional: </dt>
                <dd className="inline">{doctor.billing.licenseNumber}</dd>
              </div>
              <div>
                <dt className="inline text-muted">RFC: </dt>
                <dd className="inline">{doctor.billing.taxId}</dd>
              </div>
              <div>
                <dt className="sr-only">Dirección</dt>
                <dd>{doctor.billing.address}</dd>
              </div>
              <div>
                <dt className="sr-only">Contacto</dt>
                <dd>
                  {doctor.phone} · {doctor.email}
                </dd>
              </div>
            </dl>
          </div>
          <div className="sm:text-right">
            <Logo className="sm:justify-end" />
            <h1 className="mt-4 text-xl font-semibold tracking-tight">Recibo de honorarios</h1>
            <p className="text-sm text-muted">Comprobante de pago para reembolso de seguro médico</p>
            <p className="tabular mt-2 text-sm">
              <span className="text-muted">Folio </span>
              <span className="font-semibold">{receiptNumber(transaction)}</span>
            </p>
            <p className="text-sm">
              <span className="text-muted">Fecha de emisión </span>
              {formatDate(issuedAt)}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-medium tracking-wide text-subtle uppercase">Paciente</h2>
            <p className="mt-1 font-semibold">{patientName(patient)}</p>
            <p className="text-sm text-muted">Fecha de nacimiento: {formatDate(`${patient.dateOfBirth}T00:00:00Z`)}</p>
          </div>
          <div>
            <h2 className="text-xs font-medium tracking-wide text-subtle uppercase">Lugar de atención</h2>
            <p className="mt-1 font-semibold">{clinic.name}</p>
            <p className="text-sm text-muted">
              {appointment.modality === "video" ? "Consulta por videollamada" : clinic.city}
            </p>
          </div>
        </section>

        <section className="py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs tracking-wide text-subtle uppercase">
                <th className="pb-2 font-medium">Fecha del servicio</th>
                <th className="pb-2 font-medium">Concepto</th>
                <th className="pb-2 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border align-top">
                <td className="tabular py-3 pr-4 whitespace-nowrap">
                  {formatDate(appointment.startsAt)}
                  <span className="block text-xs text-muted">{formatTime(appointment.startsAt)}</span>
                </td>
                <td className="py-3 pr-4">
                  {consultation?.name ?? "Consulta médica"} · {doctor.specialty}
                  <span className="block text-xs text-muted">{MODALITY_LABEL[appointment.modality]}</span>
                </td>
                <td className="tabular py-3 text-right">{formatMoney(transaction.amount)}</td>
              </tr>
            </tbody>
          </table>

          <dl className="mt-4 ml-auto max-w-xs text-sm">
            <Row label="Total pagado">
              <span className="tabular text-base font-semibold">{formatMoney(transaction.amount)}</span>
            </Row>
            <Row label="Método de pago">{PAYMENT_METHOD_LABEL[transaction.method]}</Row>
            <Row label="Fecha de pago">{formatDate(issuedAt)}</Row>
          </dl>
        </section>

        <footer className="border-t border-border pt-6 text-sm">
          <div className="mt-8 w-56 border-t border-border-strong pt-2 text-muted">Firma del profesional</div>
          <p className="mt-6 text-xs text-subtle">
            Recibí de {patientName(patient)} la cantidad indicada por los servicios profesionales descritos.
            {IS_DEMO_DATA
              ? " Documento de demostración generado con datos ficticios: no tiene validez fiscal."
              : ""}
          </p>
        </footer>
      </article>
    </div>
  );
}
