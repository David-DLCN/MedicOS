import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Mail, Phone, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Table, Td, Th } from "@/components/ui/table";
import { APPOINTMENT_STATUS, MODALITY_LABEL } from "@/features/appointments/labels";
import { PAYMENT_STATUS } from "@/features/finance/labels";
import {
  getNow,
  getPatient,
  getPracticeContext,
  listAppointmentsForPatient,
  listTransactionsForAppointments,
} from "@/lib/data/repository";
import { ageOn } from "@/lib/domain/dates";
import { indexById, patientName } from "@/lib/domain/lookup";
import { summarizePatients } from "@/lib/domain/patients";
import { canIssueReceipt, receiptHref } from "@/lib/domain/receipts";
import { capitalize, formatAmount, formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";

type Params = Promise<{ patientId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const patient = await getPatient((await params).patientId);
  return { title: patient ? patientName(patient) : "Paciente" };
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="tabular mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export default async function PatientProfilePage({ params }: { params: Params }) {
  const { patientId } = await params;
  const patient = await getPatient(patientId);
  if (!patient) notFound();

  const now = getNow();
  const [context, appointments] = await Promise.all([
    getPracticeContext(),
    listAppointmentsForPatient(patient.id),
  ]);
  const transactions = await listTransactionsForAppointments(appointments.map((apt) => apt.id));
  const [summary] = summarizePatients({ now, patients: [patient], appointments, transactions });
  if (!summary) notFound();

  const typesById = indexById(context.consultationTypes);
  const paymentByAppointment = new Map(transactions.map((txn) => [txn.appointmentId, txn]));
  const history = [...appointments].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const name = patientName(patient);
  const next = summary.nextAppointment;
  const firstVisit = history.at(-1)?.startsAt ?? null;

  return (
    <>
      <Link
        href="/patients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Pacientes
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="md" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="mt-0.5 text-sm text-muted">
              {formatNumber(ageOn(patient.dateOfBirth, now))} años
              {firstVisit ? ` · Paciente desde ${formatDate(firstVisit)}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {summary.isNew ? <Badge tone="info">Nuevo</Badge> : null}
          <Badge tone={summary.isActive ? "primary" : "neutral"} dot>
            {summary.isActive ? "Activo" : "Inactivo"}
          </Badge>
        </div>
      </div>

      <Card className="mb-4 grid grid-cols-2 gap-px overflow-hidden bg-border lg:grid-cols-4">
        <Stat
          label="Consultas realizadas"
          value={formatNumber(summary.completedVisits)}
          hint={summary.lastVisit ? `Última: ${formatDate(summary.lastVisit)}` : "Aún sin consultas"}
        />
        <Stat
          label="Inasistencias"
          value={formatNumber(summary.noShows)}
          hint={`${formatNumber(appointments.length)} citas en total`}
        />
        <Stat label="Total pagado" value={formatAmount(summary.totalPaid)} hint="Pagos netos de reembolsos" />
        <Stat
          label="Pendiente de cobro"
          value={formatAmount(summary.pendingAmount)}
          hint={summary.pendingAmount > 0 ? "Consultas sin cobrar" : "Al día"}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Historial de citas" description={`${formatNumber(history.length)} citas, de la más reciente a la más antigua.`} />
          <CardContent className="pt-2">
            <Table>
              <thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Consulta</Th>
                  <Th>Estado</Th>
                  <Th>Pago</Th>
                  <Th className="text-right">Importe</Th>
                </tr>
              </thead>
              <tbody>
                {history.map((apt) => {
                  const payment = paymentByAppointment.get(apt.id);
                  const consultation = typesById.get(apt.consultationTypeId);
                  const status = APPOINTMENT_STATUS[apt.status];
                  return (
                    <tr key={apt.id} className="group">
                      <Td className="tabular">
                        <Link href={`/appointments/${apt.id}`} className="group-hover:underline">
                          {formatDate(apt.startsAt)}
                        </Link>
                        <span className="block text-xs text-muted">{formatTime(apt.startsAt)}</span>
                      </Td>
                      <Td>
                        <span className="block">{consultation?.name ?? "Consulta"}</span>
                        <span className="block text-xs text-muted">{MODALITY_LABEL[apt.modality]}</span>
                      </Td>
                      <Td>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </Td>
                      <Td>
                        {payment ? (
                          <Badge tone={PAYMENT_STATUS[payment.status].tone}>
                            {PAYMENT_STATUS[payment.status].label}
                          </Badge>
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </Td>
                      <Td className="tabular text-right">
                        {payment ? formatMoney(payment.amount) : <span className="text-subtle">—</span>}
                        {payment && canIssueReceipt(payment) ? (
                          <Link
                            href={receiptHref(payment)}
                            className="block text-xs font-medium text-primary hover:underline"
                          >
                            Recibo
                          </Link>
                        ) : null}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Próxima cita" />
            <CardContent>
              {next ? (
                <Link
                  href={`/appointments/${next.id}`}
                  className="-m-2 block rounded-lg p-2 transition-colors hover:bg-surface-muted"
                >
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <CalendarClock className="size-4 text-primary" aria-hidden />
                    {capitalize(formatDate(next.startsAt, "long"))}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatTime(next.startsAt)} · {typesById.get(next.consultationTypeId)?.name}
                    {next.modality === "video" ? (
                      <Video className="ml-1 inline size-3.5 align-[-3px]" aria-label={MODALITY_LABEL.video} />
                    ) : null}
                  </p>
                  <Badge tone={APPOINTMENT_STATUS[next.status].tone} dot className="mt-2">
                    {APPOINTMENT_STATUS[next.status].label}
                  </Badge>
                </Link>
              ) : (
                <p className="text-sm text-muted">Sin citas programadas.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Contacto" />
            <CardContent>
              <dl className="space-y-3">
                <Field label="Correo electrónico">
                  <a href={`mailto:${patient.email}`} className="inline-flex items-center gap-1.5 break-all text-primary hover:underline">
                    <Mail className="size-3.5 shrink-0" aria-hidden /> {patient.email}
                  </a>
                </Field>
                <Field label="Teléfono">
                  <a href={`tel:${patient.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Phone className="size-3.5 shrink-0" aria-hidden /> {patient.phone}
                  </a>
                </Field>
                <Field label="Fecha de nacimiento">{formatDate(`${patient.dateOfBirth}T00:00:00Z`)}</Field>
              </dl>
            </CardContent>
          </Card>

          <p className="px-1 text-xs text-subtle">
            MedicOS no almacena historia clínica en esta versión: solo datos administrativos de ejemplo.
          </p>
        </div>
      </div>
    </>
  );
}
