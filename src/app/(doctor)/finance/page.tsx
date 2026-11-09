import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/features/shared/module-placeholder";

export const metadata: Metadata = { title: "Finanzas" };

export default function Page() {
  return (
    <ModulePlaceholder
      title="Finanzas"
      description="Ingresos, cobros pendientes y movimientos."
      icon={Wallet}
      plannedFeatures={["ingresos por periodo", "pagos recibidos y pendientes", "historial de transacciones", "tendencias"]}
    />
  );
}
