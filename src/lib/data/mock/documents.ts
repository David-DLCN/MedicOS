/**
 * Sample documents (metadata only, no file content) so each patient folder
 * looks realistic. Derived from completed appointments with their own random
 * stream, so the rest of the dataset is unaffected.
 */
import type { Appointment, PatientDocument } from "@/lib/domain/types";
import { createRandom } from "./random";

const KB = 1024;

export function generateSampleDocuments(appointments: Appointment[], seed = 20261111): PatientDocument[] {
  const random = createRandom(seed);
  const documents: PatientDocument[] = [];
  let sequence = 0;

  const add = (apt: Appointment, doc: Omit<PatientDocument, "id" | "patientId" | "createdAt" | "source" | "appointmentId">) => {
    sequence += 1;
    documents.push({
      id: `doc_${String(sequence).padStart(5, "0")}`,
      patientId: apt.patientId,
      createdAt: apt.endsAt,
      source: "sample",
      appointmentId: apt.id,
      ...doc,
    });
  };

  for (const apt of appointments) {
    if (apt.status !== "completed") continue;
    const day = apt.startsAt.slice(0, 10);

    if (apt.consultationTypeId === "ct_results" && random.chance(0.7)) {
      add(apt, {
        name: `Interpretación de análisis clínicos ${day}.pdf`,
        category: "results",
        mimeType: "application/pdf",
        size: random.int(120, 900) * KB,
      });
    }
    if (random.chance(0.3)) {
      add(apt, {
        name: `Receta médica ${day}.pdf`,
        category: "prescription",
        mimeType: "application/pdf",
        size: random.int(60, 250) * KB,
      });
    }
    if (apt.consultationTypeId === "ct_first" && random.chance(0.5)) {
      add(apt, {
        name: `Informe de primera consulta ${day}.pdf`,
        category: "report",
        mimeType: "application/pdf",
        size: random.int(150, 600) * KB,
      });
    }
    if (random.chance(0.04)) {
      add(apt, {
        name: `Radiografía de tórax ${day}.jpg`,
        category: "imaging",
        mimeType: "image/jpeg",
        size: random.int(900, 4200) * KB,
      });
    }
  }
  return documents;
}
