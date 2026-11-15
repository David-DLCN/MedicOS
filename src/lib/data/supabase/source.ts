import "server-only";
/**
 * Live data source. Queries run with the signed-in doctor's session, so Row
 * Level Security (supabase/migrations) limits every result to their own data.
 */
import type { DataSource, DateRange, SelfInvoiceView } from "@/lib/data/types";
import { integrations } from "@/lib/data/mock/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ID } from "@/lib/domain/types";
import {
  toAppointment,
  toClinic,
  toConsultationType,
  toDoctor,
  toInvoice,
  toPatient,
  toTransaction,
} from "./mappers";

/** PostgREST returns at most 1 000 rows per request: page through everything. */
const PAGE = 1000;

/* eslint-disable @typescript-eslint/no-explicit-any -- PostgREST builders and rows are untyped here */
type Query = any;
type Row = Record<string, any>;
/* eslint-enable @typescript-eslint/no-explicit-any */

async function fetchAll<T>(build: (from: number, to: number) => Query, map: (row: Row) => T) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as Row[]).map(map));
    if (!data || data.length < PAGE) return rows;
  }
}

function chunk<T>(items: T[], size: number) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));
}

async function single<T>(query: Query, map: (row: Row) => T): Promise<T | null> {
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? map(data) : null;
}

function rangeFilter(query: Query, column: string, range?: DateRange) {
  return range ? query.gte(column, range.from.toISOString()).lt(column, range.to.toISOString()) : query;
}

export const supabaseSource: DataSource = {
  async getPracticeContext() {
    const db = await createSupabaseServerClient();
    const { data: doctorRow, error } = await db.from("doctors").select("*, clinics(*)").maybeSingle();
    if (error) throw new Error(error.message);
    if (!doctorRow) return null;
    const { data: types, error: typesError } = await db
      .from("consultation_types")
      .select("*")
      .eq("active", true)
      .order("price_amount", { ascending: false });
    if (typesError) throw new Error(typesError.message);
    return {
      doctor: toDoctor(doctorRow),
      clinic: toClinic((doctorRow as Row).clinics),
      consultationTypes: ((types ?? []) as Row[]).map(toConsultationType),
    };
  },
  async listPatients() {
    const db = await createSupabaseServerClient();
    return fetchAll((from, to) => db.from("patients").select("*").order("id").range(from, to), toPatient);
  },
  async getPatient(id) {
    const db = await createSupabaseServerClient();
    return single(db.from("patients").select("*").eq("id", id), toPatient);
  },
  async listAppointments(range) {
    const db = await createSupabaseServerClient();
    return fetchAll(
      (from, to) => rangeFilter(db.from("appointments").select("*"), "starts_at", range).order("id").range(from, to),
      toAppointment,
    );
  },
  async getAppointment(id) {
    const db = await createSupabaseServerClient();
    return single(db.from("appointments").select("*").eq("id", id), toAppointment);
  },
  async listAppointmentsForPatient(patientId) {
    const db = await createSupabaseServerClient();
    return fetchAll(
      (from, to) => db.from("appointments").select("*").eq("patient_id", patientId).order("id").range(from, to),
      toAppointment,
    );
  },
  async listTransactionsForAppointments(appointmentIds: ID[]) {
    if (appointmentIds.length === 0) return [];
    const db = await createSupabaseServerClient();
    // Keep each "in (...)" list short enough for the request URL.
    const batches = await Promise.all(
      chunk(appointmentIds, 150).map((ids) =>
        fetchAll(
          (from, to) => db.from("transactions").select("*").in("appointment_id", ids).order("id").range(from, to),
          toTransaction,
        ),
      ),
    );
    return batches.flat();
  },
  async getTransaction(id) {
    const db = await createSupabaseServerClient();
    return single(db.from("transactions").select("*").eq("id", id), toTransaction);
  },
  async listTransactions(range) {
    const db = await createSupabaseServerClient();
    return fetchAll(
      (from, to) => rangeFilter(db.from("transactions").select("*"), "created_at", range).order("id").range(from, to),
      toTransaction,
    );
  },
  async listDocumentsForPatient() {
    // Stored documents move to Supabase Storage in a later step; uploads stay in the browser for now.
    return [];
  },
  async getInvoiceForTransaction(transactionId) {
    const db = await createSupabaseServerClient();
    return single(db.from("invoices").select("*").eq("transaction_id", transactionId), toInvoice);
  },
  async listInvoices() {
    const db = await createSupabaseServerClient();
    return fetchAll((from, to) => db.from("invoices").select("*").order("id").range(from, to), toInvoice);
  },
  async listIntegrations() {
    return integrations;
  },
  async getSelfInvoiceView(token): Promise<SelfInvoiceView | null> {
    if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
    const db = await createSupabaseServerClient();
    const { data, error } = await db.rpc("self_invoice_context", { p_token: token }).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    const row = data as Row;
    return {
      transactionId: row.transaction_id,
      amount: { amount: row.amount, currency: row.currency },
      method: row.method,
      serviceStartsAt: new Date(row.service_starts_at).toISOString(),
      consultationName: row.consultation_name,
      doctorTitle: row.doctor_title,
      doctorName: row.doctor_name,
      specialty: row.specialty,
      clinicName: row.clinic_name,
      issuer: {
        name: row.issuer_legal_name,
        rfc: row.issuer_rfc,
        taxRegime: row.issuer_tax_regime,
        postalCode: row.issuer_postal_code,
      },
      patientEmail: row.patient_email,
      invoice: row.invoice_folio
        ? {
            folio: row.invoice_folio,
            uuid: row.invoice_uuid,
            issuedAt: new Date(row.invoice_issued_at).toISOString(),
            receiverRfc: row.invoice_receiver_rfc,
          }
        : null,
    };
  },
};
