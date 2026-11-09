import type { Metadata } from "next";
import { CalendarDays, CreditCard, MessageSquare, Receipt, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DoctoraliaCard } from "@/features/settings/doctoralia-card";
import { INTEGRATION_CATEGORY } from "@/features/settings/labels";
import { getNow, listAppointments, listIntegrations } from "@/lib/data/repository";
import { addDays, startOfDay } from "@/lib/domain/dates";
import type { IntegrationCategory } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Integraciones · Ajustes" };

const CATEGORY_ICON: Record<IntegrationCategory, LucideIcon> = {
  payments: CreditCard,
  scheduling: CalendarDays,
  communication: MessageSquare,
  accounting: Receipt,
};

const CATEGORY_ORDER: IntegrationCategory[] = ["payments", "scheduling", "communication", "accounting"];

export default async function IntegrationsSettingsPage() {
  const now = getNow();
  const [integrations, recent] = await Promise.all([
    listIntegrations(),
    listAppointments({ from: addDays(startOfDay(now), -89), to: now }),
  ]);
  const fromDoctoralia = recent.filter((apt) => apt.channel === "doctoralia").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Conecta MedicOS con los servicios que ya usas. Ninguna integración está activa todavía: esta pantalla
        muestra lo que llegará y para qué servirá.
      </p>

      <DoctoraliaCard
        bookings90d={fromDoctoralia}
        share90d={recent.length === 0 ? 0 : fromDoctoralia / recent.length}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const items = integrations.filter((integration) => integration.category === category);
          if (items.length === 0) return null;
          const Icon = CATEGORY_ICON[category];
          return (
            <Card key={category}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary">
                      <Icon className="size-4" aria-hidden />
                    </span>
                    {INTEGRATION_CATEGORY[category].label}
                  </span>
                }
                description={INTEGRATION_CATEGORY[category].description}
              />
              <CardContent className="pt-3">
                <ul className="space-y-2">
                  {items.map((integration) => (
                    <li
                      key={integration.id}
                      className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{integration.name}</p>
                        <p className="text-xs text-muted">{integration.description}</p>
                      </div>
                      <Badge tone="neutral" className="shrink-0">
                        Próximamente
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title="Cobros online: decisión en curso"
          description="Antes de conectar pagos reales hay que elegir la infraestructura."
        />
        <CardContent>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <span className="font-medium text-foreground">Stripe Connect</span> encaja con un marketplace de
              varios médicos: cobro con tarjeta y Apple Pay, comisión de la plataforma, pagos a cada médico y
              reembolsos por cita.
            </li>
            <li>
              <span className="font-medium text-foreground">Shopify</span> resuelve el checkout, pero no está
              pensado para repartir pagos entre varios profesionales; necesita una evaluación aparte.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
