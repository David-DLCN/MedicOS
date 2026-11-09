import {
  getNow,
  getPracticeContext,
  listAppointments,
  listPatients,
  listTransactions,
} from "@/lib/data/repository";
import { addMonths, isSameDay, startOfMonth } from "@/lib/domain/dates";
import { indexById, patientName } from "@/lib/domain/lookup";
import {
  monthlySeries,
  operationalAlerts,
  overviewMetrics,
  recentTransactions,
  statusBreakdown,
  upcomingAppointments,
} from "@/lib/domain/metrics";
import { capitalize, formatDate } from "@/lib/format";
import type { RevenueChartPoint } from "@/components/charts/revenue-chart";
import type { TransactionRow } from "./recent-transactions";
import type { UpcomingAppointmentRow } from "./upcoming-appointments";

/** Loads raw entities and turns them into the view model the dashboard renders. */
export async function getDashboardData() {
  const now = getNow();
  const [context, patients, appointments, transactions] = await Promise.all([
    getPracticeContext(),
    listPatients(),
    listAppointments(),
    listTransactions(),
  ]);

  const patientsById = indexById(patients);
  const typesById = indexById(context.consultationTypes);
  const appointmentsById = indexById(appointments);

  const upcoming: UpcomingAppointmentRow[] = upcomingAppointments(appointments, now, 6).map(
    (appointment) => ({
      appointment,
      patientName: patientName(patientsById.get(appointment.patientId)),
      consultationName: typesById.get(appointment.consultationTypeId)?.name ?? "Consulta",
      isToday: isSameDay(new Date(appointment.startsAt), now),
    }),
  );

  const recent: TransactionRow[] = recentTransactions(transactions, 6).map((transaction) => {
    const appointment = appointmentsById.get(transaction.appointmentId);
    return {
      transaction,
      patientName: patientName(patientsById.get(transaction.patientId)),
      consultationName: (appointment && typesById.get(appointment.consultationTypeId)?.name) ?? "Consulta",
    };
  });

  const revenueSeries: RevenueChartPoint[] = monthlySeries({ now, appointments, transactions }, 6).map(
    (point) => ({
      label: capitalize(formatDate(point.month, "month").replace(".", "")),
      revenue: point.revenue,
      appointments: point.completedAppointments,
      partial: point.partial,
    }),
  );

  const monthStart = startOfMonth(now);
  const previousMonthLabel = formatDate(addMonths(monthStart, -1), "month").replace(".", "");

  return {
    doctor: context.doctor,
    now,
    metrics: overviewMetrics({ now, patients, appointments, transactions }),
    revenueSeries,
    upcoming,
    recent,
    alerts: operationalAlerts({ now, appointments, transactions }),
    monthStatus: statusBreakdown(appointments, monthStart, addMonths(monthStart, 1)),
    monthLabel: capitalize(formatDate(monthStart, "monthYear")),
    previousMonthLabel,
  };
}
