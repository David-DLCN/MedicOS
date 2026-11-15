/**
 * Builds the rows that load the fictional demo dataset into a real practice.
 * Pure (no database access) so it can be tested against Postgres directly.
 *
 * Dates move to the current week (whole weeks, so weekdays stay the same) and
 * the dataset's wall-clock times are converted to the clinic's time zone.
 */
import { APP_CONFIG, DEMO_NOW } from "@/lib/config";
import { generateDataset } from "@/lib/data/mock/generate";
import { generateSampleInvoices } from "@/lib/data/mock/invoices";
import { consultationTypes as sampleTypes } from "@/lib/data/mock/seed";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type SampleTable = "patients" | "appointments" | "transactions" | "invoices";

export function buildSampleRows(input: {
  doctorId: string;
  /** Consultation type ids of the practice, by name (created at onboarding). */
  typeIdByName: Map<string, string>;
  now: Date;
}): [SampleTable, Record<string, unknown>[]][] {
  const { doctorId, typeIdByName, now } = input;
  const typeId = (sampleTypeId: string) => {
    const name = sampleTypes.find((type) => type.id === sampleTypeId)?.name ?? "";
    return typeIdByName.get(name);
  };

  const dataset = generateDataset();
  const invoices = generateSampleInvoices(dataset.transactions, dataset.patients);

  // Whole weeks, rounded down: the dataset's "today" never lands in the future,
  // so no appointment marked as completed appears after the real now.
  const weeks = Math.floor((now.getTime() - DEMO_NOW.getTime()) / WEEK_MS) * WEEK_MS;
  const toClinicTime = -APP_CONFIG.utcOffsetMinutes * 60 * 1000;
  const shift = (value: string | null | undefined) =>
    value ? new Date(Date.parse(value) + weeks + toClinicTime).toISOString() : null;

  const ids = new Map<string, string>();
  const idFor = (mockId: string) => {
    let id = ids.get(mockId);
    if (!id) {
      id = crypto.randomUUID();
      ids.set(mockId, id);
    }
    return id;
  };

  return [
    [
      "patients",
      dataset.patients.map((p) => ({
        id: idFor(p.id),
        doctor_id: doctorId,
        first_name: p.firstName,
        last_name: p.lastName,
        date_of_birth: p.dateOfBirth,
        email: p.email,
        phone: p.phone,
        created_at: shift(p.createdAt),
      })),
    ],
    [
      "appointments",
      dataset.appointments.map((a) => ({
        id: idFor(a.id),
        doctor_id: doctorId,
        patient_id: idFor(a.patientId),
        consultation_type_id: typeId(a.consultationTypeId),
        starts_at: shift(a.startsAt),
        ends_at: shift(a.endsAt),
        status: a.status,
        modality: a.modality,
        channel: a.channel,
        external_booking_id: a.externalBookingId ?? null,
        reminder_sent_at: shift(a.reminder?.sentAt),
        reminder_confirmed_at: shift(a.reminder?.confirmedAt),
      })),
    ],
    [
      "transactions",
      dataset.transactions.map((t) => ({
        id: idFor(t.id),
        doctor_id: doctorId,
        appointment_id: idFor(t.appointmentId),
        patient_id: idFor(t.patientId),
        amount: t.amount.amount,
        currency: t.amount.currency,
        status: t.status,
        method: t.method,
        created_at: shift(t.createdAt),
        settled_at: shift(t.settledAt),
      })),
    ],
    [
      "invoices",
      invoices.map((i) => ({
        doctor_id: doctorId,
        transaction_id: idFor(i.transactionId),
        patient_id: idFor(i.patientId),
        folio: i.folio,
        uuid: i.uuid,
        issued_at: shift(i.issuedAt),
        receiver_rfc: i.receiver.rfc,
        receiver_name: i.receiver.name,
        receiver_tax_regime: i.receiver.taxRegime,
        receiver_postal_code: i.receiver.postalCode,
        receiver_cfdi_use: i.receiver.cfdiUse,
        receiver_email: i.receiver.email,
        subtotal_amount: i.subtotal.amount,
        currency: i.subtotal.currency,
        isr_withheld: i.isrWithheld,
      })),
    ],
  ];
}
