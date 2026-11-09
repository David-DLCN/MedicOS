import { Info } from "lucide-react";

/** Honest notice: settings are read-only until accounts and a backend exist. */
export function ReadOnlyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-lg bg-info-soft px-4 py-3 text-sm text-info">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
