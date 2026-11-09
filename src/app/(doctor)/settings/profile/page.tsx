import type { Metadata } from "next";
import { MapPin, Video } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MODALITY_LABEL } from "@/features/appointments/labels";
import { ReadOnlyNote } from "@/features/settings/read-only-note";
import { getPracticeContext } from "@/lib/data/repository";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Perfil · Ajustes" };

export default async function ProfileSettingsPage() {
  const { doctor, clinic, consultationTypes } = await getPracticeContext();
  const displayName = `${doctor.title} ${doctor.fullName}`;
  const byPrice = [...consultationTypes].sort((a, b) => a.price.amount - b.price.amount);

  return (
    <>
      <ReadOnlyNote>
        Solo lectura en esta versión: podrás editar tu perfil cuando existan las cuentas de usuario.
      </ReadOnlyNote>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader title="Datos profesionales" />
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre">{displayName}</Field>
                <Field label="Especialidad">{doctor.specialty}</Field>
                <Field label="Correo electrónico">{doctor.email}</Field>
                <Field label="Teléfono">{doctor.phone}</Field>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Consultorio" />
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nombre">{clinic.name}</Field>
                <Field label="Ciudad">{clinic.city}</Field>
              </dl>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Tu perfil público"
            description="Así te verán los pacientes en el marketplace de MedicOS (próximamente)."
            action={<Badge tone="info">Vista previa</Badge>}
          />
          <CardContent>
            <div className="rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <Avatar name={doctor.fullName} size="md" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{displayName}</p>
                  <p className="text-sm text-muted">{doctor.specialty}</p>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4 shrink-0" aria-hidden /> {clinic.name} · {clinic.city}
              </p>

              <h3 className="mt-5 text-xs font-medium tracking-wide text-subtle uppercase">Consultas y precios</h3>
              <ul className="mt-2 divide-y divide-border">
                {byPrice.map((type) => (
                  <li key={type.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{type.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        {type.modality === "video" ? <Video className="size-3.5" aria-hidden /> : null}
                        {MODALITY_LABEL[type.modality]} · {type.durationMinutes} min
                      </p>
                    </div>
                    <p className="tabular shrink-0 text-sm font-semibold">{formatMoney(type.price)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-subtle">Precio final por consulta, sin cargos ocultos.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
