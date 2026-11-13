import { Clock, MessageCircle, MessageCircleCheck } from "lucide-react";
import type { ReminderState } from "@/lib/domain/reminders";
import { cn } from "@/lib/utils";

const CONFIG: Record<Exclude<ReminderState, "none">, { icon: typeof Clock; label: string; className: string }> = {
  confirmed: { icon: MessageCircleCheck, label: "Confirmó por WhatsApp", className: "text-primary" },
  sent: { icon: MessageCircle, label: "Recordatorio enviado, sin respuesta", className: "text-info" },
  scheduled: { icon: Clock, label: "Recordatorio programado", className: "text-subtle" },
};

/** Compact WhatsApp reminder status for agenda rows. */
export function ReminderIndicator({ state, className }: { state: ReminderState; className?: string }) {
  if (state === "none") return null;
  const { icon: Icon, label, className: tone } = CONFIG[state];
  return (
    <span title={label} aria-label={label} role="img" className={cn("inline-flex shrink-0", tone, className)}>
      <Icon className="size-4" aria-hidden />
    </span>
  );
}

export const REMINDER_LABEL = {
  confirmed: CONFIG.confirmed.label,
  sent: CONFIG.sent.label,
  scheduled: CONFIG.scheduled.label,
  none: "Sin recordatorio",
} satisfies Record<ReminderState, string>;
