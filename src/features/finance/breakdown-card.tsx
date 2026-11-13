import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { BreakdownItem } from "@/lib/domain/finance";
import { formatAmount, formatShare, pluralize } from "@/lib/format";

/** Ranked list with a proportional bar: one colour, intensity carries no meaning. */
export function BreakdownCard<K extends string>({
  title,
  description,
  items,
  labelFor,
}: {
  title: string;
  description: string;
  items: BreakdownItem<K>[];
  labelFor: (key: K) => string;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted">Sin cobros en este periodo.</p>
        ) : (
          <ul className="space-y-3.5">
            {items.map((item) => (
              <li key={item.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="truncate font-medium">{labelFor(item.key)}</span>
                  <span className="tabular shrink-0">
                    <span className="font-semibold">{formatAmount(item.amount)}</span>{" "}
                    <span className="text-xs text-muted">· {formatShare(item.share)}</span>
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${item.share * 100}%` }} />
                </div>
                <p className="mt-1 text-xs text-subtle">{pluralize(item.count, "cobro")}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
