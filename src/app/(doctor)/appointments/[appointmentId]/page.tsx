import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Mail, Phone, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { agendaHref } from "@/features/appointments/agenda-toolbar";
import { APPOINTMENT_STATUS, CHANNEL_LABEL, MODALITY_LABEL } from "@/features/appointments/labels";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/features/finance/labels";
import {
  getAppointment,
  getNow,
  getPatient,
  getPracticeContext,
  listAppointmentsForPatient,
  listTransactionsForAppointments,
} from "@/lib/data/repository";
import { ageOn } from "@/lib/domain/dates";
import { indexById, patientName } from "@/lib/domain/lookup";
import { capitalize, formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Params = Promise<{ appointmentId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { appointmentId } = await params;
  const appointment = await getAppointment(appointmentId);
  const patient = appointment ? await getPatient(appointment.patientId) : null;
  return { title: patient ? `Cita · ${patientName(patient)}` : "Cita" };
}

export default async function AppointmentDetailPage({ params }: { params: Params }) {
  const { appointmentId } = await params;
  const appointment = await getAppointment(appointmentId);
  if (!appointment) notFound();

  const now = getNow();
  const [context, patient, history] = await Promise.all([
    getPracticeContext(),
    getPatient(appointment.patientId),
    listAppointmentsForPatient(appointment.patientId),
  ]);
  const payments = await listTransactionsForAppointments([appointment.id]);
  const payment = payments[0] ?? null;

  const typesById = indexById(context.consultationTypes);
  const consultation = typesById.get(appointment.consultationTypeId);
  const status = APPOINTMENT_STATUS[appointment.status];
  const name = patientName(patient ?? undefined);

  const sortedHistory = [...history].sort((a, b) => b.startsAt.localeCompare(a.startsAt));
  const completedVisits = history.filter((apt) => apt.status === "completed").length;
  const firstVisit = history.reduce<string | null>(
    (min, apt) => (min === null || apt.startsAt < min ? apt.startsAt : min),
    null,
  );

  return (
    <>
      <Link
        href={agendaHref(new Date(appointment.startsAt), "day")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Volver a la agenda
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="md" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {patient ? (
                <Link href={`/patients/${patient.id}`} className="hover:underline">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
              <CalendarClock className="size-4" aria-hidden />
              {capitalize(formatDate(appointment.startsAt, "long"))} · {formatTime(appointment.startsAt)}–
              {formatTime(appointment.endsAt)}
            </p>
          </div>
        </div>
        <Badge tone={status.tone} dot className="self-start px-3 py-1 text-sm sm:self-auto">
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Consulta" />
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Tipo">{consultation?.name ?? "Consulta"}</Field>
                <Field label="Duración">{consultation ? `${consultation.durationMinutes} min` : "—"}</Field>
                <Field label="Precio">
                  <span className="tabular">{consultation ? formatMoney(consultation.price) : "—"}</span>
                </Field>
                <Field label="Modalidad">
                  <span className="inline-flex items-center gap-1">
                    {appointment.modality === "video" ? <Video className="size-4 text-info" aria-hidden /> : null}
                    {MODALITY_LABEL[appointment.modality]}
                  </span>
                </Field>
                <Field label="Origen de la reserva">{CHANNEL_LABEL[appointment.channel]}</Field>
                <Field label="Referencia">
                  <span className="text-muted">{appointment.id}</span>
                </Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Pago" />
            <CardContent>
              {payment ? (
                <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field label="Estado">
                    <Badge tone={PAYMENT_STATUS[payment.status].tone}>{PAYMENT_STATUS[payment.status].label}</Badge>
                  </Field>
                  <Field label="Importe">
                    <span className="tabular font-medium">{formatMoney(payment.amount)}</span>
                  </Field>
                  <Field label="Método">{PAYMENT_METHOD_LABEL[payment.method]}</Field>
                  <Field label="Registrado">{formatDate(payment.createdAt)}</Field>
                  <Field label={payment.status === "refunded" ? "Reembolsado" : "Liquidado"}>
                    {payment.settledAt ? formatDate(payment.settledAt) : "Pendiente"}
                  </Field>
                </dl>
              ) : (
                <p className="text-sm text-muted">
                  {appointment.status === "cancelled" || appointment.status === "no_show"
                    ? "Esta cita no generó ningún cobro."
                    : "Aún no hay un cobro registrado. Se registrará al realizarse la consulta."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Paciente"
              action={
                patient ? (
                  <ButtonLink href={`/patients/${patient.id}`} variant="ghost" size="sm">
                    Ver perfil
                  </ButtonLink>
                ) : null
              }
            />
            <CardContent>
              {patient ? (
                <dl className="space-y-3">
                  <Field label="Edad">
                    {formatNumber(ageOn(patient.dateOfBirth, now))} años ·{" "}
                    <span className="text-muted">{formatDate(`${patient.dateOfBirth}T00:00:00Z`)}</span>
                  </Field>
                  <Field label="Contacto">
                    <span className="flex items-center gap-1.5 break-all">
                      <Mail className="size-3.5 shrink-0 text-subtle" aria-hidden /> {patient.email}
                    </span>
                    <span className="mt-1 flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0 text-subtle" aria-hidden /> {patient.phone}
                    </span>
                  </Field>
                  <Field label="Consultas realizadas">{formatNumber(completedVisits)}</Field>
                  <Field label="Paciente desde">{firstVisit ? formatDate(firstVisit) : "—"}</Field>
                </dl>
              ) : (
                <p className="text-sm text-muted">Paciente no encontrado.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Historial de citas" description={`${formatNumber(history.length)} en total`} />
            <CardContent className="pt-2">
              <ul className="divide-y divide-border">
                {sortedHistory.slice(0, 8).map((apt) => {
                  const current = apt.id === appointment.id;
                  return (
                    <li key={apt.id}>
                      <Link
                        href={`/appointments/${apt.id}`}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "-mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm hover:bg-surface-muted",
                          current && "bg-primary-soft hover:bg-primary-soft",
                        )}
                      >
                        <span className="min-w-0">
                          <span className="tabular block">{formatDate(apt.startsAt)}</span>
                          <span className="block truncate text-xs text-muted">
                            {typesById.get(apt.consultationTypeId)?.name}
                          </span>
                        </span>
                        <Badge tone={APPOINTMENT_STATUS[apt.status].tone}>{APPOINTMENT_STATUS[apt.status].label}</Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
