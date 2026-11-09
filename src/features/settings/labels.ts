import type { IntegrationCategory } from "@/lib/domain/types";

export const INTEGRATION_CATEGORY: Record<IntegrationCategory, { label: string; description: string }> = {
  payments: { label: "Pagos", description: "Cobra consultas online y recibe tus pagos." },
  scheduling: { label: "Agenda", description: "Mantén tus citas sincronizadas." },
  communication: { label: "Comunicación", description: "Avisa y recuerda citas a tus pacientes." },
  accounting: { label: "Contabilidad", description: "Lleva tus ingresos a tu gestoría o software contable." },
};
