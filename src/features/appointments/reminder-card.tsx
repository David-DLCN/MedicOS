import { CheckCheck, Clock, MessageCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { reminderScheduledAt, reminderState } from "@/lib/domain/reminders";
import type { Appointment } from "@/lib/domain/types";
import { formatDate, formatTime } from "@/lib/format";
import { REMINDER_LABEL } from "./reminder-indicator";

/** WhatsApp reminder for one appointment: message preview and its timeline. */
export function ReminderCard({ appointment, message, now }: { appointment: Appointment; message: string; now: Date }) {
  const state = reminderState(appointment, now);
  if (state === "none" && !appointment.reminder) return null;
  const reminder = appointment.reminder;

  return (
    <Card>
      <CardHeader title="Recordatorio por WhatsApp" description={REMINDER_LABEL[state]} />
      <CardContent>
        <div className="rounded-xl bg-surface-muted p-3">
          <p className="max-w-md rounded-lg rounded-tl-none bg-surface px-3 py-2 text-sm whitespace-pre-line shadow-sm">
            {message}
          </p>
          {reminder?.confirmedAt ? (
            <p className="mt-2 ml-auto w-fit rounded-lg rounded-tr-none bg-primary-soft px-3 py-2 text-sm text-primary">
              1
            </p>
          ) : null}
        </div>
        <ol className="mt-4 space-y-2 text-sm">
          {state === "scheduled" ? (
            <li className="flex items-center gap-2 text-muted">
              <Clock className="size-4 text-subtle" aria-hidden />
              Se enviará el {formatDate(reminderScheduledAt(appointment), "short")} a las{" "}
              {formatTime(reminderScheduledAt(appointment))}
            </li>
          ) : null}
          {reminder ? (
            <li className="flex items-center gap-2 text-muted">
              <MessageCircle className="size-4 text-info" aria-hidden />
              Enviado el {formatDate(reminder.sentAt, "short")} a las {formatTime(reminder.sentAt)}
            </li>
          ) : null}
          {reminder?.confirmedAt ? (
            <li className="flex items-center gap-2 font-medium text-primary">
              <CheckCheck className="size-4" aria-hidden />
              Confirmó el {formatDate(reminder.confirmedAt, "short")} a las {formatTime(reminder.confirmedAt)}
            </li>
          ) : null}
        </ol>
        <p className="mt-4 text-xs text-subtle">
          Demo: no se envían mensajes reales. En producción se usará WhatsApp Business con plantillas aprobadas.
        </p>
      </CardContent>
    </Card>
  );
}
