"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { consultationTypes as sampleTypes } from "@/lib/data/mock/seed";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildSampleRows } from "./sample-rows";

const BATCH = 500;

export interface SampleDataState {
  error?: string;
}

/**
 * Fills an empty practice with the fictional demo dataset so the doctor can
 * explore MedicOS with their own account. Row Level Security only lets these
 * rows land in the signed-in doctor's practice.
 */
export async function loadSampleData(): Promise<SampleDataState> {
  const supabase = await createSupabaseServerClient();

  const { data: doctor } = await supabase.from("doctors").select("id").maybeSingle();
  if (!doctor) return { error: "Primero configura tu consultorio." };

  const { count } = await supabase.from("patients").select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return { error: "Tu consultorio ya tiene pacientes: no cargamos ejemplos encima." };

  const { data: types } = await supabase.from("consultation_types").select("id, name");
  const typeIdByName = new Map((types ?? []).map((type) => [type.name as string, type.id as string]));
  if (sampleTypes.some((type) => !typeIdByName.has(type.name))) {
    return { error: "Faltan los tipos de consulta iniciales; no podemos cargar los ejemplos." };
  }

  const tables = buildSampleRows({ doctorId: doctor.id as string, typeIdByName, now: new Date() });

  for (const [table, rows] of tables) {
    for (let start = 0; start < rows.length; start += BATCH) {
      const { error } = await supabase.from(table).insert(rows.slice(start, start + BATCH));
      if (error) {
        return { error: `No pudimos cargar los ejemplos (${table}). Inténtalo de nuevo.` };
      }
    }
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
