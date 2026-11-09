import { ArrowLeftRight, CalendarCheck2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatNumber, formatShare } from "@/lib/format";

const STEPS = [
  {
    icon: CalendarCheck2,
    title: "Tus reservas de Doctoralia, en tu agenda",
    text: "Cada cita reservada, cambiada o cancelada en Doctoralia aparece al momento en MedicOS, marcada con su origen.",
  },
  {
    icon: ArrowLeftRight,
    title: "Una sola disponibilidad",
    text: "Las citas que agendes en MedicOS bloquean ese hueco en Doctoralia, así nunca se reserva dos veces la misma hora.",
  },
  {
    icon: ShieldCheck,
    title: "Tú decides qué se comparte",
    text: "Autorizas desde tu cuenta de Doctoralia qué consultorios y agendas se sincronizan. Tu perfil y tus opiniones siguen en Doctoralia.",
  },
];

/** Doctoralia is integrated, not replaced: it keeps bringing patients, MedicOS runs the practice. */
export function DoctoraliaCard({ bookings90d, share90d }: { bookings90d: number; share90d: number }) {
  return (
    <Card>
      <CardHeader
        title="Doctoralia: intégralo, no lo sustituyas"
        description="Sigue recibiendo pacientes por Doctoralia y gestiona todo lo demás desde MedicOS."
        action={<Badge tone="neutral">Próximamente</Badge>}
      />
      <CardContent>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <p className="mt-2 text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-sm text-muted">{text}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-lg bg-surface-muted px-4 py-3 text-sm text-muted">
          En esta demo, <span className="font-semibold text-foreground">{formatNumber(bookings90d)} citas</span> de los
          últimos 90 días ({formatShare(share90d)}) llegaron desde Doctoralia; las verás en tu agenda con su origen y su
          referencia.
        </p>
      </CardContent>
    </Card>
  );
}
