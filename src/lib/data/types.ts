/**
 * Contract every data source (demo or Supabase) implements. Screens only use
 * the functions re-exported by lib/data/repository.ts.
 */
import type {
  Appointment,
  Clinic,
  ConsultationType,
  Doctor,
  ID,
  Integration,
  Invoice,
  Money,
  Patient,
  PatientDocument,
  PaymentMethod,
  Transaction,
} from "@/lib/domain/types";

export interface DateRange {
  from: Date;
  to: Date;
}

export interface PracticeContext {
  doctor: Doctor;
  clinic: Clinic;
  consultationTypes: ConsultationType[];
}

/** Everything the public self-invoice page needs, looked up by its token. */
export interface SelfInvoiceView {
  transactionId: ID;
  amount: Money;
  method: PaymentMethod;
  serviceStartsAt: string;
  consultationName: string;
  doctorTitle: string;
  doctorName: string;
  specialty: string;
  clinicName: string;
  issuer: { name: string; rfc: string; taxRegime: string; postalCode: string };
  patientEmail: string;
  invoice: { folio: string; uuid: string; issuedAt: string; receiverRfc: string } | null;
}

export interface DataSource {
  /** Null when the signed-in user has not set up a practice yet (live mode). */
  getPracticeContext(): Promise<PracticeContext | null>;
  listPatients(): Promise<Patient[]>;
  getPatient(id: ID): Promise<Patient | null>;
  listAppointments(range?: DateRange): Promise<Appointment[]>;
  getAppointment(id: ID): Promise<Appointment | null>;
  listAppointmentsForPatient(patientId: ID): Promise<Appointment[]>;
  listTransactionsForAppointments(appointmentIds: ID[]): Promise<Transaction[]>;
  getTransaction(id: ID): Promise<Transaction | null>;
  listTransactions(range?: DateRange): Promise<Transaction[]>;
  listDocumentsForPatient(patientId: ID): Promise<PatientDocument[]>;
  getInvoiceForTransaction(transactionId: ID): Promise<Invoice | null>;
  listInvoices(): Promise<Invoice[]>;
  listIntegrations(): Promise<Integration[]>;
  getSelfInvoiceView(token: string): Promise<SelfInvoiceView | null>;
}
