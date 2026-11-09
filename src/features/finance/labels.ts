import type { BadgeTone } from "@/components/ui/badge";
import type { PaymentMethod, PaymentStatus } from "@/lib/domain/types";

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: "Cobrado", tone: "primary" },
  pending: { label: "Pendiente", tone: "outline" },
  refunded: { label: "Reembolsado", tone: "neutral" },
  failed: { label: "Fallido", tone: "danger" },
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  card: "Tarjeta",
  apple_pay: "Apple Pay",
  cash: "Efectivo",
  transfer: "Transferencia",
};
