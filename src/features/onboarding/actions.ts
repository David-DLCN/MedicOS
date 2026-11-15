"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface OnboardingState {
  error?: string;
}

/** Creates clinic + doctor profile + starter consultation types in one database call. */
export async function createPractice(_: OnboardingState, form: FormData): Promise<OnboardingState> {
  const value = (key: string) => String(form.get(key) ?? "").trim();
  const fullName = value("fullName");
  const clinicName = value("clinicName");
  if (fullName.length < 3) return { error: "Escribe tu nombre completo." };
  if (clinicName.length < 2) return { error: "Escribe el nombre de tu consultorio." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("create_my_practice", {
    p_full_name: fullName,
    p_title: value("title") || "Dr.",
    p_specialty: value("specialty"),
    p_phone: value("phone"),
    p_clinic_name: clinicName,
    p_city: value("city"),
  });
  if (error && !error.message.includes("practice already exists")) {
    return { error: "No pudimos crear tu consultorio. Inténtalo de nuevo." };
  }
  redirect("/dashboard");
}
