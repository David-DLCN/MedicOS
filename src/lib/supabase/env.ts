/**
 * Supabase connection settings. When both are present MedicOS runs in "live"
 * mode (real accounts and data); otherwise it runs the fictional demo.
 *
 * NEXT_PUBLIC_ values are inlined at build time and visible in the browser:
 * only the public URL and the publishable / anon key belong here, never the
 * service-role key.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_KEY.length > 0;
