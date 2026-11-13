"use client";

import { useState } from "react";
import { CheckCircle2, FileCheck2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isCompanyRfc,
  isValidRfc,
  isrWithholding,
  normalizeRfc,
  validateReceiver,
  type ReceiverErrors,
} from "@/lib/domain/invoicing";
import type { CfdiReceiver, Money } from "@/lib/domain/types";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  CFDI_USE_LABEL,
  MEDICAL_SERVICE_KEY,
  PAYMENT_FORM_LABEL,
  PAYMENT_METHOD_PUE,
  TAX_REGIME_LABEL,
} from "./sat-catalogs";

export interface SelfInvoiceContext {
  issuer: { name: string; rfc: string; taxRegime: string; postalCode: string };
  concept: string;
  serviceDate: string;
  amount: Money;
  paymentMethod: string;
  defaultEmail: string;
}

const inputClass =
  "mt-1 h-10 w-full rounded-lg border bg-surface px-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20";

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-normal text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs font-normal text-subtle">{hint}</span>
      ) : null}
    </label>
  );
}

/** Patient-facing self-invoice form (autofactura). In the demo nothing is stamped or sent. */
export function SelfInvoiceForm({ context }: { context: SelfInvoiceContext }) {
  const [receiver, setReceiver] = useState<CfdiReceiver>({
    rfc: "",
    name: "",
    taxRegime: "",
    postalCode: "",
    cfdiUse: "D01",
    email: context.defaultEmail,
  });
  const [errors, setErrors] = useState<ReceiverErrors>({});
  const [submitted, setSubmitted] = useState<CfdiReceiver | null>(null);

  const set = (key: keyof CfdiReceiver) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setReceiver((current) => {
      const next = { ...current, [key]: value };
      // Companies cannot use D01: switch to G03 when a valid company RFC is entered.
      if (key === "rfc" && isValidRfc(value) && isCompanyRfc(value) && current.cfdiUse === "D01") next.cfdiUse = "G03";
      return next;
    });
    // The field's error disappears as soon as the patient starts correcting it.
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = { ...receiver, rfc: normalizeRfc(receiver.rfc), name: receiver.name.trim().toUpperCase() };
    const found = validateReceiver(clean);
    setErrors(found);
    if (Object.keys(found).length === 0) setSubmitted(clean);
  };

  if (submitted) return <CfdiPreview context={context} receiver={submitted} onEdit={() => setSubmitted(null)} />;

  const companyRfc = receiver.rfc.length > 0 && isCompanyRfc(receiver.rfc);

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="RFC" error={errors.rfc} hint={companyRfc ? "RFC de empresa: se retiene 10 % de ISR." : undefined}>
        <input
          value={receiver.rfc}
          onChange={set("rfc")}
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={13}
          placeholder="XAXX010101000"
          className={cn(inputClass, "uppercase", errors.rfc ? "border-danger" : "border-border")}
        />
      </Field>
      <Field
        label="Nombre o razón social"
        error={errors.name}
        hint="Exactamente como aparece en tu constancia de situación fiscal, sin régimen de capital."
      >
        <input
          value={receiver.name}
          onChange={set("name")}
          autoComplete="name"
          className={cn(inputClass, errors.name ? "border-danger" : "border-border")}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Field label="Régimen fiscal" error={errors.taxRegime}>
            <select
              value={receiver.taxRegime}
              onChange={set("taxRegime")}
              className={cn(inputClass, errors.taxRegime ? "border-danger" : "border-border")}
            >
              <option value="">Elige tu régimen</option>
              {Object.entries(TAX_REGIME_LABEL).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Código postal" error={errors.postalCode}>
          <input
            value={receiver.postalCode}
            onChange={set("postalCode")}
            inputMode="numeric"
            maxLength={5}
            className={cn(inputClass, errors.postalCode ? "border-danger" : "border-border")}
          />
        </Field>
      </div>
      <Field label="Uso del CFDI" error={errors.cfdiUse} hint="D01 te permite deducir la consulta en tu declaración anual.">
        <select value={receiver.cfdiUse} onChange={set("cfdiUse")} className={cn(inputClass, "border-border")}>
          {Object.entries(CFDI_USE_LABEL).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Correo para recibir PDF y XML" error={errors.email}>
        <input
          type="email"
          value={receiver.email}
          onChange={set("email")}
          autoComplete="email"
          className={cn(inputClass, errors.email ? "border-danger" : "border-border")}
        />
      </Field>
      <Button type="submit" className="h-10 w-full">
        <FileCheck2 className="size-4" aria-hidden /> Generar mi factura
      </Button>
    </form>
  );
}

function Line({ label, children, strong = false }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-4 py-1", strong && "text-base font-semibold")}>
      <dt className={strong ? "" : "text-muted"}>{label}</dt>
      <dd className="tabular text-right">{children}</dd>
    </div>
  );
}

function CfdiPreview({
  context,
  receiver,
  onEdit,
}: {
  context: SelfInvoiceContext;
  receiver: CfdiReceiver;
  onEdit: () => void;
}) {
  const isr = isrWithholding(context.amount.amount, receiver.rfc);
  const money = (amount: number) => formatMoney({ amount, currency: context.amount.currency });

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-primary-soft px-4 py-3 text-sm text-primary">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Tus datos son correctos.</span> Así quedará tu factura; la recibirás en{" "}
          {receiver.email}.
        </span>
      </p>

      <div className="rounded-xl border border-border p-4 text-sm">
        <h3 className="text-xs font-medium tracking-wide text-subtle uppercase">Emisor</h3>
        <p className="mt-1 font-medium">{context.issuer.name}</p>
        <p className="text-muted">
          RFC {context.issuer.rfc} · Régimen {context.issuer.taxRegime} · C.P. {context.issuer.postalCode}
        </p>

        <h3 className="mt-4 text-xs font-medium tracking-wide text-subtle uppercase">Receptor</h3>
        <p className="mt-1 font-medium">{receiver.name}</p>
        <p className="text-muted">
          RFC {receiver.rfc} · {TAX_REGIME_LABEL[receiver.taxRegime]} · C.P. {receiver.postalCode}
        </p>
        <p className="text-muted">Uso: {CFDI_USE_LABEL[receiver.cfdiUse]}</p>

        <h3 className="mt-4 text-xs font-medium tracking-wide text-subtle uppercase">Concepto</h3>
        <p className="mt-1">
          {context.concept} · {context.serviceDate}
        </p>
        <p className="text-xs text-muted">Clave SAT {MEDICAL_SERVICE_KEY} · Unidad E48 (servicio)</p>

        <dl className="mt-4 border-t border-border pt-3">
          <Line label="Subtotal">{money(context.amount.amount)}</Line>
          <Line label="IVA">Exento</Line>
          {isr > 0 ? <Line label="Retención ISR (10 %)">−{money(isr)}</Line> : null}
          <Line label="Total" strong>
            {money(context.amount.amount - isr)}
          </Line>
          <Line label="Forma de pago">{PAYMENT_FORM_LABEL[context.paymentMethod] ?? "99 · Por definir"}</Line>
          <Line label="Método de pago">{PAYMENT_METHOD_PUE}</Line>
        </dl>
      </div>

      <p className="flex items-start gap-2 rounded-lg bg-info-soft px-4 py-3 text-xs text-info">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        Demo: esta factura no se timbra ante el SAT ni se envía por correo. En producción, un proveedor certificado
        (PAC) la timbra al instante y recibes el PDF y el XML.
      </p>

      <Button type="button" variant="secondary" className="w-full" onClick={onEdit}>
        Corregir mis datos
      </Button>
    </div>
  );
}
