import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { OperationalAlert } from "@/lib/domain/metrics";
import { cn } from "@/lib/utils";

export function AlertsPanel({ alerts }: { alerts: OperationalAlert[] }) {
  return (
    <Card className="flex flex-col">
      <CardHeader title="Requiere tu atención" description="Avisos generados a partir de tu actividad." />
      <CardContent className="flex-1">
        {alerts.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-muted">
            <CheckCircle2 className="size-4 text-primary" aria-hidden /> Todo al día.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((alert) => {
              const Icon = alert.severity === "attention" ? AlertTriangle : Info;
              return (
                <li key={alert.id}>
                  <Link
                    href={alert.href}
                    className="group flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
                        alert.severity === "attention" ? "bg-danger-soft text-danger" : "bg-info-soft text-info",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{alert.title}</span>
                      <span className="block text-xs text-muted">{alert.description}</span>
                    </span>
                    <ChevronRight className="mt-1 size-4 text-subtle group-hover:text-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
