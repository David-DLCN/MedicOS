"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { loadSampleData, type SampleDataState } from "./sample-data";

/** First screen of a brand-new practice (live mode). */
export function EmptyPractice({ firstName }: { firstName: string }) {
  const [state, action, pending] = useActionState<SampleDataState>(loadSampleData, {});
  return (
    <EmptyState
      icon={Sparkles}
      title={`Tu consultorio está listo, ${firstName}`}
      description="Todavía no hay pacientes ni citas. Puedes cargar datos de ejemplo para explorar MedicOS con tu cuenta; el registro de pacientes y citas reales es el siguiente paso del proyecto."
    >
      <form action={action} className="flex flex-col items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Cargando ejemplos… (unos segundos)" : "Cargar datos de ejemplo"}
        </Button>
        {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
      </form>
    </EmptyState>
  );
}
