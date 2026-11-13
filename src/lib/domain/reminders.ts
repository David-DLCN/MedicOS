/**
 * WhatsApp appointment reminders: sent 24 h before; the patient confirms by
 * replying. Real sending requires the WhatsApp Business Platform (Cloud API)
 * with approved message templates.
 */
import type { Appointment } from "./types";

export const REMINDER_HOURS_BEFORE = 24;

export type ReminderState = "confirmed" | "sent" | "scheduled" | "none";

export function reminderState(appointment: Appointment, now: Date): ReminderState {
  if (appointment.status === "cancelled") return "none";
  if (appointment.reminder?.confirmedAt) return "confirmed";
  if (appointment.reminder) return "sent";
  const scheduledAt = Date.parse(appointment.startsAt) - REMINDER_HOURS_BEFORE * 3_600_000;
  return scheduledAt > now.getTime() ? "scheduled" : "none";
}

export function reminderScheduledAt(appointment: Appointment) {
  return new Date(Date.parse(appointment.startsAt) - REMINDER_HOURS_BEFORE * 3_600_000);
}

/** Text of the reminder (mirrors the WhatsApp template that must be approved by Meta). */
export function reminderMessage(input: {
  patientFirstName: string;
  doctorName: string;
  date: string;
  time: string;
  place: string;
}) {
  return (
    `Hola ${input.patientFirstName}, te recordamos tu cita con ${input.doctorName} ` +
    `el ${input.date} a las ${input.time} en ${input.place}.\n\n` +
    `Responde 1 para confirmar o 2 si necesitas cambiarla.`
  );
}
