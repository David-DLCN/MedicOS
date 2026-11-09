import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { addDays, toISODate } from "@/lib/domain/dates";
import { cn } from "@/lib/utils";
import type { AgendaView } from "./get-appointments-data";

export function agendaHref(date: Date, view: AgendaView) {
  return `/appointments?date=${toISODate(date)}&view=${view}`;
}

/**
 * Date navigation built from plain links: the agenda state lives in the URL,
 * so views are shareable, bookmarkable and need no client-side JavaScript.
 */
export function AgendaToolbar({
  anchor,
  view,
  today,
  label,
}: {
  anchor: Date;
  view: AgendaView;
  today: Date;
  label: string;
}) {
  const step = view === "week" ? 7 : 1;
  const stepLabel = view === "week" ? "semana" : "día";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <Link
          href={agendaHref(addDays(anchor, -step), view)}
          aria-label={`${stepLabel} anterior`}
          className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2" })}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <Link
          href={agendaHref(addDays(anchor, step), view)}
          aria-label={`${stepLabel} siguiente`}
          className={buttonClasses({ variant: "secondary", size: "sm", className: "px-2" })}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
        <Link href={agendaHref(today, view)} className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Hoy
        </Link>
        <h2 className="ml-2 text-base font-semibold">{label}</h2>
      </div>

      <div role="tablist" aria-label="Vista" className="inline-flex self-start rounded-lg bg-surface-muted p-1 sm:self-auto">
        {(
          [
            ["day", "Día"],
            ["week", "Semana"],
          ] as const
        ).map(([value, text]) => (
          <Link
            key={value}
            role="tab"
            aria-selected={view === value}
            href={agendaHref(anchor, value)}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium transition-colors",
              view === value ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {text}
          </Link>
        ))}
      </div>
    </div>
  );
}
