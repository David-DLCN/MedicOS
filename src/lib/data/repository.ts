/**
 * Data access layer: the only module screens use to read data.
 *
 * Demo mode (no Supabase settings) reads the fictional dataset; live mode reads
 * the signed-in doctor's data from Supabase. Both implement DataSource
 * (lib/data/types.ts), so no screen changes between modes.
 */
import "server-only";
import { DEMO_NOW, IS_LIVE } from "@/lib/config";
import type { ID } from "@/lib/domain/types";
import { mockSource } from "./mock/source";
import { supabaseSource } from "./supabase/source";
import type { DataSource, DateRange, PracticeContext } from "./types";

export type { DateRange, PracticeContext, SelfInvoiceView } from "./types";

const source: DataSource = IS_LIVE ? supabaseSource : mockSource;

/** Reference "now": the fixed demo instant, or the real clock in live mode. */
export function getNow(): Date {
  return IS_LIVE ? new Date() : DEMO_NOW;
}

/** Practice of the signed-in doctor, or null if they still need to set it up (live mode). */
export function findPracticeContext(): Promise<PracticeContext | null> {
  return source.getPracticeContext();
}

/** Practice context for screens inside the doctor app (the layout guarantees it exists). */
export async function getPracticeContext(): Promise<PracticeContext> {
  const context = await source.getPracticeContext();
  if (!context) throw new Error("No practice set up for this user");
  return context;
}

export const listPatients = () => source.listPatients();
export const getPatient = (id: ID) => source.getPatient(id);
export const listAppointments = (range?: DateRange) => source.listAppointments(range);
export const getAppointment = (id: ID) => source.getAppointment(id);
export const listAppointmentsForPatient = (patientId: ID) => source.listAppointmentsForPatient(patientId);
export const listTransactionsForAppointments = (ids: ID[]) => source.listTransactionsForAppointments(ids);
export const getTransaction = (id: ID) => source.getTransaction(id);
export const listTransactions = (range?: DateRange) => source.listTransactions(range);
/** Stored documents of a patient (newest first). Receipts are generated, not stored. */
export const listDocumentsForPatient = (patientId: ID) => source.listDocumentsForPatient(patientId);
export const getInvoiceForTransaction = (transactionId: ID) => source.getInvoiceForTransaction(transactionId);
export const listInvoices = () => source.listInvoices();
export const listIntegrations = () => source.listIntegrations();
export const getSelfInvoiceView = (token: string) => source.getSelfInvoiceView(token);
