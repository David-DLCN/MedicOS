"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { NAV_ITEMS, isActive } from "./nav-items";

export interface SidebarDoctor {
  fullName: string;
  displayName: string;
  specialty: string;
  clinicName: string;
}

/** Light navigation rail: a professional app avoids dark backgrounds (docs/guia-de-diseno.md). */
export function Sidebar({
  doctor,
  onNavigate,
}: {
  doctor: SidebarDoctor;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav aria-label="Principal" className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4.5", active ? "text-primary" : "text-subtle")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar name={doctor.fullName} />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{doctor.displayName}</p>
            <p className="truncate text-xs text-muted">
              {doctor.specialty} · {doctor.clinicName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
