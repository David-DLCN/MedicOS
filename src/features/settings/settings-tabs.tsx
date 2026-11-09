"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Second-level navigation inside Ajustes (keeps the main menu at 5 items). */
export const SETTINGS_TABS = [
  { href: "/settings/profile", label: "Perfil" },
  { href: "/settings/consultations", label: "Consultas" },
  { href: "/settings/integrations", label: "Integraciones" },
] as const;

export function SettingsTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Secciones de ajustes" className="mb-6 border-b border-border">
      <ul className="-mb-px flex gap-6 overflow-x-auto">
        {SETTINGS_TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-block border-b-2 pb-3 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
