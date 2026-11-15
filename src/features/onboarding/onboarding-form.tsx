"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createPractice, type OnboardingState } from "./actions";

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-2 focus:outline-primary/20";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(createPractice, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-[6rem_1fr] gap-3">
        <label className="block text-sm font-medium">
          Título
          <select name="title" defaultValue="Dr." className={inputClass}>
            <option>Dr.</option>
            <option>Dra.</option>
          </select>
        </label>
        <label className="block text-sm font-medium">
          Nombre completo
          <input name="fullName" required autoComplete="name" className={inputClass} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Especialidad
        <input name="specialty" placeholder="Medicina interna" className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        Teléfono del consultorio
        <input name="phone" type="tel" autoComplete="tel" placeholder="+52 81 …" className={inputClass} />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium">
          Nombre del consultorio
          <input name="clinicName" required className={inputClass} />
        </label>
        <label className="block text-sm font-medium">
          Ciudad
          <input name="city" placeholder="Monterrey, N.L." className={inputClass} />
        </label>
      </div>
      {state.error ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-10 w-full">
        {pending ? "Creando tu consultorio…" : "Crear mi consultorio"}
      </Button>
      <p className="text-center text-xs text-subtle">
        Empezarás con 4 tipos de consulta de ejemplo; podrás ajustarlos después.
      </p>
    </form>
  );
}
