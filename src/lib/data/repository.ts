/**
 * Data access layer.
 *
 * Every screen reads data through these functions only. Today they are backed
 * by the in-memory demo dataset; later each one can be re-implemented against
 * Supabase (scoped to the signed-in doctor) without changing any component.
 *
 * Functions are async on purpose so the call sites already have the shape a
 * network-backed implementation needs.
 */
import { DEMO_NOW } from "@/lib/config";
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Doctor,
  ID,
  Integration,
  Invoice,
  Patient,
  PatientDocument,
  Transaction,
} from "@/lib/domain/types";
import { generateSampleDocuments } from "./mock/documents";
import { generateSampleInvoices } from "./mock/invoices";
import { generateDataset, type MockDataset } from "./mock/generate";
import { clinic, consultationTypes, doctor, integrations } from "./mock/seed";

let dataset: (MockDataset & { documents: PatientDocument[]; invoices: Invoice[] }) | null = null;
function data() {
  if (!dataset) {
    const generated = generateDataset();
    dataset = {
      ...generated,
      documents: generateSampleDocuments(generated.appointments),
      invoices: generateSampleInvoices(generated.transactions, generated.patients),
    };
  }
  return dataset;
}

export interface DateRange {
  from: Date;
  to: Date;
}

function inRange(value: string, range?: DateRange) {
  if (!range) return true;
  const time = Date.parse(value);
  return time >= range.from.getTime() && time < range.to.getTime();
}

export interface PracticeContext {
  doctor: Doctor;
  clinic: Clinic;
  consultationTypes: ConsultationType[];
}

/** Reference "now" for the current data source. */
export function getNow(): Date {
  return DEMO_NOW;
}

export async function getPracticeContext(): Promise<PracticeContext> {
  return { doctor, clinic, consultationTypes };
}

export async function listPatients(): Promise<Patient[]> {
  return data().patients;
}

export async function getPatient(id: ID): Promise<Patient | null> {
  return data().patients.find((patient) => patient.id === id) ?? null;
}

export async function listAppointments(range?: DateRange): Promise<Appointment[]> {
  return data().appointments.filter((appointment) => inRange(appointment.startsAt, range));
}

export async function getAppointment(id: ID): Promise<Appointment | null> {
  return data().appointments.find((appointment) => appointment.id === id) ?? null;
}

export async function listAppointmentsForPatient(patientId: ID): Promise<Appointment[]> {
  return data().appointments.filter((appointment) => appointment.patientId === patientId);
}

export async function listTransactionsForAppointments(appointmentIds: ID[]): Promise<Transaction[]> {
  const ids = new Set(appointmentIds);
  return data().transactions.filter((transaction) => ids.has(transaction.appointmentId));
}

export async function getTransaction(id: ID): Promise<Transaction | null> {
  return data().transactions.find((transaction) => transaction.id === id) ?? null;
}

export async function listTransactions(range?: DateRange): Promise<Transaction[]> {
  return data().transactions.filter((transaction) => inRange(transaction.createdAt, range));
}

/**
 * Stored documents of a patient (newest first). Receipts are not stored: they
 * are generated from paid transactions (see lib/domain/receipts.ts).
 */
export async function listDocumentsForPatient(patientId: ID): Promise<PatientDocument[]> {
  return data()
    .documents.filter((doc) => doc.patientId === patientId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getInvoiceForTransaction(transactionId: ID): Promise<Invoice | null> {
  return data().invoices.find((invoice) => invoice.transactionId === transactionId) ?? null;
}

export async function listInvoices(): Promise<Invoice[]> {
  return data().invoices;
}

export async function listIntegrations(): Promise<Integration[]> {
  return integrations;
}
