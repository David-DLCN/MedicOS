/**
 * Static, fictional seed data. Every person, phone number and e-mail here is
 * invented: phone numbers use the invalid "0000" exchange, e-mails use the
 * reserved example.com domain and the RFC / cédula start with "DEMO".
 */
import type { Clinic, ConsultationType, Doctor, Integration } from "@/lib/domain/types";
import { APP_CONFIG } from "@/lib/config";

const currency = APP_CONFIG.currency;

export const clinic: Clinic = {
  id: "clinic_demo",
  name: "Consultorio Herrera",
  city: "Monterrey, N.L.",
};

export const doctor: Doctor = {
  id: "doc_demo",
  clinicId: clinic.id,
  fullName: "Lucía Herrera Ortiz",
  title: "Dra.",
  specialty: "Medicina interna",
  email: "lucia.herrera@example.com",
  phone: "+52 81 0000 0100",
  billing: {
    legalName: "Lucía Herrera Ortiz",
    taxId: "DEMO800515XX0",
    taxRegime: "612",
    postalCode: "64000",
    licenseNumber: "DEMO-1234567",
    address: "Av. Ejemplo 123, consultorio 4, Col. Centro, Monterrey, N.L.",
  },
};

export const consultationTypes: ConsultationType[] = [
  {
    id: "ct_first",
    doctorId: doctor.id,
    name: "Primera consulta",
    durationMinutes: 45,
    price: { amount: 120000, currency },
    modality: "in_person",
  },
  {
    id: "ct_followup",
    doctorId: doctor.id,
    name: "Consulta de seguimiento",
    durationMinutes: 30,
    price: { amount: 90000, currency },
    modality: "in_person",
  },
  {
    id: "ct_video",
    doctorId: doctor.id,
    name: "Teleconsulta",
    durationMinutes: 30,
    price: { amount: 80000, currency },
    modality: "video",
  },
  {
    id: "ct_results",
    doctorId: doctor.id,
    name: "Revisión de resultados",
    durationMinutes: 15,
    price: { amount: 60000, currency },
    modality: "in_person",
  },
];

export const integrations: Integration[] = [
  {
    id: "int_stripe",
    name: "Stripe",
    category: "payments",
    description: "Cobros con tarjeta, Apple Pay y pagos a médicos mediante Stripe Connect.",
    status: "planned",
  },
  {
    id: "int_doctoralia",
    name: "Doctoralia",
    category: "scheduling",
    description:
      "Tus reservas de Doctoralia entran en tu agenda de MedicOS y tu disponibilidad se publica en Doctoralia, sin duplicar citas.",
    status: "planned",
  },
  {
    id: "int_google_calendar",
    name: "Google Calendar",
    category: "scheduling",
    description: "Sincroniza tu agenda de MedicOS con tu calendario personal.",
    status: "planned",
  },
  {
    id: "int_whatsapp",
    name: "WhatsApp Business",
    category: "communication",
    description: "Confirmaciones y recordatorios de citas para tus pacientes.",
    status: "planned",
  },
  {
    id: "int_email",
    name: "Correo electrónico",
    category: "communication",
    description: "Notificaciones automáticas de reserva, cambios y recibos.",
    status: "planned",
  },
  {
    id: "int_cfdi",
    name: "Timbrado CFDI 4.0",
    category: "accounting",
    description: "Facturas timbradas ante el SAT mediante un proveedor certificado (PAC), con autofactura para tus pacientes.",
    status: "planned",
  },
];

export const firstNames = [
  "Ana", "Carlos", "María", "José", "Laura", "Miguel", "Sofía", "Javier",
  "Valentina", "Diego", "Camila", "Andrés", "Isabel", "Fernando", "Lucía",
  "Ricardo", "Elena", "Pablo", "Gabriela", "Tomás", "Daniela", "Héctor",
  "Paula", "Raúl", "Mariana", "Sergio", "Carmen", "Alberto", "Natalia", "Emilio",
] as const;

export const lastNames = [
  "García", "Martínez", "López", "Sánchez", "Pérez", "Gómez", "Fernández",
  "Díaz", "Romero", "Torres", "Ruiz", "Vargas", "Castro", "Morales", "Ortega",
  "Delgado", "Navarro", "Ramos", "Molina", "Suárez", "Rojas", "Medina",
  "Cruz", "Reyes", "Aguilar", "Silva", "Mendoza", "Herrera", "Rivas", "Campos",
] as const;
