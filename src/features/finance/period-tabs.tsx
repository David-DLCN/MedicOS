import Link from "next/link";
import type { FinancePeriod } from "@/lib/domain/finance";
import { cn } from "@/lib/utils";
import { type FinanceParams, PERIOD_LABEL, financeHref } from "./finance-params";

export function PeriodTabs({ params, rangeLabel }: { params: FinanceParams; rangeLabel: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div role="tablist" aria-label="Periodo" className="inline-flex self-start rounded-lg bg-surface-muted p-1">
        {(Object.keys(PERIOD_LABEL) as FinancePeriod[]).map((period) => (
          <Link
            key={period}
            role="tab"
            aria-selected={params.period === period}
            href={financeHref(params, { period })}
            className={cn(
              "rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors",
              params.period === period ? "bg-surface text-foreground shadow-sm" : "text-muted hover:text-foreground",
            )}
          >
            {PERIOD_LABEL[period]}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted">{rangeLabel}</p>
    </div>
  );
}
