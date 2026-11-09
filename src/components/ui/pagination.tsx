import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { formatNumber } from "@/lib/format";

/** Previous / next pagination driven by URLs (no client JavaScript). */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  hrefFor,
  itemLabel,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  hrefFor: (page: number) => string;
  itemLabel: string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const disabled = "pointer-events-none opacity-40";

  return (
    <div className="flex items-center justify-between gap-4 pt-4 text-sm text-muted">
      <p className="tabular">
        {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)} {itemLabel}
      </p>
      <div className="flex gap-2">
        <Link
          href={hrefFor(page - 1)}
          aria-label="Página anterior"
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={buttonClasses({ variant: "secondary", size: "sm", className: page <= 1 ? disabled : "" })}
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
        <Link
          href={hrefFor(page + 1)}
          aria-label="Página siguiente"
          aria-disabled={page >= pageCount}
          tabIndex={page >= pageCount ? -1 : undefined}
          className={buttonClasses({ variant: "secondary", size: "sm", className: page >= pageCount ? disabled : "" })}
        >
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
