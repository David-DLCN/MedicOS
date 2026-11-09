import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/features/shared/module-placeholder";

export const metadata: Metadata = { title: "Ajustes" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Ajustes"
      description="Tu perfil, tus consultas y las integraciones con servicios externos."
      icon={Settings}
      plannedFeatures={["perfil profesional", "tipos de consulta y precios", "pagos", "agenda", "canales de comunicación"]}
    />
  );
}
