import { NextResponse } from "next/server";
import { IS_LIVE } from "@/lib/config";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Public health check: tells whether this deployment runs in demo or live mode
 * and which Supabase-related settings exist. Never returns secret values: only
 * variable names and the Supabase host (which is public anyway).
 */
export const dynamic = "force-dynamic";

export function GET() {
  const supabaseVariables = Object.keys(process.env)
    .filter((name) => name.includes("SUPABASE"))
    .sort();
  let supabaseHost: string | null = null;
  try {
    supabaseHost = SUPABASE_URL ? new URL(SUPABASE_URL).host : null;
  } catch {
    supabaseHost = "URL inválida";
  }

  return NextResponse.json(
    {
      status: "ok",
      // Decided when the app was built (NEXT_PUBLIC_ values are inlined at build time).
      mode: IS_LIVE ? "live" : "demo",
      supabaseHost,
      // Present at runtime on the server (names only).
      supabaseVariables,
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
      environment: process.env.VERCEL_ENV ?? "local",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
