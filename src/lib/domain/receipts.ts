/**
 * Receipts ("recibos de honorarios") for paid consultations, used by patients
 * to claim reimbursement from their health insurer.
 */
import type { Transaction } from "./types";

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
