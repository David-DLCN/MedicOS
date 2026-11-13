/**
 * CFDI 4.0 rules for medical fees (honorarios médicos) issued by a doctor who
 * is a persona física. Simplified for the prototype; the PAC validates the
 * final document against the SAT schema when stamping.
 */
import type { CfdiReceiver, Transaction } from "./types";

/** RFC: 4 letters + 6 digits (yymmdd) + 3-char homoclave (persona física, 13 chars),
 *  or 3 letters + 6 digits + 3 (persona moral, 12 chars). */
const RFC_PATTERN = /^([A-ZÑ&]{3,4})(\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])([A-Z\d]{2})([A\d])$/;

export function normalizeRfc(value: string) {
  return value.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidRfc(value: string) {
  return RFC_PATTERN.test(normalizeRfc(value));
}

/** Personas morales (companies) have 12-character RFCs. */
export function isCompanyRfc(rfc: string) {
  return normalizeRfc(rfc).length === 12;
}

/**
 * Medical fees are VAT-exempt (LIVA art. 15, fr. XIV). When a persona física
 * invoices a persona moral for professional fees, the company withholds 10 % ISR.
 */
export const ISR_WITHHOLDING_RATE = 0.1;

export function isrWithholding(amountMinor: number, receiverRfc: string) {
  return isCompanyRfc(receiverRfc) ? Math.round(amountMinor * ISR_WITHHOLDING_RATE) : 0;
}

export type ReceiverErrors = Partial<Record<keyof CfdiReceiver, string>>;

export function validateReceiver(receiver: CfdiReceiver): ReceiverErrors {
  const errors: ReceiverErrors = {};
  if (!isValidRfc(receiver.rfc)) errors.rfc = "Revisa el RFC: 13 caracteres para personas, 12 para empresas.";
  if (receiver.name.trim().length < 3) errors.name = "Escribe el nombre tal como aparece en tu constancia fiscal.";
  if (!receiver.taxRegime) errors.taxRegime = "Elige tu régimen fiscal.";
  if (!/^\d{5}$/.test(receiver.postalCode.trim())) errors.postalCode = "El código postal tiene 5 dígitos.";
  if (!receiver.cfdiUse) errors.cfdiUse = "Elige el uso del CFDI.";
  // D01 is a personal deduction: only personas físicas can use it.
  else if (receiver.cfdiUse === "D01" && isValidRfc(receiver.rfc) && isCompanyRfc(receiver.rfc)) {
    errors.cfdiUse = "D01 solo aplica a personas físicas. Para una empresa usa G03 · Gastos en general.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiver.email.trim())) errors.email = "Escribe un correo válido.";
  return errors;
}

/** Only paid consultations can be invoiced. */
export function canInvoice(transaction: Transaction) {
  return transaction.status === "paid";
}

/**
 * Public self-invoice link the patient receives. In production the token must
 * be a random, unguessable value stored with the transaction (and expire).
 */
export function selfInvoicePath(transaction: Transaction) {
  return `/facturar/${transaction.id}`;
}
