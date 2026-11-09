import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/features/shared/module-placeholder";

export const metadata: Metadata = { title: "Pacientes" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Pacientes"
      description="Tu cartera de pacientes y su historial de citas."
      icon={Users}
      plannedFeatures={["listado y búsqueda de pacientes", "datos de contacto", "historial de citas", "perfil del paciente"]}
    />
  );
}
