"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  message?: string;
}

const ERRORS: Record<string, string> = {
  "Invalid login credentials": "Correo o contraseña incorrectos.",
  "Email not confirmed": "Confirma tu correo: te enviamos un enlace al registrarte.",
  "User already registered": "Ya existe una cuenta con ese correo. Inicia sesión.",
};

function translate(message: string) {
  const text = message.toLowerCase();
  if (text.includes("password should be")) return "La contraseña debe tener al menos 8 caracteres.";
  if (text.includes("rate limit")) {
    return "Se alcanzó el límite de correos o de intentos. Espera unos minutos y vuelve a intentarlo.";
  }
  if (text.includes("sending confirmation email") || text.includes("not authorized")) {
    return "No pudimos enviar el correo de confirmación. El correo gratuito de Supabase solo llega a los miembros del proyecto: desactiva «Confirm email» o configura un SMTP propio.";
  }
  if (text.includes("email logins are disabled") || text.includes("email signups are disabled")) {
    return "El acceso con correo está desactivado en Supabase: actívalo en Authentication → Sign In / Providers → Email.";
  }
  if (text.includes("signups not allowed") || text.includes("signup is disabled")) {
    return "El registro de cuentas nuevas está desactivado en Supabase.";
  }
  if (text.includes("invalid") && text.includes("email")) return "Ese correo no es válido.";
  if (ERRORS[message]) return ERRORS[message];
  // Unknown error: show it (Supabase auth messages contain no secrets) and log it for diagnosis.
  console.error("[auth] Supabase error:", message);
  return `No pudimos completar la operación (${message}).`;
}

/** Only allow redirects to paths inside the app (avoid open redirects). */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu correo y tu contraseña." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: translate(error.message) };
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email) return { error: "Escribe tu correo." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: translate(error.message) };
  // With e-mail confirmation enabled there is no session until the link is opened.
  if (!data.session) {
    return { message: `Te enviamos un enlace a ${email}. Ábrelo para activar tu cuenta.` };
  }
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
