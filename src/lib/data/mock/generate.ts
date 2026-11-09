/**
 * Deterministic generator for the demo dataset.
 *
 * Appointments are generated first; transactions are *derived* from them, so
 * every revenue figure on screen traces back to a specific appointment.
 */
import { DEMO_NOW, DEMO_TODAY } from "@/lib/config";
import type {
  Appointment,
  AppointmentStatus,
  BookingChannel,
  ConsultationType,
  Patient,
  PaymentMethod,
  PaymentStatus,
  Transaction,
} from "@/lib/domain/types";
import { createRandom, type Random } from "./random";
import { consultationTypes, doctor, firstNames, lastNames } from "./seed";

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

const HISTORY_DAYS = 180;
const FUTURE_DAYS = 21;
const PATIENT_COUNT = 150;

export interface MockDataset {
  patients: Patient[];
  appointments: Appointment[];
  transactions: Transaction[];
}

function pad(value: number, size = 2) {
  return String(value).padStart(size, "0");
}

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function buildPatients(random: Random): Patient[] {
  const usedNames = new Set<string>();
  const patients: Patient[] = [];

  for (let index = 0; patients.length < PATIENT_COUNT; index++) {
    const firstName = random.pick(firstNames);
    const lastName = `${random.pick(lastNames)} ${random.pick(lastNames)}`;
    const key = `${firstName} ${lastName}`;
    if (usedNames.has(key)) continue;
    usedNames.add(key);

    const year = random.int(1950, 2005);
    const month = random.int(1, 12);
    const day = random.int(1, 28);
    const n = patients.length + 1;
    const emailSlug = `${firstName}.${lastName.split(" ")[0]}`
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();

    patients.push({
      id: `pat_${pad(n, 3)}`,
      doctorId: doctor.id,
      firstName,
      lastName,
      dateOfBirth: `${year}-${pad(month)}-${pad(day)}`,
      email: `${emailSlug}${n}@example.com`,
      phone: `+1 555 01${pad(n % 100)} ${pad(random.int(0, 99))}${random.int(0, 9)}`,
      // Provisional; replaced by the first booking date below.
      createdAt: iso(DEMO_TODAY.getTime() - HISTORY_DAYS * DAY - random.int(1, 60) * DAY),
    });
  }
  return patients;
}

function pastStatus(random: Random): AppointmentStatus {
  return random.weighted<AppointmentStatus>([
    ["completed", 86],
    ["cancelled", 7],
    ["no_show", 7],
  ]);
}

function futureStatus(random: Random, startsAt: number): AppointmentStatus {
  const hoursAway = (startsAt - DEMO_NOW.getTime()) / (60 * MINUTE);
  if (hoursAway <= 48) {
    return random.weighted<AppointmentStatus>([
      ["confirmed", 72],
      ["scheduled", 28],
    ]);
  }
  return random.weighted<AppointmentStatus>([
    ["confirmed", 45],
    ["scheduled", 50],
    ["cancelled", 5],
  ]);
}

function paymentMethod(random: Random, channel: BookingChannel): PaymentMethod {
  if (channel === "marketplace") {
    return random.weighted<PaymentMethod>([
      ["card", 70],
      ["apple_pay", 30],
    ]);
  }
  if (channel === "walk_in") {
    return random.weighted<PaymentMethod>([
      ["cash", 60],
      ["card", 40],
    ]);
  }
  return random.weighted<PaymentMethod>([
    ["card", 45],
    ["cash", 25],
    ["transfer", 25],
    ["apple_pay", 5],
  ]);
}

