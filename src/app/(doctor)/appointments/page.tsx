import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { ModulePlaceholder } from "@/features/shared/module-placeholder";

export const metadata: Metadata = { title: "Citas" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Citas"
      description="Gestiona tu agenda y el estado de cada consulta."
      icon={CalendarDays}
      plannedFeatures={["vista diaria y semanal", "detalle de cada cita", "estados y confirmaciones", "próximas consultas"]}
    />
  );
}
