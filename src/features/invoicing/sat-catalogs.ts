/**
 * Subset of SAT (Mexico) catalogs needed to issue a CFDI 4.0 for medical fees.
 * Full catalogs: http://omawww.sat.gob.mx/tramitesyservicios/Paginas/anexo_20.htm
 */

/** c_RegimenFiscal: the regimes a patient (receiver) most commonly has. */
export const TAX_REGIME_LABEL: Record<string, string> = {
  "605": "605 · Sueldos y salarios e ingresos asimilados",
  "606": "606 · Arrendamiento",
  "612": "612 · Personas físicas con actividades empresariales y profesionales",
  "616": "616 · Sin obligaciones fiscales",
  "621": "621 · Incorporación fiscal",
  "625": "625 · Actividades empresariales con ingresos a través de plataformas tecnológicas",
  "626": "626 · Régimen simplificado de confianza",
  "601": "601 · General de ley personas morales",
};

/** c_UsoCFDI: D01 is the personal deduction for medical fees. */
export const CFDI_USE_LABEL: Record<string, string> = {
  D01: "D01 · Honorarios médicos, dentales y gastos hospitalarios",
  G03: "G03 · Gastos en general",
  S01: "S01 · Sin efectos fiscales",
};

/** Generic RFC for "público en general" (patients who do not request an invoice). */
export const GENERIC_PUBLIC_RFC = "XAXX010101000";

/** SAT product/service key for medical consultation services. */
export const MEDICAL_SERVICE_KEY = "85121600";
