/** Row (snake_case, Postgres) → domain (camelCase) mappers for the Supabase data source. */
import type {
  Appointment,
  AppointmentStatus,
  BookingChannel,
  Clinic,
  ConsultationModality,
  ConsultationType,
  Doctor,
  Invoice,
  Patient,
  PaymentMethod,
  PaymentStatus,
  Transaction,
} from "@/lib/domain/types";

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come untyped from PostgREST */
type Row = Record<string, any>;

const iso = (value: string | null) => (value === null ? null : new Date(value).toISOString());

export function toClinic(row: Row): Clinic {
  return { id: row.id, name: row.name, city: row.city };
}

export function toDoctor(row: Row): Doctor {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    fullName: row.full_name,
    title: row.title,
    specialty: row.specialty,
    email: row.email,
    phone: row.phone,
    billing: {
      legalName: row.billing_legal_name,
      taxId: row.billing_rfc,
      taxRegime: row.billing_tax_regime,
      postalCode: row.billing_postal_code,
      licenseNumber: row.license_number,
      address: row.billing_address,
    },
  };
}

export function toConsultationType(row: Row): ConsultationType {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    name: row.name,
    durationMinutes: row.duration_minutes,
    price: { amount: row.price_amount, currency: row.currency },
    modality: row.modality as ConsultationModality,
  };
}

export function toPatient(row: Row): Patient {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    firstName: row.first_name,
    lastName: row.last_name,
    dateOfBirth: row.date_of_birth,
    email: row.email,
    phone: row.phone,
    createdAt: iso(row.created_at)!,
  };
}

export function toAppointment(row: Row): Appointment {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    patientId: row.patient_id,
    consultationTypeId: row.consultation_type_id,
    startsAt: iso(row.starts_at)!,
    endsAt: iso(row.ends_at)!,
    status: row.status as AppointmentStatus,
    modality: row.modality as ConsultationModality,
    channel: row.channel as BookingChannel,
    ...(row.external_booking_id ? { externalBookingId: row.external_booking_id } : {}),
    ...(row.reminder_sent_at
      ? {
          reminder: {
            channel: "whatsapp" as const,
            sentAt: iso(row.reminder_sent_at)!,
            ...(row.reminder_confirmed_at ? { confirmedAt: iso(row.reminder_confirmed_at)! } : {}),
          },
        }
      : {}),
  };
}

export function toTransaction(row: Row): Transaction {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id,
    patientId: row.patient_id,
    amount: { amount: row.amount, currency: row.currency },
    status: row.status as PaymentStatus,
    method: row.method as PaymentMethod,
    createdAt: iso(row.created_at)!,
    settledAt: iso(row.settled_at),
    invoiceToken: row.invoice_token,
  };
}

export function toInvoice(row: Row): Invoice {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    patientId: row.patient_id,
    folio: row.folio,
    uuid: row.uuid,
    issuedAt: iso(row.issued_at)!,
    receiver: {
      rfc: row.receiver_rfc,
      name: row.receiver_name,
      taxRegime: row.receiver_tax_regime,
      postalCode: row.receiver_postal_code,
      cfdiUse: row.receiver_cfdi_use,
      email: row.receiver_email,
    },
    subtotal: { amount: row.subtotal_amount, currency: row.currency },
    isrWithheld: row.isr_withheld,
  };
}
