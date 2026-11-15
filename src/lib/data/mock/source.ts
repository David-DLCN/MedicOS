/** Demo data source: the deterministic fictional dataset, no login. */
import type { DataSource, DateRange, SelfInvoiceView } from "@/lib/data/types";
import type { Invoice, PatientDocument } from "@/lib/domain/types";
import { generateSampleDocuments } from "./documents";
import { generateDataset, type MockDataset } from "./generate";
import { generateSampleInvoices } from "./invoices";
import { clinic, consultationTypes, doctor, integrations } from "./seed";

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

function inRange(value: string, range?: DateRange) {
  if (!range) return true;
  const time = Date.parse(value);
  return time >= range.from.getTime() && time < range.to.getTime();
}

export const mockSource: DataSource = {
  async getPracticeContext() {
    return { doctor, clinic, consultationTypes };
  },
  async listPatients() {
    return data().patients;
  },
  async getPatient(id) {
    return data().patients.find((patient) => patient.id === id) ?? null;
  },
  async listAppointments(range) {
    return data().appointments.filter((appointment) => inRange(appointment.startsAt, range));
  },
  async getAppointment(id) {
    return data().appointments.find((appointment) => appointment.id === id) ?? null;
  },
  async listAppointmentsForPatient(patientId) {
    return data().appointments.filter((appointment) => appointment.patientId === patientId);
  },
  async listTransactionsForAppointments(appointmentIds) {
    const ids = new Set(appointmentIds);
    return data().transactions.filter((transaction) => ids.has(transaction.appointmentId));
  },
  async getTransaction(id) {
    return data().transactions.find((transaction) => transaction.id === id) ?? null;
  },
  async listTransactions(range) {
    return data().transactions.filter((transaction) => inRange(transaction.createdAt, range));
  },
  async listDocumentsForPatient(patientId) {
    return data()
      .documents.filter((doc) => doc.patientId === patientId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async getInvoiceForTransaction(transactionId) {
    return data().invoices.find((invoice) => invoice.transactionId === transactionId) ?? null;
  },
  async listInvoices() {
    return data().invoices;
  },
  async listIntegrations() {
    return integrations;
  },
  async getSelfInvoiceView(token): Promise<SelfInvoiceView | null> {
    const { transactions, appointments, patients, invoices } = data();
    const transaction = transactions.find((txn) => txn.id === token);
    if (!transaction || transaction.status !== "paid") return null;
    const appointment = appointments.find((apt) => apt.id === transaction.appointmentId);
    const patient = patients.find((p) => p.id === transaction.patientId);
    if (!appointment || !patient) return null;
    const invoice = invoices.find((inv) => inv.transactionId === transaction.id);
    return {
      transactionId: transaction.id,
      amount: transaction.amount,
      method: transaction.method,
      serviceStartsAt: appointment.startsAt,
      consultationName: consultationTypes.find((type) => type.id === appointment.consultationTypeId)?.name ?? "Consulta",
      doctorTitle: doctor.title,
      doctorName: doctor.fullName,
      specialty: doctor.specialty,
      clinicName: clinic.name,
      issuer: {
        name: doctor.billing.legalName,
        rfc: doctor.billing.taxId,
        taxRegime: doctor.billing.taxRegime,
        postalCode: doctor.billing.postalCode,
      },
      patientEmail: patient.email,
      invoice: invoice
        ? { folio: invoice.folio, uuid: invoice.uuid, issuedAt: invoice.issuedAt, receiverRfc: invoice.receiver.rfc }
        : null,
    };
  },
};
