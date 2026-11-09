import { cn } from "@/lib/utils";

/** Four-colour system (see globals.css): primary, info, neutral and danger, plus an outline variant. */
export type BadgeTone = "neutral" | "primary" | "info" | "outline" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-neutral-soft text-muted",
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  outline: "bg-surface text-info ring-1 ring-inset ring-info/40",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
