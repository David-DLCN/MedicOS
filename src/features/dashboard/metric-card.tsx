import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatChange } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Relative change vs. the comparison period; null = no baseline. */
  change?: number | null;
  changeLabel?: string;
  hint?: string;
}) {
  const hasChange = typeof change === "number";
  const positive = hasChange && change > 0;
  const negative = hasChange && change < 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-surface-muted text-muted">
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        {hasChange ? (
          <span
            className={cn(
              "tabular inline-flex items-center gap-0.5 font-medium",
              positive && "text-primary",
              negative && "text-danger",
              !positive && !negative && "text-muted",
            )}
          >
            {positive ? <ArrowUpRight className="size-3.5" aria-hidden /> : null}
            {negative ? <ArrowDownRight className="size-3.5" aria-hidden /> : null}
            {formatChange(change)}
          </span>
        ) : null}
        {changeLabel || hint ? <span className="text-subtle">{hasChange ? changeLabel : hint}</span> : null}
      </div>
    </Card>
  );
}
