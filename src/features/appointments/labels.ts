import type { BadgeTone } from "@/components/ui/badge";
import type { AppointmentStatus, BookingChannel, ConsultationModality } from "@/lib/domain/types";

export const APPOINTMENT_STATUS: Record<AppointmentStatus, { label: string; tone: BadgeTone }> = {
  scheduled: { label: "Por confirmar", tone: "outline" },
  confirmed: { label: "Confirmada", tone: "info" },
  completed: { label: "Realizada", tone: "primary" },
  cancelled: { label: "Cancelada", tone: "neutral" },
  no_show: { label: "No asistió", tone: "danger" },
};

export const MODALITY_LABEL: Record<ConsultationModality, string> = {
  in_person: "Presencial",
  video: "Videollamada",
};

export const CHANNEL_LABEL: Record<BookingChannel, string> = {
  marketplace: "Reserva online",
  phone: "Teléfono",
  walk_in: "Sin cita",
};
