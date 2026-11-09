/** Label + value pair for description lists (`<dl>`). */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-subtle">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}
