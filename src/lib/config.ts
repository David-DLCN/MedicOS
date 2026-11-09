/**
 * Application-wide configuration.
 *
 * These values are deliberately centralised so that they can later be
 * resolved per doctor / clinic (e.g. from Supabase) without touching UI code.
 */
export const APP_CONFIG = {
  productName: "MedikOS",
  /** Locale used for all number / date formatting. */
  locale: "es-US",
  /** Default currency for the prototype. All mock amounts use it. */
  currency: "USD",
  /**
   * Time zone used to render dates. The prototype stores and renders every
   * timestamp in UTC so server and client output are identical. Real
   * per-clinic time zones arrive together with the backend.
   */
  timeZone: "UTC",
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
export const IS_DEMO_DATA = true;
