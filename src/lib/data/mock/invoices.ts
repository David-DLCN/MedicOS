/**
 * Sample CFDI invoices for part of the paid consultations. Own random stream,
 * so the rest of the dataset is unaffected. RFCs start with "DEMO" so they can
 * never match a real taxpayer.
 */
import type { Invoice, Patient, Transaction } from "@/lib/domain/types";
import { isrWithholding } from "@/lib/domain/invoicing";
import { createRandom } from "./random";

const HEX = "0123456789ABCDEF";

export function generateSampleInvoices(
  transactions: Transaction[],
  patients: Patient[],
  seed = 20261112,
): Invoice[] {
  const random = createRandom(seed);
  const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
  const invoices: Invoice[] = [];
  const uuid = () =>
    [8, 4, 4, 4, 12].map((length) => Array.from({ length }, () => HEX[random.int(0, 15)]).join("")).join("-");

  for (const txn of transactions) {
    if (txn.status !== "paid" || !random.chance(0.35)) continue;
    const patient = patientsById.get(txn.patientId);
    if (!patient) continue;
    const forCompany = random.chance(0.12);
    const dob = patient.dateOfBirth.replace(/-/g, "").slice(2);
    const rfc = forCompany ? `DEM${dob}XX${random.int(0, 9)}` : `DEMO${dob}XX${random.int(0, 9)}`;
    invoices.push({
      id: `inv_${String(invoices.length + 1).padStart(5, "0")}`,
      transactionId: txn.id,
      patientId: txn.patientId,
      folio: `A-${1000 + invoices.length + 1}`,
      uuid: uuid(),
      issuedAt: txn.settledAt ?? txn.createdAt,
      receiver: {
        rfc,
        name: forCompany ? "EMPRESA DEMO SA DE CV" : `${patient.firstName} ${patient.lastName}`.toUpperCase(),
        taxRegime: forCompany ? "601" : random.pick(["605", "612", "626"]),
        postalCode: random.pick(["64000", "64460", "66220", "66260", "64700"]),
        cfdiUse: forCompany ? "G03" : "D01",
        email: patient.email,
      },
      subtotal: { ...txn.amount },
      isrWithheld: isrWithholding(txn.amount.amount, rfc),
    });
  }
  return invoices;
}
