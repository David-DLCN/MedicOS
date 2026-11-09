import type { DocumentCategory } from "@/lib/domain/types";

export const DOCUMENT_CATEGORY: Record<DocumentCategory, string> = {
  results: "Resultados e interpretaciones",
  prescription: "Recetas",
  imaging: "Estudios de imagen",
  report: "Informes",
  receipt: "Recibos",
  other: "Otros",
};

/** Categories a doctor can choose when uploading (receipts are generated, not uploaded). */
export const UPLOAD_CATEGORIES: DocumentCategory[] = ["results", "prescription", "imaging", "report", "other"];

/** Best guess from the file itself; the doctor can always choose explicitly. */
export function guessCategory(file: { name: string; type: string }): DocumentCategory {
  const name = file.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/receta|prescripcion|rx\b/.test(name)) return "prescription";
  if (/resultado|analisis|laboratorio|interpretacion|hemograma|biometria/.test(name)) return "results";
  if (file.type.startsWith("image/") || /\.dcm$|dicom|radiograf|ecografia|resonancia|tac\b/.test(name)) return "imaging";
  if (/informe|reporte|referencia|interconsulta/.test(name)) return "report";
  return "other";
}
