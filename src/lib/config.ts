/**
 * Application-wide configuration.
 *
 * These values are deliberately centralised so that they can later be
 * resolved per doctor / clinic (e.g. from Supabase) without touching UI code.
 */
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Live mode: real accounts and data in Supabase. Demo mode: fictional data, no login. */
export const IS_LIVE = isSupabaseConfigured;

export const APP_CONFIG = {
  productName: "MedicOS",
  /** Locale used for all number / date formatting. */
  locale: "es-MX",
  /** Default currency. */
  currency: "MXN",
  /**
   * Clinic time zone. The demo renders everything in UTC so its fictional data
   * never shifts; live data uses the clinic's real time zone. Monterrey has no
   * daylight-saving time since 2022, so a fixed offset is exact. Per-clinic
   * time zones will come from the clinic record.
   */
  timeZone: IS_LIVE ? "America/Monterrey" : "UTC",
  /** Fixed UTC offset of `timeZone`, used by the calendar helpers in lib/domain/dates.ts. */
  utcOffsetMinutes: IS_LIVE ? -360 : 0,
} as const;

/**
 * Fixed "today" for the demo dataset. Mock data is generated relative to this
 * date so the dashboard always tells the same, internally consistent story.
 * Replace with `new Date()` once data comes from a real backend.
 */
export const DEMO_TODAY = new Date("2026-11-09T00:00:00Z");

/** Fixed "now" (12:30 on the demo day): morning appointments are done, afternoon ones are upcoming. */
export const DEMO_NOW = new Date("2026-11-09T12:30:00Z");

/** Whether the app is currently showing fictional demo data. */
export const IS_DEMO_DATA = !IS_LIVE;
