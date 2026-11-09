/**
 * Receipts ("recibos de honorarios") for paid consultations, used by patients
 * to claim reimbursement from their health insurer.
 */
import type { PatientDocument, Transaction } from "./types";

/** Only settled, non-refunded payments can be documented with a receipt. */
export function canIssueReceipt(transaction: Transaction) {
  return transaction.status === "paid";
}

/**
 * Stable, sequential folio derived from the transaction: REC-2026-001234.
 * A real implementation must reserve folios atomically in the database so they
 * are never reused or skipped (a legal requirement in many countries).
 */
export function receiptNumber(transaction: Transaction) {
  const year = (transaction.settledAt ?? transaction.createdAt).slice(0, 4);
  const sequence = transaction.id.replace(/\D/g, "").padStart(6, "0");
  return `REC-${year}-${sequence}`;
}

export function receiptHref(transaction: Transaction) {
  return `/receipts/${transaction.id}`;
}

/** A receipt as an entry of the patient's document folder (generated on demand, never stored). */
export function receiptDocument(transaction: Transaction, appointmentId: string): PatientDocument {
  return {
    id: `receipt_${transaction.id}`,
    patientId: transaction.patientId,
    name: `Recibo ${receiptNumber(transaction)}`,
    category: "receipt",
    mimeType: "application/pdf",
    size: 0,
    createdAt: transaction.settledAt ?? transaction.createdAt,
    source: "receipt",
    appointmentId,
    transactionId: transaction.id,
  };
}
