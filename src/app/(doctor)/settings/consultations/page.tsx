import type { Metadata } from "next";
import { Video } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { MODALITY_LABEL } from "@/features/appointments/labels";
import { ReadOnlyNote } from "@/features/settings/read-only-note";
import { getNow, getPracticeContext, listAppointments, listTransactions } from "@/lib/data/repository";
import { addDays, isWithin, startOfDay } from "@/lib/domain/dates";
import { indexById } from "@/lib/domain/lookup";
import { formatAmount, formatMoney, formatNumber, formatShare } from "@/lib/format";

export const metadata: Metadata = { title: "Consultas · Ajustes" };

const WINDOW_DAYS = 90;

export default async function ConsultationSettingsPage() {
  const now = getNow();
  const from = addDays(startOfDay(now), -(WINDOW_DAYS - 1));
  const [{ consultationTypes }, appointments, transactions] = await Promise.all([
    getPracticeContext(),
    listAppointments(),
    listTransactions(),
  ]);

  // Usage over the last 90 days. Revenue uses the same rule as Finanzas (by the
  // date the money was received), so a prepaid future appointment counts in
  // the window it was paid and the totals match across modules.
  const appointmentsById = indexById(appointments);
  const usage = new Map(consultationTypes.map((type) => [type.id, { completed: 0, revenue: 0 }]));
  for (const apt of appointments) {
    if (apt.status === "completed" && isWithin(apt.startsAt, from, now)) {
      usage.get(apt.consultationTypeId)!.completed += 1;
    }
  }
  for (const txn of transactions) {
    const apt = appointmentsById.get(txn.appointmentId);
    if (apt && txn.status === "paid" && isWithin(txn.settledAt, from, now)) {
      usage.get(apt.consultationTypeId)!.revenue += txn.amount.amount;
    }
  }
  const totalRevenue = [...usage.values()].reduce((sum, item) => sum + item.revenue, 0);

  return (
    <>
      <ReadOnlyNote>
        Solo lectura en esta versión: podrás crear consultas y cambiar precios cuando existan las cuentas de
        usuario.
      </ReadOnlyNote>

      <Card>
        <CardHeader
          title="Tipos de consulta"
          description={`Lo que ofreces a tus pacientes y su uso en los últimos ${WINDOW_DAYS} días.`}
        />
        <CardContent className="pt-2">
          <Table>
            <thead>
              <tr>
                <Th>Consulta</Th>
                <Th>Duración</Th>
                <Th className="text-right">Precio</Th>
                <Th className="text-right">Realizadas</Th>
                <Th className="text-right">Ingresos</Th>
              </tr>
            </thead>
            <tbody>
              {consultationTypes.map((type) => {
                const stats = usage.get(type.id)!;
                return (
                  <tr key={type.id}>
                    <Td>
                      <p className="font-medium">{type.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        {type.modality === "video" ? <Video className="size-3.5" aria-hidden /> : null}
                        {MODALITY_LABEL[type.modality]}
                      </p>
                    </Td>
                    <Td className="tabular text-muted">{type.durationMinutes} min</Td>
                    <Td className="tabular text-right font-semibold">{formatMoney(type.price)}</Td>
                    <Td className="tabular text-right">{formatNumber(stats.completed)}</Td>
                    <Td className="tabular text-right">
                      {formatAmount(stats.revenue)}{" "}
                      <span className="text-xs text-muted">
                        · {formatShare(totalRevenue === 0 ? 0 : stats.revenue / totalRevenue)}
                      </span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