export function generateDataset(seed = 20261109): MockDataset {
  const random = createRandom(seed);
  const patients = buildPatients(random);
  const firstVisit = new Map<string, number>();
  const appointments: Appointment[] = [];
  const transactions: Transaction[] = [];

  const [first, followUp, video, results] = consultationTypes as [
    ConsultationType,
    ConsultationType,
    ConsultationType,
    ConsultationType,
  ];

  const start = DEMO_TODAY.getTime() - HISTORY_DAYS * DAY;
  const end = DEMO_TODAY.getTime() + FUTURE_DAYS * DAY;
  const now = DEMO_NOW.getTime();

  for (let day = start; day <= end; day += DAY) {
    const weekday = new Date(day).getUTCDay(); // 0 = Sunday
    if (weekday === 0) continue;

    const progress = (day - start) / (end - start);
    // The practice grows over time: more of the pool becomes active and occupancy rises.
    const activePatients = Math.floor(20 + (PATIENT_COUNT - 20) * Math.min(1, progress));
    const occupancy = 0.5 + 0.25 * progress;

    const dayEndMinutes = weekday === 6 ? 13 * 60 : 18 * 60;
    let cursor = 9 * 60;

    while (cursor < dayEndMinutes) {
      if (cursor >= 13 * 60 && cursor < 14 * 60 && weekday !== 6) {
        cursor = 14 * 60; // lunch break
        continue;
      }
      if (!random.chance(occupancy)) {
        cursor += 30;
        continue;
      }

      const patient = patients[random.int(0, activePatients - 1)]!;
      const isNewPatient = !firstVisit.has(patient.id);
      const type = isNewPatient
        ? first
        : random.weighted<ConsultationType>([
            [followUp, 55],
            [video, 25],
            [results, 20],
          ]);

      if (cursor + type.durationMinutes > dayEndMinutes) break;

      const startsAt = day + cursor * MINUTE;
      const endsAt = startsAt + type.durationMinutes * MINUTE;
      const channel: BookingChannel =
        type.modality === "video"
          ? random.weighted<BookingChannel>([["marketplace", 60], ["phone", 40]])
          : random.weighted<BookingChannel>([["marketplace", 35], ["phone", 50], ["walk_in", 15]]);
      const status = endsAt <= now ? pastStatus(random) : futureStatus(random, startsAt);

      if (isNewPatient) {
        firstVisit.set(patient.id, startsAt);
        patient.createdAt = iso(Math.min(startsAt - random.int(1, 10) * DAY, now));
      }

      const appointment: Appointment = {
        id: `apt_${pad(appointments.length + 1, 5)}`,
        doctorId: doctor.id,
        patientId: patient.id,
        consultationTypeId: type.id,
        startsAt: iso(startsAt),
        endsAt: iso(endsAt),
        status,
        modality: type.modality,
        // Walk-ins only make sense for consultations that already happened.
        channel: channel === "walk_in" && endsAt > now ? "phone" : channel,
      };
      appointments.push(appointment);

      const transaction = deriveTransaction(random, appointment, type, transactions.length + 1);
      if (transaction) transactions.push(transaction);

      cursor += type.durationMinutes;
    }
  }

  return { patients, appointments, transactions };
}

/**
 * Business rules for the demo:
 * - Completed consultations are charged (mostly settled; recent ones may still be pending).
 * - Marketplace bookings are prepaid: no-shows keep the payment, cancellations are refunded.
 * - Future appointments have no transaction yet.
 */
function deriveTransaction(
  random: Random,
  appointment: Appointment,
  type: ConsultationType,
  sequence: number,
): Transaction | null {
  const now = DEMO_NOW.getTime();
  const startsAt = Date.parse(appointment.startsAt);
  const endsAt = Date.parse(appointment.endsAt);
  const prepaid = appointment.channel === "marketplace";

  let status: PaymentStatus;
  let createdAt: number;
  let settledAt: number | null;

  if (appointment.status === "completed") {
    const ageDays = (now - endsAt) / DAY;
    if (prepaid) {
      createdAt = startsAt - random.int(1, 6) * DAY;
      status = random.chance(0.015) ? "refunded" : "paid";
      settledAt = status === "refunded" ? Math.min(endsAt + 2 * DAY, now) : createdAt;
    } else if (ageDays <= 21 && random.chance(0.18)) {
      createdAt = endsAt;
      status = "pending";
      settledAt = null;
    } else {
      createdAt = endsAt;
      status = random.chance(0.01) ? "refunded" : "paid";
      settledAt = status === "refunded" ? Math.min(endsAt + 3 * DAY, now) : endsAt;
    }
  } else if (prepaid && appointment.status === "no_show") {
    createdAt = startsAt - random.int(1, 6) * DAY;
    status = "paid";
    settledAt = createdAt;
  } else if (prepaid && appointment.status === "cancelled" && endsAt <= now) {
    createdAt = startsAt - random.int(2, 8) * DAY;
    status = "refunded";
    settledAt = Math.min(startsAt, now);
  } else if (
    prepaid &&
    (appointment.status === "confirmed" || appointment.status === "scheduled")
  ) {
    // Upcoming marketplace booking: paid at booking time, if that already happened.
    createdAt = startsAt - random.int(1, 10) * DAY;
    if (createdAt > now) return null;
    status = "paid";
    settledAt = createdAt;
  } else {
    return null;
  }

  return {
    id: `txn_${pad(sequence, 5)}`,
    doctorId: appointment.doctorId,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    amount: { ...type.price },
    status,
    method: paymentMethod(random, appointment.channel),
    createdAt: iso(Math.min(createdAt, now)),
    settledAt: settledAt === null ? null : iso(Math.min(settledAt, now)),
  };
}
