import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FileCheck2 } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SelfInvoiceForm } from "@/features/invoicing/self-invoice-form";
import { IS_DEMO_DATA } from "@/lib/config";
import { getSelfInvoiceView } from "@/lib/data/repository";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Solicita tu factura", robots: { index: false } };

type Params = Promise<{ token: string }>;

/** Public, patient-facing self-invoice page (autofactura). No login: the link token grants access. */
export default async function SelfInvoicePage({ params }: { params: Params }) {
  const { token } = await params;
  const view = await getSelfInvoiceView(token);
  if (!view) notFound();

  const concept = `${view.consultationName} · ${view.specialty}`;
  const invoice = view.invoice;

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <main className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          {IS_DEMO_DATA ? (
            <span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-medium text-info">Demostración</span>
          ) : null}
        </div>

        <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
          <h1 className="text-xl font-semibold tracking-tight">Solicita tu factura</h1>
          <p className="mt-1 text-sm text-muted">
            {view.doctorTitle} {view.doctorName} · {view.clinicName}
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-muted p-4 text-sm">
            <div className="col-span-2">
              <dt className="text-xs text-muted">Servicio</dt>
              <dd className="font-medium">{concept}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Fecha</dt>
              <dd>{formatDate(view.serviceStartsAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Importe</dt>
              <dd className="tabular font-semibold">{formatMoney(view.amount)}</dd>
            </div>
          </dl>

          <div className="mt-6">
            {invoice ? (
              <div className="rounded-lg bg-primary-soft p-4 text-sm text-primary">
                <p className="flex items-center gap-2 font-semibold">
                  <FileCheck2 className="size-4" aria-hidden /> Esta consulta ya fue facturada
                </p>
                <p className="mt-1">
                  Folio {invoice.folio} · emitida el {formatDate(invoice.issuedAt)} a nombre de RFC{" "}
                  {invoice.receiverRfc.slice(0, 4)}•••••••••.
                </p>
                <p className="mt-1 text-xs break-all">Folio fiscal: {invoice.uuid}</p>
              </div>
            ) : (
              <SelfInvoiceForm
                context={{
                  issuer: { ...view.issuer, name: view.issuer.name.toUpperCase() },
                  concept,
                  serviceDate: formatDate(view.serviceStartsAt),
                  amount: view.amount,
                  paymentMethod: view.method,
                  defaultEmail: view.patientEmail,
                }}
              />
            )}
          </div>
        </section>

        <p className="mt-4 text-center text-xs text-subtle">
          Tus datos fiscales solo se usan para emitir esta factura.
        </p>
      </main>
    </div>
  );
}
