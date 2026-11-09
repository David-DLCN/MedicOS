import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Honest placeholder for modules scheduled in a later phase. It states what
 * the module will do instead of faking functionality.
 */
export function ModulePlaceholder({
  title,
  description,
  icon,
  plannedFeatures,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  plannedFeatures: string[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={icon}
        title="Módulo en construcción"
        description={`Este módulo llega en la siguiente fase del MVP. Incluirá: ${plannedFeatures.join(", ")}.`}
      >
        <ButtonLink href="/dashboard" variant="secondary">
          Volver al panel
        </ButtonLink>
      </EmptyState>
    </>
  );
}
