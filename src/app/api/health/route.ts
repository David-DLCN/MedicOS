import { NextResponse } from "next/server";
import { IS_LIVE } from "@/lib/config";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Public health check: demo or live mode, which Supabase settings exist and
 * whether Supabase accepts them. Never returns secret values: only variable
 * names, the (public) Supabase host, the kind of key and HTTP status codes.
 */
export const dynamic = "force-dynamic";

/** Classifies the configured key without revealing it. */
function describeKey(key: string) {
  if (!key) return { kind: "missing" };
  const issues: string[] = [];
  if (key !== key.trim()) issues.push("espacios o saltos de línea al inicio o al final");
  if (/^["']|["']$/.test(key.trim())) issues.push("comillas alrededor del valor");
  const clean = key.trim().replace(/^["']|["']$/g, "");
  let kind = "desconocido";
  if (clean.startsWith("sb_publishable_")) kind = "publishable (correcta)";
  else if (clean.startsWith("sb_secret_")) kind = "secret (NO debe usarse en la app)";
  else if (clean.split(".").length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(clean.split(".")[1]!, "base64url").toString("utf8")) as { role?: string };
      kind =
        payload.role === "anon"
          ? "anon JWT (correcta)"
          : payload.role === "service_role"
            ? "service_role JWT (NO debe usarse en la app)"
            : `JWT con rol ${payload.role ?? "desconocido"}`;
    } catch {
      kind = "parece JWT pero no se puede leer";
    }
  }
  return { kind, length: clean.length, issues };
}

async function checkSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { reachable: false, reason: "faltan variables" };
  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/+$/, "")}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_KEY.trim() },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    let message: string | null = null;
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string; msg?: string } | null;
      message = body?.message ?? body?.msg ?? null;
    }
    return { reachable: true, authStatus: response.status, keyAccepted: response.ok, message };
  } catch (error) {
    return { reachable: false, reason: error instanceof Error ? error.message : "error de red" };
  }
}

export async function GET() {
  const supabaseVariables = Object.keys(process.env)
    .filter((name) => name.includes("SUPABASE"))
    .sort();
  let supabaseHost: string | null = null;
  let urlIssues: string[] = [];
  try {
    if (SUPABASE_URL) {
      const url = new URL(SUPABASE_URL.trim());
      supabaseHost = url.host;
      urlIssues = [
        ...(SUPABASE_URL !== SUPABASE_URL.trim() ? ["espacios al inicio o al final"] : []),
        ...(url.pathname !== "/" ? [`incluye una ruta (${url.pathname}): debe ser solo https://xxxx.supabase.co`] : []),
      ];
    }
  } catch {
    supabaseHost = "URL inválida";
  }

  return NextResponse.json(
    {
      status: "ok",
      mode: IS_LIVE ? "live" : "demo",
      supabaseHost,
      urlIssues,
      key: describeKey(SUPABASE_KEY),
      supabase: IS_LIVE ? await checkSupabase() : null,
      supabaseVariables,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
