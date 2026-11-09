/**
 * Core domain model for MedicOS.
 *
 * These types are the contract between the UI and the data layer. The mock
 * data and, later, the Supabase repositories must both produce exactly these
 * shapes, so the UI never needs to know where data comes from.
 *
 * Conventions:
 * - IDs are opaque strings (UUIDs once persisted).
 * - Timestamps are ISO-8601 strings in UTC.
 * - Money is always stored in minor units (cents) together with its currency.
 */

export type ID = string;
export type ISODateTime = string;
export type ISODate = string; // YYYY-MM-DD

export interface Money {
  /** Amount in minor units (e.g. cents). */
  amount: number;
  /** ISO-4217 currency code. */
  currency: string;
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

/** A clinic or independent practice. One doctor may belong to one clinic for now. */
export interface Clinic {
  id: ID;
  name: string;
  city: string;
}

export type ConsultationModality = "in_person" | "video";

/** A bookable service offered by a doctor (future marketplace "product"). */
export interface ConsultationType {
  id: ID;
  doctorId: ID;
  name: string;
  durationMinutes: number;
  price: Money;
  modality: ConsultationModality;
}

export interface Doctor {
  id: ID;
  clinicId: ID;
  fullName: string;
  /** Honorific shown in the UI, e.g. "Dra." */
  title: string;
  specialty: string;
  email: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Patients (synthetic only — no clinical records in the MVP)
// ---------------------------------------------------------------------------

export interface Patient {
  id: ID;
  /** Doctor that owns this patient relationship (tenancy boundary). */
  doctorId: ID;
  firstName: string;
  lastName: string;
  dateOfBirth: ISODate;
  email: string;
  phone: string;
  createdAt: ISODateTime;
}

// ---------------------------------------------------------------------------
// Appointments
// ---------------------------------------------------------------------------

export type AppointmentStatus =
  | "scheduled" // booked, awaiting confirmation
  | "confirmed"
  | "completed"
  | "cancelled"
  | "no_show";

/** Where the booking came from. "marketplace" is the future MedicOS booking flow. */
export type BookingChannel = "marketplace" | "phone" | "walk_in";

export interface Appointment {
  id: ID;
  doctorId: ID;
  patientId: ID;
  consultationTypeId: ID;
  startsAt: ISODateTime;
  endsAt: ISODateTime;
  status: AppointmentStatus;
  modality: ConsultationModality;
  channel: BookingChannel;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

export type PaymentStatus = "paid" | "pending" | "refunded" | "failed";
export type PaymentMethod = "card" | "apple_pay" | "cash" | "transfer";

/**
 * A payment for a single consultation. Kept provider-agnostic on purpose:
 * Stripe / Stripe Connect / Shopify identifiers would live in a separate
 * provider-specific table, not here.
 */
export interface Transaction {
  id: ID;
  doctorId: ID;
  appointmentId: ID;
  patientId: ID;
  amount: Money;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: ISODateTime;
  /** When the money was actually received (paid / refunded transactions). */
  settledAt: ISODateTime | null;
}

// ---------------------------------------------------------------------------
// Integrations (concept only in the MVP)
// ---------------------------------------------------------------------------

export type IntegrationCategory = "payments" | "scheduling" | "communication" | "accounting";
export type IntegrationStatus = "available" | "planned";

export interface Integration {
  id: ID;
  name: string;
  category: IntegrationCategory;
  description: string;
  status: IntegrationStatus;
}
